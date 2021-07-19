import {
    Mixture, 
} from '../mixture.js';
import {
    abstractMethodError,
} from '../helpers.js';
import qs from 'qs';

/**
 * Abstract class for transport requests
 * 
 * @abstract
 * @class
 */
class AbstractTransportRequest
{
    /**
     * Check if this request can be cancelled
     * 
     * @returns {Boolean}
     */
    isCancellable() {
        return false;
    }

    /**
     * Cancel this request 
     * 
     * @abstract
     * @param {String} message 
     */
    cancel() {
        abstractMethodError('cancel');
    }
    
    /**
     * Add post-request handler
     * 
     * @param {Function} callback 
     * @returns {AbstractTransportRequest}
     */
    then() {
        abstractMethodError('then');
    }

    /**
     * Add error handler
     * 
     * @param {Function} callback 
     * @returns {AbstractTransportRequest}
     */
    catch() {
        abstractMethodError('catch');
    }
}

/**
 * Abstract class for transports
 * 
 * @abstract
 * @class
 * @augments Mixture
 */
class AbstractTransport extends Mixture
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
     * Send request
     * 
     * @abstract
     * @param {Request} request 
     * @param {Object} [options={}] 
     * @returns {AbstractTransportRequest}
     */
    send() {
        abstractMethodError('send');
    }

    /**
     * Build request options
     * 
     * @protected
     * @param {Request} request 
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
     * @param {Request} request 
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

export default AbstractTransport;

export {
    AbstractTransportRequest,
    TransportSymbol,
};