import {
    is,
    isObject, 
    isFunction,
    isArray,
    isNumber } from '../helpers.js';

const ASC = 'asc';
const DESC = 'desc';

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

const IS = 'is';
const IS_NOT = 'isNot';

/**
 * Condition assertion
 * 
 * @class
 */
class Assertion
{
    /**
     * @protected
     * @var {String}
     */
    _prop;

    /**
     * @protected
     * @var {String}
     */
    _operator;

    /**
     * @protected
     * @var {any}
     */
    _argument;

    /**
     * @param {String} prop 
     * @param {String} operator 
     * @param {any} argument 
     */
    constructor(prop, operator, argument) {
        this._prop = prop;
        this._operator = operator;
        this._argument = argument;
    }

    /**
     * Make a copy of this assertion
     * 
     * @return Assertion
     */
    clone() {
        return new this.constructor(this._prop, this._operator, this._argument);
    }

    /**
     * Get object property name
     * 
     * @var {String}
     */
    get property() {
        return this._prop;
    }

    /**
     * Get operator
     * 
     * @var {String}
     */
    get operator() {
        return this._operator;
    }

    /**
     * Get assertion argument
     * 
     * @var {any}
     */
    get argument() {
        return this._argument;
    }
}

class Negation
{
    /**
     * @protected
     * @var {Assertion|Condition|Negation}
     */
    _subject;

    /**
     * @param {Assertion|Condition|Negation} subject
     */
    constructor(subject) {
        this._subject = subject;
    }

    /**
     * Make a copy of this negation
     * 
     * @return Negation
     */
    clone() {
        return new this.constructor(this._subject.clone());
    }

    /**
     * Get assertion 
     * 
     * @var {Assertion|Condition|Negation}
     */
    get subject() {
        return this._subject;
    }
}

/**
 * Query condition
 * 
 * @class
 */
class Condition
{
    /**
     * @protected
     * @var {Array}
     */
    _wheres = [[]];

    /**
     * @param  {...any} args 
     */
    constructor(...args) {
        if (args.length !== 0) {
            this.where(...args);
        }
    }
    
    /**
     * Add assertion to condition
     * 
     * @param  {...any} args
     * @returns {Condition}
     * @example
     * let condition = new Condition();
     * condition.where('foo', Assert.EQ, 'bar');
     * // which is equivalent to
     * condition.where('foo', 'bar');
     * 
     * condition.where('foo'); 
     * // which is equivalent to 
     * condition.where('foo', Assert.NEQ, null);
     * 
     * // nested condition
     * condition.where(othercondition); 
     * 
     * condition.where({foo: 'bar', foo2: 'bar2'});
     * // which is equivalent to 
     * condition.where('foo', Assert.EQ, 'bar');
     * condition.where('foo2', Assert.EQ, 'bar2');
     */
    where(...args) {
        this._pushAssertion(this._makeAssertion(...args));
        return this;
    }
    
    /**
     * Add equality assertion. This is an equivalent to where(prop, Assert.EQ, value)
     * 
     * @param {String} prop 
     * @param {any} value 
     * @returns {Condition}
     */
    eq(prop, value) {
        return this.where(prop, EQ, value);
    }
    
    /**
     * Add non-equality assertion. This is an equivalent to where(prop, Assert.NEQ, value)
     * 
     * @param {String} prop 
     * @param {any} value 
     * @returns {Condition}
     */
    neq(prop, value) {
        return this.where(prop, NEQ, value);
    }
    
    /**
     * Add "less than" assertion. This is an equivalent to where(prop, Assert.LT, value)
     * 
     * @param {String} prop 
     * @param {any} value 
     * @returns {Condition}
     */
    lt(prop, value) {
        return this.where(prop, LT, value);
    }
    
    /**
     * Add "less than or equals" assertion. This is an equivalent to where(prop, Assert.LTE, value)
     * 
     * @param {String} prop 
     * @param {any} value 
     * @returns {Condition}
     */
    lte(prop, value) {
        return this.where(prop, LTE, value);
    }
    
    /**
     * Add "greater than" assertion. This is an equivalent to where(prop, Assert.GT, value)
     * 
     * @param {String} prop 
     * @param {any} value 
     * @returns {Condition}
     */
    gt(prop, value) {
        return this.where(prop, GT, value);
    }
    
