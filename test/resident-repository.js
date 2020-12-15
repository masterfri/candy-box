import assert from 'assert';
import Model from '../src/lib/structures/model';
import ResidentRepository from '../src/lib/repository/resident';
import Query from '../src/lib/repository/query';

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

describe('Resident repository', function() {
    describe('#store', function() {
        it('Model should be stored in repository', function(done) {
            let model = new TestModel();
            let repository = new ResidentRepository(TestModel);
            repository.store(model).then(() => {
                assert.ok(model.hasKey());
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#get', function() {
        it('Model should be retrievable from repository', function(done) {
            let model = new TestModel();
            let repository = new ResidentRepository(TestModel);
            repository.store(model).then(() => {
                return repository.get(model.getKey());
            }).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#search', function() {
        it('Model should be searchable in repository', function(done) {
            let repository = new ResidentRepository(TestModel);
            Promise.all([
                repository.store(new TestModel({color: 'red', weight: 100})),
                repository.store(new TestModel({color: 'red', weight: 150})),
                repository.store(new TestModel({color: 'blue', weight: 60})),
            ]).then(() => {
                let query = (new Query).where('color', 'blue');
                return repository.search(query);
            }).then((result) => {
                assert.equal(result.length, 1);
                assert.equal(result.first().weight, 60);
                let query = (new Query).where((cond) => {
                    cond.lessThanOrEquals('weight', 100);
                });
                return repository.search(query);
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
            let repository = new ResidentRepository(TestModel);
            repository.store(model).then(() => {
                return repository.delete(model.getKey());
            }).then(() => {
                return repository.get(model.getKey());
            }).then(() => {
                done('Model not deleted');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#exists', function() {
        it('exists() should return true when model exists in collection', function(done) {
            let model = new TestModel();
            let repository = new ResidentRepository(TestModel);
            repository.store(model).then(() => {
                return repository.exists(model.getKey());
            }).then((result) => {
                assert.ok(result);
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('exists() should return false when model does not exist in collection', function(done) {
            let model = new TestModel();
            let repository = new ResidentRepository(TestModel);
            repository.store(model).then(() => {
                return repository.exists(999);
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
            let repository = new ResidentRepository(TestModel);
            Promise.all([
                repository.store(new TestModel({color: 'red', weight: 100})),
                repository.store(new TestModel({color: 'red', weight: 150})),
                repository.store(new TestModel({color: 'blue', weight: 60})),
            ]).then(() => {
                return repository.count({color: 'blue'});
            }).then((result) => {
                assert.equal(result, 1);
                let query = (new Query).where((cond) => {
                    cond.lessThanOrEquals('weight', 100);
                });
                return repository.count(query);
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
            let repository = new ResidentRepository(TestModel);
            Promise.all([
                repository.store(new TestModel({color: 'red', weight: 100})),
                repository.store(new TestModel({color: 'red', weight: 150})),
                repository.store(new TestModel({color: 'blue', weight: 60})),
            ]).then(() => {
                return repository.sum('weight', {color: 'red'});
            }).then((result) => {
                assert.equal(result, 250);
                return repository.sum('weight');
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
            let repository = new ResidentRepository(TestModel);
            Promise.all([
                repository.store(new TestModel({color: 'red', weight: 100})),
                repository.store(new TestModel({color: 'red', weight: 200})),
                repository.store(new TestModel({color: 'blue', weight: 300})),
            ]).then(() => {
                return repository.avg('weight', {color: 'red'});
            }).then((result) => {
                assert.equal(result, 150);
                return repository.avg('weight');
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
            let repository = new ResidentRepository(TestModel);
            Promise.all([
                repository.store(new TestModel({color: 'red', weight: 100})),
                repository.store(new TestModel({color: 'red', weight: 200})),
                repository.store(new TestModel({color: 'blue', weight: 300})),
            ]).then(() => {
                return repository.min('weight', {color: 'blue'});
            }).then((result) => {
                assert.equal(result, 300);
                return repository.min('weight');
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
            let repository = new ResidentRepository(TestModel);
            Promise.all([
                repository.store(new TestModel({color: 'red', weight: 100})),
                repository.store(new TestModel({color: 'red', weight: 200})),
                repository.store(new TestModel({color: 'blue', weight: 300})),
            ]).then(() => {
                return repository.max('weight', {color: 'red'});
            }).then((result) => {
                assert.equal(result, 200);
                return repository.max('weight');
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
            let repository = new ResidentRepository(TestModel);
            Promise.all([
                repository.store(new TestModel({color: 'red', weight: 200})),
                repository.store(new TestModel({color: 'red', weight: 80})),
                repository.store(new TestModel({color: 'blue', weight: 150})),
                repository.store(new TestModel({color: 'red', weight: 180})),
            ]).then(() => {
                let query = (new Query)
                    .where('color', 'red')
                    .ascendingBy('weight');
                return repository.search(query);
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