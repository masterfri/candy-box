const makeMutator = (type, nullable = false) => {
    if (type === Number) {
        return nullable 
            ? (v) => isNil(v) ? null : (isNaN(v) ? 0 : Number(v))
            : (v) => isNaN(v) ? 0 : Number(v);
    }
    if (type === String) {
        return nullable
            ? (v) => isNil(v) ? null : String(v)
            : (v) => String(v);
    }
    if (type === Boolean) {
        return nullable
            ? (v) => isNil(v) ? null : Boolean(Number(v))
            : (v) => Boolean(Number(v));
    }
    if (type === Object) {
        return nullable
            ? (v) => isNil(v) ? null : (isObject(v) ? v : {})
            : (v) => isObject(v) ? v : {};
    }
    if (type === Array) {
        return nullable
            ? (v) => isNil(v) ? null : toArray(v)
            : (v) => toArray(v)
    }
    if (isFunction(type)) {
        return nullable
            ? (v) => isNil(v) ? null: (is(v, type) ? v : new type(v))
            : (v) => (v instanceof type) ? v : new type(v);
    }
    return nullable
        ? (v) => isNil(v) ? null : v
        : (v) => v;
}

const toArray = (v) => {
    if (isArray(v)) {
        return v;
    }
    if (isIterable(v)) {
        return [...v];
    }
    if (isNil(v)) {
        return [];
    }
    return [v];
}

const pickProps = (source, props) => {
    let result = {};
    Object.keys(source).forEach((prop) => {
        if (props.indexOf(prop) !== -1) {
            result[prop] = source[prop];
        }
    });
    return result;
}

const skipProps = (source, props) => {
    let result = {};
    Object.keys(source).forEach((prop) => {
        if (props.indexOf(prop) === -1) {
            result[prop] = source[prop];
        }
    });
    return result;
}

const getProps = (source, props) => {
    let result = {};
    props.forEach((prop) => {
        result[prop] = source[prop];
    });
    return result;
}

const getProp = (source, prop = null) => {
    if (prop === null) {
        for (let key in source) {
            return source[key];
        }
        return undefined;
    }
    return source[prop];
}

const assign = (key, val, target = {}) => {
    target[key] = val;
    return target;
}

const get = (object, path, def = undefined) => {
    if (isObject(object)) {
        let dot = path.indexOf('.');
        if (dot === -1) {
            return (path in object) ? object[path] : valueOf(def);
        }
        let root = path.substr(0, dot);
        if (root in object) {
            return get(object[root], path.substr(dot + 1), def);
        }
    }
    return valueOf(def);
}

const set = (object, path, value) => {
    if (isObject(object)) {
        let dot = path.indexOf('.');
        if (dot === -1) {
            object[path] = value;
        } else {
            let root = path.substr(0, dot);
            if (!(root in object)) {
                object[root] = {};
            }
            return set(object[root], path.substr(dot + 1), value);
        }
    }
}

const inject = (target, ...extensions) => {
    Array.from(extensions).forEach((extension) => {
        let descriptors = Object.getOwnPropertyDescriptors(extension);
        forEach(descriptors, (descriptor, name) => {
            if (target.prototype[name] === undefined) {
                Object.defineProperty(target.prototype, name, descriptor);
            }
        });
    });
    return target;
}

const valueOf = (v) => {
    return isFunction(v) ? v() : v;
}

const sum = (values) => {
    let sum = 0;
    forEach(values, (val) => {
        if (!isNaN(val)) {
            sum += Number(val);
        }
    });
    return sum;
}

const avg = (values) => {
    let sum = 0, count = 0;
    forEach(values, (val) => {
        if (!isNaN(val)) {
            sum += Number(val);
            count++;
        }
    });
    return count === 0 ? 0 : sum / count;
}

const min = (values) => {
    let res = undefined;
    forEach(values, (val) => {
        if (!isNil(val)) {
            if (res === undefined || res > val) {
                res = val;
            }
        }
    });
    return res;
}

const max = (values) => {
    let res = undefined;
    forEach(values, (val) => {
        if (!isNil(val)) {
            if (res === undefined || res < val) {
                res = val;
            }
        }
    });
    return res;
}

const forEach = (object, callback) => {
    if (isObject(object)) {
        if (isFunction(object[Symbol.iterator])) {
            let index = 0;
            for (let val of object) {
                callback(val, index++, object);
            }
        } else {
            for (let key in object) {
                callback(object[key], key, object);
            }
        }
    } else {
        callback(object, null, object);
    }
}

function* filter (iterable, test) {
    if (isIterable(iterable)) {
        for (let val of iterable) {
            if (test(val)) {
                yield val;
            }
        }
    }
}

function* map (iterable, prop) {
    if (isIterable(iterable)) {
        let getter = isFunction(prop) ? prop : (v) => get(v, prop);
        for (let val of iterable) {
            yield getter(val);
        }
    }
}

const intersect = (...args) => {
    let arrays = Array.from(args);
    let base = arrays.shift();
    return base.filter((item) => {
        return arrays.every((array) => array.indexOf(item) !== -1);
    });
}

