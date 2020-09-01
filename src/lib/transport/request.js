import app from '../app';
import {
    TransportInterface,
    RequestInterface,
    Method,
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
    ValidatorInterface,
    ValidationError,
} from '../validation/validator';

class Request extends Mixture
{
    constructor(data = {}, query = {}) {
        super();
        this._data = data;
        this._query = query;
        this._validated = false;
        this._errors = {};
    }

    mixins() {
        return [
            RequestInterface,
        ];
    }

    method() {
        return Method.GET;
    }

    getQuery() {
        return this._query;
    }

    getData() {
        return this._data;
    }

    getParam(name, fallback = null) {
        if (name in this._data) {
            return this._data[name];
        }
        if (name in this._query) {
            return this._query[name];
        }
        return fallback;
    }

    getErrors() {
        return this._errors;
    }
    
    transport() {
        return app.make(TransportInterface);
    }
    
    validator() {
        return app.make(ValidatorInterface);
    }

    options() {
        return {};
    }
    
    validation(chain) {
        return null;
    }
    
    send() {
        return this.validate().then(() => {
            return this.transport().send(this, this.options());
        });
    }
    
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

class PlainRequest extends Request
{
    constructor(route, method = Method.GET, data = {}, query = {}) {
        super(data, query);
        this._method = method;
        this._route = route;
    }

    method() {
        return this._method;
    }

    route() {
        return this._route;
    }
}

class RequestMap
{
    constructor() {
        this._map = {};
    }

    map(method, request) {
        if (isSubclass(request, Request)) {
            this._map[method] = {
                method: request.prototype.method.call({}),
                route: request.prototype.route.call({}),
                factory: (data, query) => new request(data, query),
            };
        } else if (isObject(request)) {
            let route = request.route;
            let requestMethod = request.method || Method.GET;
            let factory = request.factory || ((data, query) => new PlainRequest(route, requestMethod, data, query)),
            this._map[method] = {
                method: requestMethod,
                route,
                factory,
            };
        } else if (isString(request)) {
            this._map[method] = {
                method: Method.GET,
                route: request,
                factory: (data, query) => new PlainRequest(request, Method.GET, data, query),
            };
        } else {
            throw new Error('Invalid request mapping');
        }
    }

    create(method, data = {}, query = {}) {
        if (this._map[method] === undefined) {
            throw new Error(`Nothing is mapped to ${method}`);
        }
        return this._map[method].factory(data, query);
    }

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