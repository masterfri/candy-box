import { TransportSymbol } from './base.js';
import Message from './message.js';
import {
    isSubclass,
    isObject,
    isString,
    get,
    forEach,
    valueOf, 
    isFunction,
    pickProps } from '../helpers.js';
import {
    ValidationError,
    ValidatorSymbol } from '../validation/validator.js';
import App from '../app.js';
import {
    Status,
    HttpError } from './response.js';

const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';
const DELETE = 'DELETE';

const Method = {
    GET,
    POST,
    PUT,
    DELETE, 
};

/**
 * Base class for requests
 * 
 * @class
 * @augments Message
 */
class BaseRequest extends Message
{
    /**
     * @protected
     * @var {Object}
     */
    _query;
    
    /**
     * @protected
     * @var {Boolean}
     */
    _validated = false;

    /**
     * @protected
     * @var {Object}
     */
    _errors = {};

    /**
     * @param {Object} [body={}]
     * @param {Object} [query={}]
     * @param {Object} [headers={}]
     */
    constructor(body = {}, query = {}, headers = {}) {
        super(body, headers);
        this._query = query;
    }

    /**
     * This method defines request method
     * 
     * @returns {String}
     */
    method() {
        return GET;
    }

    /**
     * This method defines request path
     * 
     * @returns {String}
     */
    route() {
        return '/';
    }

    /**
     * Get parameter from request data or query
     * 
     * @param {String} key 
     * @param {any} [fallback=null] 
     * @returns {any}
     */
    get(key, fallback = null) {
        return super.get(key, () => get(this._query, key, fallback));
    }

    /**
     * Require parameter from request data or query
     * 
     * @param {String} key 
     * @returns {any}
     */
    require(key) {
        return this.get(key, () => {
            throw new HttpError(Status.BAD_REQUEST);
        });
    }

    /**
     * Make request transport instance
     * 
     * @returns {AbstractTransport}
     */
    transport() {
        return App.make(TransportSymbol);
    }
    
    /**
     * Make request validator instance
     * 
     * @returns {Validator}
     */
    validator() {
        return App.make(ValidatorSymbol);
    }

    /**
     * Get request options
     * 
     * @returns {Object}
     */
    options() {
        return {};
    }
    
    /**
     * This method defines request validation
     * 
     * @returns {Object|null}
     */
    validation() {
        return null;
    }
    
    /**
     * Send this request to its destination
     * 
     * @param {Object} [options={}]
     * @returns {Promise}
     */
    send(options = {}) {
        return this.validate().then(() => {
            return this.transport().send(this, {
                ...this.options(),
                ...options,
            });
        });
    }
    
    /**
     * Validate request
     * 
     * @returns {Promise}
     */
    validate() {
        if (this._validated) {
            return Promise.resolve();
        }
        let validation = this.validation();
        if (validation === null) {
            this._validated = true;
            return Promise.resolve();
        }
        return Promise.all(
                Object.keys(validation).map((attribute) => {
                    return validation[attribute].validate(attribute, this._body)
                        .catch((errors) => {
                            Object.keys(errors).map((attribute) => {
                                this._errors[attribute] = errors[attribute];
                            });
                        });
                })
            ).then(() => {
                this._validated = true;
                if (Object.keys(this._errors).length !== 0) {
                    throw new ValidationError(this._errors);
                }
            });
    }

    /**
     * BaseRequest query
     * 
     * @var {Object}
     */
    get query() {
        return this._query;
    }

    /**
     * BaseRequest errors
     * 
     * @var {Object}
     */
    get errors() {
        return this._errors;
    }
}

/**
 * Class for simple request
 * 
 * @class
 * @augments BaseRequest
 */
class Request extends BaseRequest
{
    /**
     * @protected
     * @var {String}
     */
    _method;

    /**
     * @protected
     * @var {String}
     */
    _route;

    /**
     * @protected
     * @var {any}
     */
    _validation = null;

    /**
     * @protected
     * @var {Object}
     */
    _options = {};

    /**
     * @param {String} route 
     * @param {String} [method=GET]
     * @param {Object} [body={}]
     * @param {Object} [query={}]
     * @param {Object} [headers={}]
     */
    constructor(route, method = GET, body = {}, query = {}, headers = {}) {
        super(body, query, headers);
        this.usingMethod(method)
            .routeTo(route);
    }

