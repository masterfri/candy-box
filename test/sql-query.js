import assert from 'assert';
import Builder from '../src/lib/sql/mysql-query-builder.js';

const assertSQL = (qSql, sql, bindings = []) => {
    assert.equal(qSql.sql, sql);
    assert.deepEqual(qSql.bindings, bindings);
}

describe('SQL query', function() {
    describe('#SqlGrammar', function() {
        it('Grammar should produce correct SQL text (simple select)', function() {
            let sql = (new Builder)
                .table('table')
                .select();
            assertSQL(sql, 'select * from `table`');
            sql = (new Builder)
                .column(['column', 'other_column'])
                .columnRaw('date_add(date_column, interval ? day)', [1])
                .table('table')
                .select();
            assertSQL(sql, 'select `column`, `other_column`, date_add(date_column, interval ? day) from `table`', [1]);
            sql = (new Builder)
                .column(['column', {'columnalias': 'othercolumn'}])
                .table({'tablealias': 'table'})
                .select();
            assertSQL(sql, 'select `column`, `othercolumn` as `columnalias` from `table` as `tablealias`');
        });
        it('Grammar should produce correct SQL text (with where condition)', function() {
            let sql = (new Builder)
                .table('table')
                .where((where) => {
                    where
                        .eq('column', 5)
                        .or((where) => {
                            where
                                .gt('column', 10)
                                .neq('other_column', 5);
                        })
                        .lt('some_column', 15);
                })
                .select();
            assertSQL(sql, 'select * from `table` where `column` = ? or (`column` > ? and `other_column` != ?) and `some_column` < ?', [5, 10, 5, 15]);
            sql = (new Builder)
                .table('table')
                .whereRaw('date_column = now() and other_column between ? and ?', [3, 5])
                .select();
            assertSQL(sql, 'select * from `table` where date_column = now() and other_column between ? and ?', [3, 5]);
            sql = (new Builder)
                .table({'t': 'table'})
                .where((where) => {
                    where.eq('column', 5)
                        .raw('other_column != ?', [5])
                        .not({
                            'third_column': 10,
                            'forth_column': 20,
                        });
                })
                .select();
            assertSQL(sql, 'select * from `table` as `t` where `column` = ? and other_column != ? and not (`third_column` = ? and `forth_column` = ?)', [5, 5, 10, 20]);
            sql = (new Builder)
                .table({'t': 'table'})
                .where((where) => {
                    where.eq('column', 5)
                        .or({
                            'other_column': 10,
                            'third_column': 20,
                        });
                })
                .select();
            assertSQL(sql, 'select * from `table` as `t` where `column` = ? or (`other_column` = ? and `third_column` = ?)', [5, 10, 20]);
            sql = (new Builder)
                .table('table')
                .where((where) => {
                    where.whereJson('object', 'z', {a: 10})
                        .whereJson('object', 'x.y', 10);
                })
                .select();
            assertSQL(sql, 'select * from `table` where json_extract(`object`, ?) = ? and json_extract(`object`, ?) = ?', ['$.z', '{"a":10}', '$.x.y', 10]);
        });
        it('Grammar should produce correct SQL text (with having condition)', function() {
            let sql = (new Builder)
                .table('table')
                .columnRaw('sum(`column`) as `totals`')
                .having('totals', '>', 5)
                .select();
            assertSQL(sql, 'select sum(`column`) as `totals` from `table` having `totals` > ?', [5]);
            sql = (new Builder)
                .table({'t': 'table'})
                .columnRaw('sum(t.column) as `totals`')
                .where((where) => {
                    where.not('column', '=', 5);
                })
                .having((having) => {
                    having
                        .not((h) => {
                            h.lt('totals', 10)
                                .or()
                                .gt('totals', 15);
                        });
                })
                .select();
            assertSQL(sql, 'select sum(t.column) as `totals` from `table` as `t` where not `column` = ? having not (`totals` < ? or `totals` > ?)', [5, 10, 15]);
            sql = (new Builder)
                .table({'t': 'table'})
                .columnRaw('sum(t.column) as `totals`, max(t.column) as `max`')
                .having((having) => {
                    having
                        .gt('totals', 5)
                        .or({
                            totals: 10,
                            max: 20,
                        });
                })
                .select();
            assertSQL(sql, 'select sum(t.column) as `totals`, max(t.column) as `max` from `table` as `t` having `totals` > ? or (`totals` = ? and `max` = ?)', [5, 10, 20]);
        });
        it('Grammar should produce correct SQL text (with order by)', function() {
            let sql = (new Builder)
                .table('table')
                .where((cond) => {
                    cond.in('column', [1, 2, 3]);
                })
                .descendingBy('other_column')
                .ascendingBy('third_column')
                .select();
            assertSQL(sql, 'select * from `table` where `column` in(?, ?, ?) order by `other_column` desc, `third_column` asc', [1, 2, 3]);
            sql = (new Builder)
                .table('table')
                .orderByRaw('length(column)', 'desc')
                .select();
            assertSQL(sql, 'select * from `table` order by length(column) desc');
            sql = (new Builder)
                .table({'t': 'table'})
                .where((cond) => {
                    cond.where((cond) => {
                        cond.between('column', 5, 10)
                    });
                })
                .orderBy('other_column')
                .select();
            assertSQL(sql, 'select * from `table` as `t` where (`column` between ? and ?) order by `other_column` asc', [5, 10]);
        });
        it('Grammar should produce correct SQL text (with group by)', function() {
            let sql = (new Builder)
                .table('table')
                .descendingBy('other_column')
                .groupBy('third_column', 'forth_column')
                .select();
            assertSQL(sql, 'select * from `table` group by `third_column`, `forth_column` order by `other_column` desc');
            sql = (new Builder)
                .columnRaw('count(*)')
                .table('table')
                .groupByRaw('concat(column, ?, other_column)', '-')
                .select();
            assertSQL(sql, 'select count(*) from `table` group by concat(column, ?, other_column)', ['-']);
        });
        it('Grammar should produce correct SQL text (offset and limit)', function() {
            let sql = (new Builder)
                .table('table')
                .where((cond) => {
                    cond.isNull('column');
                })
                .select(10);
            assertSQL(sql, 'select * from `table` where `column` is null limit 10');
            sql = (new Builder)
                .table('table')
                .where((cond) => {
                    cond.startsWith('column', 'foo')
                })
                .select(10, 20);
            assertSQL(sql, 'select * from `table` where `column` like ? limit 10 offset 20', ['foo%']);
        });
        it('Grammar should produce correct SQL text (with join)', function() {
            let sql = (new Builder)
                .table('table')
                .join('another_table', 'table.other_id', '=', 'another_table.id')
                .where('column', '=', 5)
                .select(10);
            assertSQL(sql, 'select * from `table` inner join `another_table` on `table`.`other_id` = `another_table`.`id` where `column` = ? limit 10', [5]);
            sql = (new Builder)
                .table({'t1': 'table'})
                .join({'t2': 'another_table'}, 'other_id', '=', 't2.id')
                .join({'t3': 'third_table'}, (join) => {
                    join
                        .on((join) => {
                            join.on('t1.third_id', '=', 't3.id')
                                .or('t2.third_id', '=', 't3.id')
                        })
                        .where('t1.column', '=', 5);
                })
                .select();
            assertSQL(sql, 'select * from `table` as `t1` inner join `another_table` as `t2` on `other_id` = `t2`.`id` inner join `third_table` as `t3` on (`t1`.`third_id` = `t3`.`id` or `t2`.`third_id` = `t3`.`id`) and `t1`.`column` = ?', [5]);
            sql = (new Builder)
                .table('table')
                .join('another_table', (join) => {
                    join
                        .eq('other_id', 'another_table.id')
                        .raw('table.date > date_sub(another_table.date, interval ? day)', [5]);
                })
                .select();
            assertSQL(sql, 'select * from `table` inner join `another_table` on `other_id` = `another_table`.`id` and table.date > date_sub(another_table.date, interval ? day)', [5]);
            sql = (new Builder)
                .table({'t1': 'table'})
                .join({'t2': 'another_table'}, (join) => {
                    join.eq('other_id', 't2.id');
                })
                .leftJoin({'t3': 'third_table'}, (join) => {
                    join.neq('other_id', 't3.id');
                })
                .rightJoin({'t4': 'fourth_table'}, (join) => {
                    join.lt('other_id', 't4.id');
                })
                .select();
            assertSQL(sql, 'select * from `table` as `t1` inner join `another_table` as `t2` on `other_id` = `t2`.`id` left join `third_table` as `t3` on `other_id` != `t3`.`id` right join `fourth_table` as `t4` on `other_id` < `t4`.`id`');
        });
        it('Grammar should produce correct SQL text (with exists)', function() {
            let sql = (new Builder)
                .table('table')
                .where((condition) => {
                    condition.exists((query) => {
                        query.table('other_table')
                            .where((condition) => {
                                condition.raw('table.column = other_table.other_column');
                            });
                    });
                })
                .select();
            assertSQL(sql, 'select * from `table` where exists(select * from `other_table` where table.column = other_table.other_column)');
            sql = (new Builder)
                .table('table')
                .where((condition) => {
                    condition.notExists((query) => {
                        query.table({'t2': 'other_table'})
                        query.where((condition) => {
                            condition.raw('table.column = t2.other_column')
                                .or('table.third_column', '=', 1000);
                        });
                    });
                })
                .select();
            assertSQL(sql, 'select * from `table` where not exists(select * from `other_table` as `t2` where table.column = t2.other_column or `table`.`third_column` = ?)', [1000]);
        });
        it('Grammar should produce correct SQL text (insert)', function() {
            let sql = (new Builder)
                .table('table')
                .insert({foo: 1, bar: 2, foobar: 3});
            assertSQL(sql, 'insert into `table` (`foo`, `bar`, `foobar`) values (?, ?, ?)', [1, 2, 3]);
            sql = (new Builder)
                .table('table')
                .insert([
                    {foo: 1, bar: 2},
                    {bar: 3, foobar: 4},
                    {foo: 5, bar: 6, foobar: 7},
                ]);
            assertSQL(sql, 'insert into `table` (`foo`, `bar`, `foobar`) values (?, ?, null), (null, ?, ?), (?, ?, ?)', [1, 2, 3, 4, 5, 6, 7]);
            let builder = (new Builder)
                .table('table');
            sql = builder.insert([
                {name: 'John', date: builder.raw('now()')},
                {name: 'Jack', expires: builder.raw('date_add(now(), interval ? day)', [30])},
            ]);
            assertSQL(sql, 'insert into `table` (`name`, `date`, `expires`) values (?, now(), null), (?, null, date_add(now(), interval ? day))', ['John', 'Jack', 30]);
        });
        it('Grammar should produce correct SQL text (update)', function() {
            let sql = (new Builder)
                .table('table')
                .update({foo: 1, bar: 2, foobar: 3});
            assertSQL(sql, 'update `table` set `foo` = ?, `bar` = ?, `foobar` = ?', [1, 2, 3]);
            sql = (new Builder)
                .table('table')
                .where('column', 100)
                .descendingBy('other_column')
                .update({foo: 1, bar: 2, foobar: 3}, 5);
            assertSQL(sql, 'update `table` set `foo` = ?, `bar` = ?, `foobar` = ? where `column` = ? order by `other_column` desc limit 5', [1, 2, 3, 100]);
            let builder = (new Builder)
                .table('table')
                .ascendingBy('column')
                .descendingBy('other_column');
            sql = builder.update({foo: builder.raw('foo + ?', [10])}, 10);
            assertSQL(sql, 'update `table` set `foo` = foo + ? order by `column` asc, `other_column` desc limit 10', [10]);
        });
        it('Grammar should produce correct SQL text (delete)', function() {
            let sql = (new Builder)
                .table('table')
                .delete();
            assertSQL(sql, 'delete from `table`');
            sql = (new Builder)
                .table({'t': 'table'})
                .where((cond) => {
                    cond.in('t.column', [1, 2, 3])
                })
                .delete(10);
            assertSQL(sql, 'delete from `table` as `t` where `t`.`column` in(?, ?, ?) limit 10', [1, 2, 3]);
            sql = (new Builder)
                .table('table')
                .orderBy('column', 'desc')
                .delete(10);
            assertSQL(sql, 'delete from `table` order by `column` desc limit 10');
        });
    });
});