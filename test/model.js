import assert from 'assert';
import Model, {
    Attribute,
} from '../src/lib/structures/model.js';
import Collection from '../src/lib/structures/collection.js';

class TestModel extends Model
{
    attributes() {
        return {
            color: Attribute.string('orange'),
            weight: Attribute.number(),
            collection: Attribute.collection(TestModel),
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

    describe('#states', function() {
        it('Attribute states should be restored', function() {
            let model = new TestModel();
            model.assign({weight: 10, color: 'red'});
            assert.equal(model.color, 'red');
            model.saveState();
            model.assign({color: 'blue'});
            assert.equal(model.color, 'blue');
            model.revertState();
            assert.equal(model.color, 'red');
        });
        it('Attributes diff should be calculated properly', function() {
            let model = new TestModel();
            model.assign({weight: 10, color: 'red'});
            assert.equal(model.color, 'red');
            model.saveState();
            model.assign({color: 'blue'});
            assert.deepEqual(model.diffState(), {color: 'red'});
        });
    });
});