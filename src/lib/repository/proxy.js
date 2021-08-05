import Query, {
    SerializedQuery } from '../query/query.js';
import Response, {
    Status,
    HttpError } from '../transport/response.js';
import { NotExistsError } from './base.js';
import { 
    is,
    isFunction } from '../helpers.js';
import { gate } from '../auth/auth.js';

/**
 * Class that forwards REST API calls to repository methods
 * 
 * @class
 */
class RepositoryProxy
{
    /**
     * @protected
     * @var {AbstractRepository}
     */
    _repository;

    /**
     * @protected
     * @var {Object}
     */
    _gatekeepers = {};

    /**
     * @param {AbstractRepository} repository 
     */
    constructor(repository) {
        this._repository = repository;
    }

    /**
     * Forwarding to "get" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    get(request) {
        return this._proxyMethod(
            request,
            'get', 
            [
                () => this._getKeyFromRequest(request),
            ], 
            (result) => this._serializeDocument(result)
        );
    }

    /**
     * Forwarding to "search" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    search(request) {
        return this._proxyMethod(
            request,
            'search', 
            [
                () => this._getQueryFromRequest(request),
            ], 
            (results) => this._serializeCollection(results)
        );
    }
    
    /**
     * Forwarding to "store" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    store(request) {
        let document = this._getDocumentFromRequest(request);
        let isUpdate = document.hasKey();
        return this._proxyMethod(
            request,
            'store', 
            [document], 
            (stored) => this._serializeDocument(stored),
            isUpdate ? Status.OK : Status.CREATED
        );
    }

    /**
     * Forwarding to "delete" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    delete(request) {
        return this._proxyMethod(
            request,
            'delete', 
            [
                () => this._getKeyFromRequest(request),
            ], 
            () => new Response()
        );
    }

    /**
     * Forwarding to "exists" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    exists(request) {
        return this._proxyMethod(
            request,
            'exists', 
            [
                () => this._getQueryFromRequest(request),
            ]
        );
    }
    
    /**
     * Forwarding to "count" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    count(request) {
        return this._proxyMethod(
            request,
            'count', 
            [
                () => this._getQueryFromRequest(request),
            ]
        );
    }

    /**
     * Forwarding to "sum" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    sum(request) {
        return this._proxyMethod(
            request,
            'sum', 
            [
                () => this._getAttributeNameFromRequest(request),
                () => this._getQueryFromRequest(request),
            ]
        );
    }
    
    /**
     * Forwarding to "avg" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    avg(request) {
        return this._proxyMethod(
            request,
            'avg', 
            [
                () => this._getAttributeNameFromRequest(request),
                () => this._getQueryFromRequest(request),
            ]
        );
    }
    
    /**
     * Forwarding to "min" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    min(request) {
        return this._proxyMethod(
            request,
            'min', 
            [
                () => this._getAttributeNameFromRequest(request),
                () => this._getQueryFromRequest(request),
            ]
        );
    }
    
    /**
     * Forwarding to "max" method of repository
     * 
     * @param {Request} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    max(request) {
        return this._proxyMethod(
            request,
            'max', 
            [
                () => this._getAttributeNameFromRequest(request),
                () => this._getQueryFromRequest(request),
            ]
        );
    }

    /**
     * Put gatekeeper on certain method
     * 
     * @param {String} method 
     * @param {String} gatekeeper 
     * @returns {RepositoryProxy}
     */
    protect(method, gatekeeper) {
        this._gatekeepers[method] = gatekeeper;
        return this;
    }

    /**
     * Put gatekeeper on all "read" methods
     * 
     * @param {String} gatekeeper 
     * @returns {RepositoryProxy}
     */
    protectRead(gatekeeper) {
        let readMethods = [
            'get', 
            'search',
            'exists', 
            'count',
            'sum', 
            'avg', 
            'min', 
            'max',
        ];
        readMethods.forEach((method) => {
            this.protect(method, gatekeeper);
        });
        return this;
    }

    /**
     * Put gatekeeper on all "write" methods
     * 
     * @param {String} gatekeeper 
     * @returns {RepositoryProxy}
     */
    protectWrite(gatekeeper) {
        let writeMethods = [
            'store', 
            'delete', 
        ];
        writeMethods.forEach((method) => {
            this.protect(method, gatekeeper);
        });
        return this;
    }

    /**
     * Put gatekeeper on all methods
     * 
     * @param {String} gatekeeper 
     * @returns {RepositoryProxy}
     */
    protectAll(gatekeeper) {
        this.protectRead(gatekeeper);
        this.protectWrite(gatekeeper);
        return this;
    }

    /**
     * Get key value from request
     * 
     * @protected
     * @param {Request} request 
     * @returns {Number}
     */
    _getKeyFromRequest(request) {
        let key = request.get(this._repository.keyName);
        if (key === null) {
            throw new HttpError(Status.BAD_REQUEST);
        }
        return key;
    }

    /**
     * Get attribute name from request
     * 
     * @protected
     * @param {Request} request 
     * @returns {String}
     */
    _getAttributeNameFromRequest(request) {
        let attribute = request.get('attribute');
        if (attribute === null) {
            throw new HttpError(Status.BAD_REQUEST);
        }
        return attribute;
    }

    /**
     * Get query from request
     * 
     * @protected
     * @param {Request} request 
     * @returns {Query}
     */
    _getQueryFromRequest(request) {
        let data = request.get('query');
        if (data === null) {
            return null;
        }
        let query = (new SerializedQuery(data)).instantiate();
        return query;
    }

    /**
     * Get document from request
     * 
     * @protected
     * @param {Request} request 
     * @returns {Document}
     */
    _getDocumentFromRequest(request) {
        return this._repository.newDocument(request.body);
    }

    /**
     * Forward request to a certain method
     * 
     * @protected
     * @param {Request} request
     * @param {String} method 
     * @param {Object} params
     * @param {Function} [transformer=null]
     * @param {Number} [code=Status.OK]
     * @returns {Promise}
     */
    _proxyMethod(request, method, params, transformer = null, code = Status.OK) {
        return new Promise((resolve, reject) => {
            try {
                let args = params.map((param) => isFunction(param) ? param() : param);
                this._passGate(request, method, args)
                    .then(() => this._repository[method](...args))
                    .then((result) => {
                        if (transformer !== null) {
                            result = transformer(result);
                        }
                        if (!is(result, Response)) {
                            result = new Response(result, code);
                        }
                        resolve(result);
                    })
                    .catch((error) => {
                        if (is(error, NotExistsError)) {
                            resolve(
                                new Response(error.message, Status.NOT_FOUND)
                            );
                        } else {
                            reject(error);
                        }
                    });
            } catch (error) {
                if (is(error, Response)) {
                    resolve(error);
                } else {
                    reject(error);
                }
            }
        });
    }

    /**
     * Check if request is allowed
     * 
     * @param {Request} request 
     * @param {String} method 
     * @param {Array} args 
     * @returns {Promise}
     */
    _passGate(request, method, args) {
        let gatekeeper = this._gatekeepers[method];
        if (gatekeeper === undefined) {
            return Promise.resolve();
        }
        return gate().pass(gatekeeper, request, ...args);
    }

    /**
     * Serialize document
     * 
     * @param {Document} document 
     * @returns {Object}
     */
    _serializeDocument(document) {
        return document.export();
    }

    /**
     * Serialize collection
     * 
     * @param {Collection} collection 
     * @returns {Array}
     */
    _serializeCollection(collection) {
        return collection.all().map((item) => this._serializeDocument(item));
    }
}

export default RepositoryProxy;