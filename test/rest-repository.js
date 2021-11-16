import assert from 'assert';
import './_boot.js';
import { server } from '../src/lib/server/base.js';
import Document, {
    Attribute } from '../src/lib/structures/document.js';
import ResidentRepository from '../src/lib/repository/resident.js';
import RestRepository from '../src/lib/repository/rest.js';
import RepositoryProxy from '../src/lib/repository/proxy.js';
import RepositoryRequestMap from '../src/lib/repository/request-map.js';
import {
    BaseRequest,
    Method } from '../src/lib/transport/request.js';
import { ValidationError } from '../src/lib/validation/validator.js';
import Query from '../src/lib/query/query.js';
import validateQuery from '../src/lib/query/validator.js';

class TestDocument extends Document
{
    attributes() {
        return {
            id: Number,
            color: Attribute.string('orange'),
            weight: Number,
        };
    }
}

class StoreDocumentRequest extends BaseRequest
{
    method() {
        return Method.PUT;
    }

    route() {
        return '/item';
    }

    validation() {
        return {
            color: this.validator().required(),
            weight: this.validator().required().between(1, 300),
        }
    }
}

class SearchDocumentRequest extends BaseRequest
{
    method() {
        return Method.GET;
    }

    route() {
        return '/item2';
    }

    validation() {
        return {
            query: this.validator().custom(validateQuery, {
                filterable: {
                    color: this.validator()
                        .in(['red', 'green', 'blue']),
                    weight: this.validator()
                        .number()
                        .between(0, 1000),
                },
                sortable: ['color', 'weight'], 
                groupable: ['color'], 
                limit: 50,
            }),
        }
    }
}

let repository = new ResidentRepository(TestDocument);
let proxy = new RepositoryProxy(repository);
let noValidationMapping = new RepositoryRequestMap('/item');
let mapping = new RepositoryRequestMap('/item');
let mapping2 = new RepositoryRequestMap('/item2');
mapping.map('store', StoreDocumentRequest);
mapping2.map('search', SearchDocumentRequest);

