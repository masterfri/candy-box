import assert from 'assert';
import {
    Component,
    Mixture,
} from '../src/lib/mixture.js';

class TestComponentA extends Component
{
    static methods() {
        return {
            componentMethodA() {
                return 1;
            },
            componentMethodB() {
                return 1;
            }
        };
    }
}

class TestClass extends Mixture
{
    components() {
        return [
            TestComponentA,
        ];
    }

    componentMethodB() {
        return 2;
    }
}

describe('Mixture', function() {
    describe('#component', function() {
        it('TestClass should have method componentMethodA', function() {
            let obj = new TestClass();
            assert.equal(typeof obj.componentMethodA, 'function');
        });
        it('TestClass::componentMethodA should return proper value', function() {
            let obj = new TestClass();
            assert.equal(obj.componentMethodA(), 1);
        });
        it('TestClass::componentMethodB should return proper value', function() {
            let obj = new TestClass();
            assert.equal(obj.componentMethodB(), 2);
        });
    });
});