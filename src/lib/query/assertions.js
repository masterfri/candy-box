import Collection from '../structures/collection';
import {
    isObject, 
    isBool,
    isString,
    isNumber,
} from '../helpers';

const EQ = '=';
const NEQ = '!=';
const LT = '<';
const LTE = '<=';
const GT = '>';
const GTE = '>=';
const IN = 'in';
const NOT_IN = 'notIn';
const CONTAINS = 'contains';
const STARTS = 'starts';
const ENDS = 'ends';
const HAS = 'has';
const NOT_HAS = 'notHas';

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
        return object.some((item) => condition.isValid(item));
    }
    if (object instanceof Array) {
        return object.some((item) => condition.isValid(item));
    }
    if (isObject(object)) {
        return condition.isValid(object);
    }
    return false;
}

const objectNotHas = (object, condition) => {
    if (object instanceof Collection) {
        return object.every((item) => !condition.isValid(item));
    }
    if (object instanceof Array) {
        return object.every((item) => !condition.isValid(item));
    }
    if (isObject(object)) {
        return !condition.isValid(object);
    }
    return false;
}

const assertTrue = (operator, left, right) => {
    switch (operator) {
        case EQ:  
            return isEqual(left, right);
            
        case NEQ:
            return isNotEqual(left, right);
            
        case LT:
            return isLessThan(left, right);
            
        case LTE:
            return isLessThanOrEqual(left, right);
            
        case GT:
            return isGreaterThan(left, right);
            
        case GTE:
            return isGreaterThanOrEqual(left, right);
            
        case IN:
            return inArray(left, right);
        
        case NOT_IN:
            return notInArray(left, right);
            
        case CONTAINS:
            return strContains(left, right);
        
        case STARTS:
            return strStartsWith(left, right);
        
        case ENDS:
            return strEndsWith(left, right);
        
        case HAS:
            return objectHas(left, right);
        
        case NOT_HAS:
            return objectNotHas(left, right);
    }
    return false;
}

const Assert = {
    EQ,
    NEQ,
    LT,
    LTE,
    GT,
    GTE,
    IN,
    NOT_IN,
    CONTAINS,
    STARTS,
    ENDS,
    HAS,
    NOT_HAS,
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
    assertTrue,
    Assert,
};