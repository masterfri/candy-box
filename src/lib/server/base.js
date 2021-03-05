import {
    Mixture, 
} from '../mixture.js';
import {
    PlainRequest,
    Method,
} from '../transport/request.js';
import {
    abstractMethodError,
} from '../helpers.js';

/**
 * Base server class
 * 
 * @abstract
 * @class
 * @augments Mixture
 */
class AbstractServer extends Mixture
{
    /**
     * Start server
     * 
     * @abstract
     * @returns {Promise}
     */
    start() {
        abstractMethodError('start');
    }

    /**
     * Stop server
     * 
     * @abstract
     * @returns {Promise}
     */
    stop() {
        abstractMethodError('stop');
    }

    /**
     * Define a route
     * 
     * @abstract
     * @param {String} method 
     * @param {String} path 
     * @param {Function} requestFactory 
     * @param {Function} target 
     */
    register() {
        abstractMethodError('register');
    }

    /**
     * Define a route by request
     * 
     * @param {Request} request 
     * @param {Function} target 
     * @returns {AbstractServer}
     */
    route(request, target) {
        this.register(
            request.prototype.method.call({}).toLowerCase(),
            request.prototype.route.call({}),
            (data, query) => new request(data, query),
            target
        );
        return this;
    }

    /**
     * Define routes by request mapping
     * 
     * @param {RequestMap} mapping 
     * @param {Function} target 
     * @returns {AbstractServer}
     */
    map(mapping, target) {
        mapping.forEach((request, method) => {
            this.register(
                request.method.toLowerCase(), request.route, 
                request.factory, target[method].bind(target)
            );
        });
        return this;
    }

    /**
     * Define a route for GET request
     * 
     * @param {String} path 
     * @param {Function} target
     * @returns {AbstractServer}
     */
    get(path, target) {
        this.register(
            'get', path, 
            (data, query) => new PlainRequest(path, Method.GET, data, query),
            target
        );
        return this;
    }

    /**
     * Define a route for POST request
     * 
     * @param {String} path 
     * @param {Function} target
     * @returns {AbstractServer}
     */
    post(path, target) {
        this.register(
            'post', path, 
            (data, query) => new PlainRequest(path, Method.POST, data, query),
            target
        );
        return this;
    }

    /**
     * Define a route for PUT request
     * 
     * @param {String} path 
     * @param {Function} target
     * @returns {AbstractServer}
     */
    put(path, target) {
        this.register(
            'put', path, 
            (data, query) => new PlainRequest(path, Method.PUT, data, query),
            target
        );
        return this;
    }

    /**
     * Define a route for DELETE request
     * 
     * @param {String} path 
     * @param {Function} target
     * @returns {AbstractServer}
     */
    delete(path, target) {
        this.register(
            'delete', path, 
            (data, query) => new PlainRequest(path, Method.DELETE, data, query),
            target
        );
        return this;
    }
}

const ServerSymbol = Symbol('Server');

export default AbstractServer;

export {
    ServerSymbol,
};