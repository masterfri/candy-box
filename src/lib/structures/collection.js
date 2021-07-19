import {
    getProps, 
    objectsEqual, 
    argsToArray,
    isFunction,
    isObject,
    is,
} from '../helpers.js';

/**
 * Extention class for native Array
 * 
 * @class
 */
class Collection
{
    /**
     * @protected
     * @var {Array}
     */
    _items;

    /**
     * @param {Array|Collection} [items=[]] Initial set of elements 
     */
    constructor(items = []) {
        this._items = is(items, Collection) ? items.all().slice(0) : items;
    }

    /**
     * Make new collection
     * 
     * @param {Array} [items=[]] Initial set of elements
     * @returns {Collection}
     */
    newCollection(items = []) {
        return new this.constructor(items);
    }
    
    /**
     * Add elements to collection
     * 
     * @param {...any} items Elements being added to collection
     * @returns {Number}
     * @see Array.push
     */
    push(...args) {
        return this._items.push(...args);
    }
    
    /**
     * Pull out the last element of collection
     * 
     * @returns {any}
     * @see Array.pop
     */
    pop() {
        return this._items.pop();
    }
    
    /**
     * Prepend elements to collection
     * 
     * @param  {...any} items Elements being added to collection
     * @returns {Number}
     * @see Array.unshift
     */
    unshift(...args) {
        return this._items.unshift(...args);
    }
    
    /**
     * Pull out the first element of collection
     * 
     * @returns {any}
     * @see Array.shift
     */
    shift() {
        return this._items.shift();
    }
    
    /**
     * Create a slice of collection
     * 
     * @param {Number} [begin] Index of the first element to slice
     * @param {Number} [end] Index of the last element to slice
     * @returns {Collection} Collection containing sliced elements
     * @see Array.slice
     */
    slice(...args) {
        return this.newCollection(this._items.slice(...args));
    }
    
    /**
     * Remove sequence of elements from collection
     * 
     * @param {Number} start Index of the first element to remove
     * @param {Number} deleteCount Count of elements to delete
     * @param  {...any} [item] Values to replace removed elements
     * @returns {Collection} Collection containing removed elements
     * @see Array.splice
     */
    splice(...args) {
        return this.newCollection(this._items.splice(...args));
    }
    
    /**
     * Remove elements from collection
     * 
     * @param  {...any} items Elements being removed
     */
    remove(...args) {
        for (let i = 0; i < args.length; i++) {
            let index = this._items.indexOf(args[i]);
            if (index !== -1) {
                this.removeIndex(index);
            }
        }
    }
    
    /**
     * Remove elements by its index
     * 
     * @param {Number} index Index of the element being removed
     */
    removeIndex(index) {
        this._items.splice(index, 1);
    }

    /**
     * Remove all elements from collection
     */
    clear() {
        return this._items.splice(0);
    }
    
    /**
     * Call a function with every element of collection
     * 
     * @param {Function} callback
     * @param {any} [thisArg] 
     * @returns {Collection} New collection containing call results
     * @see Array.map
     */
    map(...args) {
        return this.newCollection(this._items.map(...args));
    }
    
    /**
     * Filter collection
     * 
     * @param {Function} callback
     * @param {any} [thisArg] 
     * @returns {Collection} New collection containing elements that match the criteria
     * @see Array.filter
     */
    filter(...args) {
        return this.newCollection(this._items.filter(...args));
    }
    
    /**
     * Concat two or more collections
     * 
     * @param  {...(Array|Collection)} array
     * @returns {Collection} New collection containing elements of concatenated collections
     * @see Array.concat
     */
    concat(...args) {
        return this.newCollection(this._items.concat(...argsToArray(args).map((arg) => {
            return arg instanceof Collection ? arg.all() : arg;
        })));
    }

    /**
     * Create an intersection of elements of this collection and the collections passed as arguments
     * 
     * @param  {...(Array|Collection)} args Collections to intersect with
     * @returns {Collection}
     */
    intersect(...args) {
        let arrays = argsToArray(args);
        return this.newCollection(this._items.filter((item) => {
            return arrays.every((array) => array.indexOf(item) !== -1);
        }));
    }

    /**
     * Create a difference of elements of this collection and the collections passed as arguments
     * 
     * @param  {...(Array|Collection)} args Collections to be subtracted
     * @returns {Collection}
     */
    difference(...args) {
        let arrays = argsToArray(args);
        return this.newCollection(this._items.filter((item) => {
            return arrays.every((array) => array.indexOf(item) === -1);
        }));
    }

    /**
     * Create new collection with only distinct elements
     * 
     * @returns {Collection}
     */
    distinct() {
        let distinct = [];
        this.forEach((item) => {
            if (distinct.indexOf(item) === -1) {
                distinct.push(item);
            }
        });
        return this.newCollection(distinct);
    }
    
    /**
     * Execute function for each element of collection
     * 
     * @param {Function} callback
     * @param {any} [thisArg] 
     * @see Array.forEach
     */
    forEach(...args) {
        this._items.forEach(...args);
    }
    
