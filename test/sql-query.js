import assert from 'assert';
import SqlQuery, {SqlGrammar} from '../src/lib/db/sql-query';

let grammar = new SqlGrammar();

const assertSQL = (query, sql, bindings = []) => {
    let rawSql = grammar.select(query);
    assert.equal(rawSql.sql, sql);
    assert.deepEqual(rawSql.bindings, bindings);
}

describe('SQL query', function() {
    describe('#SqlGrammar', function() {
        it('Grammar should produce correct SQL text (simple select)', function() {
            let query = new SqlQuery();
            query.from('table');
            assertSQL(query, 'select * from [table]');
            query = new SqlQuery();
            query.select(['column', 'other_column']);
            query.selectRaw('date_add(date_column, interval ? day)', [1]);
            query.from('table');
            assertSQL(query, 'select [table].[column], [table].[other_column], date_add(date_column, interval ? day) from [table]', [1]);
        });
        it('Grammar should produce correct SQL text (with condition)', function() {
            let query = new SqlQuery();
            query.from('table')
                .where((condition) => {
                    condition
                        .where('column', 5)
                        .or((condition) => {
                            condition
                                .where('column', '>', 10)
                                .where('other_column', '!=', 5);
                        });
                });
            assertSQL(query, 'select * from [table] where [table].[column]=? and ([table].[column]>? or [table].[other_column]!=?)', [5, 10, 5]);
            query = new SqlQuery();
            query.from('table')
                .where((condition) => {
                    condition.whereRaw('date_column = now() and other_column between ? and ?', [3, 5])
                });
            assertSQL(query, 'select * from [table] where date_column = now() and other_column between ? and ?', [3, 5]);
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
            assertSQL(query, 'select * from [table] join [another_table] on [table].[other_id]=[another_table].[id] where [another_table].[another_column]<? and [table].[column]=?', [100, 5]);
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
            assertSQL(query, 'select * from [table] join [another_table] on [table].[other_id]=[another_table].[id] join [third_table] on ([table].[third_id]=[third_table].[id] or [another_table].[third_id]=[third_table].[id]) and [table].[column]=?', [5]);
            query = new SqlQuery();
            query.from('table')
                .join('another_table', (join) => {
                    join
                        .onEquals('other_id', 'id')
                        .onRaw('table.date > date_sub(another_table.date, interval ? day)', [5]);
                });
            assertSQL(query, 'select * from [table] join [another_table] on [table].[other_id]=[another_table].[id] and table.date > date_sub(another_table.date, interval ? day)', [5]);
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
        });
    });
});