const argsToArray = (...args) => {
    return Array.prototype.slice.call(...args);
}

const makeMutator = (type) => {
    if (type === Number) {
        return (v) => isNaN(v) ? 0 : Number(v);
    }
    
    if (type === String) {
        return (v) => String(v);
    }
    
    if (type === Boolean) {
        return (v) => Boolean(Number(v));
    }
    
    if (type === Object) {
        return (v) => isObject(v) ? v : {};
    }
    
    if (type === Array) {
        return (v) => (v instanceof Array) ? v : [];
    }
    
    if (isFunction(type)) {
        return (v) => (v instanceof type) ? v : new type(v);
    }
    
    return (v) => v;
}

const onlyProps = (source, props) => {
    let result = {};
    
    for (let prop in source) {
        if (props.indexOf(prop) !== -1) {
            result[prop] = source[prop];
        }
    }
    
    return result;
}

const getProps = (source, props) => {
    let result = {};
    
    for (let prop of props) {
        result[prop] = source[prop];
    }
    
    return result;
}

const assign = (key, val, target = {}) => {
    target[key] = val;
    return target;
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

const isObject = (o) => {
    return typeof(o) === 'object';
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

export {
    argsToArray,
    makeMutator,
    getProps,
    onlyProps,
    assign,
    isScalar,
    objectsEqual,
    isObject,
    isFunction,
    isNumber,
    isBool,
    isString,
    is,
    isSubclass,
    safeCall,
    assertType,
    assertIsObject,
    assertIsArray,
};