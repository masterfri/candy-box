import express from 'express';
import {
    BaseServer, 
} from './base';
import {
    is,
} from '../helpers';
import Response from '../transport/response';

class HttpServer extends BaseServer
{
    constructor(config = {}) {
        super();
        this._express = express();
        this._router = express.Router();
        this._express.use(express.json());
        this._express.use(express.urlencoded({
            extended: true,
        }));
        this._express.use(this._router);
        this._server = null;
        this._config = config;
    }

    start() {
        return new Promise((resolve) => {
            this._server = this._express.listen(this._config, (result) => {
                resolve();
            });
        });
    }

    stop() {
        if (this._server === null) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this._server.close(() => {
                resolve();
            });
        });
    }

    register(method, path, requestFactory, target) {
        this._router[method](path, (req, res) => {
            let request = requestFactory(req.body, {
                ...(is(req.params, Array) ? {params: req.params} : req.params),
                ...req.query,
            });
            request.validate().then(() => {
                this.delegate(target, request).then((response) => {
                    if (is(response, Response)) {
                        let props = response.getProps();
                        let body = response.getBody();
                        res.status(response.getStatus());
                        for (let prop in props) {
                            res.append(prop, props[prop]);
                        }
                        if (body !== null) {
                            res.send(body);
                        } else {
                            res.end();
                        }
                    } else {
                        res.status(200);
                        res.send(response);
                    }
                }).catch((error) => {
                    res.status(500).send('Server error');
                });
            }).catch((error) => {
                res.status(422).send(error.getErrors());
            });
        });
    }

    delegate(target, request) {
        let response = target(request);
        if (response instanceof Promise) {
            return response;
        }
        if (response instanceof Error) {
            return Promise.reject(response);
        }
        return Promise.resolve(response);
    }
}

export default HttpServer;