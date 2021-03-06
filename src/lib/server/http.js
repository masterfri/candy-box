import express from 'express';
import AbstractServer from './base.js';
import {
    is,
    isString,
    forEach,
} from '../helpers.js';
import Response, {
    Status,
    HttpError,
} from '../transport/response.js';
import {
    AuthorizationError,
    DenyReason,
} from '../auth/auth.js';

/**
 * HTTP server
 * 
 * @class
 * @augments AbstractServer
 */
class HttpServer extends AbstractServer
{
    /**
     * @protected
     * @var {Express.Application}
     */
    _express = express();

    /**
     * @protected
     * @var {Express.Router}
     */
    _router = express.Router();

    /**
     * @protected
     * @var {http.Server}
     */
    _server = null;

    /**
     * @protected
     * @var {Object}
     */
    _config;

    /**
     * @param {Object} [config={}] 
     */
    constructor(config = {}) {
        super();
        this._express.use(express.json());
        this._express.use(express.urlencoded({
            extended: true,
        }));
        this._express.use(this._router);
        this._config = config;
    }

    /**
     * @inheritdoc
     * @override
     */
    start() {
        return new Promise((resolve) => {
            this._server = this._express.listen(this._config, (result) => {
                resolve();
            });
        });
    }

    /**
     * @inheritdoc
     * @override
     */
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

    /**
     * @inheritdoc
     * @override
     */
    register(method, path, requestFactory, target) {
        this._router[method](path, (req, res) => {
            let request = requestFactory(req.body, {
                ...(is(req.params, Array) ? {params: req.params} : req.params),
                ...req.query,
            }, req.headers);
            request.validate().then(() => {
                this._delegate(target, request).then((response) => {
                    this._respond(res, response);
                }).catch((error) => {
                    if (is(error, HttpError)) {
                        res.status(error.code).send(error.message);
                    } else if (is(error, AuthorizationError)) {
                        if (error.reason === DenyReason.FORBIDDEN) {
                            res.status(Status.FORBIDDEN).send('Forbidden');
                        } else {
                            res.status(Status.UNAUTHORIZED).send('Unauthorized');
                        }
                    } else {
                        res.status(Status.INTERNAL_SERVER_ERROR).send('Server error: ' + error);
                    }
                });
            }).catch((error) => {
                res.status(Status.UNPROCESSABLE_ENTITY).send(error.getErrors());
            });
        });
    }

    /**
     * Delegate request to the certain target
     * 
     * @protected
     * @param {Function} target 
     * @param {Request} request 
     * @returns {Promise}
     */
    _delegate(target, request) {
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

    /**
     * Send a response to client
     * 
     * @protected
     * @param {Express.Response} res 
     * @param {Response|String|Object} response 
     */
    _respond(res, response) {
        let status, body;
        if (is(response, Response)) {
            body = response.body;
            status = response.status;
            forEach(response.headers, (value, key) => {
                res.append(key, value);
            });
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