    /**
     * Add "greater than or equals" assertion. This is an equivalent to where(prop, Assert.GTE, value)
     * 
     * @param {String} prop 
     * @param {any} value 
     * @returns {Condition}
     */
    gte(prop, value) {
        return this.where(prop, GTE, value);
    }
    
    /**
     * Add inclusive assertion. This is an equivalent to where(prop, Assert.IN, value)
     * 
     * @param {String} prop 
     * @param {Array} value 
     * @returns {Condition}
     */
    in(prop, value) {
        return this.where(prop, IN, value);
    }

    /**
     * Add exclusive assertion. This is an equivalent to where(prop, Assert.NOT_IN, value)
     * 
     * @param {String} prop 
     * @param {Array} value 
     * @returns {Condition}
     */
    notIn(prop, value) {
        return this.where(prop, NOT_IN, value);
    }
    
    /**
     * Add "contains" assertion. This is an equivalent to where(prop, Assert.CONTAINS, value)
     * 
     * @param {String} prop 
     * @param {String} value 
     * @returns {Condition}
     */
    contains(prop, value) {
        return this.where(prop, CONTAINS, value);
    }
    
    /**
     * Add "starts with" assertion. This is an equivalent to where(prop, Assert.STARTS, value)
     * 
     * @param {String} prop 
     * @param {String} value 
     * @returns {Condition}
     */
    startsWith(prop, value) {
        return this.where(prop, STARTS, value);
    }
    
    /**
     * Add assertion to condition using boolean AND. Alias for where
     * 
     * @param {...any} args 
     * @returns {Condition}
     */
    and(...args) {
        this._pushAssertion(this._makeAssertion(...args));
        return this;
    }
    
    /**
     * Add assertion to condition using boolean OR
     * 
     * @param {...any} args
     * @returns {Condition}
     */
    or(...args) {
        this._addOrCase();
        if (args.length !== 0) {
            this._pushAssertion(this._makeAssertion(...args));
        }
        return this;
    }
    
    /**
     * Add assertion to condition using boolean NOT
     * 
     * @param {...any} args
     * @returns {Condition}
     */
    not(...args) {
        let assertion = this._makeAssertion(...args);
        this._pushAssertion(new Negation(assertion));
        return this;
    }
    
    /**
     * Make a copy of this condition
     * 
     * @returns {Condition}
     */
    clone() {
        let copy = new this.constructor();
        this._wheres.forEach((or) => {
            copy.or();
            or.forEach((assertion) => {
                copy.and(assertion.clone());
            });
        });
        return copy;
    }

    /**
     * Make an assertion based on the given arguments
     * 
     * @protected
     * @param {any} prop
     * @param {String} op
     * @param {any} expr
     * @returns {Assertion|Condition|Negation}
     */
    _makeAssertion(prop, op, expr) {
        if (is(prop, Condition) || is(prop, Assertion) || is(prop, Negation)) {
            return prop;
        }
        
        if (isArray(prop)) {
            let nested = new this.constructor();
            for (let args of prop) {
                nested.where(...args);
            }
            return nested;
        }
         
        if (isFunction(prop)) {
            let nested = new this.constructor();
            prop(nested);
            return nested;
        }
        
        if (isObject(prop)) {
            let nested = new this.constructor();
            for (let key in prop) {
                nested.where(key, EQ, prop[key]);
            }
            return nested;
        }

        if (expr !== undefined) {
            return new Assertion(prop, op, expr);
        }
        
        if (op !== undefined) {
            return new Assertion(prop, EQ, op);
        }
        
        return new Assertion(prop, NEQ, null);
    }

    /**
     * Push assertion to the last OR case
     * 
     * @protected
     * @param {Assertion|Condition|Negation} assertion 
     */
    _pushAssertion(assertion) {
        this._lastOr().push(assertion);
    }

    /**
     * Append OR case if necessary
     * 
     * @protected
     */
    _addOrCase() {
        if (this._lastOr().length !== 0) {
            this._wheres.push([]);
        }
    }

    /**
     * Get last OR case
     */
    _lastOr() {
        return this._wheres[this._wheres.length - 1];
    }

    /**
     * List of assertions
     * 
     * @var {Array}
     */
    get wheres() {
        return this._wheres;
    }

