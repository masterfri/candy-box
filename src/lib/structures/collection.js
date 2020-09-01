import {
    getProps, 
    objectsEqual, 
    argsToArray,
    isFunction,
    isObject,
} from '../helpers';

class Collection
{
    constructor(items = []) {
        this._items = items;
    }
    
    make(items = []) {
        return new Collection(items);
    }
    
    push(...args) {
        return this._items.push(...args);
    }
    
    pop() {
        return this._items.pop();
    }
    
    unshift(...args) {
        return this._items.unshift(...args);
    }
    
    shift() {
        return this._items.shift();
    }
    
    slice(...args) {
        return this.make(this._items.slice(...args));
    }
    
    splice(...args) {
        return this._items.splice(...args);
    }
    
    remove(...args) {
        for (let i = 0; i < args.length; i++) {
            let index = this._items.indexOf(args[i]);
            if (index !== -1) {
                this.removeIndex(index);
            }
        }
    }
    
    removeIndex(index) {
        this._items.splice(index, 1);
    }
    
    map(...args) {
        return this.make(this._items.map(...args));
    }
    
    filter(...args) {
        return this.make(this._items.filter(...args));
    }
    
    concat(...args) {
        return this.make(this._items.concat(...argsToArray(args).map((arg) => {
            return arg instanceof Collection ? arg.all() : arg;
        })));
    }
    
    forEach(...args) {
        return this._items.forEach(...args);
    }
    
    reduce(...args) {
        return this._items.reduce(...args);
    }
    
    reduceRight(...args) {
        return this._items.reduceRight(...args);
    }
    
    sort(...args) {
        return this.make(this._items.sort(...args));
    }
    
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
    
    some(...args) {
        return this._items.some(...args);
    }
    
    every(...args) {
        return this._items.every(...args);
    }
    
    indexOf(...args) {
        return this._items.indexOf(...args);
    }
    
    findIndex(...args) {
        return this._items.findIndex(...args);
    }
    
    first() {
        return this._items.length === 0 ? null : this._items[0];
    }
    
    last() {
        return this._items.length === 0 ? null : this._items[this._items.length - 1];
    }
    
    at(n) {
        return this._items[n];
    }
    
    insert(value, index) {
        this._items[index] = value;
    }
    
    all() {
        return this._items;
    }
    
    get length() {
        return this._items.length;
    }
}

export default Collection;