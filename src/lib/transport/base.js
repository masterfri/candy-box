import { abstractMethodError } from '../helpers.js';
import qs from 'qs';
import App from '../app.js';
import Middleware from './middleware.js';

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
     * @var {Middleware}
     */
    _middleware = new Middleware();

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
     * @param {Function|Middleware} func 
     * @returns {AbstractTransport}
     */
    appendMiddleware(func) {
        this._middleware.append(func);
        return this;
    }

    /**
     * Prepend middleware
     * 
     * @param {Function|Middleware} func 
     * @returns {AbstractTransport}
     */
    prependMiddleware(func) {
        this._middleware.prepend(func);
        return this;
    }

    /**
     * Remove middleware
     * 
     * @param {Function|Middleware} func 
     * @returns {AbstractTransport}
     */
    removeMiddleware(func) {
        this._middleware.remove(func);
        return this;
    }

    /**
     * Send request
     * 
     * @param {BaseRequest} request 
     * @param {Object} [options={}] 
     * @returns {any}
     */
    send(request, options = {}) {
        return this._middleware.run(request, (req) => {
            return this._sendInternal(req, options);
        });
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