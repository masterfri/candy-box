import assert from 'assert';
import Query, {
    SerializedQuery,
} from '../src/lib/query/query.js';
import {
    testCondition
} from '../src/lib/query/assertions.js';

const copyViaSerialization = (query) => {
    let serialized = new SerializedQuery(query);
    let data = JSON.parse(JSON.stringify(serialized.toObject()));
    // console.dir(data, {depth: null});
    let copy = new SerializedQuery(data);
    return copy.toQuery();
}

describe('Query', function() {
    describe('#eq', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where({a: 5, b: '10'});
            assert.ok(testCondition(query.condition, {a: 5, b: 10}));
            assert.ok(testCondition(query.condition, {a: '5', b: '10'}));
            query = (new Query).where((cond) => {
                cond.eq('a', null);
                cond.eq('b', true);
            });
            assert.ok(testCondition(query.condition, {b: true}));
            assert.ok(testCondition(query.condition, {a: null, b: 1}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new Query).where({a: 5});
            assert.ok(!testCondition(query.condition, {a: true}));
            assert.ok(!testCondition(query.condition, {a: null}));
        });
    });
    describe('#neq', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.neq('a', null);
                cond.neq('b', true);
            });
            assert.ok(testCondition(query.condition, {a: 5}));
            assert.ok(testCondition(query.condition, {a: true, b: 0}));
        });
    });
    describe('#lt', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.lt('a', 5);
                cond.lt('b', 'bb');
            });
            assert.ok(testCondition(query.condition, {a: 4, b: 'aaa'}));
        });
    });
    describe('#gt', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.gt('a', 5);
                cond.gt('b', 'bb');
            });
            assert.ok(testCondition(query.condition, {a: 10, b: 'c'}));
        });
    });
    describe('#in', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.in('a', [5, '10', true]);
            });
            assert.ok(testCondition(query.condition, {a: 5}));
            assert.ok(testCondition(query.condition, {a: 10}));
            assert.ok(testCondition(query.condition, {a: 1}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.in('a', [5, '10', true]);
            });
            assert.ok(!testCondition(query.condition, {a: null}));
        });
    });
    describe('#notIn', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.notIn('a', [5, '10', true]);
            });
            assert.ok(testCondition(query.condition, {a: 15}));
            assert.ok(testCondition(query.condition, {a: null}));
            assert.ok(testCondition(query.condition, {a: false}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.notIn('a', [5, '10', true]);
            });
            assert.ok(!testCondition(query.condition, {a: 5}));
            assert.ok(!testCondition(query.condition, {a: 10}));
            assert.ok(!testCondition(query.condition, {a: 1}));
        });
    });
    describe('#contains', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.contains('a', 'bar');
            });
            assert.ok(testCondition(query.condition, {a: 'foo bar'}));
        });
    });
    describe('#startsWith', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.startsWith('a', 'foo');
            });
            assert.ok(testCondition(query.condition, {a: 'foo bar'}));
        });
    });
    describe('#and', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.eq('a', 5)
                    .and('b', 10);
            });
            assert.ok(testCondition(query.condition, {a: 5, b: 10}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.eq('a', 5)
                    .and('b', 10);
            });
            assert.ok(!testCondition(query.condition, {a: 5, b: 15}));
        });
    });
    describe('#or', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.where('a', '=', 5)
                    .or('b', '=', 10)
                    .or('b', '=', 15);
            });
            assert.ok(testCondition(query.condition, {a: 5, b: 5}));
            assert.ok(testCondition(query.condition, {a: 10, b: 10}));
            assert.ok(testCondition(query.condition, {a: 15, b: 15}));
            query = (new Query).where((cond) => {
                cond.where('a', '=', 5)
                    .or((cond) => {
                        cond.eq('a', 10)
                            .and('b', 10);
                    });
            });
            assert.ok(testCondition(query.condition, {a: 5}));
            assert.ok(testCondition(query.condition, {a: 5, b: 5}));
            assert.ok(testCondition(query.condition, {a: 10, b: 10}));
            query = (new Query).where((cond) => {
                cond.where('a', '=', 5)
                    .and((cond) => {
                        cond.eq('b', 10)
                            .or('b', 15);
                    });
            });
            assert.ok(testCondition(query.condition, {a: 5, b: 10}));
            assert.ok(testCondition(query.condition, {a: 5, b: 15}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.where('a', '=', 5)
                    .or('b', '=', 10)
                    .or('b', '=', 15);
            });
            assert.ok(!testCondition(query.condition, {a: 15, b: 20}));
            query = (new Query).where((cond) => {
                cond.where('a', '=', 5)
                    .or((cond) => {
                        cond.eq('a', 10)
                            .and('b', 10);
                    });
            });
            assert.ok(!testCondition(query.condition, {a: 15, b: 10}));
            assert.ok(!testCondition(query.condition, {a: 10}));
            query = (new Query).where((cond) => {
                cond.where('a', '=', 5)
                    .and((cond) => {
                        cond.eq('b', 10)
                            .or('b', 15);
                    });
            });
            assert.ok(!testCondition(query.condition, {a: 5, b: 20}));
            assert.ok(!testCondition(query.condition, {a: 10, b: 10}));
        });
    });
    describe('#not', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.not((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            assert.ok(testCondition(query.condition, {a: 5, b: 5}));
            assert.ok(testCondition(query.condition, {a: 10, b: 10}));
            assert.ok(testCondition(query.condition, {a: 5}));
            query = (new Query).where((cond) => {
                cond.not('a', 5)
                    .not('b', 10);
            });
            assert.ok(testCondition(query.condition, {a: 10, b: 5}));
            assert.ok(testCondition(query.condition, {a: 10}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.not((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            assert.ok(!testCondition(query.condition, {a: 5, b: 10}));
            query = (new Query).where((cond) => {
                cond.not('a', 5)
                    .not('b', 10);
            });
            assert.ok(!testCondition(query.condition, {a: 5, b: 5}));
        });
    });
    describe('#nested objects', function() {
        it('Condition should be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.eq('a.b', 5);
            });
            assert.ok(testCondition(query.condition, {a: {b: 5}}));
        });
        it('Condition should not be satisfiable for the given data', function() {
            let query = (new Query).where((cond) => {
                cond.eq('a.c', 5);
            });
            assert.ok(!testCondition(query.condition, {a: {b: 10}}));
        });
    });
    describe('#SerializedQuery', function() {
        it('Serialized query should produce the same result as original one', function() {
            let query = (new Query).where((cond) => {
                cond.eq('a', 5)
                    .or()
                    .eq('b', 10);
            });
            let copy = copyViaSerialization(query);
            assert.ok(testCondition(copy.condition, {a: 5, b: 5}));
            assert.ok(testCondition(copy.condition, {a: 10, b: 10}));
            assert.ok(testCondition(copy.condition, {a: 5}));
            query = (new Query).where((cond) => {
                cond.in('a', [5, '10', true]);
            });
            copy = copyViaSerialization(query);
            assert.ok(testCondition(copy.condition, {a: 5}));
            assert.ok(testCondition(copy.condition, {a: 10}));
            assert.ok(testCondition(copy.condition, {a: 1}));
            query = (new Query).where((cond) => {
                cond.not((subcond) => {
                    subcond.eq('a', 5);
                    subcond.eq('b', 10);
                });
            });
            copy = copyViaSerialization(query);
            assert.ok(testCondition(copy.condition, {a: 5, b: 5}));
            assert.ok(testCondition(copy.condition, {a: 10, b: 10}));
            assert.ok(testCondition(copy.condition, {a: 5}));
            query = (new Query).where((cond) => {
                cond.eq('a.b', 5)
                    .or()
                    .startsWith('a.c', 'foo');
            });
            copy = copyViaSerialization(query);
            assert.ok(testCondition(copy.condition, {a: {b: 5}}));
            assert.ok(testCondition(copy.condition, {a: {c: 'foobar'}}));
            query = (new Query).where((cond) => {
                cond.eq('a.b', 5)
                    .or()
                    .neq('b.a', 10);
            });
            copy = copyViaSerialization(query);
            assert.ok(testCondition(copy.condition, {a: {b: 5}, b: {a: 10}}));
            assert.ok(testCondition(copy.condition, {a: {b: 15}, b: {a: 5}}));
        });
        it('Serialized query should be euqal to original one', function() {
            let query = new Query();
            query.limitTo(10);
            query.groupBy('a', 'b');
            query.descendingBy('a');
            let copy = copyViaSerialization(query);
            assert.deepEqual(query.group, copy.group);
            assert.deepEqual(query.order, copy.order);
            assert.equal(query.limit, copy.limit);
            assert.equal(query.start, copy.start);
        });
    });
});