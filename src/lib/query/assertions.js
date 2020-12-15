import Collection from '../structures/collection';
import {
    Assertion,
    Logic,
    Assert,
} from './query';
import {
    is,
    isObject, 
    isBool,
    isString,
    isNumber,
} from '../helpers';

const isNull = (a) => {
    return a === null || a === undefined;
}

const isEqual = (a, b) => {
    if (isNull(b)) {
        return isNull(a);
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
    if (isNull(a) || isNull(b)) {
        return false;
    }
    if (isString(b)) {
        return String(a) < b;
    }
    return Number(a) < Number(b);
}

const isLessThanOrEqual = (a, b) => {
    if (isNull(a) || isNull(b)) {
        return false;
    }
    if (isString(b)) {
        return String(a) <= b;
    }
    return Number(a) <= Number(b);
}

const isGreaterThan = (a, b) => {
    if (isNull(a) || isNull(b)) {
        return false;
    }
    if (isString(b)) {
        return String(a) > b;
    }
    return Number(a) > Number(b);
}

const isGreaterThanOrEqual = (a, b) => {
    if (isNull(a) || isNull(b)) {
        return false;
    }
    if (isString(a)) {
        return isString(a) >= b;
    }
    return Number(a) >= Number(b);
}

const inArray = (a, b) => {
    if (b instanceof Array) {
        return b.some((item) => isEqual(item, a));
    }
    return false;
}

const notInArray = (a, b) => {
    if (b instanceof Array) {
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
    if (object instanceof Collection) {
        return object.some((item) => testCondition(condition, item));
    }
    if (object instanceof Array) {
        return object.some((item) => testCondition(condition, item));
    }
    if (isObject(object)) {
        return testCondition(condition, object);
    }
    return false;
}

const objectNotHas = (object, condition) => {
    if (object instanceof Collection) {
        return object.every((item) => !testCondition(condition, item));
    }
    if (object instanceof Array) {
        return object.every((item) => !testCondition(condition, item));
    }
    if (isObject(object)) {
        return !testCondition(condition, object);
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
        
        case Assert.HAS:
            return objectHas(left, right);
        
        case Assert.NOT_HAS:
            return objectNotHas(left, right);
    }
    return false;
}

const testSubcondition = (thing, input) => {
    if (is(thing, Assertion)) {
        return testAssertion(thing.operator, input[thing.property], thing.argument);
    } else {
        return testCondition(thing, input);
    }
}

const testCondition = (condition, input) => {
    switch (condition.logic) {
        case Logic.AND:
            return condition.wheres.every((item) => testSubcondition(item, input));
        case Logic.OR:
            return condition.wheres.some((item) => testSubcondition(item, input));
        case Logic.NOT:
            return !condition.wheres.every((item) => testSubcondition(item, input));
    }
    return false;
}

const compare = (a, b, descOrder = false) => {
    if (isNull(a) || isNull(b)) {
        return 0;
    }
    if (isNull(a)) {
        return descOrder ? 1 : -1;
    }
    if (isNull(b)) {
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
    isNull,
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
    testAssertion,
    testCondition,
    compare,
};