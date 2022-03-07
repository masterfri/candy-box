import { 
    get,
    assertType,
    filter,
    map,
    groupReduce,
    sum,
    avg,
    min,
    max,
    count, 
    combine } from '../helpers.js';
import AbstractRepository from './base.js';
import { 
    testCondition,
    compare } from '../query/assertions.js';
import { SortOrder } from '../query/query.js';

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
     * @var {Array}
     */
    _items;

    /**
     * @param {any} type 
     * @param {Array} container 
     */
    constructor(type, container = null) {
        super(type);
        this.attachTo(container !== null ? container : []);
    }
    
    /**
     * Set collection as repository source
     * 
     * @param {Array} container 
     */
    attachTo(container) {
        container.forEach((document) => {
            assertType(document, this._type);
            this._updateNextKey(document.getKey());
        });
        this._items = container;
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
     * Make repository empty
     */
    purge() {
        this._items.splice(0);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _getInternal(key) {
        return new Promise((resolve) => {
            let index = this._findIndex(key);
            if (index !== -1) {
                resolve(this._items[index]);
            } else {
                resolve(null);
            }
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _searchInternal(query) {
        return new Promise((resolve) => {
            let results = [...this._pickItems(query.condition)];
            results = this._applyGroup(results, query);
            results = this._applyOrder(results, query);
            results = this._applyLimit(results, query);
            resolve(results);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _storeInternal(key, data) {
        return new Promise((resolve) => {
            if (key === null) {
                data[this._keyName] = this._getNextKey();
                this._items.push(data);
            } else {
                let index = this._findIndex(key);
                if (index === -1) {
                    this._items.push(data);
                } else {
                    this._items[index] = data;
                }
                this._updateNextKey(key);
            }
            resolve(data);
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _deleteInternal(key) {
        return new Promise((resolve) => {
            let index = this._findIndex(key);
            if (index !== -1) {
                this._items.splice(index, 1);
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _existsInternal(query) {
        return new Promise((resolve) => {
            let condition = query.condition;
            resolve(this._items.some((item) => {
                return testCondition(condition, item);
            }));
        });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _countInternal(query) {
        let {condition, group} = query;
        let items = this._pickItems(condition);
        if (group.length === 0) {
            return Promise.resolve(count(items));
        }
        let results = groupReduce(items, (count) => {
            return count === undefined ? 1 : count + 1;
        }, ...group).map((item) => {
            return combine(
                [].concat(group, 'count()'),
                [].concat(item.key, item.value),
            );
        });
        results = this._applyOrder(results, query);
        results = this._applyLimit(results, query);
        return Promise.resolve(results);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _sumInternal(attribute, query) {
        let {condition, group} = query;
        let items = this._pickItems(condition);
        if (group.length === 0) {
            return Promise.resolve(sum(map(items, attribute)));
        }
        let results = groupReduce(items, (sum, item) => {
            let val = get(item, attribute);
            if (!isNaN(val)) {
                return (sum === undefined ? 0 : sum) + Number(val);
            }
            return sum;
        }, ...group).map((item) => {
            return combine(
                [].concat(group, 'sum()'),
                [].concat(item.key, item.value),
            );
        });
        results = this._applyOrder(results, query);
        results = this._applyLimit(results, query);
        return Promise.resolve(results);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _avgInternal(attribute, query) {
        let {condition, group} = query;
        let items = this._pickItems(condition);
        if (group.length === 0) {
            return Promise.resolve(avg(map(items, attribute)));
        }
        let results = groupReduce(items, (avg, item) => {
            let val = get(item, attribute);
            let agg = avg === undefined ? [0, 0] : avg;
            if (!isNaN(val)) {
                agg[0]++;
                agg[1] += Number(val);
            }
            return agg;
        }, ...group).map((item) => {
            return combine(
                [].concat(group, 'avg()'),
                [].concat(item.key, item.value[0] === 0 ? 0 : item.value[1] / item.value[0]),
            );
        });
        results = this._applyOrder(results, query);
        results = this._applyLimit(results, query);
        return Promise.resolve(results);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _minInternal(attribute, query) {
        let {condition, group} = query;
        let items = this._pickItems(condition);
        if (group.length === 0) {
            return Promise.resolve(min(map(items, attribute)));
        }
        let results = groupReduce(items, (min, item) => {
            return min === undefined 
                ? get(item, attribute)
                : Math.min(min, get(item, attribute));
        }, ...group).map((item) => {
            return combine(
                [].concat(group, 'min()'),
                [].concat(item.key, item.value),
            );
        });
        results = this._applyOrder(results, query);
        results = this._applyLimit(results, query);
        return Promise.resolve(results);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _maxInternal(attribute, query) {
        let {condition, group} = query;
        let items = this._pickItems(condition);
        if (group.length === 0) {
            return Promise.resolve(max(map(items, attribute)));
        }
        let results = groupReduce(items, (max, item) => {
            return max === undefined 
                ? get(item, attribute)
                : Math.max(max, get(item, attribute));
        }, ...group).map((item) => {
            return combine(
                [].concat(group, 'max()'),
                [].concat(item.key, item.value),
            );
        });
        results = this._applyOrder(results, query);
        results = this._applyLimit(results, query);
        return Promise.resolve(results);
    }

    /**
     * Pick items from collection
     * 
     * @param {Condition} condition 
     * @returns {Generator|Array}
     */
    _pickItems(condition) {
        return condition.isEmpty 
            ? this._items
            : filter(this._items, (v) => testCondition(condition, v));
    }

    /**
     * Apply query group to search results
     * 
     * @param {Array} results 
     * @param {Query} query 
     * @returns {Array}
     */
    _applyGroup(results, query) {
        if (query.group.length !== 0) {
            return groupReduce(results, 
                (first, item) => first === undefined ? item : first, 
                ...query.group).map((v) => v.value);
        }
        return results;
    }

    /**
     * Apply query order to search results
     * 
     * @param {Array} results 
     * @param {Query} query 
     * @returns {Array}
     */
    _applyOrder(results, query) {
        if (query.order.length !== 0) {
            return results.sort(this._makeSorter(query.order));
        }
        return results;
    }

    /**
     * Apply query limit to search results
     * 
     * @param {Array} results 
     * @param {Query} query 
     * @returns {Array}
     */
    _applyLimit(results, query) {
        if (query.limit !== false) {
            return results.slice(query.start, query.start + query.limit);
        }
        if (query.start !== 0) {
            results = results.slice(query.start);
        }
        return results;
    }

    /**
     * Make sort function
     * 
     * @protected
     * @param {SortOrder} sort 
     * @returns {Function}
     */
    _makeSorter(sort) {
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
}

export default ResidentRepository;