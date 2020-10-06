import {
    is,
    isObject, 
    isFunction,
    isNumber, 
} from '../helpers';
import {
    Assert,
    isNull,
    assertTrue,
    isLessThan,
    isGreaterThan,
} from './assertions';

const ASC = 'asc';
const DESC = 'desc';

const AND = 'and';
const OR = 'or';
const NOT = 'not';

const makeSubcondition = (condition, type) => {
    if (condition instanceof type) {
        return condition;
    }
    let subcondition = new type();
    if (isFunction(condition)) {
        condition(subcondition);
    } else {
        subcondition.where(condition);
    }
    return subcondition;
}

class Assertion
{
    constructor(prop, operator, argument) {
        this._prop = prop;
        this._operator = operator;
        this._argument = argument;
    }
    
    isValid(object) {
        return assertTrue(this._operator, object[this._prop], this._argument);
    }

    get property() {
        return this._prop;
    }

    get operator() {
        return this._operator;
    }

    get argument() {
        return this._argument;
    }
}

class Condition
{
    constructor(...args) {
        this._wheres = [];
        if (args.length !== 0) {
            this.where(...args);
        }
    }
    
    where(...args) {
        if (args.length === 3) {
            this._wheres.push(new Assertion(args[0], args[1], args[2]));
            return this;
        }
        
        if (args.length === 2) {
            this.where(args[0], Assert.EQ, args[1]);
            return this;
        }
        
        if (args[0] instanceof Condition) {
            this._wheres.push(args[0]);
            return this;
        }
        
        if (args[0] instanceof Array) {
            for (let arg of args[0]) {
                this.where(...arg);
            }
            return this;
        }
         
        if (isFunction(args[0])) {
            args[0](this);
            return this;
        }
        
        if (isObject(args[0])) {
            for (let prop in args[0]) {
                this.where(prop, Assert.EQ, args[0][prop]);
            }
            return this;
        }
        
        this.where(args[0], Assert.NEQ, null);

        return this;
    }
    
    equals(prop, value) {
        return this.where(prop, value);
    }
    
    notEquals(prop, value) {
        return this.where(prop, Assert.NEQ, value);
    }
    
    lessThan(prop, value) {
        return this.where(prop, Assert.LT, value);
    }
    
    lessThanOrEquals(prop, value) {
        return this.where(prop, Assert.LTE, value);
    }
    
    greaterThan(prop, value) {
        return this.where(prop, Assert.GT, value);
    }
    
    greaterThanOrEquals(prop, value) {
        return this.where(prop, Assert.GTE, value);
    }
    
    inArray(prop, value) {
        return this.where(prop, Assert.IN, value);
    }

    notInArray(prop, value) {
        return this.where(prop, Assert.NOT_IN, value);
    }
    
    contains(prop, value) {
        return this.where(prop, Assert.CONTAINS, value);
    }
    
    startsWith(prop, value) {
        return this.where(prop, Assert.STARTS, value);
    }
    
    endsWith(prop, value) {
        return this.where(prop, Assert.ENDS, value);
    }
    
    and(condition) {
        return this.where(makeSubcondition(condition, Condition));
    }
    
    or(condition) {
        return this.where(makeSubcondition(condition, OrCondition));
    }
    
    not(condition) {
        return this.where(makeSubcondition(condition, NotCondition));
    }
    
    has(prop, condition) {
        return this.where(prop, Assert.HAS, makeSubcondition(condition, Condition));
    }

    doesntHave(prop, condition) {
        return this.where(prop, Assert.NOT_HAS, makeSubcondition(condition, Condition));
    }
    
    isValid(object) {
        return this._wheres.every((assertion) => {
            return assertion.isValid(object);
        });
    }
    
    isEmpty() {
        return this._wheres.length === 0;
    }

    get logic() {
        return AND;
    }

    get wheres() {
        return this._wheres;
    }
}

class OrCondition extends Condition
{
    isValid(object) {
        return this._wheres.some((assertion) => {
            return assertion.isValid(object);
        });
    }

    get logic() {
        return OR;
    }
}

class NotCondition extends Condition
{
    isValid(object) {
        return !super.isValid(object);
    }

    get logic() {
        return NOT;
    }
}

class SortOrder 
{
    constructor(prop, dir) {
        this._prop = prop;
        this._dir = dir;
    }
    
    compare(a, b) {
        if (isNull(a) || isNull(b)) {
            return 0;
        }
        if (isNull(a)) {
            return this._dir === DESC ? 1 : -1;
        }
        if (isNull(b)) {
            return this._dir === DESC ? -1 : 1;
        }
        if (isLessThan(a, b)) {
            return this._dir === DESC ? 1 : -1;
        }
        if (isGreaterThan(a, b)) {
            return this._dir === DESC ? -1 : 1;
        }
        return 0;
    }
    
