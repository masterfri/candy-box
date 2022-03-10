import {
    is,
    isNil,
    isObject, 
    isFunction,
    abstractMethodError } from '../helpers.js';
import Query, {
    Condition,
    Assertion,
    Negation } from '../query/query.js';

/**
 * Base class for all repositories
 * 
 * @class
 * @abstract
 */
class AbstractRepository
{
    /**
     * Document class
     * 
     * @protected
     * @var {any}
     */
    _type;

    /**
     * Document key name
     * 
     * @protected
     * @var {String}
     */
    _keyName;

    /**
     * @param {any} type 
     */
    constructor(type) {
        this._type = type;
        this._keyName = type.prototype.getKeyName();
    }

    /**
     * Create new document instance
     * 
     * @param {Object} [data={}]
     * @returns {Document} 
     */
    newDocument(data = {}) {
        return new this._type(data);
    }

    /**
     * Defines filters for virtual attributes
     * 
     * @returns {Object|false}
     */
    virtualFilters() {
        return false;
    }

    /**
     * Defines sorters for virtual attributes
     * 
     * @returns {Object|false}
     */
    virtualSorters() {
        return false;
    }

    /**
     * Transform argument into complete query
     * 
     * @param {any} query 
     * @returns {Query}
     */
    finalizeQuery(query) {
        return this._devirtualizeQuery(
            this._normalizeQuery(query)
        );
    }

    /**
     * Find document by its key in repository
     * 
     * @param {Number} key Document key value
     * @returns {Promise}
     */
    get(key) {
        return this._getInternal(key).then((result) => {
            if (result === null) {
                throw new NotExistsError(`Element with key '${key}' does not exists`);
            }
            return this._makeDocument(result);
        });
    }

    /**
     * Search documents that match the given query
     * 
     * @param {any} query 
     * @returns {Promise}
     */
    search(query) {
        let finalized = this.finalizeQuery(query);
        return this._searchInternal(finalized)
            .then((results) => {
                return this._makeCollection(results);
            });
    }

    /**
     * Put document in repository. If repository already has document 
     * with the same key value that document is being replaced
     * 
     * @param {Document} document 
     * @returns {Promise}
     */
    store(document) {
        let data = this._consumeDocument(document);
        return this._storeInternal(document.getKey(), data)
            .then((updates) => {
                this._updateDocument(document, updates);
                return document;
            });
    }

    /**
     * Remove document from repository
     * 
     * @param {Number} key 
     * @returns {Promise}
     */
    delete(key) {
        return this._deleteInternal(key)
            .then((result) => {
                if (result === false) {
                    throw new NotExistsError(`Element with key '${key}' does not exists`);
                }
                return true;
            });
    }

    /**
     * Check if repository has documents that match the given query
     * 
     * @param {any} query 
     * @returns {Promise}
     */
    exists(query) {
        let finalized = this.finalizeQuery(query);
        return this._existsInternal(finalized);
    }

