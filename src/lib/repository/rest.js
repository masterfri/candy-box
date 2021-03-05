import AbstractRepository from './base.js';
import {
    SerializedRepositoryQuery,
} from './query.js';
import { 
    assign,
    isObject,
    assertType,
    assertIsObject,
    assertIsArray,
} from '../helpers.js';
import Collection from '../structures/collection.js';

/**
 * Repository that communicates with storage via REST API
 * 
 * @class
 * @augments AbstractRepository
 */
class RestRepository extends AbstractRepository
{
    /**
     * @protected
     * @var {RequestMap}
     */
    _mapping;

    /**
     * @param {any} type 
     * @param {RequestMap} mapping 
     */
    constructor(type, mapping) {
        super(type);
        this._mapping = mapping;
    }

    /**
     * @override
     * @inheritdoc
     */
    get(key) {
        let data = assign(this._keyName, key);
        return this._request('get', data).then((result) => {
            assertIsObject(result);
            return new this._type(result);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    search(query) {
        return this._request('search', {
            query: this._serializeQuery(query),
        }).then((result) => {
            assertIsArray(result);
            return new Collection(result.map((item) => {
                assertIsObject(item);
                return new this._type(item);
            }));
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    store(object) {
        return new Promise((resolve, reject) => {
            assertType(object, this._type);
            this._request('store', object.toObject()).then((result) => {
                if (isObject(result)) {
                    object.assign(result);
                }
                resolve(object);
            }).catch(reject);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    delete(key) {
        let data = assign(this._keyName, key);
        return this._request('delete', data).then(() => {
            return true;
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    exists(query) {
        return this._request('exists', {
            query: this._serializeQuery(query),
        }).then((result) => {
            return Boolean(result);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    count(query = null) {
        let data = query === null ? {} : {
            query: this._serializeQuery(query),
        };
        return this._request('count', data).then((result) => {
            return Number(result);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    sum(attribute, query = {}) {
        return this._request('sum', {
            attribute,
            query: this._serializeQuery(query),
        }).then((result) => {
            return Number(result);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    avg(attribute, query = {}) {
        return this._request('avg', {
            attribute,
            query: this._serializeQuery(query),
        }).then((result) => {
            return Number(result);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    min(attribute, query = {}) {
        return this._request('min', {
            attribute,
            query: this._serializeQuery(query),
        }).then((result) => {
            return Number(result);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    max(attribute, query = {}) {
        return this._request('max', {
            attribute,
            query: this._serializeQuery(query),
        }).then((result) => {
            return Number(result);
        });
    }

    /**
     * Make request instance for the given method
     * 
     * @protected
     * @param {String} method 
     * @param {Object} data 
     * @returns {Request}
     */
    _request(method, data) {
        return this._mapping.create(method, data)
            .send()
            .then((response) => {
                return response.body;
            });
    }

    /**
     * Serialize query to a plain object
     * 
     * @protected
     * @param {any} query
     * @returns {Object}
     */
    _serializeQuery(query) {
        return (
            new SerializedRepositoryQuery(this.normalizeQuery(query))
        ).toObject();
    }
}

export default RestRepository;