import Query, {
    SerializedQuery } from '../query/query.js';
import Response, {
    Status,
    HttpError } from '../transport/response.js';
import { NotExistsError } from './base.js';
import { 
    is,
    isFunction,
    promise } from '../helpers.js';
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
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    get(request) {
        return this._proxyMethod(
            request,
            'get', 
            [
                () => this._pullDocumentKey(request),
            ], 
            (result) => this._serializeDocument(result)
        );
    }

    /**
     * Forwarding to "search" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    search(request) {
        return this._proxyMethod(
            request,
            'search', 
            [
                () => this._pullQuery(request),
            ], 
            (results) => this._serializeCollection(results)
        );
    }
    
    /**
     * Forwarding to "store" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    store(request) {
        let document = this._pullDocument(request);
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
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    delete(request) {
        return this._proxyMethod(
            request,
            'delete', 
            [
                () => this._pullDocumentKey(request),
            ], 
            () => new Response()
        );
    }

    /**
     * Forwarding to "exists" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    exists(request) {
        return this._proxyMethod(
            request,
            'exists', 
            [
                () => this._pullQuery(request),
            ]
        );
    }
    
    /**
     * Forwarding to "count" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    count(request) {
        return this._proxyMethod(
            request,
            'count', 
            [
                () => this._pullQuery(request),
            ]
        );
    }

    /**
     * Forwarding to "sum" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    sum(request) {
        return this._proxyMethod(
            request,
            'sum', 
            [
                () => this._pullParam(request, 'attribute'),
                () => this._pullQuery(request),
            ]
        );
    }
    
    /**
     * Forwarding to "avg" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    avg(request) {
        return this._proxyMethod(
            request,
            'avg', 
            [
                () => this._pullParam(request, 'attribute'),
                () => this._pullQuery(request),
            ]
        );
    }
    
    /**
     * Forwarding to "min" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    min(request) {
        return this._proxyMethod(
            request,
            'min', 
            [
                () => this._pullParam(request, 'attribute'),
                () => this._pullQuery(request),
            ]
        );
    }
    
    /**
     * Forwarding to "max" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    max(request) {
        return this._proxyMethod(
            request,
            'max', 
            [
                () => this._pullParam(request, 'attribute'),
                () => this._pullQuery(request),
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
     * Get parameter from request
     * 
     * @param {BaseRequest} request 
     * @param {String} param 
     * @param {Boolean} [allowNull=false] 
     * @returns {any}
     */
    _pullParam(request, param, allowNull = false) {
        let value = request.get(param);
        if (value === null && allowNull === false) {
            throw new HttpError(Status.BAD_REQUEST);
        }
        return value;
    }

    /**
     * Get key value from request
     * 
     * @protected
     * @param {BaseRequest} request 
     * @returns {Number}
     */
    _pullDocumentKey(request) {
        return this._pullParam(request, this._repository.keyName);
    }

    /**
     * Get query from request
     * 
     * @protected
     * @param {BaseRequest} request 
     * @returns {Query}
     */
    _pullQuery(request) {
        let data = this._pullParam(request, 'query');
        return (new SerializedQuery(data)).instantiate();
    }

    /**
     * Get document from request
     * 
     * @protected
     * @param {BaseRequest} request 
     * @returns {Document}
     */
    _pullDocument(request) {
        return this._repository.newDocument(request.body);
    }

    /**
     * Forward request to a certain method
     * 
     * @protected
     * @param {BaseRequest} request
     * @param {String} method 
     * @param {Object} params
     * @param {Function} [transformer=null]
     * @param {Number} [code=Status.OK]
     * @returns {Promise}
     */
    _proxyMethod(request, method, params, transformer = null, code = Status.OK) {
        return Promise.all(params.map((param) => promise(param)))
            .then((args) => {
                return this._passGate(request, method, args)
                    .then(() => this._repository[method](...args))
                    .then((result) => {
                        if (transformer !== null) {
                            result = transformer(result);
                        }
                        if (!is(result, Response)) {
                            result = new Response(result, code);
                        }
                        return result;
                    })
                    .catch((error) => {
                        if (is(error, Response)) {
                            return error;
                        }
                        if (is(error, NotExistsError)) {
                            return new Response(error.message, Status.NOT_FOUND)
                        }
                        throw error;
                    });
            });
    }

    /**
     * Check if request is allowed
     * 
     * @param {BaseRequest} request 
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
     * @param {Array} collection 
     * @returns {Array}
     */
    _serializeCollection(collection) {
        return collection.map((item) => this._serializeDocument(item));
    }
}

export default RepositoryProxy;