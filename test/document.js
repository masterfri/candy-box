import assert from 'assert';
import { isIterable } from '../src/lib/helpers.js';
import Document, {
    Attribute,
} from '../src/lib/structures/document.js';

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
            assert.ok(isIterable(document.collection));
        });
        it('Collection items should always has type as defined', function() {
            let document = new TestDocument();
            document.collection.push({color: 'red'});
            document.collection.push({color: 'red'});
            document.collection[1] = {color: 'green'}
            document.collection[0].weight = 100;
            assert.ok(document.collection[0] instanceof TestDocument);
            assert.strictEqual(document.collection[0].color, 'red');
            assert.strictEqual(document.collection.length, 2);
            delete document.collection[0];
            assert.strictEqual(document.collection[0].color, 'green');
            assert.strictEqual(document.collection.length, 1);
        });
    });
});