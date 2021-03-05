import assert from 'assert';
import {ServerSymbol} from '../src/lib/server/base.js';
import Model from '../src/lib/structures/model.js';
import ResidentRepository from '../src/lib/repository/resident.js';
import RestRepository from '../src/lib/repository/rest.js';
import RepositoryProxy from '../src/lib/repository/rest/proxy.js';
import RepositoryRequestMap from '../src/lib/repository/rest/request-map.js';
import Request, {Method} from '../src/lib/transport/request.js';
import {ValidationError} from '../src/lib/validation/validator.js';
import Query from '../src/lib/repository/query.js';
import App from '../src/lib/app.js';
import boot from '../src/lib/boot.js';

boot({
    transport: {
        baseURL: 'http://127.0.0.1:8088/',
    },
    server: {
        host: '127.0.0.1',
        port: 8088,
    },
});

class TestModel extends Model
{
    attributes() {
        return {
            id: Number,
            color: {
                type: String,
                default: 'orange',
            },
            weight: Number,
        };
    }
}

class StoreModelRequest extends Request
{
    method() {
        return Method.PUT;
    }

    route() {
        return '/item';
    }

    validation(chain) {
        return {
            color: chain().required(),
            weight: chain().required().between(1, 300),
        }
    }
}

let server = null;
let repository = new ResidentRepository(TestModel);
let proxy = new RepositoryProxy(repository);
let noValidationMapping = new RepositoryRequestMap('/item');
let mapping = new RepositoryRequestMap('/item');
mapping.map('store', StoreModelRequest);

