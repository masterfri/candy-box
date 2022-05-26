import {
    RequestMap,
    Method } from '../transport/request.js';

/**
 * BaseRequest mapping for repositories
 * 
 * @class
 * @augments RequestMap
 */
class RestRepositoryRequestMap extends RequestMap
{
    /**
     * @protected
     * @var {String}
     */
    _basePath;

    /**
     * @protected
     * @var {String}
     */
    _keyName;

    /**
     * @param {String} basePath 
     * @param {String} [keyName='id'] 
     */
    constructor(basePath, keyName = 'id') {
        super();
        this._basePath = basePath;
        this._keyName = keyName;
        this.map('get', this.createGetRequest());
        this.map('search', this.createSearchRequest());
        this.map('store', this.createStoreRequest());
        this.map('delete', this.createDeleteRequest());
        this.map('exists', this.createExistsRequest());
        this.map('count', this.createCountRequest());
        this.map('sum', this.createSumRequest());
        this.map('avg', this.createAvgRequest());
        this.map('min', this.createMinRequest());
        this.map('max', this.createMaxRequest());
    }

    /**
     * Create request for "get" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createGetRequest() {
        return {
            route: this._addParam(this._basePath, this._keyName),
            method: Method.GET,
        }
    }
    
    /**
     * Create request for "search" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createSearchRequest() {
        return {
            route: this._addComponent(this._basePath, 'search'),
            method: Method.POST,
        }
    }
    
    /**
     * Create request for "srore" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createStoreRequest() {
        return {
            route: this._basePath,
            method: Method.PUT,
        }
    }
    
    /**
     * Create request for "delete" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createDeleteRequest() {
        return {
            route: this._addParam(this._basePath, this._keyName),
            method: Method.DELETE,
        }
    }
    
    /**
     * Create request for "exists" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createExistsRequest() {
        return {
            route: this._addComponent(this._basePath, 'exists'),
            method: Method.POST,
        }
    }
    
    /**
     * Create request for "count" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createCountRequest() {
        return {
            route: this._addComponent(this._basePath, 'count'),
            method: Method.POST,
        }
    }

    /**
     * Create request for "sum" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createSumRequest() {
        return {
            route: this._addComponent(this._basePath, 'sum/:attribute'),
            method: Method.POST,
        }
    }

    /**
     * Create request for "avg" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createAvgRequest() {
        return {
            route: this._addComponent(this._basePath, 'avg/:attribute'),
            method: Method.POST,
        }
    }

    /**
     * Create request for "min" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createMinRequest() {
        return {
            route: this._addComponent(this._basePath, 'min/:attribute'),
            method: Method.POST,
        }
    }

    /**
     * Create request for "max" method of repository
     * 
     * @returns {BaseRequest}
     * @see RestRepository
     */
    createMaxRequest() {
        return {
            route: this._addComponent(this._basePath, 'max/:attribute'),
            method: Method.POST,
        }
    }
    
    /**
     * Add param component to path
     * 
     * @protected
     * @param {String} path 
     * @param {String} name 
     * @returns {String}
     */
    _addParam(path, name) {
        return name ? this._addComponent(path, ':' + name) : path;
    }
    
    /**
     * Add path component
     * 
     * @protected
     * @param {String} path 
     * @param {String} component 
     * @returns {String}
     */
    _addComponent(path, component) {
        if (path.substr(-1) === '/') {
            return path + component;
        }
        return path + '/' + component;
    }
}

export default RestRepositoryRequestMap;