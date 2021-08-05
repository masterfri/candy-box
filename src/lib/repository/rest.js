import AbstractRepository from './base.js';
import { SerializedQuery } from '../query/query.js';
import { assign } from '../helpers.js';

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
            return this._hydrateDocument(result);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    search(query) {
        return this._request('search', {
            query: this._serializeQuery(query),
        }).then((results) => {
            return this._hydrateCollection(results);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    store(document) {
        return new Promise((resolve, reject) => {
            this._request('store', this._consumeDocument(document))
                .then((result) => {
                    this._updateDocument(document, result);
                    resolve(document);
                })
                .catch(reject);
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
    sum(attribute, query = null) {
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
    avg(attribute, query = null) {
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
    min(attribute, query = null) {
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
    max(attribute, query = null) {
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
            new SerializedQuery(this.normalizeQuery(query))
        ).export();
    }
}

export default RestRepository;