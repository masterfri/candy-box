const argsToArray = (...args) => {
    return Array.prototype.slice.call(...args);
}

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
            ? (v) => isNil(v) ? null : (isArray(v) ? v : [])
            : (v) => isArray(v) ? v : [];
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

const onlyProps = (source, props) => {
    let result = {};
    Object.keys(source).forEach((prop) => {
        if (props.indexOf(prop) !== -1) {
            result[prop] = source[prop];
        }
    });
    return result;
}

const withoutProps = (source, props) => {
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

const valueOf = (v) => {
    return isFunction(v) ? v() : v;
}

const forEach = (object, callback) => {
    if (isArray(object)) {
        object.forEach(callback);
    } else {
        Object.keys(object).forEach((key) => {
            callback(object[key], key, object);
        });
    }
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

const objectDiff = (before, after) => {
    let diff = {};
    Object.keys(after).forEach((key) => {
        if (is(after[key], Array)) {
            if (!arraysEqual(before[key], after[key])) {
                diff[key] = before[key];
            }
        } else if (isObject(after[key])) {
            if (!objectsEqual(before[key], after[key])) {
                diff[key] = before[key];
            }
        } else {
            if (before[key] !== after[key]) {
                diff[key] = before[key];
            }
        }
    });
    return diff;
};

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

const abstractMethodError = (m) => {
    throw new Error(`Method "${m}" must be implemented in subclass`);
}

const nop = () => {}

export {
    argsToArray,
    makeMutator,
    getProps,
    getProp,
    onlyProps,
    withoutProps,
    assign,
    get,
    set,
    valueOf,
    forEach,
    isScalar,
    objectsEqual,
    objectDiff,
    promise,
    isObject,
    isFunction,
    isNumber,
    isBool,
    isString,
    isArray,
    isNil,
    is,
    isSubclass,
    safeCall,
    assertType,
    assertIsObject,
    assertIsArray,
    abstractMethodError,
    nop,
};