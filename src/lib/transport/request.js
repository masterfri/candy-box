import {
    TransportSymbol,
} from './base';
import {
    Mixture, 
} from '../mixture';
import {
    isSubclass,
    isObject,
    isString,
} from '../helpers';
import {
    ValidationError,
    ValidatorSymbol,
} from '../validation/validator';
import App from '../app';

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
 * @augments Mixture
 */
class Request extends Mixture
{
    /**
     * @protected
     * @var {Object}
     */
    _data;

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
     * 
     * @param {Object} data 
     * @param {Object} query 
     */
    constructor(data = {}, query = {}) {
        super();
        this._data = data;
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
     * Get request query
     * 
     * @returns {Object}
     */
    getQuery() {
        return this._query;
    }

    /**
     * Get request body
     * 
     * @returns {Object}
     */
    getData() {
        return this._data;
    }

    /**
     * Get parameter from request data or query
     * 
     * @param {String} name 
     * @param {any} fallback 
     * @returns {any}
     */
    getParam(name, fallback = null) {
        if (name in this._data) {
            return this._data[name];
        }
        if (name in this._query) {
            return this._query[name];
        }
        return fallback;
    }

    /**
     * Get request errors
     * 
     * @returns {Object}
     */
    getErrors() {
        return this._errors;
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
                    return validation[attribute].validate(attribute, this._data)
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
     * @param {String} route 
     * @param {String} method 
     * @param {Object} data 
     * @param {Object} query 
     */
    constructor(route, method = GET, data = {}, query = {}) {
        super(data, query);
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
                factory: (data, query) => new request(data, query),
            };
        } else if (isObject(request)) {
            let route = request.route;
            let requestMethod = request.method || GET;
            let factory = request.factory || ((data, query) => new PlainRequest(route, requestMethod, data, query));
            this._map[method] = {
                method: requestMethod,
                route,
                factory,
            };
        } else if (isString(request)) {
            this._map[method] = {
                method: GET,
                route: request,
                factory: (data, query) => new PlainRequest(request, GET, data, query),
            };
        } else {
            throw new Error('Invalid request mapping');
        }
    }

    /**
     * Create new request instance for certain method
     * 
     * @param {String} method 
     * @param {Object} data 
     * @param {Object} query 
     * @returns {Request}
     */
    create(method, data = {}, query = {}) {
        if (this._map[method] === undefined) {
            throw new Error(`Nothing is mapped to ${method}`);
        }
        return this._map[method].factory(data, query);
    }

    /**
     * Execute a function with all mappings
     * 
     * @param {Function} callback 
     */
    forEach(callback) {
        Object.keys(this._map).forEach((method) => {
            callback(this._map[method], method);
        });
    }
}

export default Request;

export {
    PlainRequest,
    RequestMap,
    Method,
};