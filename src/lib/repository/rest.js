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
    _getInternal(key) {
        let data = assign(this._keyName, key);
        return this._request('get', data);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _searchInternal(query) {
        return this._request('search', {
            query: this._serializeQuery(query),
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _storeInternal(_key, data) {
        return this._request('store', data);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _deleteInternal(key) {
        let data = assign(this._keyName, key);
        return this._request('delete', data).then(() => {
            return true;
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _existsInternal(query) {
        return this._request('exists', {
            query: this._serializeQuery(query),
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _countInternal(query) {
        return this._request('count', {
            query: this._serializeQuery(query),
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _sumInternal(attribute, query) {
        return this._request('sum', {
            attribute,
            query: this._serializeQuery(query),
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _avgInternal(attribute, query) {
        return this._request('avg', {
            attribute,
            query: this._serializeQuery(query),
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _minInternal(attribute, query) {
        return this._request('min', {
            attribute,
            query: this._serializeQuery(query),
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _maxInternal(attribute, query) {
        return this._request('max', {
            attribute,
            query: this._serializeQuery(query),
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
        return (new SerializedQuery(query)).export();
    }
}

export default RestRepository;