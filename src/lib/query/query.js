import {
    is,
    isObject, 
    isFunction,
} from '../helpers.js';

const AND = 'and';
const OR = 'or';
const NOT = 'not';

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
const HAS = 'has';
const NOT_HAS = 'notHas';

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
    _wheres = [];

    /**
     * @protected
     * @var {String}
     */
    _logic = AND;

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
        if (args.length === 3) {
            this._wheres.push(new Assertion(args[0], args[1], args[2]));
            return this;
        }
        
        if (args.length === 2) {
            this.where(args[0], EQ, args[1]);
            return this;
        }
        
        if (is(args[0], Condition)) {
            this._wheres.push(args[0]);
            return this;
        }
        
        if (is(args[0], Array)) {
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
                this.where(prop, EQ, args[0][prop]);
            }
            return this;
        }
        
        this.where(args[0], NEQ, null);

        return this;
    }

    /**
     * Set boolean logic for this condition
     * 
     * @param {String} logic 
     * @returns {Condition}
     */
    use(logic) {
        this._logic = logic;
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
        return this.where(prop, value);
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
     * Make nested condition with boolean logic "AND"
     * 
     * @param {any} condition
     * @returns {Condition}
     */
    and(condition) {
        return this.where(this.makeSubcondition(condition));
    }
    
    /**
     * Make nested condition with boolean logic "OR"
     * 
     * @param {any} condition
     * @returns {Condition}
     */
    or(condition) {
        return this.where(this.makeSubcondition(condition, OR));
    }
    
    /**
     * Make nested condition with boolean logic "NOT"
     * 
     * @param {any} condition
     * @returns {Condition}
     */
    not(condition) {
        return this.where(this.makeSubcondition(condition, NOT));
    }
    
    /**
     * Add "has" assertion
     * 
     * @param {String} prop 
     * @param {any} condition 
     * @returns {Condition}
     */
    has(prop, condition) {
        return this.where(prop, HAS, this.makeSubcondition(condition));
    }

    /**
     * Add "does not have" assertion
     * 
     * @param {String} prop 
     * @param {any} condition 
     * @returns {Condition}
     */
    doesntHave(prop, condition) {
        return this.where(prop, NOT_HAS, this.makeSubcondition(condition));
    }
    
    /**
     * Check whether condition is empty
     * 
     * @returns {Boolean}
     */
    isEmpty() {
        return this._wheres.length === 0;
    }

    /**
     * Make a copy of this condition
     * 
     * @returns {Condition}
     */
    copy() {
        let copy = new this.constructor();
        copy._logic = this._logic;
        copy._wheres = this._wheres.map((where) => {
            if (is(where, Condition)) {
                return where.copy();
            }
            return where;
        });
        return copy;
    }

    /**
     * Create subcondition with the given parameters
     * 
     * @param {any} condition 
     * @param {String} logic
     * @returns {Condition}
     */
    makeSubcondition(condition, logic = AND) {
        if (is(condition, Condition)) {
            condition.use(logic);
            return condition;
        }
        let subcondition = new this.constructor();
        subcondition.use(logic);
        if (isFunction(condition)) {
            condition(subcondition);
        } else {
            subcondition.where(condition);
        }
        return subcondition;
    }

    /**
     * Boolean logic
     * 
     * @var {String}
     */
    get logic() {
        return this._logic;
    }

    /**
     * List of assertions
     * 
     * @var {Array}
     */
    get wheres() {
        return this._wheres;
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
     * @param  {...any} condition 
     * @returns {Query}
     * @see Condition
     */
    where(...condition) {
        this._condition.where(...condition);
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
     * @var {Array}
     */
    get order() {
        return this._order;
    }
    
    /**
     * Query group clause
     * 
     * @var {Array}
     */
    get group() {
        return this._group;
    }
    
    /**
     * Results offset
     * 
     * @var {Number}
     */
    get start() {
        return this._start;
    }
    
    /**
     * Results limit
     * 
     * @var {Number|false}
     */
    get limit() {
        return this._limit;
    }
}

const Logic = {
    AND,
    OR,
    NOT,
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
    HAS,
    NOT_HAS,
}

export default Query;

export {
    Condition,
    Assertion,
    SortOrder,
    Logic,
    Assert,
    Sort,
};