    /**
     * Determines whether condition is empty
     * 
     * @var {Boolean}
     */
    get isEmpty() {
        return this._wheres[0].length === 0;
    }
}

/**
 * Class that represents sorting order
 * 
 * @class
 */
class SortOrder 
{
    /**
     * @protected
     * @var {String}
     */
    _prop;
    
    /**
     * @protected
     * @var {String}
     */
    _dir;

    /**
     * @param {String} prop 
     * @param {String} dir 
     */
    constructor(prop, dir) {
        this._prop = prop;
        this._dir = dir;
    }
    
    /**
     * Property name sorting is going against
     * 
     * @var {String}
     */
    get prop() {
        return this._prop;
    }
    
    /**
     * Sorting direction
     * 
     * @var {String}
     */
    get direction() {
        return this._dir;
    }

    /**
     * This property tells where sort is descending
     * 
     * @returns {Boolean}
     */
    get isDescending() {
        return this._dir === DESC;
    }

    /**
     * This property tells where sort is ascending
     * 
     * @returns {Boolean}
     */
    get isAscending() {
        return this._dir !== DESC;
    }
}

/**
 * Search query
 * 
 * @class
 */
class Query
{
    /**
     * @protected
     * @var {Condition}
     */
    _condition = this.newCondition();

    /**
     * @protected
     * @var {Array}
     */
    _order = [];

    /**
     * @protected
     * @var {Array}
     */
    _group = [];

    /**
     * @protected
     * @var {Number|false}
     */
    _limit = false;

    /**
     * @protected
     * @var {Number}
     */
    _start = 0;

    /**
     * Make a new condition
     */
    newCondition() {
        return new Condition();
    }
    
    /**
     * Add where clause to query
     * 
     * @param  {...any} args 
     * @returns {Query}
     * @see Condition
     */
    where(...args) {
        if (args.length === 1) {
            let [expr] = args;

            if (is(expr, Condition) || is(expr, Assertion)) {
                this._condition.where(expr);
                return this;
            }
            
            if (isArray(expr)) {
                for (let args of expr) {
                    this._condition.where(...args);
                }
                return this;
            }
             
            if (isFunction(expr)) {
                expr(this._condition);
                return this;
            }
            
            if (isObject(expr)) {
                for (let key in expr) {
                    this._condition.where(key, EQ, expr[key]);
                }
                return this;
            }
        }

        this._condition.where(...args);
        return this;
    }

    /**
     * Add sort order to query
     * 
     * @param {String} prop 
     * @param {String} [direction=Sort.ASC] 
     * @returns {Query}
     */
    orderBy(prop, direction = ASC) {
        this._order.push(new SortOrder(prop, direction === DESC ? DESC : ASC));
        return this;
    }
    
    /**
     * Add ascending sort order to query
     * 
     * @param {String} prop 
     * @returns {Query}
     */
    ascendingBy(prop) {
        return this.orderBy(prop, ASC);
    }
    
    /**
     * Add descending sort order to query
     * 
     * @param {String} prop 
     * @returns {Query}
     */
    descendingBy(prop) {
        return this.orderBy(prop, DESC);
    }
    
    /**
     * Add group clause to query
     * 
     * @param  {...String} args 
     * @returns {Query}
     */
    groupBy(...args) {
        this._group.push(...args);
        return this;
    }
    
    /**
     * Set results offset
     * 
     * @param {Number} offset 
     * @returns {Query}
     */
    startFrom(offset) {
        this._start = offset;
        return this;
    }
    
    /**
     * Set results limit
     * 
     * @param {Number} limit 
     * @returns {Query}
     */
    limitTo(limit) {
        this._limit = limit;
        return this;
    }

    /**
     * Make a copy of this query
     * 
     * @returns {Query}
     */
    clone() {
        let copy = new this.constructor();
        this._condition.wheres.forEach((or) => {
            copy.condition.or();
            or.forEach((and) => {
                copy.condition.where(and.clone());
            });
        });
        this._order.forEach((order) => {
            copy.orderBy(order.prop, order.direction);
        });
        copy.groupBy(...this._group);
        copy.limitTo(this._limit);
        copy.startFrom(this._start);
        return copy;
    }
    
    /**
     * Query condition
     * 
     * @var {Condition}
     */
    get condition() {
        return this._condition;
    }
    
