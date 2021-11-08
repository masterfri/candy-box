import assert from 'assert';
import { inject } from '../src/lib/helpers.js';

let TestComponent = {
    methodA() {
        return 1;
    },
    methodB() {
        return 2;
    },
    incB() {
        this._varB++;
        return this._varB;
    },
    _varA: 1,
    _varB: 2,
};

class TestClass
{
    _varB = 3;

    methodB() {
        return 3;
    }

    methodC() {
        return 4;
    }
}

inject(TestClass, TestComponent);

describe('Mixture', function() {
    describe('#component', function() {
        it('TestClass should have required properties', function() {
            let obj = new TestClass();
            assert.strictEqual(typeof obj.methodA, 'function');
            assert.strictEqual(typeof obj.methodB, 'function');
            assert.strictEqual(typeof obj.methodC, 'function');
            assert.strictEqual(typeof obj._varA, 'number');
            assert.strictEqual(typeof obj._varB, 'number');
        });
        it('Methods of TestClass should return proper results', function() {
            let obj = new TestClass();
            assert.strictEqual(obj.methodA(), 1);
            assert.strictEqual(obj.methodB(), 3);
            assert.strictEqual(obj.methodC(), 4);
        });
        it('Properties of TestClass should return proper values', function() {
            let obj = new TestClass();
            let obj2 = new TestClass();
            obj2._varA = 5;
            obj2.incB();
            assert.strictEqual(obj._varA, 1);
            assert.strictEqual(obj._varB, 3);
            assert.strictEqual(obj2._varB, 4);
        });
    });
});