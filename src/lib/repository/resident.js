import Collection from '../structures/collection.js';
import { assertType } from '../helpers.js';
import AbstractRepository from './base.js';
import {
    CountAggregator,
    SumAggregator,
    AvgAggregator,
    MinAggregator,
    MaxAggregator } from '../query/aggregators.js';
import {
    testCondition,
    compare } from '../query/assertions.js';

const makeSorter = (sort) => {
    return (a, b) => {
        for (let order of sort) {
            let sign = compare(a[order.prop], b[order.prop], order.isDescending);
            if (sign !== 0) {
                return sign;
            }
        }
        return 0;
    }
}

/**
 * Repository that stores documents in memory
 * 
 * @class
 * @augments AbstractRepository
 */
class ResidentRepository extends AbstractRepository
{
    /**
     * Sequence number for the next document
     * 
     * @protected
     * @var {Number}
     */
    _nextKey = 0;

    /**
     * @protected
     * @var {Collection}
     */
    _items;

    /**
     * @param {any} type 
     * @param {Collection} collection 
     */
    constructor(type, collection = null) {
        super(type);
        this.attachTo(collection !== null ? collection : new Collection());
    }
    
    /**
     * Set collection as repository source
     * 
     * @param {Collection} collection 
     */
    attachTo(collection) {
        assertType(collection, Collection);
        collection.forEach((document) => {
            assertType(document, this._type);
            this._updateNextKey(document.getKey());
        });
        this._items = collection;
    }
    
    /**
     * Generate next key in sequence
     * 
     * @protected
     * @returns {Number}
     */
    _getNextKey() {
        return ++this._nextKey;
    }
    
    /**
     * Generate key followed by the given one
     * 
     * @protected
     * @param {Number} key Previous key
     * @returns {Number}
     */
    _updateNextKey(key) {
        if (isNaN(key)) {
            throw new TypeError('Element key should be numeric');
        }
        if (key > this._nextKey) {
            this._nextKey = Number(key);
        }
    }
    
    /**
     * Find element in repository by its key
     * 
     * @protected
     * @param {Number} key
     * @returns {Number} 
     */
    _findIndex(key) {
        return this._items.findIndex((item) => item[this._keyName] == key);
    }
    
    /**
     * Get document by its index
     * 
     * @protected
     * @param {Number} index 
     * @returns {Document}
     */
    _getIndex(index) {
        return this._items.get(index);
    }

    /**
     * Make repository empty
     */
    purge() {
        this._items.clear();
    }
    
    /**
     * @override
     * @inheritdoc
     */
    get(key) {
        return new Promise((resolve, reject) => {
            let index = this._findIndex(key);
            if (index !== -1) {
                resolve(this._makeDocument(this._getIndex(index)));
            } else {
                reject(this._notExistsError(key));
            }
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    search(query) {
        return new Promise((resolve) => {
            let normQuery = this.normalizeQuery(query);
            let condition = normQuery.condition;
            let results = this._items.filter((item) => testCondition(condition, item));
            if (normQuery.order.length !== 0) {
                results = results.sort(makeSorter(normQuery.order));
            }
            if (normQuery.group.length !== 0) {
                let groups = results.group(normQuery.group);
                results = new Collection(groups.map((g) => g.items[0]));
            }
            if (normQuery.limit !== false) {
                results = results.slice(normQuery.start, normQuery.start + normQuery.limit);
            } else if (normQuery.start !== 0) {
                results = results.slice(normQuery.start);
            }
            resolve(this._makeCollection(results));
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    store(document) {
        return new Promise((resolve) => {
            if (!document.hasKey()) {
                document.setKey(this._getNextKey());
                this._items.push(this._consumeDocument(document));
            } else {
                let index = this._findIndex(document.getKey());
                if (index === -1) {
                    this._items.push(this._consumeDocument(document));
                } else {
                    this._items.set(index, this._consumeDocument(document));
                }
                this._updateNextKey(document.getKey());
            }
            resolve(document);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    delete(key) {
        return new Promise((resolve, reject) => {
            let index = this._findIndex(key);
            if (index !== -1) {
                this._items.removeIndex(index);
                resolve(true);
            } else {
                reject(this._notExistsError(key));
            }
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    exists(query) {
        return new Promise((resolve) => {
            let normQuery = this.normalizeQuery(query);
            let condition = normQuery.condition;
            let result = this._items.some((item) => {
                return testCondition(condition, item);
            });
            resolve(result);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    count(query = null) {
        if (query === null) {
            return Promise.resolve(this._items.length);
        }
        return this._aggregate(query, null, new CountAggregator());
    }
    
    /**
     * @override
     * @inheritdoc
     */
    sum(attribute, query = null) {
        return this._aggregate(query, attribute, new SumAggregator());
    }
    
    /**
     * @override
     * @inheritdoc
     */
    avg(attribute, query = null) {
        return this._aggregate(query, attribute, new AvgAggregator());
    }
    
    /**
     * @override
     * @inheritdoc
     */
    min(attribute, query = null) {
        return this._aggregate(query, attribute, new MinAggregator());
    }
    
    /**
     * @override
     * @inheritdoc
     */
    max(attribute, query = null) {
        return this._aggregate(query, attribute, new MaxAggregator());
    }

    /**
     * Execute function on each document that matches the given query
     * 
     * @protected
     * @param {any} query 
     * @param {Function} callback 
     */
    _forEach(query, callback) {
        if (query === null) {
            this._items.forEach((item) => {
                callback(item);
            });    
        } else {
            let normQuery = this.normalizeQuery(query);
            let condition = normQuery.condition;
            this._items.forEach((item) => {
                if (testCondition(condition, item)) {
                    callback(item);
                }
            });
        }
    }
    
    /**
     * Apply aggregator on the documents that match the given query
     * 
     * @protected
     * @param {any} query 
     * @param {String} attribute 
     * @param {Aggregator} aggregator 
     * @returns {Promise}
     */
    _aggregate(query, attribute, aggregator) {
        return new Promise((resolve) => {
            this._forEach(query, (item) => {
                aggregator.add(attribute === null ? item : item[attribute]);
            });
            resolve(aggregator.result);
        });
    }
}

export default ResidentRepository;