describe('Rest repository', function() {
    before(function (done) {
        server = App.make(ServerSymbol);
        server
            .map(mapping, proxy)
            .start()
            .then(done);
    });
    beforeEach(function () {
        repository.purge();
    });
    after(function (done) {
        server.stop().then(done);
    });
    describe('#store', function() {
        it('Model should be stored in repository', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            let model = new TestModel({
                weight: 5,
            });
            repo.store(model).then(() => {
                assert.ok(model.hasKey());
                done();
            }).catch(done);
        });
        it('Model should not be stored due to validation errors', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            let model = new TestModel({
                weight: 1500,
            });
            repo.store(model).then(() => {
                done('Validation should fail');
            }).catch((response) => {
                assert.ok(response instanceof ValidationError);
                done();
            }).catch(done);
        });
        it('Model should not be stored due to validation errors (server side)', function(done) {
            let repo = new RestRepository(TestModel, noValidationMapping);
            let model = new TestModel({
                weight: 1500,
            });
            repo.store(model).then(() => {
                done('Validation should fail');
            }).catch((response) => {
                assert.ok(response instanceof ValidationError);
                done();
            }).catch(done);
        });
        it('Model should be updated but not created again if exists', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            let model = new TestModel({
                color: 'white',
                weight: 5,
            });
            repo.store(model).then((stored) => {
                stored.weight = 10;
                return repo.store(model);
            }).then(() => {
                let query = (new Query).where('color', 'white');
                return repo.search(query);
            }).then((results) => {
                assert.equal(results.length, 1);
                assert.equal(results.first().weight, 10);
                done();
            }).catch(done);
        });
    });
    describe('#get', function() {
        it('Model should be retrievable from repository', function(done) {
            let model = new TestModel({
                weight: 5,
            });
            let repo = new RestRepository(TestModel, mapping);
            repo.store(model).then(() => {
                return repo.get(model.getKey());
            }).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#search', function() {
        it('Model should be searchable in repository', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            Promise.all([
                repo.store(new TestModel({color: 'red', weight: 100})),
                repo.store(new TestModel({color: 'red', weight: 150})),
                repo.store(new TestModel({color: 'blue', weight: 60})),
            ]).then(() => {
                let query = (new Query).where('color', 'blue');
                return repo.search(query);
            }).then((result) => {
                assert.equal(result.length, 1);
                assert.equal(result.first().weight, 60);
                let query = (new Query).where((cond) => {
                    cond.lte('weight', 100);
                });
                return repo.search(query);
            }).then((result) => {
                assert.equal(result.length, 2);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#delete', function() {
        it('Model should be deleteable from repository', function(done) {
            let model = new TestModel();
            let repo = new RestRepository(TestModel, mapping);
            repo.store(model).then(() => {
                return repo.delete(model.getKey());
            }).then(() => {
                return repo.get(model.getKey());
            }).then(() => {
                done('Model not deleted');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#exists', function() {
        it('exists() should return true when model exists in collection', function(done) {
            let model = new TestModel({
                weight: 5,
            });
            let repo = new RestRepository(TestModel, mapping);
            repo.store(model).then(() => {
                return repo.exists(model.getKey());
            }).then((result) => {
                assert.ok(result);
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('exists() should return false when model does not exist in collection', function(done) {
            let model = new TestModel({
                weight: 5,
            });
            let repo = new RestRepository(TestModel, mapping);
            repo.store(model).then(() => {
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
            let repo = new RestRepository(TestModel, mapping);
            Promise.all([
                repo.store(new TestModel({color: 'red', weight: 100})),
                repo.store(new TestModel({color: 'red', weight: 150})),
                repo.store(new TestModel({color: 'blue', weight: 60})),
            ]).then(() => {
                return repo.count({color: 'blue'});
            }).then((result) => {
                assert.equal(result, 1);
                let query = (new Query).where((cond) => {
                    cond.lte('weight', 100);
                });
                return repo.count(query);
            }).then((result) => {
                assert.equal(result, 2);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#sum', function() {
        it('sum() should return proper result', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            Promise.all([
                repo.store(new TestModel({color: 'red', weight: 100})),
                repo.store(new TestModel({color: 'red', weight: 150})),
                repo.store(new TestModel({color: 'blue', weight: 60})),
            ]).then(() => {
                return repo.sum('weight', {color: 'red'});
            }).then((result) => {
                assert.equal(result, 250);
                return repo.sum('weight');
            }).then((result) => {
                assert.equal(result, 310);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#avg', function() {
        it('avg() should return proper result', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            Promise.all([
                repo.store(new TestModel({color: 'red', weight: 100})),
                repo.store(new TestModel({color: 'red', weight: 200})),
                repo.store(new TestModel({color: 'blue', weight: 300})),
            ]).then(() => {
                return repo.avg('weight', {color: 'red'});
            }).then((result) => {
                assert.equal(result, 150);
                return repo.avg('weight');
            }).then((result) => {
                assert.equal(result, 200);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#min', function() {
        it('min() should return proper result', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            Promise.all([
                repo.store(new TestModel({color: 'red', weight: 100})),
                repo.store(new TestModel({color: 'red', weight: 200})),
                repo.store(new TestModel({color: 'blue', weight: 300})),
            ]).then(() => {
                return repo.min('weight', {color: 'blue'});
            }).then((result) => {
                assert.equal(result, 300);
                return repo.min('weight');
            }).then((result) => {
                assert.equal(result, 100);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#max', function() {
        it('max() should return proper result', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            Promise.all([
                repo.store(new TestModel({color: 'red', weight: 100})),
                repo.store(new TestModel({color: 'red', weight: 200})),
                repo.store(new TestModel({color: 'blue', weight: 300})),
            ]).then(() => {
                return repo.max('weight', {color: 'red'});
            }).then((result) => {
                assert.equal(result, 200);
                return repo.max('weight');
            }).then((result) => {
                assert.equal(result, 300);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#sort', function() {
        it('Search results should go in proper order', function(done) {
            let repo = new RestRepository(TestModel, mapping);
            Promise.all([
                repo.store(new TestModel({color: 'red', weight: 200})),
                repo.store(new TestModel({color: 'red', weight: 80})),
                repo.store(new TestModel({color: 'blue', weight: 150})),
                repo.store(new TestModel({color: 'red', weight: 180})),
            ]).then(() => {
                let query = (new Query)
                    .where('color', 'red')
                    .ascendingBy('weight');
                return repo.search(query);
            }).then((result) => {
                assert.equal(result.length, 3);
                assert.ok(result.get(0).weight <= result.get(1).weight);
                assert.ok(result.get(1).weight <= result.get(2).weight);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
});