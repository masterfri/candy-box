import express from 'express';
import AbstractServer from './base.js';
import {
    is,
    isString,
    isObject,
    isFunction,
    forEach } from '../helpers.js';
import Response, {
    Status,
    HttpError } from '../transport/response.js';
import {
    AuthorizationError,
    DenyReason } from '../auth/auth.js';
import {
    ValidationError } from '../validation/validator.js';
import { LoggerSymbol } from '../logging/logger.js';
import App from '../app.js';

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
     * @protected
     * @var {Logger}
     */
    _logger;

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
        this._logger = App.make(LoggerSymbol);
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
    _registerInternal(method, path, requestFactory, handler) {
        this._router[method.toLowerCase()](path, (req, res) => {
            let request = requestFactory(req.body, {
                ...(is(req.params, Array) ? {params: req.params} : req.params),
                ...req.query,
            }, req.headers);
            request.validate()
                .then(() => {
                    return this._delegate(handler, request);
                })
                .then((response) => {
                    this._respond(res, response);
                })
                .catch((error) => {
                    this._respondError(res, error);
                });
        });
    }

    /**
     * Send a response to client
     * 
     * @protected
     * @param {Express.Response} res 
     * @param {any} error 
     */
    _respondError(res, error) {
        if (is(error, ValidationError)) {
            res.status(Status.UNPROCESSABLE_ENTITY)
                .send(error.getErrors());
        } else if (is(error, AuthorizationError)) {
            if (error.reason === DenyReason.FORBIDDEN) {
                res.status(Status.FORBIDDEN)
                    .send('Forbidden');
            } else {
                res.status(Status.UNAUTHORIZED)
                    .send('Unauthorized');
            }
        } else if (is(error, HttpError)) {
            res.status(error.code)
                .send(error.message);
        } else {
            this._logger.error(error);
            res.status(Status.INTERNAL_SERVER_ERROR)
                .send('Server error: ' + error);
        }
    }

    /**
     * Delegate request to the certain handler
     * 
     * @protected
     * @param {Function} handler 
     * @param {BaseRequest} request 
     * @returns {Promise}
     */
    _delegate(handler, request) {
        try {
            let response = handler(request);
            if (is(response, Promise)) {
                return response;
            }
            if (is(response, Error)) {
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
        } else if (this._isStream(body)) {
            body.pipe(res);
        } else {
            res.json(body);
        }
    }

    /**
     * Check if data is a stream
     * 
     * @param {any} data 
     * @returns {Boolean}
     */
    _isStream(data) {
        return isObject(data) && isFunction(data.pipe);
    }
}

export default HttpServer;