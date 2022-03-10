import { abstractMethodError } from '../helpers.js';
import qs from 'qs';
import App from '../app.js';
import { ValidationError } from '../validation/validator.js';
import Response, {
    Status,
    isErrorCode } from './response.js';

/**
 * Abstract class for transports
 * 
 * @abstract
 * @class
 */
class AbstractTransport
{
    /**
     * @protected
     * @var {Object}
     */
    _stickyQuery = {};

    /**
     * @protected
     * @var {Object}
     */
    _stickyHeaders = {};

    /**
     * @protected
     * @var {Array}
     */
    _middleware = [];

    /**
     * Add sticky query parameter
     * 
     * @param {String} name 
     * @param {any} value 
     * @returns {AbstractTransport}
     */
    stickQueryParam(name, value) {
        this._stickyQuery[name] = value;
        return this;
    }

    /**
     * Remove sticky query parameter
     * 
     * @param {String} name 
     * @returns {AbstractTransport}
     */
    unstickQueryParam(name) {
        delete this._stickyQuery[name];
        return this;
    }

    /**
     * Add sticky header
     * 
     * @param {String} name 
     * @param {any} value 
     * @returns {AbstractTransport}
     */
    stickHeader(name, value) {
        this._stickyHeaders[name.toLowerCase()] = value;
        return this;
    }

    /**
     * Remove sticky header
     * 
     * @param {String} name 
     * @param {any} value 
     * @returns {AbstractTransport}
     */
    unstickHeader(name) {
        delete this._stickyHeaders[name.toLowerCase()];
        return this;
    }

    /**
     * Setup authorization header
     * 
     * @param {String} type 
     * @param {String} value 
     */
    setAuthorization(type, value) {
        return this.stickHeader('authorization', `${type} ${value}`);
    }

    /**
     * Append middleware
     * 
     * @param {Function} func 
     * @returns {AbstractTransport}
     */
    appendMiddleware(func) {
        this._middleware.push(func);
        return this;
    }

    /**
     * Prepend middleware
     * 
     * @param {Function} func 
     * @returns {AbstractTransport}
     */
    prependMiddleware(func) {
        this._middleware.unshift(func);
        return this;
    }

    /**
     * Remove middleware
     * 
     * @param {Function} func 
     * @returns {AbstractTransport}
     */
    removeMiddleware(func) {
        let index = this._middleware.indexOf(func);
        if (index !== -1) {
            this._middleware.splice(index, 1);
        }
        return this;
    }

    /**
     * Send request
     * 
     * @param {BaseRequest} request 
     * @param {Object} [options={}] 
     * @param {Function} [expectation=Response]
     * @returns {any}
     */
    send(request, options = {}, expectation = Response) {
        return this._runPipeline(request, (req) => {
            return this._sendInternal(req, options)
                .then((result) => {
                    let {data, status, statusText, headers} = result;
                    if (status === Status.UNPROCESSABLE_ENTITY) {
                        throw new ValidationError(data);
                    }
                    let response = new expectation(data, status, statusText, headers);
                    if (isErrorCode(status)) {
                        throw response;
                    }
                    return response;
                });
        });
    }

    /**
     * Run request through pipeline
     * 
     * @param {BaseRequest} request 
     * @param {Function} func 
     * @returns {any}
     */
    _runPipeline(request, func) {
        let pipe = func;
        for (let i = this._middleware.length - 1; i >= 0; i--) {
            pipe = this._wrapMiddleware(this._middleware[i], pipe);
        }
        return pipe(request);
    }

    /**
     * Add pipe section
     * 
     * @param {Function} middleware 
     * @param {Function} next 
     * @returns {any}
     */
    _wrapMiddleware(middleware, next) {
        return (request) => {
            return middleware(request, next);
        }
    }

    /**
     * Send request internally
     * 
     * @abstract
     * @param {BaseRequest} request 
     * @param {Object} options 
     */
    _sendInternal() {
        abstractMethodError('_sendInternal');
    }

    /**
     * Build request options
     * 
     * @protected
     * @param {BaseRequest} request 
     * @returns {Object}
     */
    _buildOptions(request) {
        return {
            method: request.method(),
            url: this._buildUrl(request),
            data: request.body,
            headers: {
                ...this._stickyHeaders,
                ...request.headers,
            },
        };
    }

    /**
     * Build request URL
     * 
     * @param {BaseRequest} request 
     * @returns {String}
     */
    _buildUrl(request) {
        let data = request.body;
        let params = {
            ...this._stickyQuery,
            ...request.query,
        };
        let url = request.route().split('/')
            .map((part) => {
                if (part.indexOf(':') !== -1) {
                    let [prefix, key] = part.split(':', 2);
                    let value;
                    if (key in params) {
                        value = params[key];
                        delete params[key];
                    } else if (key in data) {
                        value = data[key];
                    } else {
                        return null;
                    }
                    return prefix + value;
                }
                return part;
            })
            .filter((part) => {
                return part !== null;
            })
            .join('/');
        if (Object.keys(params).length !== 0) {
            url += '?' + qs.stringify(params);
        }
        return url;
    }
}

const TransportSymbol = Symbol('Transport');

const transport = () => App.make(TransportSymbol);

export default AbstractTransport;

export {
    TransportSymbol,
    transport,
};