import assert from 'assert';
import {
    Interface,
    Trait,
    Mixture,
    InterfaceError
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

class TestInterface extends Interface
{
    static methods() {
        return [
            'traitMethodA',
            'traitMethodB',
            'classMethodA'
        ];
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

class ClassWithInterface extends Mixture
{
    mixins() {
        return [
            TestInterface,
            TestTraitA,
        ];
    }

    classMethodA() {
    }
}

class InvalidClass extends Mixture
{
    mixins() {
        return [
            TestInterface,
        ];
    }
}

class AnotherTrait extends Trait
{
}

class AnotherInterface extends Interface
{
}

class InheritedInterface extends TestInterface
{
    static methods() {
        return [
            'classMethodB',
        ];
    }
}

class ClassWithInheritedInterface extends Mixture
{
    mixins() {
        return [
            InheritedInterface,
            TestTraitA,
        ];
    }

    classMethodA() {
    }

    classMethodB() {
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
    describe('#interface', function() {
        it('ClassWithInterface should implement TestInterface', function() {
            let obj = new ClassWithInterface();
        });
        it('InvalidClass should throw an exception', function(done) {
            try {
                let obj = new InvalidClass();
                done('Should throw exception');
            } catch (e) {
                assert.ok(e instanceof InterfaceError);
                done();
            }
        });
    });
    describe('#instanceof', function() {
        it('Object of ClassWithInterface should be instance of ClassWithInterface', function() {
            let obj = new ClassWithInterface();
            assert.ok(obj instanceof ClassWithInterface);
        });
        it('Object of ClassWithInterface should be instance of TestInterface', function() {
            let obj = new ClassWithInterface();
            assert.ok(obj instanceof TestInterface);
        });
        it('Object of ClassWithInheritedInterface should be instance of TestInterface', function() {
            let obj = new ClassWithInheritedInterface();
            assert.ok(obj instanceof TestInterface);
        });
        it('Object of ClassWithInterface should be instance of TestTrait', function() {
            let obj = new ClassWithInterface();
            assert.ok(obj instanceof TestTraitA);
        });
        it('Object of ClassWithInterface should be instance of Mixture', function() {
            let obj = new ClassWithInterface();
            assert.ok(obj instanceof Mixture);
        });
        it('Object of ClassWithInterface should not be instance of AnotherTrait', function() {
            let obj = new ClassWithInterface();
            assert.ok(!(obj instanceof AnotherTrait));
        });
        it('Object of ClassWithInterface should not be instance of AnotherInterface', function() {
            let obj = new ClassWithInterface();
            assert.ok(!(obj instanceof AnotherInterface));
        });
    });
});