    /**
     * Query sort order
     * 
     * @readonly
     * @var {Array}
     */
    get order() {
        return this._order;
    }
    
    /**
     * Query group clause
     * 
     * @readonly
     * @var {Array}
     */
    get group() {
        return this._group;
    }
    
    /**
     * Results offset
     * 
     * @readonly
     * @var {Number}
     */
    get start() {
        return this._start;
    }
    
    /**
     * Results limit
     * 
     * @readonly
     * @var {Number|false}
     */
    get limit() {
        return this._limit;
    }
}

/**
 * Class that perform (de-)serialization of queries
 * 
 * @class
 */
class SerializedQuery
{
    /**
     * @param {Object|Query} query 
     */
    constructor(query) {
        if (is(query, Query)) {
            this._data = {};
            if (!query.condition.isEmpty) {
                this._data.where = this._serializeCondition(query.condition);
            }
            if (query.order.length !== 0) {
                this._data.sort = this._serializeOrder(query.order);
            }
            if (query.group.length !== 0) {
                this._data.group = this._serializeGroup(query.group);
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

    /**
     * Get serialized query data
     * 
     * @returns {Object}
     */
    toObject() {
        return this._data;
    }

    /**
     * Restore query from serialized data
     * 
     * @returns {Query}
     */
    toQuery() {
        let query = new Query();
        if (this._data.where !== undefined) {
            this._data.where[1].forEach((or) => {
                query.condition.or();
                or.forEach((and) => {
                    query.condition.where(this._unserializeCondition(and));
                });
            });
        }
        if (this._data.sort !== undefined) {
            this._unserializeOrder(query, this._data.sort);
        }
        if (this._data.group !== undefined) {
            this._unserializeGroup(query, this._data.group);
        }
        if (isNumber(this._data.start)) {
            query.startFrom(this._data.start);
        }
        if (isNumber(this._data.limit)) {
            query.limitTo(this._data.limit);
        }
        return query;
    }

    /**
     * Serialize condition
     * 
     * @protected
     * @param {Assertion|Condition|Negation} assertion
     * @returns {Array}
     */
    _serializeCondition(assertion) {
        if (is(assertion, Assertion)) {
            return [
                assertion.operator,
                assertion.property,
                assertion.argument,
            ];
        }
        if (is(assertion, Negation)) {
            return [IS_NOT, this._serializeCondition(assertion.subject)];
        }
        if (is(assertion, Condition)) {
            return [IS, assertion.wheres.map((or) => {
                return or.map((and) => this._serializeCondition(and));
            })];
        }
        throw new TypeError('Illegal assertion type');
    }
    
    /**
     * Serialize sort order
     * 
     * @protected
     * @param {Array} order
     * @returns {Array}
     */
    _serializeOrder(order) {
        return order.map((sort) => [sort.prop, sort.direction]);
    }
    
    /**
     * Serialize group clause
     * 
     * @protected
     * @param {Array} group
     * @returns {Array}
     */
    _serializeGroup(group) {
        return [...group];
    }

    /**
     * Unserialize condition
     * 
     * @protected
     * @param {Array} params 
     * @returns {Assertion|Condition|Negation}
     */
    _unserializeCondition(params) {
        switch (params[0]) {
            case IS:
                let nested = new Condition();
                params[1].forEach((or) => {
                    nested.or();
                    or.forEach((and) => {
                        nested.where(this._unserializeCondition(and));
                    });
                });
                return nested;
            case IS_NOT:
                return new Negation(this._unserializeCondition(params[1]));
            default:
                return new Assertion(params[1], params[0], params[2]);
        }
    }

    /**
     * Unserialize sort order
     * 
     * @protected
     * @param {Query} query 
     * @param {Array} order 
     */
    _unserializeOrder(query, order) {
        order.forEach((sort) => {
            query.orderBy(sort[0], sort[1]);
        });
    }

    /**
     * Unserialize group clause
     * 
     * @protected
     * @param {Query} query 
     * @param {Array} group 
     */
    _unserializeGroup(query, group) {
        query.groupBy(...group);
    }
}

const Sort = {
    ASC, 
    DESC,
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
}

export default Query;

export {
    Condition,
    Assertion,
    Negation,
    SortOrder,
    Assert,
    Sort,
    SerializedQuery,
};