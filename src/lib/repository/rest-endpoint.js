import Query, {
    SerializedQuery } from '../query/query.js';
import Response, {
    Status } from '../transport/response.js';
import { NotExistsError } from './base.js';
import { is } from '../helpers.js';
import { gate } from '../auth/auth.js';

/**
 * Class that forwards REST API calls to repository methods
 * 
 * @class
 */
class RestRepositoryEndpoint
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
        let key = request.require(this._repository.keyName);
        return this._passGate(request, 'get', [key])
            .then(() => this._repository.get(key))
            .then((doc) => this._respondDocument(doc))
            .catch((error) => {
                if (is(error, NotExistsError)) {
                    return new Response(error.message, Status.NOT_FOUND)
                }
                throw error;
            });
    }

    /**
     * Forwarding to "search" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    search(request) {
        let query = this._getQuery(request);
        return this._passGate(request, 'search', [query])
            .then(() => this._repository.search(query))
            .then((result) => this._respondCollection(result));
    }
    
    /**
     * Forwarding to "store" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    store(request) {
        let document = this._getDocument(request);
        let isUpdate = document.hasKey();
        return this._passGate(request, 'store', [document])
            .then(() => this._repository.store(document))
            .then((doc) => {
                return this._respondDocument(
                    doc, isUpdate ? Status.OK : Status.CREATED
                );
            });
    }

    /**
     * Forwarding to "delete" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    delete(request) {
        let key = request.require(this._repository.keyName);
        return this._passGate(request, 'delete', [key])
            .then(() => this._repository.delete(key))
            .then(() => new Response())
            .catch((error) => {
                if (is(error, NotExistsError)) {
                    return new Response(error.message, Status.NOT_FOUND)
                }
                throw error;
            });
    }

    /**
     * Forwarding to "exists" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    exists(request) {
        let query = this._getQuery(request);
        return this._passGate(request, 'exists', [query])
            .then(() => this._repository.exists(query))
            .then((result) => new Response(result));
    }
    
    /**
     * Forwarding to "count" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    count(request) {
        let query = this._getQuery(request);
        return this._passGate(request, 'count', [query])
            .then(() => this._repository.count(query))
            .then((result) => new Response(result));
    }

    /**
     * Forwarding to "sum" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    sum(request) {
        let attribute = request.require('attribute');
        let query = this._getQuery(request);
        return this._passGate(request, 'sum', [query, attribute])
            .then(() => this._repository.sum(attribute, query))
            .then((result) => new Response(result));
    }
    
    /**
     * Forwarding to "avg" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    avg(request) {
        let attribute = request.require('attribute');
        let query = this._getQuery(request);
        return this._passGate(request, 'avg', [query, attribute])
            .then(() => this._repository.avg(attribute, query))
            .then((result) => new Response(result));
    }
    
    /**
     * Forwarding to "min" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    min(request) {
        let attribute = request.require('attribute');
        let query = this._getQuery(request);
        return this._passGate(request, 'min', [query, attribute])
            .then(() => this._repository.min(attribute, query))
            .then((result) => new Response(result));
    }
    
    /**
     * Forwarding to "max" method of repository
     * 
     * @param {BaseRequest} request 
     * @returns {Promise}
     * @see AbstractRepository
     */
    max(request) {
        let attribute = request.require('attribute');
        let query = this._getQuery(request);
        return this._passGate(request, 'max', [query, attribute])
            .then(() => this._repository.max(attribute, query))
            .then((result) => new Response(result));
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
     * Get query from request
     * 
     * @protected
     * @param {BaseRequest} request 
     * @returns {Query}
     */
    _getQuery(request) {
        let data = request.require('query');
        return (new SerializedQuery(data)).instantiate();
    }

    /**
     * Get document from request
     * 
     * @protected
     * @param {BaseRequest} request 
     * @returns {Document}
     */
    _getDocument(request) {
        return this._repository.newDocument(request.body);
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
     * Convert document to HTTP response
     * 
     * @param {Document} document 
     * @returns {Response}
     */
    _respondDocument(document, code = Status.OK) {
        return new Response(document.export(), code);
    }

    /**
     * Convert collection to HTTP response
     * 
     * @param {Array} collection 
     * @returns {Response}
     */
    _respondCollection(collection) {
        return new Response(
            collection.map((document) => document.export())
        );
    }
}

export default RestRepositoryEndpoint;