    /**
     * Apply aggregation function to collection
     * 
     * @param {Function} callback
     * @param {any} [initialValue] 
     * @returns {any} Aggregation result
     * @see Array.reduce
     */
    reduce(...args) {
        return this._items.reduce(...args);
    }
    
    /**
     * Apply aggregation function to collection
     * 
     * @param {Function} callback
     * @param {any} [initialValue] 
     * @returns {any} Aggregation result
     * @see Array.reduceRight
     */
    reduceRight(...args) {
        return this._items.reduceRight(...args);
    }
    
    /**
     * Sort collection elements
     * 
     * @param {Function} [compareFunction]
     * @returns {Collection}
     * @see Array.sort
     */
    sort(...args) {
        return this.newCollection(this._items.sort(...args));
    }
    
    /**
     * Group elements of collection
     * @param {...String} property 
     * @returns {Array} List of grouped elements containing object {key, items},
     *      where "key" is an object that holds distinct values of the group
     *      and "items" is an array of elements that match this group
     * @example 
     * let collection = new Collection([
     *     {name: 'cow', color: 'brown', size: 'big'},
     *     {name: 'cat', color: 'brown', size: 'small'},
     *     {name: 'elephant', color: 'grey', size: 'big'},
     *     {name: 'dog', color: 'brown', size: 'small'},
     * ]);
     * let groups = collection.group('size', 'color');
     * groups => [ 
     *     {
     *         key: {size: 'big', color: 'brown'},
     *         items: [
     *             {name: 'cow', color: 'brown', size: 'big'}
     *         ]
     *     },
     *     {
     *         key: {size: 'small', color: 'brown'},
     *         items: [ 
     *             {name: 'cat', color: 'brown', size: 'small'},
     *             {name: 'dog', color: 'brown', size: 'small'}
     *         ]
     *     },
     *     {
     *         key: {size: 'big', color: 'grey'},
     *         items: [ 
     *             {name: 'elephant', color: 'grey', size: 'big'}
     *         ]
     *     }
     * ]
     */
    group(...args) {
        if (!isFunction(args[0])) {
            let props = argsToArray(args);
            return this.group((item) => {
                return getProps(item, props);
            });
        }
        
        let groups = [];
        let makeKey = args[0];
        this._items.forEach((item) => {
            let key = makeKey(item);
            let group;
            
            if (isObject(key)) {
                group = groups.find((g) => objectsEqual(key, g.key));
            } else {
                group = groups.find((g) => key === g.key);
            }
            
            if (group !== undefined) {
                group.items.push(item);
            } else {
                groups.push({
                    key: key,
                    items: [item],
                });
            }
        });
        
        return groups;
    }
    
    /**
     * Check if some elements in the collection match the given criteria
     * 
     * @param {Function} callback
     * @param {any} [thisArg] 
     * @returns {Boolean}
     * @see Array.some
     */
    some(...args) {
        return this._items.some(...args);
    }
    
    /**
     * Check if all elements in the collection match the given criteria
     * 
     * @param {Function} callback
     * @param {any} [thisArg] 
     * @returns {Boolean}
     * @see Array.every
     */
    every(...args) {
        return this._items.every(...args);
    }
    
    /**
     * Find index of element in collection
     * 
     * @param {any} searchElement 
     * @param {Number} [fromIndex]
     * @returns {Number}
     * @see Array.indexOf
     */
    indexOf(...args) {
        return this._items.indexOf(...args);
    }
    
    /**
     * Find index of element in collection
     * 
     * @param {Function} callback
     * @param {any} [thisArg] 
     * @returns {Number}
     * @see Array.findIndex
     */
    findIndex(...args) {
        return this._items.findIndex(...args);
    }

    /**
     * Find element in collection
     * 
     * @param {Function} callback
     * @param {any} [thisArg] 
     * @returns {any}
     * @see Array.find
     */
    find(...args) {
        return this._items.find(...args);
    }
    
    /**
     * Get the first element in collection
     * 
     * @returns {any} First element or null if collection is empty
     */
    first() {
        return this._items.length === 0 ? null : this._items[0];
    }
    
    /**
     * Get the last element in collection
     * 
     * @returns {any} Last element or null if collection is empty
     */
    last() {
        return this._items.length === 0 ? null : this._items[this._items.length - 1];
    }
    
    /**
     * Get the N-th element in collection
     * 
     * @param {Number} index
     * @returns {any}
     */
    get(index) {
        return this._items[index];
    }
    
    /**
     * Update element into specific position
     * 
     * @param {Number} index
     * @param {any} value 
     */
    set(index, value) {
        this._items[index] = value;
    }
    
    /**
     * Get all elements as array
     * 
     * @returns {Array}
     */
    all() {
        return this._items;
    }

    /**
     * Make a copy of this collection
     */
    clone() {
        return this.newCollection([...this._items]);
    }
    
    /**
     * Create an iterator
     * 
     * @returns {Iterator}
     */
    [Symbol.iterator]() {
        return this._items[Symbol.iterator]();
    }

    /**
     * Size of the collection
     * 
     * @var {Number}
     * @readonly
     */
    get length() {
        return this._items.length;
    }
}

export default Collection;