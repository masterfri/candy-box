import assert from 'assert';
import Document, {
    Attribute,
} from '../src/lib/structures/document.js';
import Collection from '../src/lib/structures/collection.js';

class TestDocument extends Document
{
    attributes() {
        return {
            color: Attribute.string('orange'),
            weight: Attribute.number(),
            date: Date,
            collection: Attribute.collection(TestDocument),
        };
    }
}

describe('Document', function() {
    describe('#attributes', function() {
        it('Attribute default value should be initiated', function() {
            let document = new TestDocument();
            assert.strictEqual(document.color, 'orange');
        });
        it('Attribute value should always has type as defined', function() {
            let document = new TestDocument({
                weight: '134',
                date: '2021-09-05',
            });
            assert.strictEqual(typeof(document.weight), 'number');
            assert.ok(document.date instanceof Date);
        });
        it('Collection attribute should be initiated as empty collection', function() {
            let document = new TestDocument();
            assert.ok(document.collection instanceof Collection);
        });
        it('Collection items should always has type as defined', function() {
            let document = new TestDocument();
            document.collection.push({});
            assert.ok(document.collection.first() instanceof TestDocument);
        });
    });

    describe('#states', function() {
        it('Attribute states should be restored', function() {
            let document = new TestDocument();
            document.assign({weight: 10, color: 'red'});
            assert.equal(document.color, 'red');
            document.saveState();
            document.assign({color: 'blue'});
            assert.equal(document.color, 'blue');
            document.revertState();
            assert.equal(document.color, 'red');
        });
        it('Attributes diff should be calculated properly', function() {
            let document = new TestDocument();
            document.assign({weight: 10, color: 'red'});
            assert.equal(document.color, 'red');
            document.saveState();
            document.assign({color: 'blue'});
            assert.deepEqual(document.diffState(), {color: 'red'});
        });
    });
});