describe('Rest repository', function() {
    before(function (done) {
        server()
            .map(mapping, proxy)
            .map(mapping2, proxy)
            .start()
            .then(done);
    });
    beforeEach(function () {
        repository.purge();
    });
    after(function (done) {
        server().stop().then(done);
    });
    describe('#store', function() {
        it('Document should be stored in repository', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            let document = new TestDocument({
                weight: 5,
            });
            repo.store(document).then(() => {
                assert.ok(document.hasKey());
                done();
            }).catch(done);
        });
        it('Document should not be stored due to validation errors', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            let document = new TestDocument({
                weight: 1500,
            });
            repo.store(document).then(() => {
                done('Validation should fail');
            }).catch((response) => {
                assert.ok(response instanceof ValidationError);
                done();
            }).catch(done);
        });
        it('Document should not be stored due to validation errors (server side)', function(done) {
            let repo = new RestRepository(TestDocument, noValidationMapping);
            let document = new TestDocument({
                weight: 1500,
            });
            repo.store(document).then(() => {
                done('Validation should fail');
            }).catch((response) => {
                assert.ok(response instanceof ValidationError);
                done();
            }).catch(done);
        });
        it('Document should be updated but not created again if exists', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            let document = new TestDocument({
                color: 'white',
                weight: 5,
            });
            repo.store(document).then((stored) => {
                stored.weight = 10;
                return repo.store(document);
            }).then(() => {
                let query = (new Query).where('color', 'white');
                return repo.search(query);
            }).then((results) => {
                assert.strictEqual(results.length, 1);
                assert.strictEqual(results[0].weight, 10);
                done();
            }).catch(done);
        });
    });
    describe('#get', function() {
        it('Document should be retrievable from repository', function(done) {
            let document = new TestDocument({
                weight: 5,
            });
            let repo = new RestRepository(TestDocument, mapping);
            repo.store(document).then(() => {
                return repo.get(document.getKey());
            }).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#search', function() {
        it('Document should be searchable in repository', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 100})),
                repo.store(new TestDocument({color: 'red', weight: 150})),
                repo.store(new TestDocument({color: 'blue', weight: 60})),
            ]).then(() => {
                let query = (new Query).where('color', 'blue');
                return repo.search(query);
            }).then((result) => {
                assert.strictEqual(result.length, 1);
                assert.strictEqual(result[0].weight, 60);
                let query = (new Query).where((cond) => {
                    cond.lte('weight', 100);
                });
                return repo.search(query);
            }).then((result) => {
                assert.strictEqual(result.length, 2);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#delete', function() {
        it('Document should be deleteable from repository', function(done) {
            let document = new TestDocument();
            let repo = new RestRepository(TestDocument, mapping);
            repo.store(document).then(() => {
                return repo.delete(document.getKey());
            }).then(() => {
                return repo.get(document.getKey());
            }).then(() => {
                done('Document not deleted');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#exists', function() {
        it('exists() should return true when document exists in collection', function(done) {
            let document = new TestDocument({
                weight: 5,
            });
            let repo = new RestRepository(TestDocument, mapping);
            repo.store(document).then(() => {
                return repo.exists(document.getKey());
            }).then((result) => {
                assert.ok(result);
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('exists() should return false when document does not exist in collection', function(done) {
            let document = new TestDocument({
                weight: 5,
            });
            let repo = new RestRepository(TestDocument, mapping);
            repo.store(document).then(() => {
                return repo.exists(999);
            }).then((result) => {
                assert.ok(!result);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#count', function() {
        it('count() should return proper result', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 100})),
                repo.store(new TestDocument({color: 'red', weight: 150})),
                repo.store(new TestDocument({color: 'blue', weight: 60})),
            ]).then(() => {
                return repo.count({color: 'blue'});
            }).then((result) => {
                assert.strictEqual(result, 1);
                let query = (new Query).where((cond) => {
                    cond.lte('weight', 100);
                });
                return repo.count(query);
            }).then((result) => {
                assert.strictEqual(result, 2);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#sum', function() {
        it('sum() should return proper result', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 100})),
                repo.store(new TestDocument({color: 'red', weight: 150})),
                repo.store(new TestDocument({color: 'blue', weight: 60})),
            ]).then(() => {
                return repo.sum('weight', {color: 'red'});
            }).then((result) => {
                assert.strictEqual(result, 250);
                return repo.sum('weight');
            }).then((result) => {
                assert.strictEqual(result, 310);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#avg', function() {
        it('avg() should return proper result', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 100})),
                repo.store(new TestDocument({color: 'red', weight: 200})),
                repo.store(new TestDocument({color: 'blue', weight: 300})),
            ]).then(() => {
                return repo.avg('weight', {color: 'red'});
            }).then((result) => {
                assert.strictEqual(result, 150);
                return repo.avg('weight');
            }).then((result) => {
                assert.strictEqual(result, 200);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#min', function() {
        it('min() should return proper result', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 100})),
                repo.store(new TestDocument({color: 'red', weight: 200})),
                repo.store(new TestDocument({color: 'blue', weight: 300})),
            ]).then(() => {
                return repo.min('weight', {color: 'blue'});
            }).then((result) => {
                assert.strictEqual(result, 300);
                return repo.min('weight');
            }).then((result) => {
                assert.strictEqual(result, 100);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#max', function() {
        it('max() should return proper result', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 100})),
                repo.store(new TestDocument({color: 'red', weight: 200})),
                repo.store(new TestDocument({color: 'blue', weight: 300})),
            ]).then(() => {
                return repo.max('weight', {color: 'red'});
            }).then((result) => {
                assert.strictEqual(result, 200);
                return repo.max('weight');
            }).then((result) => {
                assert.strictEqual(result, 300);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#sort', function() {
        it('Search results should go in proper order', function(done) {
            let repo = new RestRepository(TestDocument, mapping);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 200})),
                repo.store(new TestDocument({color: 'red', weight: 80})),
                repo.store(new TestDocument({color: 'blue', weight: 150})),
                repo.store(new TestDocument({color: 'red', weight: 180})),
            ]).then(() => {
                let query = (new Query)
                    .where('color', 'red')
                    .ascendingBy('weight');
                return repo.search(query);
            }).then((result) => {
                assert.strictEqual(result.length, 3);
                assert.ok(result[0].weight <= result[1].weight);
                assert.ok(result[1].weight <= result[2].weight);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#query validation', function() {
        it('Query should pass validation', function(done) {
            let repo = new RestRepository(TestDocument, mapping2);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 200})),
                repo.store(new TestDocument({color: 'green', weight: 80})),
                repo.store(new TestDocument({color: 'blue', weight: 150})),
                repo.store(new TestDocument({color: 'red', weight: 180})),
            ]).then(() => {
                let query = (new Query)
                    .where((cond) => {
                        cond.eq('color', 'red')
                            .gte('weight', 200)
                            .or()
                            .eq('color', 'green')
                    })
                    .ascendingBy('weight')
                    .limitTo(20);
                return repo.search(query);
            }).then((result) => {
                assert.strictEqual(result.length, 2);
                done();
            }).catch(done);
        });
        it('Query should not pass validation', function(done) {
            let repo = new RestRepository(TestDocument, mapping2);
            Promise.all([
                repo.store(new TestDocument({color: 'red', weight: 200})),
                repo.store(new TestDocument({color: 'green', weight: 80})),
                repo.store(new TestDocument({color: 'blue', weight: 150})),
                repo.store(new TestDocument({color: 'red', weight: 180})),
            ]).then(() => {
                let query = (new Query)
                    .where((cond) => {
                        cond.eq('color', 'brown')
                            .gte('weight', 2000)
                            .or()
                            .eq('color', 'green')
                    })
                    .ascendingBy('weight')
                    .ascendingBy('colour')
                    .limitTo(200);
                return repo.search(query);
            }).then((result) => {
                done('Query validation passed');
            }).catch((err) => {
                assert.strictEqual(err.errors['query.color'][0], 'brown is not included in the list');
                assert.strictEqual(err.errors['query.weight'][0], 'Value must be less than or equal to 1000');
                assert.strictEqual(err.errors['query.colour'][0], 'Attribute is not sortable');
                assert.strictEqual(err.errors['query'][0], 'Query limit should be set to a number less or equal to 50');
                done();
            }).catch(done);
        });
    });
});