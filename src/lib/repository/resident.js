import Collection from '../structures/collection.js';
import { 
    assertType,
} from '../helpers.js';
import AbstractRepository, {
    NotFoundError,
 } from './base.js';
import {
    CountAggregator,
    SumAggregator,
    AvgAggregator,
    MinAggregator,
    MaxAggregator,
} from '../query/aggregators.js';
import {
    testCondition,
    compare,
} from '../query/assertions.js';

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

const assertKeyFound = (key) => {
    if (key === -1) {
        throw new NotFoundError(`Element with key '${key}' was not found in repository`);
    }
}

/**
 * Repository that stores models in memory
 * 
 * @class
 * @augments AbstractRepository
 */
class ResidentRepository extends AbstractRepository
{
    /**
     * Sequence number for the next model
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
        collection.forEach((object) => {
            assertType(object, this._type);
            this._updateNextKey(object.getKey());
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
        return this._items.findIndex((item) => item.getKey() == key);
    }
    
    /**
     * Get model by its index
     * 
     * @protected
     * @param {Number} index 
     * @returns {Model}
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
        return new Promise((resolve) => {
            let index = this._findIndex(key);
            assertKeyFound(index);
            resolve(this._getIndex(index));
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
                resolve(results.slice(normQuery.start, normQuery.start + normQuery.limit));
            } else if (normQuery.start !== 0) {
                resolve(results.slice(normQuery.start));
            } else {
                resolve(results);
            }
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    store(object) {
        return new Promise((resolve) => {
            assertType(object, this._type);

            if (!object.hasKey()) {
                object.setKey(this._getNextKey());
                this._items.push(object);
            } else {
                let index = this._findIndex(object.getKey());
                if (index === -1) {
                    this._items.push(object);
                } else {
                    this._items.set(index, object);
                }
                this._updateNextKey(object.getKey());
            }
            
            resolve(object);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    delete(key) {
        return new Promise((resolve) => {
            let index = this._findIndex(key);
            assertKeyFound(index);
            this._items.removeIndex(index);

            resolve(true);
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
     * Execute function on each model that matches the given query
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
     * Apply aggregator on the models that match the given query
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
            resolve(aggregator.getResult());
        });
    }
}

export default ResidentRepository;