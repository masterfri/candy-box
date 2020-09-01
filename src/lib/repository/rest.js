import {
    BaseRepository,
} from './base';
import {
    SerializedQuery,
} from '../query/query';
import { 
    assign,
    isObject,
    assertType,
    assertIsObject,
    assertIsArray,
} from '../helpers';
import Collection from '../structures/collection';

class RestRepository extends BaseRepository
{
    constructor(type, mapping) {
        super(type);
        this._mapping = mapping;
    }

    get(key) {
        let data = assign(this._keyName, key);
        return this.request('get', data).then((result) => {
            assertIsObject(result);
            return new this._type(result);
        });
    }
    
    search(query) {
        return this.request('search', {
            query: this.serializeQuery(query),
        }).then((result) => {
            assertIsArray(result);
            return new Collection(result.map((item) => {
                assertIsObject(item);
                return new this._type(item);
            }));
        });
    }
    
    store(object) {
        return new Promise((resolve) => {
            assertType(object, this._type);
            return this.request('store', object.toObject()).then((result) => {
                if (isObject(result)) {
                    object.assign(result);
                }
                resolve(object);
            });
        });
    }
    
    delete(key) {
        let data = assign(this._keyName, key);
        return this.request('delete', data).then(() => {
            return true;
        });
    }
    
    exists(query) {
        return this.request('exists', {
            query: this.serializeQuery(query),
        }).then((result) => {
            return Boolean(result);
        });
    }
    
    count(query = null) {
        let data = query === null ? {} : {
            query: this.serializeQuery(query),
        };
        return this.request('count', data).then((result) => {
            return Number(result);
        });
    }
    
    sum(attribute, query = {}) {
        return this.request('sum', {
            attribute,
            query: this.serializeQuery(query),
        }).then((result) => {
            return Number(result);
        });
    }
    
    avg(attribute, query = {}) {
        return this.request('avg', {
            attribute,
            query: this.serializeQuery(query),
        }).then((result) => {
            return Number(result);
        });
    }
    
    min(attribute, query = {}) {
        return this.request('min', {
            attribute,
            query: this.serializeQuery(query),
        }).then((result) => {
            return Number(result);
        });
    }
    
    max(attribute, query = {}) {
        return this.request('max', {
            attribute,
            query: this.serializeQuery(query),
        }).then((result) => {
            return Number(result);
        });
    }

    request(method, data) {
        return this._mapping.create(method, data)
            .send((response) => {
                return response.data;
            });
    }

    serializeQuery(query) {
        return (
            new SerializedQuery(this.normalizeQuery(query))
        ).toObject();
    }
}

export default RestRepository;