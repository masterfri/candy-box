import assert from 'assert';
import Request, {Method} from '../src/lib/transport/request';
import Response from '../src/lib/transport/response';
import {ServerSymbol} from '../src/lib/server/base';
import {ValidationError} from '../src/lib/validation/validator';
import App from '../src/lib/app';
import boot from '../src/lib/boot';

boot({
    transport: {
        baseURL: 'http://127.0.0.1:8088/',
    },
    server: {
        host: '127.0.0.1',
        port: 8088,
    },
});

class TestRequestClient extends Request
{
    route() {
        return '/';
    }
}

class TestRequest extends TestRequestClient
{
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
        return '/entity/:id';
    }
}

class PostRequest extends Request
{
    method() {
        return Method.POST;
    }

    route() {
        return '/entity/:id';
    }
}

class Err404Request extends Request
{
    route() {
        return '/404';
    }
}

let server = null;

describe('Http server', function() {
    before(function (done) {
        server = App.make(ServerSymbol);
        server
            .route(TestRequest, (request) => {

            })
            .route(GetRequest, (request) => {
                return new Response({
                    get: true,
                    id: request.getParam('id'),
                });
            })
            .route(PostRequest, (request) => {
                return new Response({
                    post: true,
                    id: request.getParam('id'),
                    value: request.getParam('value'),
                });
            })
            .start()
            .then(done);
       
    });
    after(function (done) {
        server.stop().then(done);
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