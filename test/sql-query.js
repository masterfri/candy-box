import assert from 'assert';
import SqlClient from '../src/lib/db/sql.js';

let client = new SqlClient({
    client: 'mysql2',
    connection: {
        user : 'test',
        password : 'test',
        database : 'test'
    }
});

const assertSQL = (query, sql, bindings = []) => {
    let nativeSql = query.toSql();
    assert.equal(nativeSql.sql, sql);
    assert.deepEqual(nativeSql.bindings, bindings);
}

describe('SQL query', function() {
    describe('#SqlGrammar', function() {
        it('Grammar should produce correct SQL text (simple select)', function() {
            let query = client.select()
                .from('table');
            assertSQL(query, 'select * from `table`');
            query = client.select(['column', 'other_column'])
                .from('table');
            query.selectRaw('date_add(date_column, interval ? day)', [1]);
            assertSQL(query, 'select `column`, `other_column`, date_add(date_column, interval ? day) from `table`', [1]);
            query = client.select(['column', {'columnalias': 'othercolumn'}])
                .from({'tablealias': 'table'});
            assertSQL(query, 'select `column`, `othercolumn` as `columnalias` from `table` as `tablealias`');
        });
        it('Grammar should produce correct SQL text (with where condition)', function() {
            let query = client.select()
                .from('table')
                .where((where) => {
                    where
                        .eq('column', 5)
                        .or((where) => {
                            where
                                .gt('column', 10)
                                .neq('other_column', 5);
                        })
                        .lt('some_column', 15);
                });
            assertSQL(query, 'select * from `table` where (`column` = ? or (`column` > ? and `other_column` != ?) and `some_column` < ? )', [5, 10, 5, 15]);
            query = client.select()
                .from('table')
                .whereRaw('date_column = now() and other_column between ? and ?', [3, 5]);
            assertSQL(query, 'select * from `table` where date_column = now() and other_column between ? and ?', [3, 5]);
            query = client.select()
                .from({'t': 'table'})
                .where('column', '=', 5)
                .whereRaw('other_column != ?', [5]);
            assertSQL(query, 'select * from `table` as `t` where `column` = ? and other_column != ?', [5, 5]);
        });
        /*
        it('Grammar should produce correct SQL text (with having condition)', function() {
            let query = new SqlQuery();
            query.from('table')
                .selectRaw('sum([column]) as [totals]')
                .having((condition) => {
                    condition.gt('totals', 5)
                });
            assertSQL(query, 'select sum([column]) as [totals] from [table] having [totals]>?', [5]);
            query = new SqlQuery();
            query.from({'t': 'table'})
                .selectRaw('sum(t.column) as [totals]')
                .where((condition) => {
                    condition
                        .where('column', 5)
                })
                .having((condition) => {
                    condition.or((condition) => {
                        condition.gt('totals', 20)
                        condition.lt('totals', 10)
                    });
                });
            assertSQL(query, 'select sum(t.column) as [totals] from [table] as [t] where [t].[column]=? having ([totals]>? or [totals]<?)', [5, 20, 10]);
        });
        it('Grammar should produce correct SQL text (with order by)', function() {
            let query = new SqlQuery();
            query.from('table')
                .where('column', 'in', [1, 2, 3])
                .descendingBy('other_column')
                .ascendingBy('third_column');
            assertSQL(query, 'select * from [table] where [table].[column] in(?,?,?) order by [table].[other_column] desc, [table].[third_column]', [1, 2, 3]);
            query = new SqlQuery();
            query.from('table')
                .orderByRaw('length(column)', 'desc');
            assertSQL(query, 'select * from [table] order by length(column) desc');
            query = new SqlQuery();
            query.from({'t': 'table'})
                .where('column', 'in', [1, 2, 3])
                .descendingBy('other_column')
                .ascendingBy('third_column');
            assertSQL(query, 'select * from [table] as [t] where [t].[column] in(?,?,?) order by [t].[other_column] desc, [t].[third_column]', [1, 2, 3]);
        });
        it('Grammar should produce correct SQL text (with group by)', function() {
            let query = new SqlQuery();
            query.from('table')
                .descendingBy('other_column')
                .groupBy('third_column', 'forth_column');
            assertSQL(query, 'select * from [table] group by [table].[third_column], [table].[forth_column] order by [table].[other_column] desc');
            query = new SqlQuery();
            query
                .selectRaw('count(*)')
                .from('table')
                .groupByRaw('date(saved_at)');
            assertSQL(query, 'select count(*) from [table] group by date(saved_at)');
            query = new SqlQuery();
            query.from({'t': 'table'})
                .descendingBy('other_column')
                .groupBy('third_column', 'forth_column');
            assertSQL(query, 'select * from [table] as [t] group by [t].[third_column], [t].[forth_column] order by [t].[other_column] desc');
        });
        it('Grammar should produce correct SQL text (offset and limit)', function() {
            let query = new SqlQuery();
            query.from('table')
                .where('column', null)
                .startFrom(10);
            assertSQL(query, 'select * from [table] where [table].[column] is null offset 10');
            query = new SqlQuery();
            query.from('table')
                .where('column', '!=', null)
                .limitTo(20);
            assertSQL(query, 'select * from [table] where [table].[column] is not null limit 20');
            query = new SqlQuery();
            query.from('table')
                .where('column', '!=', null)
                .startFrom(10)
                .limitTo(20);
            assertSQL(query, 'select * from [table] where [table].[column] is not null limit 20 offset 10');
        });
        it('Grammar should produce correct SQL text (with join)', function() {
            let query = new SqlQuery();
            query.from('table')
                .join('another_table', 'other_id', '=', 'id')
                .where('another_table.another_column', '<', 100)
                .where('column', '=', 5);
            assertSQL(query, 'select * from [table] inner join [another_table] on [table].[other_id]=[another_table].[id] where [another_table].[another_column]<? and [table].[column]=?', [100, 5]);
            query = new SqlQuery();
            query.from('table')
                .join('another_table', 'other_id', '=', 'id')
                .join('third_table', (join) => {
                    join.or((join) => {
                        join
                            .onEquals('third_id', 'id')
                            .onEquals('another_table.third_id', 'id')
                    }).where('column', '=', 5);
                });
            assertSQL(query, 'select * from [table] inner join [another_table] on [table].[other_id]=[another_table].[id] inner join [third_table] on ([table].[third_id]=[third_table].[id] or [another_table].[third_id]=[third_table].[id]) and [table].[column]=?', [5]);
            query = new SqlQuery();
            query.from('table')
                .join('another_table', (join) => {
                    join
                        .onEquals('other_id', 'id')
                        .onRaw('table.date > date_sub(another_table.date, interval ? day)', [5]);
                });
            assertSQL(query, 'select * from [table] inner join [another_table] on [table].[other_id]=[another_table].[id] and table.date > date_sub(another_table.date, interval ? day)', [5]);
            query = new SqlQuery();
            query.from({'t1': 'table'})
                .join({'t2': 'another_table'}, (join) => {
                    join.onEquals('other_id', 'id');
                })
                .leftJoin({'t3': 'third_table'}, (join) => {
                    join.onNotEquals('other_id', 'id');
                })
                .rightJoin({'t4': 'fourth_table'}, (join) => {
                    join.onLessThan('other_id', 'id');
                });
            assertSQL(query, 'select * from [table] as [t1] inner join [another_table] as [t2] on [t1].[other_id]=[t2].[id] left join [third_table] as [t3] on [t1].[other_id]!=[t3].[id] right join [fourth_table] as [t4] on [t1].[other_id]<[t4].[id]');
        });
        it('Grammar should produce correct SQL text (with exists)', function() {
            let query = new SqlQuery();
            query.from('table')
                .where((condition) => {
                    condition.has('other_table', (query) => {
                        query.where((condition) => {
                            condition.whereRaw('table.column = other_table.other_column');
                        });
                    });
                });
            assertSQL(query, 'select * from [table] where exists(select * from [other_table] where table.column = other_table.other_column)');
            query = new SqlQuery();
            query.from('table')
                .where((condition) => {
                    condition.doesntHave({'t2': 'other_table'}, (query) => {
                        query.where((condition) => {
                            condition.whereRaw('table.column = t2.other_column');
                        });
                    });
                });
            assertSQL(query, 'select * from [table] where not exists(select * from [other_table] as [t2] where table.column = t2.other_column)');
        });
        */
    });
});