    /**
     * Count documents that match the given query
     * 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    count(query = null) {
        let finalized = this.finalizeQuery(query);
        return this._countInternal(finalized);
    }

    /**
     * Get total value of attributes across documents that match the given query
     * 
     * @param {String} attribute 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    sum(attribute, query = null) {
        let finalized = this.finalizeQuery(query);
        return this._sumInternal(attribute, finalized);
    }

    /**
     * Get average value of attributes across documents that match the given query
     * 
     * @param {String} attribute 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    avg(attribute, query = null) {
        let finalized = this.finalizeQuery(query);
        return this._avgInternal(attribute, finalized);
    }

    /**
     * Get minimal value of attributes across documents that match the given query
     * 
     * @param {String} attribute 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    min(attribute, query = null) {
        let finalized = this.finalizeQuery(query);
        return this._minInternal(attribute, finalized);
    }
    
    /**
     * Get maximal value of attributes across documents that match the given query
     * 
     * @param {String} attribute 
     * @param {any} [query=null] 
     * @returns {Promise}
     */
    max(attribute, query = null) {
        let finalized = this.finalizeQuery(query);
        return this._maxInternal(attribute, finalized);
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
     * Document key name
     * 
     * @var {String}
     */
    get keyName() {
        return this._keyName;
    }

    /**
     * Internal search of document by its key in repository
     * 
     * @protected
     * @abstract
     * @param {Number} key Document key value
     * @returns {Promise}
     */
    _getInternal() {
        abstractMethodError('_getInternal');
    }
    
    /**
     * Internal search of documents that match the given query
     * 
     * @protected
     * @abstract
     * @param {Query} query 
     * @returns {Promise}
     */
    _searchInternal() {
        abstractMethodError('_searchInternal');
    }
    
    /**
     * Internal method of storing document data
     * 
     * @protected
     * @abstract
     * @param {Number} key Document key value
     * @param {Object} document 
     * @returns {Promise}
     */
    _storeInternal() {
        abstractMethodError('_storeInternal');
    }
    
    /**
     * Internal method of deleting document
     * 
     * @protected
     * @abstract
     * @param {Number} key Document key value
     * @returns {Promise}
     */
    _deleteInternal() {
        abstractMethodError('_deleteInternal');
    }
    
    /**
     * Internal search of documents that match the given query
     * 
     * @protected
     * @abstract
     * @param {Query} query 
     * @returns {Promise}
     */
    _existsInternal() {
        abstractMethodError('_existsInternal');
    }
    
    /**
     * Internal count of documents that match the given query
     * 
     * @protected
     * @abstract
     * @param {Query} query 
     * @returns {Promise}
     */
    _countInternal() {
        abstractMethodError('_countInternal');
    }
    
    /**
     * Internal sum of attribute values across documents that match the given query
     * 
     * @protected
     * @abstract
     * @param {String} attribute 
     * @param {Query} query 
     * @returns {Promise}
     */
    _sumInternal() {
        abstractMethodError('_sumInternal');
    }
    
    /**
     * Internal average of attribute values across documents that match the given query
     * 
     * @protected
     * @abstract
     * @param {String} attribute 
     * @param {Query} query 
     * @returns {Promise}
     */
    _avgInternal() {
        abstractMethodError('_avgInternal');
    }
   
    /**
     * Internal minimum of attribute values across documents that match the given query
     * 
     * @protected
     * @abstract
     * @param {String} attribute 
     * @param {Query} query 
     * @returns {Promise}
     */
    _minInternal() {
        abstractMethodError('_minInternal');
    }

    /**
     * Internal maximum of attribute values across documents that match the given query
     * 
     * @protected
     * @abstract
     * @param {String} attribute 
     * @param {Query} query 
     * @returns {Promise}
     */
    _maxInternal() {
        abstractMethodError('_maxInternal');
    }

    /**
     * Make query object from provided argument
     * 
     * @param {any} query 
     * @returns {Query}
     */
    _normalizeQuery(query) {
        if (isNil(query)) {
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
     * Resolve virtual fields for the given query
     * 
     * @param {Query} query 
     * @returns {Query}
     */
    _devirtualizeQuery(query) {
        let filters = this.virtualFilters();
        let sorters = this.virtualSorters();
        if (filters === false && sorters === false) {
            return query;
        }
        let result = new Query();
        this._devirtualizeCondition(result.condition, query.condition, filters || {});
        this._devirtualizeOrder(result, query, sorters || {});
        if (query.group.length !== 0) {
            result.groupBy(...query.group);
        }
        result.startFrom(query.start);
        result.limitTo(query.limit);
        return result;
    }

    /**
     * Resolve virtual fields for the given condition
     * 
     * @param {Condition} dest 
     * @param {Assertion|Condition|Negation} assertion 
     * @param {Object} filters 
     */
     _devirtualizeCondition(dest, assertion, filters) {
        if (is(assertion, Assertion)) {
            let filter = filters[assertion.property];
            if (filter !== undefined) {
                filter(dest, assertion.operator, assertion.argument);
            } else {
                dest.where(assertion.clone());
            }
        } else if (is(assertion, Negation)) {
            dest.not((cond) => {
                this._devirtualizeCondition(cond, assertion.subject, filters);
            });
        } else if (is(assertion, Condition)) {
            dest.where((cond) => {
                assertion.wheres.forEach((or) => {
                    cond.or();
                    or.forEach((and) => {
                        this._devirtualizeCondition(cond, and, filters);
                    });
                });
            });
        } else {
            throw new TypeError('Illegal assertion type');
        }
    }

    /**
     * Resolve virtual sort fields for the given query
     * 
     * @param {Query} dest 
     * @param {Query} source 
     * @param {Object|false} sorters 
     */
    _devirtualizeOrder(dest, source, sorters) {
        source.order.forEach((order) => {
            let sorter = sorters === false ? undefined : sorters[order.prop];
            if (sorter !== undefined) {
                sorter(dest, order.direction);
            } else {
                dest.orderBy(order.prop, order.direction);
            }
        });
    }

    /**
     * Extract data from document
     * 
     * @param {Document} document 
     * @returns {Object}
     */
    _consumeDocument(document) {
        return document.export();
    }

    /**
     * Create document with data loaded from repository
     * 
     * @param {Object} data
     * @returns {Document}
     */
    _makeDocument(data) {
        return this.newDocument(data);
    }

    /**
     * Create collection with data loaded from repository
     * 
     * @param {Array} items
     * @returns {Array}
     */
    _makeCollection(items) {
        return items.map((item) => this._makeDocument(item));
    }

    /**
     * Update document data
     * 
     * @param {Document} document 
     * @param {Object} data 
     */
    _updateDocument(document, data) {
        if (isObject(data)) {
            document.assign(data);
        }
    }
}

/**
 * This error is raised when requested document was not found in repository
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