    get prop() {
        return this._prop;
    }
    
    get direction () {
        return this._dir;
    }
}

class Query
{
    constructor(params) {
        this._condition = new Condition();
        this._order = [];
        this._group = [];
        this._limit = false;
        this._start = 0;
        this._scopes = {};
        
        if (isFunction(params)) {
            params(this);
        } else if (isObject(params)) {
            this.where(params);
        }
    }
    
    where(...condition) {
        this._condition.where(...condition);
        return this;
    }
    
    orderBy(prop, direction = undefined) {
        this._order.push(new SortOrder(prop, direction === DESC ? DESC : ASC));
        return this;
    }
    
    ascendingBy(prop) {
        return this.orderBy(prop, ASC);
    }
    
    descendingBy(prop) {
        return this.orderBy(prop, DESC);
    }
    
    groupBy(...args) {
        this._group.push(...args);
        return this;
    }
    
    startFrom(offset) {
        this._start = offset;
        return this;
    }
    
    limitTo(limit) {
        this._limit = limit;
        return this;
    }

    setScope(name, params = true) {
        this._scopes[name] = params;
    }

    unsetScope(name) {
        delete this._scopes[name];
    }
    
    get condition() {
        return this._condition;
    }
    
    get order() {
        return this._order;
    }
    
    get group() {
        return this._group;
    }
    
    get start() {
        return this._start;
    }
    
    get limit() {
        return this._limit;
    }

    get scopes() {
        return this._scopes;
    }
}

class SerializedQuery
{
    constructor(query) {
        if (is(query, Query)) {
            this._data = {};
            if (!query.condition.isEmpty()) {
                this._data.where = this.serializeCondition(query.condition);
            }
            if (query.order.length !== 0) {
                this._data.sort = this.serializeOrder(query.order);
            }
            if (query.group.length !== 0) {
                this._data.group = this.serializeGroup(query.group);
            }
            if (Object.keys(query.scopes).length !== 0) {
                this._data.scopes = this.serializeScopes(query.scopes);
            }
            if (query.start !== 0) {
                this._data.start = query.start;
            }
            if (query.limit !== false) {
                this._data.limit = query.limit;
            }
        } else {
            this._data = query;
        }
    }

    serializeCondition(condition) {
        return condition.wheres.map((where) => {
            if (is(where, Assertion)) {
                return [
                    where.operator,
                    where.property,
                    where.argument,
                ];
            }
            if (is(where, Condition)) {
                return [
                    where.logic,
                    this.serializeCondition(where),
                ];
            }
            throw new TypeError('Illegal assertion type');
        });
    }
    
    serializeOrder(order) {
        return order.map((sort) => [sort.prop, sort.direction]);
    }
    
    serializeGroup(group) {
        return [...group];
    }

    serializeScopes(scopes) {
        return {...scopes};
    }

    unserializeCondition(condition, wheres) {
        wheres.forEach((where) => {
            switch (where[0]) {
                case AND:
                    condition.and((sub) => {
                        this.unserializeCondition(sub, where[1]);
                    });
                    break;
                case OR:
                    condition.or((sub) => {
                        this.unserializeCondition(sub, where[1]);
                    });
                    break;
                case NOT:
                    condition.not((sub) => {
                        this.unserializeCondition(sub, where[1]);
                    });
                    break;
                default:
                    condition.where(where[1], where[0], where[2]);
                    break;
            }
        });
    }

    unserializeOrder(query, order) {
        order.forEach((sort) => {
            query.orderBy(sort[0], sort[1]);
        });
    }

    unserializeGroup(query, group) {
        query.groupBy(...group);
    }

    unserializeScopes(query, scopes) {
        Object.keys(scopes).forEach((name) => {
            query.setScope(name, scopes[name]);
        });
    }

    toObject() {
        return this._data;
    }

    toQuery() {
        let query = new Query();
        if (this._data.where !== undefined) {
            this.unserializeCondition(query.condition, this._data.where);
        }
        if (this._data.sort !== undefined) {
            this.unserializeOrder(query, this._data.sort);
        }
        if (this._data.group !== undefined) {
            this.unserializeGroup(query, this._data.group);
        }
        if (this._data.scopes !== undefined) {
            this.unserializeScopes(query, this._data.scopes);
        }
        if (isNumber(this._data.start)) {
            query.startFrom(this._data.start);
        }
        if (isNumber(this._data.limit)) {
            query.limitTo(this._data.limit);
        }
        return query;
    }
}

const Sort = {
    ASC, 
    DESC,
}

const Logic = {
    AND,
    OR,
    NOT,
}

export default Query;

export {
    SerializedQuery,
    Condition,
    Assertion,
    SortOrder,
    Assert,
    Sort,
    Logic,
};