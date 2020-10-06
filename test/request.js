import assert from 'assert';
import express from 'express';
import Request, {Method} from '../src/lib/transport/request';
import {ValidationError} from '../src/lib/validation/validator';
import boot from '../src/lib/boot';

boot({
    transport: {
        baseURL: 'http://127.0.0.1:8088/',
    },
});

let server = null;

class TestRequest extends Request
{
    route() {
    }

    validation(chain) {
        return {
            foo: chain().required(),
            number: chain().between(1, 10),
            email: chain().required().email(),
        }
    }
}

class GetRequest extends Request
{
    route() {
        return '/item/:id';
    }
}

class PostRequest extends Request
{
    method() {
        return Method.POST;
    }

    route() {
        return '/item/:id';
    }
}

class Err404Request extends Request
{
    route() {
        return '/404';
    }
}

class InvalidRequest extends Request
{
    route() {
        return '/invalid';
    }
}

describe('Request', function() {
    before(function (done) {
        const app = express();
        const router = express.Router();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(router);
        router.get('/item/:id', (req, res, next) => {
            res.json({
                get: true,
                id: req.params.id,
            });
        });
        router.post('/item/:id', (req, res, next) => {
            res.json({
                post: true,
                id: req.params.id,
                value: req.body.value,
            });
        });
        router.get('/invalid', (req, res, next) => {
            res.status(422).json({
                value: ['Invalid value'],
            });
        });
        server = app.listen(8088, () => {
            done();
        });
    });
    after(function (done) {
        server.close(() => {
            done();
        });
    });
    describe('#validation', function() {
        it('Validation should pass', function(done) {
            let request = new TestRequest({
                foo: 'bar', 
                number: 4, 
                email: 'me@mail.com',
            });
            request.validate().then(() => {
                done();
            });
        });
        it('Validation should pass', function(done) {
            let request = new TestRequest({
                foo: 'bar', 
                email: 'me@mail.com',
            });
            request.validate().then(() => {
                done();
            });
        });
        it('Validation should fail', function(done) {
            let request = new TestRequest({
                number: 4, 
                email: 'me@mail.com',
            });
            request.validate().then(() => {
                done('Validation passed');
            }).catch(() => {
                done();
            });
        });
        it('Validation should fail', function(done) {
            let request = new TestRequest({
                number: 15, 
            });
            request.validate().then(() => {
                done('Validation passed');
            }).catch((err) => {
                assert.ok(err.getErrors('foo') !== undefined);
                assert.ok(err.getErrors('number') !== undefined);
                assert.ok(err.getErrors('email') !== undefined);
                done();
            }).catch(done);
        });
    });
    describe('#send', function() {
        it('Get request should return HTTP 200', function(done) {
            let request = new GetRequest({id: 123});
            request.send().then((response) => {
                assert.ok(response.getBody().get);
                assert.equal(response.getBody().id, 123);
                done();
            }).catch(done);
        });
        it('Post request should return HTTP 200', function(done) {
            let request = new PostRequest({id: 123, value: 100});
            request.send().then((response) => {
                assert.ok(response.getBody().post);
                assert.equal(response.getBody().id, 123);
                assert.equal(response.getBody().value, 100);
                done();
            }).catch(done);
        });
        it('Request should return 404 error', function(done) {
            let request = new Err404Request();
            request.send().then((response) => {
                done('Should return 404 error');
            })
            .catch((response) => {
                assert(response.getStatus(), 404);
                done();
            })
            .catch(done);
        });
        it('Request should return ValidationError', function(done) {
            let request = new InvalidRequest();
            request.send().then((response) => {
                done('Should return validation error');
            })
            .catch((response) => {
                assert.ok(response instanceof ValidationError);
                assert.equal(response.getErrors('value')[0], 'Invalid value');
                done();
            })
            .catch(done);
        });
    });
});