const difference = (...args) => {
    let arrays = Array.from(args);
    let base = arrays.shift();
    return base.filter((item) => {
        return arrays.every((array) => array.indexOf(item) === -1);
    });
}

const dedupe = (array) => {
    return Array.from(new Set(array));
}

const group = (array, ...args) => {
    let groups = new Map();
    let tree = new Map();
    let keys = Array.from(args);
    let [first] = keys;
    let makeKey = isFunction(first)
        ? first
        : (keys.length === 1 
            ? (item) => item[first]
            : (item) => keys.map((key) => item[key]));
    const putItem = (map, item, keys, i) => {
        let key = keys[i];
        if (i === keys.length - 1) {
            if (map.has(key)) {
                map.get(key).push(item);
            } else {
                let leaf = [item];
                groups.set(i === 0 ? key : keys, leaf);
                map.set(key, leaf);
            }
        } else {
            let branch;
            if (map.has(key)) {
                branch = map.get(key);
            } else {
                branch = new Map();
                map.set(key, branch);
            }
            putItem(branch, item, keys, i + 1);
        }
    }
    array.forEach((item) => {
        let key = makeKey(item);
        putItem(tree, item, isArray(key) ? key : [key], 0);
    });
    return groups;
}

const isScalar = (v) => {
    return isString(v) || isNumber(v) || isBool(v);
}

const objectsEqual = (a, b) => {
    if (!isObject(a) || !isObject(b)) {
        return false;
    }
    
    let keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) {
        return false;
    }
    
    return keys.every((key) => {
        return a[key] === b[key];
    });
}

const arraysEqual = (a, b) => {
    if (!is(a, Array) || !is(b, Array)) {
        return false;
    }
    
    if (a.length !== b.length) {
        return false;
    }
    
    return a.every((val, index) => {
        return val === b[index];
    });
}

const promise = (val) => {
    if (is(val, Promise)) {
        return val;
    }
    if (isFunction(val)) {
        try {
            return promise(val());
        } catch (err) {
            return Promise.reject(err);
        }
    }
    return Promise.resolve(val);
}

const isObject = (o) => {
    return o !== null && typeof(o) === 'object';
}

const isFunction = (o) => {
    return typeof(o) === 'function';
}

const isNumber = (o) => {
    return typeof(o) === 'number';
}

const isBool = (o) => {
    return typeof(o) === 'boolean';
}

const isString = (o) => {
    return typeof(o) === 'string';
}

const isArray = (o) => {
    return o instanceof Array;
}

const isNil = (o) => {
    return o === null || o === undefined;
}

const isPrimitive = (o) => {
    return isNil(o) || isString(o) || isNumber(o) || isBool(o);
}

const isIterable = (o) => {
    return isObject(o) && isFunction(o[Symbol.iterator]);
}

const is = (o, t) => {
    return o instanceof t;
}

const isSubclass = (a, b) => {
    return isFunction(a)
        && isFunction(b)
        && b.prototype.isPrototypeOf(a.prototype);
}

const safeCall = (f, ...args) => {
    return f ? f(...args) : undefined;
}

const assertType = (o, t) => {
    if (!is(o, t)) {
        throw new TypeError('The given object has invalid type');
    }
}

const assertIsString = (o) => {
    if (!isString(o)) {
        throw new TypeError('The given value should be a string');
    }
}

const assertIsFunction = (o) => {
    if (!isFunction(o)) {
        throw new TypeError('The given value should be a function');
    }
}

const assertIsNumber = (o) => {
    if (!isNumber(o)) {
        throw new TypeError('The given value should be a number');
    }
}

const assertIsBool = (o) => {
    if (!isBool(o)) {
        throw new TypeError('The given value should be boolean one');
    }
}

const assertIsObject = (o) => {
    if (!isObject(o)) {
        throw new TypeError('The given value should be an object');
    }
}

const assertIsArray = (a) => {
    if (!is(a, Array)) {
        throw new TypeError('The given value should be an array');
    }
}

const assertIsPrimitive = (o) => {
    if (!isPrimitive(o)) {
        throw new TypeError('The given value should be primitive one');
    }
}

const assertNotNil = (a) => {
    if (isNil(a)) {
        throw new TypeError('The given value should be not nil');
    }
}

const abstractMethodError = (m) => {
    throw new Error(`Method "${m}" must be implemented in subclass`);
}

const nop = () => {}

export {
    makeMutator,
    toArray,
    getProps,
    getProp,
    pickProps,
    skipProps,
    assign,
    get,
    set,
    inject,
    valueOf,
    sum,
    avg,
    min,
    max,
    forEach,
    filter,
    map,
    intersect,
    difference,
    dedupe,
    group,
    isScalar,
    objectsEqual,
    arraysEqual,
    promise,
    isObject,
    isFunction,
    isNumber,
    isBool,
    isString,
    isArray,
    isNil,
    isPrimitive,
    isIterable,
    is,
    isSubclass,
    safeCall,
    assertType,
    assertIsString,
    assertIsFunction,
    assertIsNumber,
    assertIsBool,
    assertIsObject,
    assertIsArray,
    assertIsPrimitive,
    assertNotNil,
    abstractMethodError,
    nop,
};