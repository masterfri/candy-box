import assert from 'assert';
import express from 'express';
import HttpTransport from '../src/lib/transport/http.js';

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
            let transport = new HttpTransport();
            transport._makeRequest({
                url: 'http://127.0.0.1:8088/',
            }).then((response) => {
                assert.equal(response.status, 200);
                assert.ok(response.data.get);
                done();
            }).catch((err) => {
                done(err);
            });
        });
        it('POST / should return HTTP 200', function(done) {
            let transport = new HttpTransport();
            transport._makeRequest({
                method: 'POST',
                url: 'http://127.0.0.1:8088/',
                data: {
                    param: 'param',
                },
            }).then((response) => {
                assert.equal(response.status, 200);
                assert.ok(response.data.post);
                assert.equal(response.data.param, 'param');
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
});