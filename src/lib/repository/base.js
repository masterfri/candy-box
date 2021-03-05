import {
    Mixture, 
} from '../mixture.js';
import {
    is,
    isObject, 
    isFunction,
} from '../helpers.js';
import RepositoryQuery from './query.js';

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
     * Get model key name
     * 
     * @returns {String}
     */
    getKeyName() {
        return this._keyName;
    }

    /**
     * Make query object from provided argument
     * 
     * @param {any} query 
     * @returns {RepositoryQuery}
     */
    normalizeQuery(query) {
        if (is(query, RepositoryQuery)) {
            return query;
        }

        if (isObject(query)) {
            return (new RepositoryQuery).where(query);
        }

        if (isFunction(query)) {
            let normalized = new RepositoryQuery();
            query(normalized);
            return normalized;
        }
        
        if (is(query, Array)) {
            return (new RepositoryQuery).where((condition) => {
                condition.in(this.getKeyName(), query);
            });
        }
        
        return (new RepositoryQuery).where((condition) => {
            condition.eq(this.getKeyName(), query);
        });
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
}

/**
 * This error is raised when requested model was not found in repository
 * 
 * @class
 * @augments Error
 */
class NotFoundError extends Error
{
    /**
     * @param {String} [message='Not found'] 
     */
    constructor(message = 'Not found') {
        super(message);
    }
}

export default AbstractRepository;

export {
    NotFoundError,
};