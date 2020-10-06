import {
    SerializedQuery,
} from '../../query/query';
import Response, {
    Status,
} from '../../transport/response';
import {
    EntityNotFoundError,
} from '../base';
import {
    is,
    isFunction,
} from '../../helpers';

class RestRepositoryProxy
{
    constructor(repository) {
        this._repository = repository;
    }

    get(request) {
        return this.proxyMethod(
            'get', 
            [() => this.getKeyFromRequest(request)], 
            (result) => result.toObject()
        );
    }

    search(request) {
        return this.proxyMethod(
            'search', 
            [() => this.getQueryFromRequest(request)], 
            (results) => results.all().map(result => result.toObject())
        );
    }
    
    store(request) {
        let object = this._repository.factory(request.getData());
        let isUpdate = object.hasKey();
        return this.proxyMethod(
            'store', 
            [object], 
            (stored) => stored.toObject(),
            isUpdate ? Status.OK : Status.CREATED
        );
    }

    delete(request) {
        return this.proxyMethod(
            'delete', 
            [() => this.getKeyFromRequest(request)], 
            () => new Response()
        );
    }

    exists(request) {
        return this.proxyMethod(
            'exists', 
            [() => this.getQueryFromRequest(request)]
        );
    }
    
    count(request) {
        return this.proxyMethod(
            'count', 
            [() => this.getQueryFromRequest(request)]
        );
    }

    sum(request) {
        return this.proxyMethod(
            'sum', 
            [
                () => this.getAttributeNameFromRequest(request),
                () => this.getQueryFromRequest(request),
            ]
        );
    }
    
    avg(request) {
        return this.proxyMethod(
            'avg', 
            [
                () => this.getAttributeNameFromRequest(request),
                () => this.getQueryFromRequest(request),
            ]
        );
    }
    
    min(request) {
        return this.proxyMethod(
            'min', 
            [
                () => this.getAttributeNameFromRequest(request),
                () => this.getQueryFromRequest(request),
            ]
        );
    }
    
    max(request) {
        return this.proxyMethod(
            'max', 
            [
                () => this.getAttributeNameFromRequest(request),
                () => this.getQueryFromRequest(request),
            ]
        );
    }

    getKeyFromRequest(request) {
        let key = request.getParam(this._repository.getKeyName());
        if (key === null) {
            throw new Response('Bad request', Status.BAD_REQUEST);
        }
        return key;
    }

    getAttributeNameFromRequest(request) {
        let attribute = request.getParam('attribute');
        if (attribute === null) {
            throw new Response('Bad request', Status.BAD_REQUEST);
        }
        return attribute;
    }

    getQueryFromRequest(request) {
        let data = request.getParam('query');
        if (data === null) {
            return null;
        }
        let query = (new SerializedQuery(data)).toQuery();
        return query;
    }

    proxyMethod(method, params, transformer = null, code = Status.OK) {
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
                        if (is(error, EntityNotFoundError)) {
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

export default RestRepositoryProxy;