import {
    Mixture, 
} from '../mixture';
import {
    is,
    isObject, 
    isFunction,
} from '../helpers';
import Query from '../query/query';

class BaseRepository extends Mixture
{
    constructor(type) {
        super();
        this._type = type;
        this._keyName = type.prototype.getKeyName();
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

class EntityNotFoundError extends Error
{
    constructor(message = 'Not found') {
        super(message);
    }
}

export default BaseRepository;

export {
    EntityNotFoundError,
};