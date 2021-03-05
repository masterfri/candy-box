import RepositoryQuery, {
    SerializedRepositoryQuery,
} from '../query.js';
import Response, {
    Status,
} from '../../transport/response.js';
import {
    NotFoundError,
} from '../base.js';
import {
    is,
    isFunction,
} from '../../helpers.js';

/**
 * Class that forwards REST API calls to repository methods
 * 
 * @class
 */
class RepositoryProxy
{
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
            'get', 
            [() => this._getKeyFromRequest(request)], 
            (result) => result.toObject()
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
            'search', 
            [() => this._getQueryFromRequest(request)], 
            (results) => results.all().map(result => result.toObject())
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
        let object = this._repository.newModel(request.getData());
        let isUpdate = object.hasKey();
        return this._proxyMethod(
            'store', 
            [object], 
            (stored) => stored.toObject(),
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
            'delete', 
            [() => this._getKeyFromRequest(request)], 
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
            'exists', 
            [() => this._getQueryFromRequest(request)]
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
            'count', 
            [() => this._getQueryFromRequest(request)]
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
            'max', 
            [
                () => this._getAttributeNameFromRequest(request),
                () => this._getQueryFromRequest(request),
            ]
        );
    }

    /**
     * Get key value from request
     * 
     * @protected
     * @param {Request} request 
     * @returns {Number}
     */
    _getKeyFromRequest(request) {
        let key = request.getParam(this._repository.getKeyName());
        if (key === null) {
            throw new Response('Bad request', Status.BAD_REQUEST);
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
        let attribute = request.getParam('attribute');
        if (attribute === null) {
            throw new Response('Bad request', Status.BAD_REQUEST);
        }
        return attribute;
    }

    /**
     * Get query from request
     * 
     * @protected
     * @param {Request} request 
     * @returns {RepositoryQuery}
     */
    _getQueryFromRequest(request) {
        let data = request.getParam('query');
        if (data === null) {
            return null;
        }
        let query = (new SerializedRepositoryQuery(data)).toQuery();
        return query;
    }

    /**
     * Forward request to a certain method
     * 
     * @protected
     * @param {String} method 
     * @param {Object} params
     * @param {Function} [transformer=null]
     * @param {Number} [code=Status.OK]
     * @returns {Promise}
     */
    _proxyMethod(method, params, transformer = null, code = Status.OK) {
        return new Promise((resolve, reject) => {
            try {
                params = params.map((param) => {
                    if (isFunction(param)) {
                        return param();
                    }
                    return param;
                });
                this._repository[method](...params)
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
                        if (is(error, NotFoundError)) {
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
}

export default RepositoryProxy;