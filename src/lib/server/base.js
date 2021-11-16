import {
    requestFactory,
    Method } from '../transport/request.js';
import { abstractMethodError } from '../helpers.js';
import App from '../app.js';

/**
 * Base server class
 * 
 * @abstract
 * @class
 */
class AbstractServer
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
     * @param {Function} request 
     * @param {Function} target 
     * @returns {AbstractServer}
     */
    route(request, target) {
        this.register(
            request.prototype.method.call({}),
            request.prototype.route.call({}),
            (data, query, headers) => new request(data, query, headers),
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
        mapping.forEach(({method, route}, name) => {
            this.register(method, route, mapping.factory(name), target[name].bind(target));
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
        this.register(Method.GET, path, requestFactory(path, Method.GET), target);
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
        this.register(Method.POST, path, requestFactory(path, Method.POST), target);
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
        this.register(Method.PUT, path, requestFactory(path, Method.PUT), target);
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
        this.register(Method.DELETE, path, requestFactory(path, Method.DELETE), target);
        return this;
    }
}

const ServerSymbol = Symbol('Server');

const server = () => App.make(ServerSymbol);

export default AbstractServer;

export {
    ServerSymbol,
    server,
};