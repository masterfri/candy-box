import { makeMutator,
    map } from '../helpers.js';

const isValidIndex = (target, key) => {
    return key >= 0 && key <= target.length;
}

const collect = (values = [], type = undefined) => {
    let mutator = makeMutator(type);
    let col = Object.create({
        constructor: Array.prototype.constructor,
        indexOf: Array.prototype.indexOf,
        find: Array.prototype.find,
        some: Array.prototype.some,
        every: Array.prototype.every,
        slice: Array.prototype.slice,
        keys: Array.prototype.keys,
        length: Array.prototype.length,
        [Symbol.iterator]: Array.prototype[Symbol.iterator],
    }, {
        push: {
            enumerable: false,
            configurable: false,
            writable: false,
            value (...args) {
                Array.prototype.push.call(this, ...map(args, mutator));
            }
        }, 
        remove: {
            enumerable: false,
            configurable: false,
            writable: false,
            value (index, count = 1) {
                Array.prototype.splice.call(this, index, count);
            }
        },
    });
    col.push(...values);
    return new Proxy(col, {
        set(target, key, val, receiver) {
            if (isValidIndex(target, key)) {
                return Reflect.set(target, key, mutator(val), receiver);
            }
            return Reflect.set(target, key, val, receiver);
        },
        deleteProperty(target, key) {
            if (isValidIndex(target, key)) {
                target.remove(key);
                return true;
            }
            return false;
        },
    });
}

export default collect;