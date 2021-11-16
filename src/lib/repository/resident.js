import { 
    assertType,
    filter,
    map,
    group,
    sum,
    avg,
    min,
    max } from '../helpers.js';
import AbstractRepository from './base.js';
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
            let condition = query.condition;
            let results = condition.isEmpty 
                ? [...this._items]
                : this._items.filter((item) => testCondition(condition, item));
            if (query.order.length !== 0) {
                results = results.sort(makeSorter(query.order));
            }
            if (query.group.length !== 0) {
                results = [
                    ...map(group(results, ...query.group).values(), (v) => v[0]),
                ];
            }
            if (query.limit !== false) {
                results = results.slice(query.start, query.start + query.limit);
            } else if (query.start !== 0) {
                results = results.slice(query.start);
            }
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
    _countInternal(query) {
        let cond = query.condition;
        if (cond.isEmpty) {
            return Promise.resolve(this._items.length);
        }
        let count = 0;
        let filtered = filter(this._items, (v) => testCondition(cond, v));
        for (let val of filtered) {
            count++;
        }
        return Promise.resolve(count);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _sumInternal(attribute, query) {
        return Promise.resolve(
            sum(this._pickValues(attribute, query.condition))
        );
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _avgInternal(attribute, query) {
        return Promise.resolve(
            avg(this._pickValues(attribute, query.condition))
        );
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _minInternal(attribute, query) {
        return Promise.resolve(
            min(this._pickValues(attribute, query.condition))
        );
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _maxInternal(attribute, query) {
        return Promise.resolve(
            max(this._pickValues(attribute, query.condition))
        );
    }

    /**
     * Pick attribute values from collection items
     * 
     * @param {String} attribute 
     * @param {Condition} condition 
     */
    _pickValues(attribute, condition) {
        let items = condition.isEmpty 
            ? this._items
            : filter(this._items, (v) => testCondition(condition, v));
        return map(items, attribute);
    }
}

export default ResidentRepository;