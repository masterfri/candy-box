import assert from 'assert';
import Model from '../src/lib/structures/model';
import Collection from '../src/lib/structures/collection';

class TestModel extends Model
{
    constructor(attributes = {}, safe = true, change = true) {
        super(attributes, safe, change);
        this.unsafe = 'ok';
    }
    
    attributes() {
        return {
            color: {
                type: String,
                default: 'orange',
            },
            weight: {
                type: Number,
            },
            collection: {
                type: Array,
                elementsType: TestModel,
            },
        };
    }
}

describe('Model', function() {
    describe('#attributes', function() {
        it('Attribute default value should be initiated', function() {
            let model = new TestModel();
            assert.equal(model.color, 'orange');
        });
        it('Attribute value should always has type as defined', function() {
            let model = new TestModel({
                weight: '134',
            });
            assert.equal(typeof(model.weight), 'number');
        });
        it('Collection attribute should be initiated as empty collection', function() {
            let model = new TestModel();
            assert.ok(model.collection instanceof Collection);
        });
        it('Collection items should always has type as defined', function() {
            let model = new TestModel();
            model.collection.push({});
            assert.ok(model.collection.first() instanceof TestModel);
        });
    });
    describe('#assign', function() {
        it('Attribute changes should be tracked', function() {
            let model = new TestModel();
            assert.ok(!model.isChanged('color'));
            model.color = 'red';
            assert.ok(model.isChanged('color'));
        });
        it('Attribute changes should not be tracked when not needed', function() {
            let model = new TestModel();
            assert.ok(!model.isChanged('color'));
            model.assign({color: 'red'}, true, false);
            assert.ok(!model.isChanged('color'));
        });
        it('Only safe attributes can be changes via mass assignment', function() {
            let model = new TestModel();
            model.assign({unsafe: 'fail'});
            assert.equal(model.unsafe, 'ok');
        });
        it('Safe attributes can be changes via mass assignment when needed', function() {
            let model = new TestModel();
            model.assign({unsafe: 'fail'}, false);
            assert.notEqual(model.unsafe, 'ok');
        });
        it('Original value should be available', function() {
            let model = new TestModel();
            model.color = 'red';
            model.color = 'green';
            assert.equal(model.original('color'), 'orange');
        });
    });
    describe('#revert', function() {
        it('Attribute value should be reverted', function() {
            let model = new TestModel();
            model.color = 'red';
            model.revert();
            assert.equal(model.color, 'orange');
        });
        it('Only specified attributes should be reverted', function() {
            let model = new TestModel();
            model.color = 'red';
            model.weight = 500;
            model.revert('color');
            assert.equal(model.color, 'orange');
            assert.equal(model.weight, 500);
        });
    });
    describe('#sync', function() {
        it('Attribute should not treat as changed after sync', function() {
            let model = new TestModel();
            model.color = 'red';
            model.sync();
            assert.ok(!model.isChanged('color'));
        });
        it('Original attribute value should be updated', function() {
            let model = new TestModel();
            model.color = 'red';
            model.sync();
            model.color = 'green';
            assert.equal(model.original('color'), 'red');
        });
    });
});