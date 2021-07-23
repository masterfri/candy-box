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
                    assert.equal(result.length, 4);
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
                    assert.equal(result.weight, 10);
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
                    assert.deepEqual(result, ['yellow', 'red', 'green']);
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
                    assert.equal(result, 'blue');
                    done();
                })
                .catch(done);
        });
    });
});
