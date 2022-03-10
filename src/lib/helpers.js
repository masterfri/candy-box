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

const filterObject = (source, test) => {
    let result = {};
    Object.keys(source).forEach((prop) => {
        if (test(prop, source)) {
            result[prop] = source[prop];
        }
    });
    return result;
}

const mapObject = (source, callback) => {
    let result = {};
    Object.keys(source).forEach((prop) => {
        result[prop] = callback(source[prop], prop, source);
    });
    return result;
}

const pickProps = (source, props) => {
    let test = isFunction(props)
        ? props 
        : ((k) => props.indexOf(k) !== -1);
    return filterObject(source, test);
}

const skipProps = (source, props) => {
    let test = isFunction(props) 
        ? ((k, o) => !props(k, o))
        : ((k) => props.indexOf(k) === -1);
    return filterObject(source, test);
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

const combine = (keys, values) => {
    let result = {};
    keys.forEach((key, index) => {
        result[key] = values[index];
    });
    return result;
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

const singleton = (factory) => {
    let instance = undefined;
    return () => {
        if (instance === undefined) {
            instance = factory();
        }
        return instance;
    }
}

const sum = (values) => {
    return reduce(values, (sum, val) => {
        return isNaN(val) ? sum : sum + Number(val);
    }, 0);
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
    return reduce(values, (res, val) => {
        return isNil(val) || res < val ? res : val;
    }, Infinity);
}

const max = (values) => {
    return reduce(values, (res, val) => {
        return isNil(val) || res > val ? res : val;
    }, -Infinity);
}

const count = (values) => {
    if (isArray(values)) {
        return values.length;
    }
    return reduce(values, (res) => (res + 1), 0);
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

const eachToEach = (array, callback) => {
    for (let i = 0; i < array.length - 1; i++) {
        for (let j = i + 1; j < array.length; j++) {
            callback(array[i], array[j], i, j);
        }
    }
}

const reduce = (iterable, reducer, initial = undefined) => {
    let result = initial;
    forEach(iterable, (item) => {
        result = reducer(result, item);
    });
    return result;
}

const group = (iterable, ...args) => {
    return groupReduce(iterable, (items, item) => {
        if (items === undefined) {
            return [item];
        }
        items.push(item);
        return items;
    }, ...args);
}

const groupReduce = (iterable, reducer, ...args) => {
    let groups = [];
    let tree = new Map();
    let keys = Array.from(args);
    let [first] = keys;
    let makeKey = isFunction(first)
        ? first
        : (keys.length === 1 
            ? (item) => item[first]
            : (item) => keys.map((key) => item[key]));
    const mapget = (map, key, init) => {
        if (map.has(key)) {
            return map.get(key);
        }
        let val = init();
        map.set(key, val);
        return val;
    }
    const put = (map, item, keys, i) => {
        let key = keys[i];
        if (i === keys.length - 1) {
            let leaf = mapget(map, key, () => {
                let val = {
                    key: i === 0 ? key : keys,
                    value: undefined,
                };
                groups.push(val);
                return val;
            });
            leaf.value = reducer(leaf.value, item, keys);
        } else {
            let branch = mapget(map, key, () => new Map());
            put(branch, item, keys, i + 1);
        }
    }
    forEach(iterable, (item) => {
        let key = makeKey(item);
        put(tree, item, isArray(key) ? key : [key], 0);
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
    filterObject,
    mapObject,
    pickProps,
    skipProps,
    assign,
    get,
    set,
    combine,
    inject,
    valueOf,
    singleton,
    sum,
    avg,
    min,
    max,
    count,
    forEach,
    filter,
    map,
    intersect,
    difference,
    eachToEach,
    dedupe,
    reduce,
    group,
    groupReduce,
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