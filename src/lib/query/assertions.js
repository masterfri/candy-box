import Collection from '../structures/collection.js';
import {
    Assertion,
    Negation,
    Assert } from './query.js';
import {
    get,
    is,
    isObject, 
    isArray,
    isBool,
    isString,
    isNumber,
    isNil } from '../helpers.js';

const isEqual = (a, b) => {
    if (isNil(b)) {
        return isNil(a);
    }
    if (isBool(b)) {
        return Boolean(Number(a)) === b;
    }
    if (isNumber(b)) {
        return Number(a) === b;
    }
    return String(a) === String(b);
}

const isNotEqual = (a, b) => {
    return !isEqual(a, b);
}

const isLessThan = (a, b) => {
    if (isNil(a) || isNil(b)) {
        return false;
    }
    if (isString(b)) {
        return String(a) < b;
    }
    return Number(a) < Number(b);
}

const isLessThanOrEqual = (a, b) => {
    if (isNil(a) || isNil(b)) {
        return false;
    }
    if (isString(b)) {
        return String(a) <= b;
    }
    return Number(a) <= Number(b);
}

const isGreaterThan = (a, b) => {
    if (isNil(a) || isNil(b)) {
        return false;
    }
    if (isString(b)) {
        return String(a) > b;
    }
    return Number(a) > Number(b);
}

const isGreaterThanOrEqual = (a, b) => {
    if (isNil(a) || isNil(b)) {
        return false;
    }
    if (isString(a)) {
        return isString(a) >= b;
    }
    return Number(a) >= Number(b);
}

const inArray = (a, b) => {
    if (isArray(b)) {
        return b.some((item) => isEqual(item, a));
    }
    return false;
}

const notInArray = (a, b) => {
    if (isArray(b)) {
        return b.every((item) => isNotEqual(item, a));
    }
    return false;
}

const strContains = (a, b) => {
    if (isString(a) && isString(b)) {
        return a.indexOf(b) !== -1;
    }
    return false;
}

const strStartsWith = (a, b) => {
    if (isString(a) && isString(b)) {
        return a.substr(0, b.length) === b;
    }
    return false;
}

const strEndsWith = (a, b) => {
    if (isString(a) && isString(b)) {
        return a.substr(-b.length) === b;
    }
    return false;
}

const objectHas = (object, condition) => {
    if (is(object, Collection)) {
        return object.some((item) => testSubcondition(condition, item));
    }
    if (isArray(object)) {
        return object.some((item) => testSubcondition(condition, item));
    }
    if (isObject(object)) {
        return testSubcondition(condition, object);
    }
    return false;
}

const objectNotHas = (object, condition) => {
    if (is(object, Collection)) {
        return object.every((item) => !testSubcondition(condition, item));
    }
    if (isArray(object)) {
        return object.every((item) => !testSubcondition(condition, item));
    }
    if (isObject(object)) {
        return !testSubcondition(condition, object);
    }
    return false;
}

const testAssertion = (operator, left, right) => {
    switch (operator) {
        case Assert.EQ:  
            return isEqual(left, right);
            
        case Assert.NEQ:
            return isNotEqual(left, right);
            
        case Assert.LT:
            return isLessThan(left, right);
            
        case Assert.LTE:
            return isLessThanOrEqual(left, right);
            
        case Assert.GT:
            return isGreaterThan(left, right);
            
        case Assert.GTE:
            return isGreaterThanOrEqual(left, right);
            
        case Assert.IN:
            return inArray(left, right);
        
        case Assert.NOT_IN:
            return notInArray(left, right);
            
        case Assert.CONTAINS:
            return strContains(left, right);
        
        case Assert.STARTS:
            return strStartsWith(left, right);
    }
    return false;
}

const testSubcondition = (thing, input) => {
    if (is(thing, Assertion)) {
        return testAssertion(thing.operator, get(input, thing.property), thing.argument);
    }
    if (is(thing, Negation)) {
        return !testSubcondition(thing.subject, input);
    }
    return testCondition(thing, input);
}

const testCondition = (condition, input) => {
    return condition.isInverted ^ condition.wheres.some((or) => {
        return or.every((and) => testSubcondition(and, input));
    });
}

const compare = (a, b, descOrder = false) => {
    if (isNil(a) || isNil(b)) {
        return 0;
    }
    if (isNil(a)) {
        return descOrder ? 1 : -1;
    }
    if (isNil(b)) {
        return descOrder ? -1 : 1;
    }
    if (isLessThan(a, b)) {
        return descOrder ? 1 : -1;
    }
    if (isGreaterThan(a, b)) {
        return descOrder ? -1 : 1;
    }
    return 0;
}

export {
    isNil,
    isEqual,
    isNotEqual,
    isLessThan,
    isLessThanOrEqual,
    isGreaterThan,
    isGreaterThanOrEqual,
    inArray,
    notInArray,
    strContains,
    strStartsWith,
    strEndsWith,
    objectHas,
    objectNotHas,
    testAssertion,
    testCondition,
    compare,
};