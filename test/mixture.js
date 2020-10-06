import assert from 'assert';
import {
    Trait,
    Mixture,
} from '../src/lib/mixture';

class TestTraitA extends Trait
{
    static methods() {
        return {
            traitMethodA() {
                return 1;
            },
            traitMethodB() {
                return 1;
            }
        };
    }
}

class TestClass extends Mixture
{
    mixins() {
        return [
            TestTraitA,
        ];
    }

    traitMethodB() {
        return 2;
    }
}

describe('Mixture', function() {
    describe('#trait', function() {
        it('TestClass should have method traitMethodA', function() {
            let obj = new TestClass();
            assert.equal(typeof obj.traitMethodA, 'function');
        });
        it('TestClass::traitMethodA should return proper value', function() {
            let obj = new TestClass();
            assert.equal(obj.traitMethodA(), 1);
        });
        it('TestClass::traitMethodB should return proper value', function() {
            let obj = new TestClass();
            assert.equal(obj.traitMethodB(), 2);
        });
    });
});