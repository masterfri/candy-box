import assert from 'assert';
import fs from 'fs';
import './_boot.js';
import {
    BaseRequest,
    Method } from '../src/lib/transport/request.js';
import Response from '../src/lib/transport/response.js';
import { server } from '../src/lib/server/base.js';
import { ValidationError } from '../src/lib/validation/validator.js';

class TestRequestClient extends BaseRequest
{
    route() {
        return '/';
    }
}

class TestRequest extends TestRequestClient
{
    validation() {
        return {
            foo: this.validator().required(),
            number: this.validator().between(1, 10),
            email: this.validator().required().email(),
        }
    }
}

class GetRequest extends BaseRequest
{
    route() {
        return '/entity/:id';
    }
}

class StreamRequest extends BaseRequest
{
    route() {
        return '/stream';
    }
}

class PostRequest extends BaseRequest
{
    method() {
        return Method.POST;
    }

    route() {
        return '/entity/:id';
    }
}

class Err404Request extends BaseRequest
{
    route() {
        return '/404';
    }
}

describe('Http server', function() {
    before(function (done) {
        server()
            .route(TestRequest, (request) => {

            })
            .route(GetRequest, (request) => {
                return new Response({
                    get: true,
                    id: request.get('id'),
                });
            })
            .route(PostRequest, (request) => {
                return new Response({
                    post: true,
                    id: request.get('id'),
                    value: request.get('value'),
                });
            })
            .route(StreamRequest, (request) => {
                return new Response(
                    fs.createReadStream('test/_test.txt')
                );
            })
            .start()
            .then(done);
       
    });
    after(function (done) {
        server().stop().then(done);
    });
    describe('#send', function() {
        it('Get request should return HTTP 200', function(done) {
            let request = new GetRequest({id: 123});
            request.send().then((response) => {
                assert.ok(response.body.get);
                assert.equal(response.body.id, 123);
                done();
            }).catch(done);
        });
        it('Post request should return HTTP 200', function(done) {
            let request = new PostRequest({id: 123, value: 345});
            request.send().then((response) => {
                assert.ok(response.body.post);
                assert.equal(response.body.id, 123);
                assert.equal(response.body.value, 345);
                done();
            }).catch(done);
        });
        it('Stream request should return file contents', function(done) {
            let request = new StreamRequest();
            request.send().then((response) => {
                assert.ok(response.body.indexOf('TEST DATA BEGIN') !== -1);
                assert.ok(response.body.indexOf('TEST DATA END') !== -1);
                done();
            }).catch(done);
        });
        it('Request should return 404 error', function(done) {
            let request = new Err404Request();
            request.send().then((response) => {
                done('Should return 404 error');
            })
            .catch((response) => {
                assert(response.status, 404);
                done();
            })
            .catch(done);
        });
        it('Request should return ValidationError', function(done) {
            let request = new TestRequestClient({
                foo: 'bar',
                number: 5,
            });
            request.send().then((response) => {
                done('Should return validation error');
            })
            .catch((response) => {
                assert.ok(response instanceof ValidationError);
                assert.equal(response.getErrors('email')[0], 'Email can\'t be blank');
                done();
            })
            .catch(done);
        });
    });
});