    /**
     * Change request route
     * 
     * @param {String} route 
     * @returns {Request}
     */
    routeTo(route) {
        this._route = route;
        return this;
    }

    /**
     * Change request method
     * 
     * @param {String} method 
     * @returns {Request}
     */
    usingMethod(method) {
        this._method = method;
        return this;
    }

    /**
     * Setup request validation
     * 
     * @param {Function|Object} validation 
     * @returns {Request}
     */
    withValidation(validation) {
        this._validation = validation;
        return this;
    }

    /**
     * Setup request options
     * 
     * @param {Function|Object} options
     * @returns {Request}
     */
    withValidation(options) {
        this._options = options;
        return this;
    }

    /**
     * @inheritdoc
     * @override
     */
    method() {
        return this._method;
    }

    /**
     * @inheritdoc
     * @override
     */
    route() {
        return this._route;
    }

    /**
     * @inheritdoc
     * @override
     */
    validation() {
        return valueOf(this._validation);
    }

    /**
     * @inheritdoc
     * @override
     */
    options() {
        return valueOf(this._options);
    }
}

/**
 * Class for mapping request to specific target methods
 * 
 * @class
 */
class RequestMap
{
    /**
     * @protected
     * @var {Object}
     */
    _map = {};

    /**
     * Map method to request
     * 
     * @param {String} name
     * @param {any} request 
     * @returns {RequestMap}
     */
    map(name, request) {
        if (isSubclass(request, BaseRequest)) {
            this._configure(name, {
                method: request.prototype.method.call({}),
                route: request.prototype.route.call({}),
                factory: (data, query, headers) => new request(data, query, headers),
                configurable: false,
            }, true);
        } else if (isObject(request)) {
            this._configure(name, pickProps(request, [
                'method', 'route', 'validation',
            ]), true);
        } else if (isString(request)) {
            this._configure(name, {
                route: request,
            }, true);
        } else {
            throw new Error('Invalid request mapping');
        }
        return this;
    }

    /**
     * Configure method route
     * 
     * @param {String} name 
     * @param {String} route
     * @returns {RequestMap}
     */
    route(name, route) {
        this._configure(name, {route});
        return this;
    }

    /**
     * Configure method route
     * 
     * @param {String} name 
     * @param {String} method
     * @returns {RequestMap}
     */
    method(name, method) {
        this._configure(name, {method});
        return this;
    }

    /**
     * Configure method validation
     * 
     * @param {String} name 
     * @param {Function|Object} validation
     * @returns {RequestMap}
     */
    validation(name, validation) {
        this._configure(name, {validation});
        return this;
    }

    /**
     * Create new request instance for certain method
     * 
     * @param {String} name 
     * @param {Object} [data={}]
     * @param {Object} [query={}]
     * @param {Object} [headers={}]
     * @returns {BaseRequest}
     */
    create(name, data = {}, query = {}, headers = {}) {
        let factory = this.factory(name);
        return factory(data, query, headers);
    }

    /**
     * Create factory for for certain method
     * 
     * @param {String} name 
     * @returns {Function}
     */
    factory(name) {
        let options = this._map[name];
        if (options === undefined) {
            throw new Error(`Nothing is mapped to ${name}`);
        }
        if (isFunction(options.factory)) {
            return options.factory;
        }
        let {route, method, validation} = options;
        return requestFactory(route, method, validation);
    }

    /**
     * Execute a function with all mappings
     * 
     * @param {Function} callback
     * @returns {RequestMap}
     */
    forEach(callback) {
        forEach(this._map, (options, name) => {
            callback(options, name);
        });
        return this;
    }

    /**
     * Configure request method
     * 
     * @protected
     * @param {String} name 
     * @param {Object} options 
     * @param {Boolean} [replace=false]
     */
    _configure(name, options, replace = false) {
        let current = this._map[name];
        if (current === undefined || replace) {
            this._map[name] = {
                method: GET,
                route: '',
                ...options,
            };
        } else {
            if (current.configurable === false) {
                throw new Error(`Mapping ${name} is not configurable`);
            }
            this._map[name] = {
                ...current,
                ...options,
            };
        }
    }
}

const requestFactory = (route, method = GET, validation = null) => {
    return (data, query, headers) => {
        let request = new Request(route, method, data, query, headers);
        return request.withValidation(validation);
    }
}

export default Request;

export {
    BaseRequest,
    RequestMap,
    Method,
    requestFactory,
};