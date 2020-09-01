import {
    Mixture, 
    Interface,
} from '../mixture';
import {
    is,
    isObject, 
    isFunction,
} from '../helpers';
import Query from '../query/query';

class RepositoryInterface extends Interface
{
    static methods() {
        return [
            'getKeyName',
            'get',
            'search',
            'store',
            'delete',
            'exists',
            'count',
            'sum',
            'avg',
            'min',
            'max', 
        ];
    }
}

class BaseRepository extends Mixture
{
    constructor(type) {
        super();
        this._type = type;
        this._keyName = type.prototype.getKeyName.call({});
    }

    mixins() {
        return [
            RepositoryInterface,
        ];
    }
    
    factory(data = {}) {
        if (is(data, this._type)) {
            return data;
        }
        return new this._type(data);
    }

    getKeyName() {
        return this._keyName;
    }

    normalizeQuery(query) {
        if (is(query, Query)) {
            return query;
        }
        
        if (isObject(query) || isFunction(query)) {
            return new Query(query);
        }
        
        if (is(query, Array)) {
            return new Query((q) => {
                q.where((condition) => {
                    condition.inArray(this.getKeyName(), query);
                }).limitTo(query.length);
            });
        }
        
        return new Query((q) => {
            q.where((condition) => {
                condition.equals(this.getKeyName(), query);
            }).limitTo(1);
        });
    }
}

export {
    RepositoryInterface,
    BaseRepository,
};