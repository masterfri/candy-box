import { TransportSymbol } from './base.js';
import Message from './message.js';
import {
    isSubclass,
    isObject,
    isString,
    get,
    forEach } from '../helpers.js';
import {
    ValidationError,
    ValidatorSymbol } from '../validation/validator.js';
import App from '../app.js';

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
class Request extends Message
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
     * @param {Function} chain 
     * @returns {Object|null}
     */
    validation(chain) {
        return null;
    }
    
    /**
     * Send this request to its destination
     * 
     * @returns {Promise}
     */
    send() {
        return this.validate().then(() => {
            return new Promise((resolve, reject) => {
                this.transport().send(this, this.options())
                    .then((response) => {
                        resolve(response);
                    }).catch((error) => {
                        reject(error);
                    });
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
        let validation = this.validation(() => {
            return this.validator();
        });
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
     * Request query
     * 
     * @var {Object}
     */
    get query() {
        return this._query;
    }

    /**
     * Request errors
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
 * @augments Request
 */
class PlainRequest extends Request
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
     * @param {String} route 
     * @param {String} [method=GET]
     * @param {Object} [body={}]
     * @param {Object} [query={}]
     * @param {Object} [headers={}]
     */
    constructor(route, method = GET, body = {}, query = {}, headers = {}) {
        super(body, query, headers);
        this._method = method;
        this._route = route;
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
     * @param {String} method 
     * @param {any} request 
     */
    map(method, request) {
        if (isSubclass(request, Request)) {
            this._map[method] = {
                method: request.prototype.method.call({}),
                route: request.prototype.route.call({}),
                factory: (data, query, headers) => new request(data, query, headers),
            };
        } else if (isObject(request)) {
            let route = request.route;
            let requestMethod = request.method || GET;
            let factory = request.factory || ((data, query, headers) => new PlainRequest(route, requestMethod, data, query, headers));
            this._map[method] = {
                method: requestMethod,
                route,
                factory,
            };
        } else if (isString(request)) {
            this._map[method] = {
                method: GET,
                route: request,
                factory: (data, query, headers) => new PlainRequest(request, GET, data, query, headers),
            };
        } else {
            throw new Error('Invalid request mapping');
        }
    }

    /**
     * Create new request instance for certain method
     * 
     * @param {String} method 
     * @param {Object} [data={}]
     * @param {Object} [query={}]
     * @param {Object} [headers={}]
     * @returns {Request}
     */
    create(method, data = {}, query = {}, headers = {}) {
        if (this._map[method] === undefined) {
            throw new Error(`Nothing is mapped to ${method}`);
        }
        return this._map[method].factory(data, query, headers);
    }

    /**
     * Execute a function with all mappings
     * 
     * @param {Function} callback 
     */
    forEach(callback) {
        forEach(this._map, (factory, method) => {
            callback(factory, method);
        });
    }
}

export default Request;

export {
    PlainRequest,
    RequestMap,
    Method,
};