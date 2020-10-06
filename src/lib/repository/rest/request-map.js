import {
    RequestMap,
    Method,
} from '../../transport/request';

class RestRepositoryRequestMap extends RequestMap
{
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

    createGetRequest() {
        return {
            route: this.addParam(this._basePath, this._keyName),
            method: Method.GET,
        }
    }
    
    createSearchRequest() {
        return {
            route: this.addComponent(this._basePath, 'search'),
            method: Method.POST,
        }
    }
    
    createStoreRequest() {
        return {
            route: this._basePath,
            method: Method.PUT,
        }
    }
    
    createDeleteRequest() {
        return {
            route: this.addParam(this._basePath, this._keyName),
            method: Method.DELETE,
        }
    }
    
    createExistsRequest() {
        return {
            route: this.addComponent(this._basePath, 'exists'),
            method: Method.POST,
        }
    }
    
    createCountRequest() {
        return {
            route: this.addComponent(this._basePath, 'count'),
            method: Method.POST,
        }
    }

    createSumRequest() {
        return {
            route: this.addComponent(this._basePath, 'sum/:attribute'),
            method: Method.POST,
        }
    }

    createAvgRequest() {
        return {
            route: this.addComponent(this._basePath, 'avg/:attribute'),
            method: Method.POST,
        }
    }

    createMinRequest() {
        return {
            route: this.addComponent(this._basePath, 'min/:attribute'),
            method: Method.POST,
        }
    }

    createMaxRequest() {
        return {
            route: this.addComponent(this._basePath, 'max/:attribute'),
            method: Method.POST,
        }
    }
    
    addParam(path, name) {
        return name ? this.addComponent(path, ':' + name) : path;
    }
    
    addComponent(path, component) {
        if (path.substr(-1) === '/') {
            return path + component;
        }
        return path + '/' + component;
    }
}

export default RestRepositoryRequestMap;