import assert from 'assert';
import RepositoryQuery, {
    SerializedRepositoryQuery,
} from '../src/lib/repository/query.js';
import {
    testCondition
} from '../src/lib/query/assertions.js';

describe('Query', function() {
    describe('#eq', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where({a: 5, b: '10'});
            assert.ok(testCondition(query.condition, {a: 5, b: 10}));
            assert.ok(testCondition(query.condition, {a: '5', b: '10'}));
            query = (new RepositoryQuery).where((cond) => {
                cond.eq('a', null);
                cond.eq('b', true);
            });
            assert.ok(testCondition(query.condition, {b: true}));
            assert.ok(testCondition(query.condition, {a: null, b: 1}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where({a: 5});
            assert.ok(!testCondition(query.condition, {a: true}));
            assert.ok(!testCondition(query.condition, {a: null}));
        });
    });
    describe('#neq', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.neq('a', null);
                cond.neq('b', true);
            });
            assert.ok(testCondition(query.condition, {a: 5}));
            assert.ok(testCondition(query.condition, {a: true, b: 0}));
        });
    });
    describe('#lt', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.lt('a', 5);
                cond.lt('b', 'bb');
            });
            assert.ok(testCondition(query.condition, {a: 4, b: 'aaa'}));
        });
    });
    describe('#gt', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.gt('a', 5);
                cond.gt('b', 'bb');
            });
            assert.ok(testCondition(query.condition, {a: 10, b: 'c'}));
        });
    });
    describe('#in', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.in('a', [5, '10', true]);
            });
            assert.ok(testCondition(query.condition, {a: 5}));
            assert.ok(testCondition(query.condition, {a: 10}));
            assert.ok(testCondition(query.condition, {a: 1}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.in('a', [5, '10', true]);
            });
            assert.ok(!testCondition(query.condition, {a: null}));
        });
    });
    describe('#notIn', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.notIn('a', [5, '10', true]);
            });
            assert.ok(testCondition(query.condition, {a: 15}));
            assert.ok(testCondition(query.condition, {a: null}));
            assert.ok(testCondition(query.condition, {a: false}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.notIn('a', [5, '10', true]);
            });
            assert.ok(!testCondition(query.condition, {a: 5}));
            assert.ok(!testCondition(query.condition, {a: 10}));
            assert.ok(!testCondition(query.condition, {a: 1}));
        });
    });
    describe('#contains', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.contains('a', 'bar');
            });
            assert.ok(testCondition(query.condition, {a: 'foo bar'}));
        });
    });
    describe('#startsWith', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.startsWith('a', 'foo');
            });
            assert.ok(testCondition(query.condition, {a: 'foo bar'}));
        });
    });
    describe('#and', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.and((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            assert.ok(testCondition(query.condition, {a: 5, b: 10}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.and((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            assert.ok(!testCondition(query.condition, {a: 5, b: 15}));
        });
    });
    describe('#or', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.or((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            assert.ok(testCondition(query.condition, {a: 5, b: 5}));
            assert.ok(testCondition(query.condition, {a: 10, b: 10}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.or((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            assert.ok(!testCondition(query.condition, {a: 15, b: 15}));
        });
    });
    describe('#not', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.not((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            assert.ok(testCondition(query.condition, {a: 5, b: 5}));
            assert.ok(testCondition(query.condition, {a: 10, b: 10}));
            assert.ok(testCondition(query.condition, {a: 5}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.not((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            assert.ok(!testCondition(query.condition, {a: 5, b: 10}));
        });
    });
    describe('#has', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.has('a', (subcond) => {
                    subcond.eq('b', 5);
                });
            });
            assert.ok(testCondition(query.condition, {a: {b: 5}}));
            assert.ok(testCondition(query.condition, {a: [{b: 1}, {b: 5}]}));
        });
    });
    describe('#doesntHave', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.doesntHave('a', (subcond) => {
                    subcond.eq('b', 5);
                });
            });
            assert.ok(testCondition(query.condition, {a: {b: 10}}));
            assert.ok(testCondition(query.condition, {a: [{b: 1}, {b: 10}]}));
        });
    });
    describe('#SerializedQuery', function() {
        it('Serialized query should produce the same result as original one', function() {
            let query = (new RepositoryQuery).where((cond) => {
                cond.or((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            let serializedQuery = new SerializedRepositoryQuery(query);
            let condition = serializedQuery.toQuery().condition;
            assert.ok(testCondition(condition, {a: 5, b: 5}));
            assert.ok(testCondition(condition, {a: 10, b: 10}));
            assert.ok(testCondition(condition, {a: 5}));
            query = (new RepositoryQuery).where((cond) => {
                cond.in('a', [5, '10', true]);
            });
            serializedQuery = new SerializedRepositoryQuery(query);
            condition = serializedQuery.toQuery().condition;
            assert.ok(testCondition(condition, {a: 5}));
            assert.ok(testCondition(condition, {a: 10}));
            assert.ok(testCondition(condition, {a: 1}));
            query = (new RepositoryQuery).where((cond) => {
                cond.not((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            serializedQuery = new SerializedRepositoryQuery(query);
            condition = serializedQuery.toQuery().condition;
            assert.ok(testCondition(condition, {a: 5, b: 5}));
            assert.ok(testCondition(condition, {a: 10, b: 10}));
            assert.ok(testCondition(condition, {a: 5}));
        });
        it('Serialized query should be euqal to original one', function() {
            let query = new RepositoryQuery();
            query.limitTo(10);
            query.groupBy('a', 'b');
            query.descendingBy('a');
            let serializedQuery = new SerializedRepositoryQuery(query);
            let copy = serializedQuery.toQuery();
            assert.deepEqual(query.group, copy.group);
            assert.deepEqual(query.order, copy.order);
            assert.equal(query.limit, copy.limit);
            assert.equal(query.start, copy.start);
        });
    });
});