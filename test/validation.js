import assert from 'assert';
import Validator from '../src/lib/validation/validator.js';

describe('Validation', function() {
    describe('#between', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.between(5, 10);
            chain.validate('value', {value: 7}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.between(5, 10);
            chain.validate('value', {value: 17}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#date', function() {
        it('Validation should pass for date', function(done) {
            let chain = new Validator();
            chain.date();
            chain.validate('date', {date: '2020-05-10'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should pass for datetime', function(done) {
            let chain = new Validator();
            chain.datetime();
            chain.validate('date', {date: '2020-05-10 06:30:00'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should pass for earlier date', function(done) {
            let chain = new Validator();
            chain.before('2020-05-10', {
                dateOnly: true,
            });
            chain.validate('date', {date: '2020-05-05'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail for non-date value', function(done) {
            let chain = new Validator();
            chain.date();
            chain.validate('date', {date: 'foobar'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
        it('Validation should fail for datetime when only date expected', function(done) {
            let chain = new Validator();
            chain.date();
            chain.validate('date', {date: '2020-05-10 06:30:00'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
        it('Validation should fail for date above threshold', function(done) {
            let chain = new Validator();
            chain.before('2020-05-10', {
                dateOnly: true,
            });
            chain.validate('date', {date: '2020-05-11'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#in', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.in([5, 10]);
            chain.validate('value', {value: 5}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.in([5, 10]);
            chain.validate('value', {value: 17}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#required', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.required();
            chain.validate('name', {name: 'Jack'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.required();
            chain.validate('name', {name: ''}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
    });

    describe('#required + length', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.required().length(4);
            chain.validate('name', {name: 'Jack'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.required().length(3, 5);
            chain.validate('name', {name: 'Jack'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.required().length(4);
            chain.validate('name', {name: ''}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.required().length(4);
            chain.validate('name', {name: 'John Doe'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.required().length(10, 15);
            chain.validate('name', {name: 'John Doe'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#custom', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.custom((val, options) => {
                return val.indexOf(options.letter) !== -1 ? undefined : `Where is '${options.letter}'?`;
            }, {
                letter: 'X',
            });
            chain.validate('name', {name: 'JackX'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.custom((val) => {
                return val.indexOf('X') !== -1 ? undefined : 'Where is X?';
            });
            chain.validate('name', {name: 'Jack'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                assert.ok(err.name !== undefined);
                assert.strictEqual(err.name.length, 1);
                assert.strictEqual(err.name[0], 'Where is X?');
                done();
            }).catch(done);
        });
    });
    describe('#each', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.each((chain) => {
                chain.between(5, 10);
            });
            chain.validate('numbers', {numbers: [5, 7, 10]}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.each((chain) => {
                chain.between(5, 10);
            });
            chain.validate('numbers', {numbers: [5, 15, 10]}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                assert.ok(err['numbers.1'] !== undefined);
                done();
            }).catch(done);
        });
    });
    describe('#nested', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.nested({
                date(chain) {
                    chain
                        .required()
                        .date();
                },
                numbers(chain) {
                    chain
                        .required()
                        .each((chain) => {
                            chain.between(5, 10);
                        });
                },
            });
            chain.validate('object', {object: {
                date: '2021-05-01',
                numbers: [5, 7, 10],
            }}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.nested({
                date(chain) {
                    chain
                        .required()
                        .date();
                },
                numbers(chain) {
                    chain
                        .required()
                        .each((chain) => {
                            chain.between(5, 10);
                        });
                },
            });
            chain.validate('object', {object: {
                date: '',
                numbers: [5, 7, 10],
            }}).then(() => {
                done('Validation passed');
            }).catch(() => {
                return chain.validate('object', {object: {
                    date: '2021-05-01',
                    numbers: [],
                }});
            }).then(() => {
                done('Validation passed');
            }).catch(() => {
                done();
            });
        });
    });
    describe('#each + nested', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.each((chain) => {
                chain.nested({
                    date(chain) {
                        chain
                            .required()
                            .date();
                    },
                    age(chain) {
                        chain
                            .required()
                            .between(5, 10);
                    },
                });
            });
            chain.validate('array', {array: [{
                date: '2021-05-01',
                age: 5,
            }, {
                date: '2021-07-01',
                age: 10,
            }]}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.each((chain) => {
                chain.nested({
                    date(chain) {
                        chain
                            .required()
                            .date();
                    },
                    age(chain) {
                        chain
                            .required()
                            .between(5, 10);
                    },
                });
            });
            chain.validate('array', {array: [{
                date: '',
                age: 5,
            }, {
                date: '2021-07-01',
                age: 15,
            }]}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                assert.ok(err['array.0.date'] !== undefined);
                assert.ok(err['array.1.age'] !== undefined);
                done();
            }).catch(done);
        });
    });
    describe('#or', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.or((chain) => {
                chain.url()
                    .in(['foo', 'bar']);
            });
            chain.validate('url', {url: 'http://google.com'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.or((chain) => {
                chain.url()
                    .in(['foo', 'bar']);
            });
            chain.validate('url', {url: 'bar'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.or((chain) => {
                chain.url()
                    .in(['foo', 'bar']);
            });
            chain.validate('url', {url: 'foobar'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#or + and', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.or((chain) => {
                chain.and((chain) => {
                    chain.url()
                        .length(10, 15);
                })
                .in(['foo', 'bar']);
            });
            chain.validate('url', {url: 'http://i.ua'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.or((chain) => {
                chain.and((chain) => {
                    chain.url()
                        .length(10, 15);
                })
                .in(['foo', 'bar']);
            });
            chain.validate('url', {url: 'foo'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.or((chain) => {
                chain.and((chain) => {
                    chain.url()
                        .length(10, 15);
                })
                .in(['foo', 'bar']);
            });
            chain.validate('url', {url: 'http://google.com'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
    });
    describe('#when', function() {
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.when((attr, data) => {
                return data.related === 'foo';
            }, (chain) => {
                chain.required();
            });
            chain.validate('name', {name: 'Jack', related: 'foo'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.when((attr, data) => {
                return data.related === 'foo';
            }, (chain) => {
                chain.required();
            });
            chain.validate('name', {name: '', related: 'bar'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.when((attr, data) => {
                return data.related === 'foo';
            }, (chain) => {
                chain.required();
            });
            chain.validate('name', {name: '', related: 'foo'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
    });
});