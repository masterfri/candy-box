import assert from 'assert';
import Query, {
    SerializedQuery,
} from '../src/lib/query/query';

describe('Query', function() {
    describe('#equals', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query({a: 5, b: '10'});
            assert.ok(query.condition.isValid({a: 5, b: 10}));
            assert.ok(query.condition.isValid({a: '5', b: '10'}));
            query = new Query((query) => {
                query.where((cond) => {
                    cond.equals('a', null);
                    cond.equals('b', true);
                });
            });
            assert.ok(query.condition.isValid({b: true}));
            assert.ok(query.condition.isValid({a: null, b: 1}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = new Query({a: 5});
            assert.ok(!query.condition.isValid({a: true}));
            assert.ok(!query.condition.isValid({a: null}));
        });
    });
    describe('#notEquals', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.notEquals('a', null);
                    cond.notEquals('b', true);
                });
            });
            assert.ok(query.condition.isValid({a: 5}));
            assert.ok(query.condition.isValid({a: true, b: 0}));
        });
    });
    describe('#lessThan', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.lessThan('a', 5);
                    cond.lessThan('b', 'bb');
                });
            });
            assert.ok(query.condition.isValid({a: 4, b: 'aaa'}));
        });
    });
    describe('#greaterThan', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.greaterThan('a', 5);
                    cond.greaterThan('b', 'bb');
                });
            });
            assert.ok(query.condition.isValid({a: 10, b: 'c'}));
        });
    });
    describe('#inArray', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.inArray('a', [5, '10', true]);
                });
            });
            assert.ok(query.condition.isValid({a: 5}));
            assert.ok(query.condition.isValid({a: 10}));
            assert.ok(query.condition.isValid({a: 1}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.inArray('a', [5, '10', true]);
                });
            });
            assert.ok(!query.condition.isValid({a: null}));
        });
    });
    describe('#notInArray', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.notInArray('a', [5, '10', true]);
                });
            });
            assert.ok(query.condition.isValid({a: 15}));
            assert.ok(query.condition.isValid({a: null}));
            assert.ok(query.condition.isValid({a: false}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.notInArray('a', [5, '10', true]);
                });
            });
            assert.ok(!query.condition.isValid({a: 5}));
            assert.ok(!query.condition.isValid({a: 10}));
            assert.ok(!query.condition.isValid({a: 1}));
        });
    });
    describe('#contains', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.contains('a', 'bar');
                });
            });
            assert.ok(query.condition.isValid({a: 'foo bar'}));
        });
    });
    describe('#startsWith', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.startsWith('a', 'foo');
                });
            });
            assert.ok(query.condition.isValid({a: 'foo bar'}));
        });
    });
    describe('#endsWith', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.endsWith('a', 'bar');
                });
            });
            assert.ok(query.condition.isValid({a: 'foo bar'}));
        });
    });
    describe('#and', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.and((subcond) => {
                        subcond.equals('a', 5);
                        subcond.equals('b', 10);
                    });
                });
            });
            assert.ok(query.condition.isValid({a: 5, b: 10}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.and((subcond) => {
                        subcond.equals('a', 5);
                        subcond.equals('b', 10);
                    });
                });
            });
            assert.ok(!query.condition.isValid({a: 5, b: 15}));
        });
    });
    describe('#or', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.or((subcond) => {
                        subcond.equals('a', 5);
                        subcond.equals('b', 10);
                    });
                });
            });
            assert.ok(query.condition.isValid({a: 5, b: 5}));
            assert.ok(query.condition.isValid({a: 10, b: 10}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.or((subcond) => {
                        subcond.equals('a', 5);
                        subcond.equals('b', 10);
                    });
                });
            });
            assert.ok(!query.condition.isValid({a: 15, b: 15}));
        });
    });
    describe('#not', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.not((subcond) => {
                        subcond.equals('a', 5);
                        subcond.equals('b', 10);
                    });
                });
            });
            assert.ok(query.condition.isValid({a: 5, b: 5}));
            assert.ok(query.condition.isValid({a: 10, b: 10}));
            assert.ok(query.condition.isValid({a: 5}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.not((subcond) => {
                        subcond.equals('a', 5);
                        subcond.equals('b', 10);
                    });
                });
            });
            assert.ok(!query.condition.isValid({a: 5, b: 10}));
        });
    });
    describe('#has', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.has('a', (subcond) => {
                        subcond.equals('b', 5);
                    });
                });
            });
            assert.ok(query.condition.isValid({a: {b: 5}}));
            assert.ok(query.condition.isValid({a: [{b: 1}, {b: 5}]}));
        });
    });
    describe('#doesntHave', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.doesntHave('a', (subcond) => {
                        subcond.equals('b', 5);
                    });
                });
            });
            assert.ok(query.condition.isValid({a: {b: 10}}));
            assert.ok(query.condition.isValid({a: [{b: 1}, {b: 10}]}));
        });
    });
    describe('#SerializedQuery', function() {
        it('Serialized query should produce the same result as original one', function() {
            let query = new Query((query) => {
                query.where((cond) => {
                    cond.or((subcond) => {
                        subcond.equals('a', 5);
                        subcond.equals('b', 10);
                    });
                });
            });
            let serializedQuery = new SerializedQuery(query);
            let condition = serializedQuery.toQuery().condition;
            assert.ok(condition.isValid({a: 5, b: 5}));
            assert.ok(condition.isValid({a: 10, b: 10}));
            assert.ok(condition.isValid({a: 5}));

            query = new Query((query) => {
                query.where((cond) => {
                    cond.inArray('a', [5, '10', true]);
                });
            });
            serializedQuery = new SerializedQuery(query);
            condition = serializedQuery.toQuery().condition;
            assert.ok(condition.isValid({a: 5}));
            assert.ok(condition.isValid({a: 10}));
            assert.ok(condition.isValid({a: 1}));

            query = new Query((query) => {
                query.where((cond) => {
                    cond.not((subcond) => {
                        subcond.equals('a', 5);
                        subcond.equals('b', 10);
                    });
                });
            });
            serializedQuery = new SerializedQuery(query);
            condition = serializedQuery.toQuery().condition;
            assert.ok(condition.isValid({a: 5, b: 5}));
            assert.ok(condition.isValid({a: 10, b: 10}));
            assert.ok(condition.isValid({a: 5}));
        });
        it('Serialized query should be euqal to original one', function() {
            let query = new Query();
            query.limitTo(10);
            query.groupBy('a', 'b');
            query.descendingBy('a');
            let serializedQuery = new SerializedQuery(query);
            let copy = serializedQuery.toQuery();
            assert.deepEqual(query.group, copy.group);
            assert.deepEqual(query.order, copy.order);
            assert.equal(query.limit, copy.limit);
            assert.equal(query.start, copy.start);
        });
    });
});