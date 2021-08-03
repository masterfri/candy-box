import assert from 'assert';
import App from '../src/lib/app.js';
import { sqlClient } from '../src/lib/sql/base-client.js';

let db = null;

describe('MySQL client', function() {
    before(function (done) {
        db = sqlClient();
        db.execute(
            `CREATE TABLE IF NOT EXISTS test (id INT(10) UNSIGNED AUTO_INCREMENT NOT NULL, color VARCHAR(100), weight DECIMAL(10, 2), PRIMARY KEY (id)) ENGINE = MEMORY;`
        )
            .then(() => db.execute(db.newQuery().table('test').insert([
                {color: 'red', weight: 10},
                {color: 'green', weight: 15},
                {color: 'blue', weight: 20},
                {color: 'yellow', weight: 5},
            ])))
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
    describe('#execute', function() {
        it('fetch() should return result', function(done) {
            let sql = db.newQuery()
                .table('test')
                .select();
            db.fetch(sql)
                .then((result) => {
                    assert.strictEqual(result.length, 4);
                    done();
                })
                .catch(done);
        });
        it('fetchRow() should return result', function(done) {
            let sql = db.newQuery()
                .table('test')
                .where('color', '=', 'red')
                .select(1);
            db.fetchRow(sql.sql, sql.bindings)
                .then((result) => {
                    assert.strictEqual(Number(result.weight), 10);
                    done();
                })
                .catch(done);
        });
        it('fetchColumn() should return result', function(done) {
            let sql = db.newQuery()
                .table('test')
                .column('color')
                .where('weight', '<=', 15)
                .ascendingBy('weight')
                .select();
            db.fetchColumn(sql.sql, sql.bindings)
                .then((result) => {
                    assert.deepStrictEqual(result, ['yellow', 'red', 'green']);
                    done();
                })
                .catch(done);
        });
        it('fetchValue() should return result', function(done) {
            let sql = db.newQuery()
                .table('test')
                .column('color')
                .where('weight', '>=', 20)
                .select(1);
            db.fetchValue(sql.sql, sql.bindings)
                .then((result) => {
                    assert.strictEqual(result, 'blue');
                    done();
                })
                .catch(done);
        });
        it('update() should change record', function(done) {
            let sql = db.newQuery()
                .table('test')
                .where('color', '=', 'red')
                .update({
                    weight: 80,
                });
            db.update(sql)
                .then((result) => {
                    assert.strictEqual(result, 1);
                    let sql = db.newQuery()
                        .table('test')
                        .column('color')
                        .where('weight', '>=', 50)
                        .select(1);
                    return db.fetchValue(sql);
                }).then((result) => {
                    assert.strictEqual(result, 'red');
                    done();
                })
                .catch(done);
        });
        it('delete() should remove record', function(done) {
            let sql = db.newQuery()
                .table('test')
                .where('color', '=', 'red')
                .delete();
            db.delete(sql)
                .then((result) => {
                    assert.strictEqual(result, 1);
                    let sql = db.newQuery()
                        .table('test')
                        .where('weight', '>=', 50)
                        .select();
                    return db.fetch(sql);
                }).then((result) => {
                    assert.strictEqual(result.length, 0);
                    done();
                })
                .catch(done);
        });
    });
});
