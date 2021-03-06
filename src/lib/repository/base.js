import {
    Mixture, 
} from '../mixture.js';
import {
    is,
    isObject, 
    isFunction,
} from '../helpers.js';
import Query from '../query/query.js';
import TypedCollection from '../structures/typed-collection.js';

/**
 * Base class for all repositories
 * 
 * @class
 * @abstract
 * @augments Mixture
 */
class AbstractRepository extends Mixture
{
    /**
     * Model class
     * 
     * @protected
     * @var {any}
     */
    _type;

    /**
     * Model key name
     * 
     * @protected
     * @var {String}
     */
    _keyName;

    /**
     * @param {any} type 
     */
    constructor(type) {
        super();
        this._type = type;
        this._keyName = type.prototype.getKeyName();
    }

    /**
     * Create new model instance
     * 
     * @param {Object} [data={}]
     * @returns {Model} 
     */
    newModel(data = {}) {
        return new this._type(data);
    }

    /**
     * Create new collection of models
     * 
     * @param {Array} [items=[]] 
     * @returns {TypedCollection}
     */
    newCollection(items = []) {
        return new TypedCollection(this._type, items);
    }

    /**
     * Make query object from provided argument
     * 
     * @param {any} query 
     * @returns {Query}
     */
    normalizeQuery(query) {
        if (query === null) {
            return new Query();
        }
        if (is(query, Query)) {
            return query;
        }
        if (isObject(query) || isFunction(query)) {
            return (new Query).where(query);
        }
        if (is(query, Array)) {
            return (new Query).where((condition) => {
                condition.in(this._keyName, query);
            });
        }
        return (new Query).where(this._keyName, query);
    }

    /**
     * Find model by its key in repository
     * 
     * @abstract
     * @param {Number} key Model key value
     * @returns {Promise}
     */
    get() {
        throw new Error('Method "get" must be implemented is subclass');
    }
    
    /**
     * Search models that match the given query
     * 
     * @abstract
     * @param {any} query 
     * @returns {Promise}
     */
    search() {
        throw new Error('Method "search" must be implemented is subclass');
    }
    
    /**
     * Put model in repository. If repository already has model 
     * with the same key value that model is being replaced
     * 
     * @abstract
     * @param {Model} object 
     * @returns {Promise}
     */
    store() {
        throw new Error('Method "store" must be implemented is subclass');
    }
    
    /**
     * Remove model from repository
     * 
     * @abstract
     * @param {Number} key 
     * @returns {Promise}
     */
    delete() {
        throw new Error('Method "delete" must be implemented is subclass');
    }
    
    /**
     * Check if repository has models that match the given query
     * 
     * @abstract
     * @param {any} query 
     * @returns {Promise}
     */
    exists() {
        throw new Error('Method "exists" must be implemented is subclass');
    }
    
    /**
     * Count models that match the given query
     * 
     * @abstract
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    count() {
        throw new Error('Method "count" must be implemented is subclass');
    }
    
    /**
     * Get total value of attribute of models that match the given query
     * 
     * @abstract
     * @param {String} attribute 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    sum() {
        throw new Error('Method "sum" must be implemented is subclass');
    }
    
    /**
     * Get average value of attribute of models that match the given query
     * 
     * @abstract
     * @param {String} attribute 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    avg() {
        throw new Error('Method "avg" must be implemented is subclass');
    }
    
    /**
     * Get minimal value of attribute of models that match the given query
     * 
     * @abstract
     * @param {String} attribute 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    min() {
        throw new Error('Method "min" must be implemented is subclass');
    }
    
    /**
     * Get maximal value of attribute of models that match the given query
     * 
     * @abstract
     * @param {String} attribute 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    max() {
        throw new Error('Method "max" must be implemented is subclass');
    }

    /**
     * Type of entities that this repository holds
     * 
     * @var {Function}
     */
    get type() {
        return this._type;
    }

    /**
     * Model key name
     * 
     * @var {String}
     */
    get keyName() {
        return this._keyName;
    }

    /**
     * Extract data from model
     * 
     * @param {Model} object 
     * @returns {Object}
     */
    _consumeModel(object) {
        return object.toObject();
    }

    /**
     * Create model with data loaded from repository
     * 
     * @param {Object} object 
     * @returns {Model}
     */
    _hydrateModel(object) {
        return this.newModel(object);
    }

    /**
     * Create collection with data loaded from repository
     * 
     * @param {Array|Collection} items
     * @returns {TypedCollection}
     */
    _hydrateCollection(items) {
        return this.newCollection(
            items.map((item) => this._hydrateModel(item))
        );
    }

    /**
     * Update model data
     * 
     * @param {Model} object 
     * @param {Object} data 
     */
    _updateModel(model, data) {
        if (isObject(data)) {
            model.assign(data);
        }
    }

    /**
     * Generate "element not exists" error
     * 
     * @param {any} key 
     * @returns {NotExistsError}
     */
    _notExistsError(key) {
        return new NotExistsError(`Element with key '${key}' does not exists`);
    }
}

/**
 * This error is raised when requested model was not found in repository
 * 
 * @class
 * @augments Error
 */
class NotExistsError extends Error
{
    /**
     * @param {String} [message='Element does not exists'] 
     */
    constructor(message = 'Element does not exists') {
        super(message);
    }
}

export default AbstractRepository;

export {
    NotExistsError,
};