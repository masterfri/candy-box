import {
    requestFactory,
    Method } from '../transport/request.js';
import Middleware from '../transport/middleware.js';
import { abstractMethodError, 
    isArray } from '../helpers.js';
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
     * @protected
     * @var {Middleware}
     */
    _middleware = new Middleware();

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
     * Append middleware
     * 
     * @param {Function|Middleware} func 
     * @returns {AbstractServer}
     */
    appendMiddleware(func) {
        this._middleware.append(func);
        return this;
    }

    /**
     * Prepend middleware
     * 
     * @param {Function|Middleware} func 
     * @returns {AbstractServer}
     */
    prependMiddleware(func) {
        this._middleware.prepend(func);
        return this;
    }

    /**
     * Remove middleware
     * 
     * @param {Function|Middleware} func 
     * @returns {AbstractServer}
     */
    removeMiddleware(func) {
        this._middleware.remove(func);
        return this;
    }

    /**
     * Define a request handler
     * 
     * @param {String} method 
     * @param {String} path 
     * @param {Function} requestFactory 
     * @param {Function} handler 
     * @param {Function|Array|Middleware} [middleware=[]]
     * @returns {AbstractServer}
     */
    register(method, path, requestFactory, handler, middleware = []) {
        this._registerInternal(
            method, path, requestFactory, 
            this._injectMiddleware(handler, middleware)
        );
        return this;
    }

    /**
     * Define a route by request
     * 
     * @param {Function} request 
     * @param {Function} handler
     * @param {Function|Array|Middleware} [middleware=[]]
     * @returns {AbstractServer}
     */
    route(request, handler, middleware = []) {
        this.register(
            request.prototype.method.call({}),
            request.prototype.route.call({}),
            (data, query, headers) => new request(data, query, headers),
            handler, middleware
        );
        return this;
    }

    /**
     * Define routes by request mapping
     * 
     * @param {RequestMap} mapping 
     * @param {Function} handler
     * @param {Function|Array|Middleware} [middleware=[]] 
     * @returns {AbstractServer}
     */
    map(mapping, handler, middleware = []) {
        mapping.forEach(({method, route}, name) => {
            this.register(
                method, route, 
                mapping.factory(name), 
                handler[name].bind(handler),
                middleware
            );
        });
        return this;
    }

    /**
     * Define a route for GET request
     * 
     * @param {String} path 
     * @param {Function} handler
     * @param {Function|Array|Middleware} [middleware=[]]
     * @returns {AbstractServer}
     */
    get(path, handler, middleware = []) {
        this.register(
            Method.GET, path, 
            requestFactory(path, Method.GET), 
            handler, middleware
        );
        return this;
    }

    /**
     * Define a route for POST request
     * 
     * @param {String} path 
     * @param {Function} handler
     * @param {Function|Array|Middleware} [middleware=[]]
     * @returns {AbstractServer}
     */
    post(path, handler, middleware = []) {
        this.register(
            Method.POST, path, 
            requestFactory(path, Method.POST), 
            handler, middleware
        );
        return this;
    }

    /**
     * Define a route for PUT request
     * 
     * @param {String} path 
     * @param {Function} handler
     * @param {Function|Array|Middleware} [middleware=[]]
     * @returns {AbstractServer}
     */
    put(path, handler, middleware = []) {
        this.register(
            Method.PUT, path, 
            requestFactory(path, Method.PUT), 
            handler, middleware
        );
        return this;
    }

    /**
     * Define a route for DELETE request
     * 
     * @param {String} path 
     * @param {Function} handler
     * @param {Function|Array|Middleware} [middleware=[]]
     * @returns {AbstractServer}
     */
    delete(path, handler, middleware = []) {
        this.register(
            Method.DELETE, path, 
            requestFactory(path, Method.DELETE), 
            handler, middleware
        );
        return this;
    }

    /**
     * Add middleware pipeline to the handler 
     * 
     * @param {Function} handler 
     * @param {Function|Array|Middleware} middleware 
     * @returns {Function}
     */
    _injectMiddleware(handler, middleware) {
        let merged = this._middleware.merge(middleware);
        return (request) => {
            return merged.run(request, handler);
        }
    }

    /**
     * Define a request handler internally
     * 
     * @abstract
     * @param {String} method 
     * @param {String} path 
     * @param {Function} requestFactory 
     * @param {Function} handler 
     */
    _registerInternal() {
        abstractMethodError('_registerInternal');
    }
}

const ServerSymbol = Symbol('Server');

const server = () => App.make(ServerSymbol);

export default AbstractServer;

export {
    ServerSymbol,
    server,
};