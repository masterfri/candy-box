import assert from 'assert';
import Collection from '../src/lib/structures/collection';
import TypedCollection from '../src/lib/structures/typed-collection';

describe('Collection', function() {
    describe('#push', function() {
        it('Collection size should equal to 3', function() {
            let col = new Collection();
            col.push(1, 2, 3);
            assert.equal(col.length, 3);
        });
    });
    describe('#pop', function() {
        it('Element should pop from collection', function() {
            let col = new Collection([1, 2, 3]);
            assert.equal(col.pop(), 3);
            assert.equal(col.length, 2);
        });
    });
    describe('#unshift', function() {
        it('Collection size should equal to 3', function() {
            let col = new Collection();
            col.unshift(1, 2, 3);
            assert.equal(col.length, 3);
        });
    });
    describe('#pop', function() {
        it('Element should be shifted from collection', function() {
            let col = new Collection([1, 2, 3]);
            assert.equal(col.shift(), 1);
            assert.equal(col.length, 2);
        });
    });
    describe('#slice', function() {
        it('Should produce collection instance with valid elements', function() {
            let col = new Collection([1, 2, 3]);
            let slice = col.slice(1, 3);
            assert.ok(slice instanceof Collection);
            assert.equal(slice.first(), 2);
            assert.equal(slice.last(), 3);
        });
    });
    describe('#splice', function() {
        it('Element should be replaced', function() {
            let col = new Collection([1, 2, 3]);
            col.splice(1, 1, 7);
            assert.equal(col.get(1), 7);
        });
    });
    describe('#remove', function() {
        it('Elements should be removed', function() {
            let col = new Collection([1, 2, 3]);
            col.remove(1, 3);
            assert.equal(col.indexOf(1), -1);
            assert.equal(col.indexOf(3), -1);
        });
    });
    describe('#map', function() {
        it('Should produce collection instance with valid elements', function() {
            let col = new Collection([1, 2, 3]);
            let mapped = col.map((el) => el * 10);
            assert.ok(mapped instanceof Collection);
            assert.equal(mapped.first(), 10);
        });
    });
    describe('#filter', function() {
        it('Should produce collection instance with valid elements', function() {
            let col = new Collection([1, 2, 3]);
            let filtered = col.filter((el) => el === 3);
            assert.ok(filtered instanceof Collection);
            assert.equal(filtered.first(), 3);
        });
    });
    describe('#concat', function() {
        it('Should produce collection instance with valid elements', function() {
            let col = new Collection([1]);
            let concatenated = col.concat(new Collection([2]), [3]);
            assert.ok(concatenated instanceof Collection);
            assert.equal(concatenated.get(1), 2);
            assert.equal(concatenated.get(2), 3);
        });
    });
    describe('#forEach', function() {
        it('Should go through whole collection', function() {
            let col = new Collection([1, 2, 3]);
            let sum = 0;
            col.forEach((el) => {
                sum += el;
            });
            assert.equal(sum, 6);
        });
    });
    describe('#reduce', function() {
        it('Should calculate sum of elements', function() {
            let col = new Collection([1, 2, 3]);
            assert.equal(col.reduce((el, sum) => el + sum), 6);
        });
    });
    describe('#reduceRight', function() {
        it('Should concatenate elements in reverse order', function() {
            let col = new Collection([1, 2, 3]);
            assert.equal(col.reduceRight((el, sum) => el + sum, ''), '321');
        });
    });
    describe('#sort', function() {
        it('Should produce collection instance with valid elements', function() {
            let col = new Collection([4, 1, 7]);
            let sorted = col.sort();
            assert.ok(sorted instanceof Collection);
            assert.equal(sorted.first(), 1);
        });
    });
    describe('#group', function() {
        it('Should create two groups with even and odd numbers', function() {
            let col = new Collection([1, 2, 3, 4, 5]);
            let groups = col.group((el) => el % 2 === 0 ? 'even' : 'odd');
            assert.equal(groups.length, 2);
            assert.equal(groups[0].key, 'odd');
            assert.equal(groups[0].items.length, 3);
            assert.equal(groups[0].items[1], 3);
            assert.equal(groups[1].key, 'even');
            assert.equal(groups[1].items.length, 2);
            assert.equal(groups[1].items[1], 4);
        });
        it('Should group elements by value of properties', function() {
            let col = new Collection([
                {name: 'cow', color: 'brown', size: 'big'},
                {name: 'cat', color: 'brown', size: 'small'},
                {name: 'elephant', color: 'grey', size: 'big'},
                {name: 'dog', color: 'brown', size: 'small'},
            ]);
            let groups = col.group('size', 'color');
            assert.equal(groups.length, 3);
            assert.equal(groups[0].items.length, 1);
            assert.equal(groups[0].items[0].name, 'cow');
            assert.equal(groups[1].items.length, 2);
            assert.equal(groups[1].items[1].name, 'dog');
            assert.equal(groups[2].items.length, 1);
            assert.equal(groups[2].items[0].name, 'elephant');
        });
    });
    describe('#some', function() {
        it('Some elements should be even', function() {
            let col = new Collection([1, 2, 3]);
            assert.ok(col.some((el) => el % 2 === 0));
        });
    });
    describe('#every', function() {
        it('All elements should be even', function() {
            let col = new Collection([2, 4, 6]);
            assert.ok(col.every((el) => el % 2 === 0));
        });
    });
    describe('#indexOf', function() {
        it('Index of element should equal to 2', function() {
            let col = new Collection([2, 4, 6]);
            assert.equal(col.indexOf(6), 2);
        });
    });
    describe('#intersect', function() {
        it('Intersection of collections should be correct', function() {
            let col = new Collection([2, 4, 6, 9, 11, 0]);
            let intersection = col.intersect([2, 5, 6], [2, 9, 11, 6]);
            assert.deepEqual(intersection.all(), [2, 6]);
        });
    });
    describe('#difference', function() {
        it('Difference of collections should be correct', function() {
            let col = new Collection([2, 4, 6, 9, 11, 0]);
            let difference = col.difference([2, 5, 6], [2, 9, 11, 6]);
            assert.deepEqual(difference.all(), [4, 0]);
        });
    });
    describe('#distinct', function() {
        it('distinct should produce collection without duplicates', function() {
            let col = new Collection([2, 4, 2, 6, 9, 6, 2]);
            let distinct = col.distinct();
            assert.deepEqual(distinct.all(), [2, 4, 6, 9]);
        });
    });
    describe('#iteratot', function() {
        it('Iterator should go over all elements of collection', function() {
            let col = new Collection([2, 4, 6]);
            let sum = 0;
            for (let val of col) {
                sum += val;
            }
            assert.equal(sum, 12);
        });
    });
});

describe('TypedCollection', function() {
    describe('#conversion', function() {
        it('All elements of collection must have proper type', function() {
            let col = new TypedCollection(Number, [2, true, '6']);
            assert.ok(col.every((el) => typeof el === 'number'));
        });
    });
    describe('#concat', function() {
        it('All elements of both collections should have proper type', function() {
            let col1 = new TypedCollection(Number, [2, true, '6']);
            let col2 = new Collection(Number, [7, '10']);
            let col3 = col1.concat(col2);
            assert.ok(col3.every((el) => typeof el === 'number'));
        });
    });
    describe('#splice', function() {
        it('After splice the collection should contain correct elements', function() {
            let col = new TypedCollection(Number, [2, true, '6', 10]);
            col.splice(0, 1, '15');
            assert.ok(col.every((el) => typeof el === 'number'));
            assert.equal(col.indexOf(2), -1);
            assert.equal(col.indexOf(15), 0);
        });
    });
});