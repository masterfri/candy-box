import assert from 'assert';
import express from 'express';
import HttpTransport from '../src/lib/transport/http.js';
import Request, {Method} from '../src/lib/transport/request.js';
import Middleware from '../src/lib/transport/middleware.js';

let server = null;

describe('Transport', function() {
    before(function (done) {
        const app = express();
        const router = express.Router();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(router);
        router.get('/', (req, res, next) => {
            res.json({
                get: true,
            });
        });
        router.post('/', (req, res, next) => {
            res.json({
                post: true,
                param: req.body.param,
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
    describe('#HttpTransport', function() {
        it('GET / should return HTTP 200', function(done) {
            let transport = new HttpTransport({
                baseURL: 'http://127.0.0.1:8088/',
            });
            let request = new Request('');
            transport.send(request).then((response) => {
                assert.strictEqual(response.status, 200);
                assert.ok(response.body.get);
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('POST / should return HTTP 200', function(done) {
            let transport = new HttpTransport({
                baseURL: 'http://127.0.0.1:8088/',
            });
            let request = new Request('', Method.POST, {
                param: 'param',
            });
            transport.send(request).then((response) => {
                assert.strictEqual(response.status, 200);
                assert.ok(response.body.post);
                assert.strictEqual(response.body.param, 'param');
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('Middleware should run correctly', function(done) {
            let transport = new HttpTransport({
                baseURL: 'http://127.0.0.1:8088/',
            });
            let request = new Request('', Method.POST, {
                param: 'X',
            });
            transport.appendMiddleware((req, next) => {
                req.body.param += 'A';
                return next(req).then((resp) => {
                    resp.body.param += 'a';
                    return resp
                });
            }).appendMiddleware(new Middleware([
                (req, next) => {
                    req.body.param += 'B';
                    return next(req).then((resp) => {
                        resp.body.param += 'b';
                        return resp
                    });
                },
                (req, next) => {
                    req.body.param += 'C';
                    return next(req).then((resp) => {
                        resp.body.param += 'c';
                        return resp
                    });
                }
            ])).appendMiddleware((req, next) => {
                req.body.param += 'D';
                return next(req).then((resp) => {
                    resp.body.param += 'd';
                    return resp
                });
            });
            transport.send(request).then((response) => {
                assert.strictEqual(response.status, 200);
                assert.ok(response.body.post);
                assert.strictEqual(response.body.param, 'XABCDdcba');
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
});