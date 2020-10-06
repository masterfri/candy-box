import express from 'express';
import BaseServer from './base';
import {
    is,
    isString,
} from '../helpers';
import Response, {
    Status,
} from '../transport/response';

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
                    this.respond(res, response);
                }).catch((error) => {
                    res.status(Status.INTERNAL_SERVER_ERROR).send('Server error');
                });
            }).catch((error) => {
                res.status(Status.UNPROCESSABLE_ENTITY).send(error.getErrors());
            });
        });
    }

    delegate(target, request) {
        try {
            let response = target(request);
            if (response instanceof Promise) {
                return response;
            }
            if (response instanceof Error) {
                return Promise.reject(response);
            }
            return Promise.resolve(response);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    respond(res, response) {
        let status, body;
        if (is(response, Response)) {
            let props = response.getProps();
            body = response.getBody();
            status = response.getStatus();
            for (let prop in props) {
                res.append(prop, props[prop]);
            }
        } else {
            body = response;
            status = Status.OK;
        }
        res.status(status);
        if (body === null) {
            res.end();
        } else if (isString(body)) {
            res.send(body);
        } else {
            res.json(body)
        }
    }
}

export default HttpServer;