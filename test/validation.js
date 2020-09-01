import assert from 'assert';
import Validator from '../src/lib/validation/validator';

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
        it('Validation should pass', function(done) {
            let chain = new Validator();
            chain.date();
            chain.validate('date', {date: '2020-05-10'}).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Validation should pass', function(done) {
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
        it('Validation should fail', function(done) {
            let chain = new Validator();
            chain.date();
            chain.validate('date', {date: 'foobar'}).then(() => {
                done('Validation passed');
            }).catch((err) => {
                done();
            });
        });
        it('Validation should fail', function(done) {
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