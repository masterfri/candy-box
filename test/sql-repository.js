import assert from 'assert';
import Document from '../src/lib/structures/document.js';
import SqlRepository from '../src/lib/repository/sql.js';
import Query from '../src/lib/query/query.js';
import { sqlClient } from '../src/lib/sql/base-client.js';

let db = null;

class TestDocument extends Document
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

describe('SQL repository', function() {
    before(function (done) {
        db = sqlClient();
        db.execute(
            `CREATE TABLE IF NOT EXISTS test (id INT(10) UNSIGNED AUTO_INCREMENT NOT NULL, color VARCHAR(100), weight DECIMAL(10, 2), PRIMARY KEY (id)) ENGINE = MEMORY;`
        )
            .then(() => done())
            .catch(done);
    });
    beforeEach(function (done) {
        db.execute(
            `TRUNCATE TABLE test;`
        )
            .then(() => done())
            .catch(done);
    });
    after(function (done) {
        db.execute(
            `DROP TABLE IF EXISTS test;`
        )
            .then(() => done())
            .catch(done);
    });
    describe('#store', function() {
        it('Document should be stored in repository', function(done) {
            let document = new TestDocument();
            let repository = new SqlRepository(TestDocument, 'test', db);
            repository.store(document).then(() => {
                assert.ok(document.hasKey());
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#get', function() {
        it('Document should be retrievable from repository', function(done) {
            let document = new TestDocument();
            let repository = new SqlRepository(TestDocument, 'test', db);
            repository.store(document).then(() => {
                return repository.get(document.getKey());
            }).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
    describe('#search', function() {
        it('Document should be searchable in repository', function(done) {
            let repository = new SqlRepository(TestDocument, 'test', db);
            Promise.all([
                repository.store(new TestDocument({color: 'red', weight: 100})),
                repository.store(new TestDocument({color: 'green', weight: 150})),
                repository.store(new TestDocument({color: 'blue', weight: 60})),
            ]).then(() => {
                let query = (new Query).where('color', 'blue');
                return repository.search(query);
            }).then((result) => {
                assert.equal(result.length, 1);
                assert.equal(result.first().weight, 60);
                let query = (new Query).where((cond) => {
                    cond.in('color', ['red', 'blue']);
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
        it('Document should be deleteable from repository', function(done) {
            let document = new TestDocument();
            let repository = new SqlRepository(TestDocument, 'test', db);
            repository.store(document).then(() => {
                return repository.delete(document.getKey());
            }).then(() => {
                return repository.get(document.getKey());
            }).then(() => {
                done('Document not deleted');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#exists', function() {
        it('exists() should return true when document exists in collection', function(done) {
            let document = new TestDocument();
            let repository = new SqlRepository(TestDocument, 'test', db);
            repository.store(document).then(() => {
                return repository.exists(document.getKey());
            }).then((result) => {
                assert.ok(result);
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('exists() should return false when document does not exist in collection', function(done) {
            let document = new TestDocument();
            let repository = new SqlRepository(TestDocument, 'test', db);
            repository.store(document).then(() => {
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
            let repository = new SqlRepository(TestDocument, 'test', db);
            Promise.all([
                repository.store(new TestDocument({color: 'red', weight: 100})),
                repository.store(new TestDocument({color: 'red', weight: 150})),
                repository.store(new TestDocument({color: 'blue', weight: 60})),
            ]).then(() => {
                return repository.count({color: 'blue'});
            }).then((result) => {
                assert.equal(result, 1);
                let query = (new Query).where((cond) => {
                    cond.lte('weight', 100);
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
            let repository = new SqlRepository(TestDocument, 'test', db);
            Promise.all([
                repository.store(new TestDocument({color: 'red', weight: 100})),
                repository.store(new TestDocument({color: 'red', weight: 150})),
                repository.store(new TestDocument({color: 'blue', weight: 60})),
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
            let repository = new SqlRepository(TestDocument, 'test', db);
            Promise.all([
                repository.store(new TestDocument({color: 'red', weight: 100})),
                repository.store(new TestDocument({color: 'red', weight: 200})),
                repository.store(new TestDocument({color: 'blue', weight: 300})),
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
            let repository = new SqlRepository(TestDocument, 'test', db);
            Promise.all([
                repository.store(new TestDocument({color: 'red', weight: 100})),
                repository.store(new TestDocument({color: 'red', weight: 200})),
                repository.store(new TestDocument({color: 'blue', weight: 300})),
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
            let repository = new SqlRepository(TestDocument, 'test', db);
            Promise.all([
                repository.store(new TestDocument({color: 'red', weight: 100})),
                repository.store(new TestDocument({color: 'red', weight: 200})),
                repository.store(new TestDocument({color: 'blue', weight: 300})),
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
            let repository = new SqlRepository(TestDocument, 'test', db);
            Promise.all([
                repository.store(new TestDocument({color: 'red', weight: 200})),
                repository.store(new TestDocument({color: 'red', weight: 80})),
                repository.store(new TestDocument({color: 'blue', weight: 150})),
                repository.store(new TestDocument({color: 'red', weight: 180})),
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