import {
    argsToArray,
    is,
    isArray,
    isObject,
    isString,
    isFunction,
    forEach,
    abstractMethodError } from '../helpers.js';

const FRAG_COLS = 'col';
const FRAG_TABLE = 'table';
const FRAG_WHERE = 'where';
const FRAG_JOIN = 'join';
const FRAG_GROUP = 'group';
const FRAG_HAVING = 'having';
const FRAG_ORDER = 'order';

/**
 * Sql fragment
 * 
 * @class
 */
class SqlFragment
{
    /**
     * @protected
     * @var {Array}
     */
    _parts;

    /**
     * @protected
     * @var {Array}
     */
    _bindings;

    /**
     * @param {String} [sql=null] 
     * @param {Array} [bindings=[]] 
     */
    constructor(sql = null, bindings = []) {
        this._parts = sql === null ? [] : [sql];
        this._bindings = bindings;
    }

    /**
     * Add sql to this fragment
     * 
     * @param {String} sql
     * @param {Array} [bindings=[]] 
     * @returns {SqlFragment}
     */
    add(sql, bindings = []) {
        this._parts.push(sql);
        if (bindings.length !== 0) {
            this._bindings.push(...bindings);
        }
        return this;
    }
    
    /**
     * Add sql bingings to this fragment
     * 
     * @param {Array} [bindings=[]] 
     * @returns {SqlFragment}
     */
    addBingings(bindings) {
        this._bindings.push(...bindings);
        return this;
    }

    /**
     * Merge two fragments
     * 
     * @param {SqlFragment} fragment
     * @returns {SqlFragment}
     */
    merge(fragment) {
        return this.add(fragment.sql, fragment.bindings);
    }

    /**
     * Join all parts into single one
     * 
     * @param {String} glue 
     * @returns {String}
     */
    join(glue) {
        return this._parts.join(glue);
    }

    /**
     * SQL fragment text
     * 
     * @var {String}
     */
    get sql() {
        return this.join(' ');
    }

    /**
     * Fragment value bindings
     * 
     * @var {Array}
     */
    get bindings() {
        return this._bindings;
    }

    /**
     * Get count of parts
     * 
     * @var {Number}
     */
    get size() {
        return this._parts.length;
    }
}

class Condition
{
    /**
     * @protected
     * @var {SqlFragment}
     */
    _fragment;

    /**
     * @protected
     * @var {QueryBuilder}
     */
    _builder;

    /**
     * @protected
     * @var {String}
     */
    _logic;

    /**
     * @protected
     * @var {Boolean}
     */
    _negation = false;

    /**
     * @param {SqlFragment} fragment
     */
    constructor(builder, fragment) {
        this._builder = builder;
        this._fragment = fragment;
        this._and();
    }

    /**
     * Add expression
     * 
     * @param  {...any} args
     * @returns {Condition}
     */
    where(...args) {
        if (args.length === 3) {
            let [col, oper, value] = args;
            this._appendExpr(col, `${oper} ?`, [value]);
        } else if (args.length === 2) {
            let [col, value] = args;
            this._appendExpr(col, '= ?', [value]);
        } else if (isArray(args[0])) {
            let [conds] = args;
            this._enclose((builder) => {
                for (let cond of conds) {
                    builder.where(...cond);
                }
            });
        } else if (isFunction(args[0])) {
            this._enclose(args[0]);
        } else if (isObject(args[0])) {
            let [conds] = args;
            this._enclose((builder) => {
                for (let prop in conds) {
                    builder.eq(prop, conds[prop]);
                }
            });
        }
        return this;
    }

    /**
     * Add columns comparison
     * 
     * @param  {...any} args
     * @returns {Condition}
     */
    whereColumn(...args) {
        if (args.length === 3) {
            let [col1, oper, col2] = args;
            this._append(`${this.quote(col1)} ${oper} ${this.quote(col2)}`);
        } else {
            let [col1, col2] = args;
            this._append(`${this.quote(col1)} = ${this.quote(col2)}`);
        }
        return this;
    }

    /**
     * Add columns comparison
     * 
     * @param {String} column
     * @param {String} path
     * @param {...any} args
     * @returns {Condition}
     */
    whereJson(column, path, ...args) {
        if (args.length === 1) {
            let [value] = args;
            return this.eq(this.json(column, path), JSON.stringify(value));
        } else {
            let [operator, value] = args;
            return this.where(this.json(column, path), operator, JSON.stringify(value));
        }
    }

    /**
     * Add equality expression
     * 
     * @param {String} column 
     * @param {any} expr
     * @returns {Condition} 
     */
    eq(column, expr) {
        return this.where(column, '=', expr);
    }

    /**
     * Add non-equality expression
     * 
     * @param {String} column 
     * @param {any} expr
     * @returns {Condition} 
     */
    neq(column, expr) {
        return this.where(column, '!=', expr);
    }

    /**
     * Add less than expression
     * 
     * @param {String} column 
     * @param {any} expr
     * @returns {Condition} 
     */
    lt(column, expr) {
        return this.where(column, '<', expr);
    }

    /**
     * Add less than or equals to expression
     * 
     * @param {String} column 
     * @param {any} expr
     * @returns {Condition} 
     */
    lte(column, expr) {
        return this.where(column, '<=', expr);
    }

    /**
     * Add greater than expression
     * 
     * @param {String} column 
     * @param {any} expr
     * @returns {Condition} 
     */
    gt(column, expr) {
        return this.where(column, '>', expr);
    }

    /**
     * Add greater than or equals to expression
     * 
     * @param {String} column 
     * @param {any} expr
     * @returns {Condition} 
     */
    gte(column, expr) {
        return this.where(column, '>=', expr);
    }

    /**
     * Add string matches expression
     * 
     * @param {String} column 
     * @param {String} substring
     * @returns {Condition} 
     */
    contains(column, substring) {
        return this.where(column, 'like', `%${substring}%`);
    }

    /**
     * Add string starts with expression
     * 
     * @param {String} column 
     * @param {String} substring
     * @returns {Condition} 
     */
    startsWith(column, substring) {
        return this.where(column, 'like', `${substring}%`);
    }

    /**
     * Add expression using boolean AND
     * 
     * @param  {...any} args
     * @returns {Condition}
     */
    and(...args) {
        this._and();
        if (args.length !== 0) {
            this.where(...args);
        }
        return this;
    }

    /**
     * Add expression using boolean OR
     * 
     * @param  {...any} args
     * @returns {Condition}
     */
    or(...args) {
        this._or();
        if (args.length !== 0) {
            this.where(...args);
        }
        return this;
    }

    /**
     * Add expression using boolean NOT
     * 
     * @param  {...any} args
     * @returns {Condition}
     */
    not(...args) {
        this._not();
        if (args.length !== 0) {
            this.where(...args);
        }
        return this;
    }

    /**
     * Add IN expression
     * 
     * @param {String} column 
     * @param {Array} set
     * @returns {Condition}
     */
    in(column, set) {
        let params = set.map(el => '?').join(', ');
        this._appendExpr(column, `in(${params})`, set);
        return this;
    }

    /**
     * Add NOT IN expression
     * 
     * @param {String} column 
     * @param {Array} set
     * @returns {Condition}
     */
    notIn(column, set) {
        this._not();
        return this.in(column, set);
    }

    /**
     * Add IS NULL expression
     * 
     * @param {String} column 
     * @returns {Condition}
     */
    isNull(column) {
        this._appendExpr(column, 'is null');
        return this;
    }

    /**
     * Add IS NOT NULL expression
     * 
     * @param {String} column 
     * @returns {Condition}
     */
    isNotNull(column) {
        this._appendExpr(column, 'is not null');
        return this;
    }

    /**
     * Add BETWEEN expression
     * 
     * @param {String} column 
     * @param {any} mix
     * @param {any} max
     * @returns {Condition}
     */
    between(column, min, max) {
        this._appendExpr(column, 'between ? and ?', [min, max]);
        return this;
    }

    /**
     * Add NOT BETWEEN expression
     * 
     * @param {String} column 
     * @param {any} mix
     * @param {any} max
     * @returns {Condition}
     */
    notBetween(column, min, max) {
        this._not();
        return this.between(column, min, max);
    }

    /**
     * Add EXISTS expression
     * 
     * @param {QueryBuilder|Function} nested 
     * @returns {Condition}
     */
    exists(nested) {
        if (isFunction(nested)) {
            let builder = new this._builder.constructor();
            nested(builder);
            this.exists(builder);
        } else {
            let frag = nested.select();
            this._append(`exists(${frag.sql})`, frag.bindings);
        }
        return this;
    }

    /**
     * Add NOT EXISTS expression
     * 
     * @param {QueryBuilder|Function} nested 
     * @returns {Condition}
     */
    notExists(nested) {
        this._not();
        return this.exists(nested);
    }

    /**
     * Add raw expression
     * 
     * @param {String} sql
     * @param {Array} bindings
     * @returns {Condition}
     */
    raw(sql, bindings) {
        this._append(sql, bindings);
        return this;
    }

    /**
     * Create json value expression
     * 
     * @param {String} column 
     * @param {String} path 
     * @returns {SqlFragment}
     */
    json(column, path) {
        return this._builder.json(column, path);
    }

    /**
     * Quote identifier
     * 
     * @param {String} name 
     * @returns {String}
     */
    quote(name) {
        return this._builder.quote(name);
    }

    /**
     * Append sql to fragment
     * 
     * @param {String} sql 
     * @param {Array} bindings 
     */
    _append(sql, bindings) {
        this._chain();
        this._fragment.add(sql, bindings);
    }

    /**
     * Append expression to fragment
     * 
     * @param {String|SqlFragment} column 
     * @param {String} sql 
     * @param {Array} bindings 
     */
    _appendExpr(column, sql, bindings) {
        if (is(column, SqlFragment)) {
            this._append(`${column.sql} ${sql}`, [...column.bindings, ...bindings]);
        } else {
            this._append(`${this.quote(column)} ${sql}`, bindings);
        }
    }

    /**
     * Enclose nested sql into barckets
     * 
     * @param {Function} callback 
     */
    _enclose(callback) {
        let frag = new SqlFragment();
        let nested = new this.constructor(this._builder, frag);
        callback(nested);
        if (frag.size !== 0) {
            this._chain();
            this._fragment.add(`(${frag.sql})`, frag.bindings);
        }
    }

    /**
     * Add link between fragments
     */
    _chain() {
        if (this._fragment.size !== 0) {
            this._fragment.add(this._logic);
        }
        if (this._negation) {
            this._fragment.add('not');
        }
        this._and();
        this._negation = false;
    }

    /**
     * Set logic operator to AND
     */
    _and() {
        this._logic = 'and';
    }

    /**
     * Set logic operator to OR
     */
    _or() {
        this._logic = 'or';
    }

    /**
     * Set logic operator to NOT
     */
    _not() {
        this._negation = true;
    }
}

class Join extends Condition
{
    /**
     * Add filter condition
     * 
     * @param  {...any} args
     * @returns {Join}
     */
    where(...args) {
        let condition = this._newCondition();
        if (isFunction(args[0])) {
            let [callback] = args;
            callback(condition);
        } else {
            condition.where(...args);
        }
        return this;
    }

    /**
     * Add join condition
     * 
     * @param  {...any} args
     * @returns {Join}
     */
    on(...args) {
        if (args.length === 2 || args.length === 3) {
            this.whereColumn(...args);
        } else if (isArray(args[0])) {
            let [conds] = args;
            this._enclose((builder) => {
                for (let cond of conds) {
                    builder.whereColumn(...cond);
                }
            });
        } else if (isFunction(args[0])) {
            this._enclose(args[0]);
        } else if (isObject(args[0])) {
            let [conds] = args;
            this._enclose((builder) => {
                for (let prop in conds) {
                    builder.whereColumn(prop, '=', conds[prop]);
                }
            });
        }
        return this;
    }

    /**
     * Add equality expression
     * 
     * @param {String} column1 
     * @param {String} column2
     * @returns {Join} 
     */
    eq(column1, column2) {
        return this.whereColumn(column1, '=', column2);
    }

    /**
     * Add non-equality expression
     * 
     * @param {String} column1 
     * @param {String} column2
     * @returns {Join} 
     */
    neq(column1, column2) {
        return this.whereColumn(column1, '!=', column2);
    }

    /**
     * Add less than expression
     * 
     * @param {String} column1 
     * @param {String} column2
     * @returns {Join} 
     */
    lt(column1, column2) {
        return this.whereColumn(column1, '<', column2);
    }

    /**
     * Add less than or equals to expression
     * 
     * @param {String} column1 
     * @param {String} column2
     * @returns {Join} 
     */
    lte(column1, column2) {
        return this.whereColumn(column1, '<=', column2);
    }

    /**
     * Add greater than expression
     * 
     * @param {String} column1 
     * @param {String} column2
     * @returns {Join} 
     */
    gt(column1, column2) {
        return this.whereColumn(column1, '>', column2);
    }

    /**
     * Add greater than or equals to expression
     * 
     * @param {String} column1 
     * @param {String} column2
     * @returns {Join} 
     */
    gte(column1, column2) {
        return this.whereColumn(column1, '>=', column2);
    }

    /**
     * Add expression using boolean AND
     * 
     * @param  {...any} args
     * @returns {Join}
     */
    and(...args) {
        this._and();
        if (args.length !== 0) {
            this.on(...args);
        }
        return this;
    }

    /**
     * Add expression using boolean OR
     * 
     * @param  {...any} args
     * @returns {Join}
     */
    or(...args) {
        this._or();
        if (args.length !== 0) {
            this.on(...args);
        }
        return this;
    }

    /**
     * Add expression using boolean NOT
     * 
     * @param  {...any} args
     * @returns {Join}
     */
    not(...args) {
        this._not();
        if (args.length !== 0) {
            this.on(...args);
        }
        return this;
    }

    /**
     * Create new condition instance
     * 
     * @returns {Condition}
     */
    _newCondition() {
        return new Condition(this._builder, this._fragment);
    }
}

class QueryBuilder
{
    /**
     * @var {Object}
     */
    _fragments = {}

    /**
     * Add columns to select
     * 
     * @param {...any} cols 
     * @returns {QueryBuilder}
     */
    column(...cols) {
        let frag = this._fragment(FRAG_COLS);
        argsToArray(cols).forEach((col) => {
            if (isString(col)) {
                frag.add(this.quote(col));
            } else if (is(col, SqlFragment)) {
                frag.merge(col);
            } else if (isArray(col)) {
                this.column(...col);
            } else if (isObject(col)) {
                forEach(col, (column, key) => {
                    this._appendAlias(frag, column, key);
                });
            }
        });
        return this;
    }

    /**
     * Add sql fragment to select
     * 
     * @param {String} sql
     * @param {Array} bindings
     * @returns {QueryBuilder}
     */
    columnRaw(sql, bindings = []) {
        this._fragment(FRAG_COLS).add(sql, bindings);
        return this;
    }

    /**
     * Add table to query
     * 
     * @param {...any} tables 
     * @returns {QueryBuilder}
     */
    table(...tables) {
        let frag = this._fragment(FRAG_TABLE);
        argsToArray(tables).forEach((table) => {
            if (isString(table)) {
                frag.add(this.quote(table));
            } else if (isArray(table)) {
                this.table(...table);
            } else if (isObject(table)) {
                forEach(table, (table, key) => {
                    this._appendAlias(frag, table, key);
                });
            }
        });
        return this;
    }

    /**
     * Add condition to WHERE statement
     * 
     * @param  {...any} args
     * @returns {QueryBuilder}
     */
    where(...args) {
        let condition = this._newCondition(this._fragment(FRAG_WHERE));
        if (isFunction(args[0])) {
            let [callback] = args;
            callback(condition);
        } else {
            condition.where(...args);
        }
        return this;
    }

    /**
     * Add raw sql to WHERE statement
     * 
     * @param  {String} sql
     * @param {Array} bindings
     * @returns {QueryBuilder}
     */
    whereRaw(sql, bindings) {
        let condition = this._newCondition(this._fragment(FRAG_WHERE));
        condition.raw(sql, bindings);
        return this;
    }

    /**
     * Add join statement
     * 
     * @param  {...any} args
     * @returns {QueryBuilder}
     */
    join(...args) {
        this._join('inner join', ...args);
        return this;
    }

    /**
     * Add left join statement
     * 
     * @param  {...any} args
     * @returns {QueryBuilder}
     */
    leftJoin(...args) {
        this._join('left join', ...args);
        return this;
    }

    /**
     * Add right join statement
     * 
     * @param  {...any} args
     * @returns {QueryBuilder}
     */
    rightJoin(...args) {
        this._join('right join', ...args);
        return this;
    }

    /**
     * Add condition to HAVING statement
     * 
     * @param  {...any} args
     * @returns {QueryBuilder}
     */
    having(...args) {
        let condition = this._newCondition(this._fragment(FRAG_HAVING));
        if (isFunction(args[0])) {
            let [callback] = args;
            callback(condition);
        } else {
            condition.where(...args);
        }
        return this;
    }

    /**
     * Add raw sql to HAVING statement
     * 
     * @param  {String} sql
     * @param {Array} bindings
     * @returns {QueryBuilder}
     */
    havingRaw(sql, bindings) {
        let condition = this._newCondition(this._fragment(FRAG_HAVING));
        condition.raw(sql, bindings);
        return this;
    }

    /**
     * Add ORDER BY statement
     * 
     * @param {String} col 
     * @param {String} [dir=''] 
     * @returns {QueryBuilder}
     */
    orderBy(col, dir = '') {
        let frag = this._fragment(FRAG_ORDER);
        if (dir.toLowerCase() === 'desc') {
            frag.add(`${this.quote(col)} desc`);
        } else {
            frag.add(`${this.quote(col)} asc`);
        }
        return this;
    }

    /**
     * Add raw ORDER BY statement
     * 
     * @param {String} col 
     * @param {String} [dir='']
     * @param {Array} [bindings=[]]
     * @returns {QueryBuilder}
     */
    orderByRaw(sql, dir = '', bindings = []) {
        let frag = this._fragment(FRAG_ORDER);
        if (dir.toLowerCase() === 'desc') {
            frag.add(`${sql} desc`, bindings);
        } else {
            frag.add(`${sql} asc`, bindings);
        }
        return this;
    }

    /**
     * Add ORDER BY ascending statement
     * 
     * @param {...String} cols 
     * @returns {QueryBuilder}
     */
    ascendingBy(...cols) {
        argsToArray(cols).forEach((col) => {
            this.orderBy(col);
        });
        return this;
    }

    /**
     * Add ORDER BY descending statement
     * 
     * @param {...String} cols
     * @returns {QueryBuilder}
     */
    descendingBy(...cols) {
        argsToArray(cols).forEach((col) => {
            this.orderBy(col, 'desc');
        });
        return this;
    }

    /**
     * Add GROUP BY statement
     * 
     * @param {...String} cols 
     * @returns {QueryBuilder}
     */
    groupBy(...cols) {
        let frag = this._fragment(FRAG_GROUP);
        argsToArray(cols).forEach((col) => {
            frag.add(this.quote(col));
        });
        return this;
    }

    /**
     * Add raw GROUP BY statement
     * 
     * @param {String} sql
     * @param {Array} [bindings=[]]
     * @returns {QueryBuilder}
     */
    groupByRaw(sql, bindings = []) {
        let frag = this._fragment(FRAG_GROUP);
        frag.add(sql, bindings);
        return this;
    }

    /**
     * Create raw sql fragment
     * 
     * @param {String} sql 
     * @param {Array} bindings 
     */
    raw(sql, bindings = []) {
        return new SqlFragment(sql, bindings);
    }

    /**
     * Create json value expression
     * 
     * @param {String} column 
     * @param {String} path 
     * @returns {SqlFragment}
     */
    json() {
        abstractMethodError('json');
    }

    /**
     * Produce select query
     * 
     * @param {Number} [limit=false] 
     * @param {Number} [offset=0]
     * @returns {SqlFragment}
     */
    select(limit = false, offset = 0) {
        let result = new SqlFragment();
        this._withFragment(FRAG_COLS, (frag) => {
            result.add(`select ${frag.join(', ')}`, frag.bindings);
        }, () => {
            result.add('select *');
        });
        this._withFragment(FRAG_TABLE, (frag) => {
            result.add(`from ${frag.join(', ')}`);
        });
        this._withFragment(FRAG_JOIN, (frag) => {
            result.add(frag.sql, frag.bindings);
        });
        this._withFragment(FRAG_WHERE, (frag) => {
            result.add(`where ${frag.sql}`, frag.bindings);
        });
        this._withFragment(FRAG_GROUP, (frag) => {
            result.add(`group by ${frag.join(', ')}`, frag.bindings);
        });
        this._withFragment(FRAG_HAVING, (frag) => {
            result.add(`having ${frag.sql}`, frag.bindings);
        });
        this._withFragment(FRAG_ORDER, (frag) => {
            result.add(`order by ${frag.join(', ')}`, frag.bindings);
        });
        if (limit !== false) {
            result.add(`limit ${limit}`);
            if (offset > 0) {
                result.add(`offset ${offset}`);
            }
        }
        return result;
    }

    /**
     * Produce insert statement
     * 
     * @param {Array|Object} data
     * @returns {SqlFragment}
     */
    insert(data) {
        if (isArray(data)) {
            let result = new SqlFragment();
            let [cols, rows, bindings] = this._mapColsRows(data);
            result.add('insert into');
            this._withFragment(FRAG_TABLE, (frag) => {
                result.add(frag.join(', '));
            });
            result.add(`(${cols.join(', ')})`);
            result.add(`values ${rows.join(', ')}`, bindings);
            return result;
        } else {
            return this.insert([data]);
        }
    }

    /**
     * Produce insert statement
     * 
     * @param {Object} data
     * @param {Number} [limit=false]
     * @returns {SqlFragment}
     */
    update(data, limit = false) {
        let result = new SqlFragment();
        result.add('update');
        this._withFragment(FRAG_TABLE, (frag) => {
            result.add(frag.join(', '));
        });
        let assign = this._makeAssignments(data);
        result.add(`set ${assign.join(', ')}`, assign.bindings);
        this._withFragment(FRAG_WHERE, (frag) => {
            result.add(`where ${frag.sql}`, frag.bindings);
        });
        this._withFragment(FRAG_ORDER, (frag) => {
            result.add(`order by ${frag.join(', ')}`, frag.bindings);
        });
        if (limit !== false) {
            result.add(`limit ${limit}`);
        }
        return result;
    }

    /**
     * Produce delete statement
     * 
     * @param {Number} [limit=false] 
     * @returns {SqlFragment}
     */
    delete(limit = false) {
        let result = new SqlFragment();
        result.add('delete from');
        this._withFragment(FRAG_TABLE, (frag) => {
            result.add(frag.join(', '));
        });
        this._withFragment(FRAG_WHERE, (frag) => {
            result.add(`where ${frag.sql}`, frag.bindings);
        });
        this._withFragment(FRAG_ORDER, (frag) => {
            result.add(`order by ${frag.join(', ')}`, frag.bindings);
        });
        if (limit !== false) {
            result.add(`limit ${limit}`);
        }
        return result;
    }

    /**
     * Remove sql fragment by its key
     * 
     * @param {string} key 
     * @returns {QueryBuilder}
     */
    removeFragment(key) {
        delete this._fragments[key];
        return this;
    }

    /**
     * Quote identifier
     * 
     * @param {String} name
     * @returns {String} 
     */
    quote(name) {
        return name.split('.')
            .map(c => '"' + c + '"')
            .join('.');
    }

    /**
     * Get sql fragment by its key
     * 
     * @protected
     * @param {string} key 
     * @returns {SqlFragment}
     */
    _fragment(key) {
        if (this._fragments[key] === undefined) {
            this._fragments[key] = new SqlFragment();
        }
        return this._fragments[key];
    }

    /**
     * Use particular fragment
     * 
     * @protected
     * @param {String} key 
     * @param {Function} callback 
     * @param {Function} [fallback=null] 
     */
    _withFragment(key, callback, fallback = null) {
        let fragment = this._fragments[key];
        if (fragment !== undefined && fragment.size !== 0) {
            callback(fragment);
        } else if (fallback !== null) {
            fallback();
        }
    }

    /**
     * Append expression alias
     * 
     * @protected
     * @param {SqlFragment} frag
     * @param {String} expr 
     * @param {String} alias 
     * @returns {String}
     */
    _appendAlias(frag, expr, alias) {
        if (is(expr, SqlFragment)) {
            frag.add(`${expr.sql} as ${this.quote(alias)}`, expr.bindings);
        } else {
            frag.add(`${this.quote(expr)} as ${this.quote(alias)}`);
        }
    }

    /**
     * Create condition instance
     * 
     * @protected
     * @param {SqlFragment} fragment
     * @returns {Condition}
     */
    _newCondition(fragment) {
        return new Condition(this, fragment);
    }

    /**
     * Create join instance
     * 
     * @protected
     * @param {SqlFragment} fragment
     * @returns {Condition}
     */
    _newJoin(fragment) {
        return new Join(this, fragment);
    }

    /**
     * Add join statement
     * 
     * @protected
     * @param {String} type 
     * @param  {...any} args 
     */
    _join(type, ...args) {
        let frag = this._fragment(FRAG_JOIN);
        let on = new SqlFragment();
        frag.add(type);
        let [table] = args;
        if (isObject(table)) {
            forEach(table, (table, key) => {
                this._appendAlias(frag, table, key);
            });
        } else {
            frag.add(this.quote(table));
        }
        let join = this._newJoin(on);
        if (isFunction(args[1])) {
            let [,callback] = args;
            callback(join);
        } else if (args.length === 3) {
            let [,leftkey, rightkey] = args;
            join.on(leftkey, '=', rightkey);
        } else {
            let [,leftkey, op, rightkey] = args;
            join.on(leftkey, op, rightkey);
        }
        if (on.size !== 0) {
            frag.add(`on ${on.sql}`, on.bindings);
        }
    }

    /**
     * Map data to columns 
     * 
     * @param {Array} data 
     * @returns {Array}
     */
    _mapColsRows(data) {
        let cols = [];
        let rows = [];
        let bindings = [];
        data.forEach((row) => {
            Object.keys(row).forEach((col) => {
                if (cols.indexOf(col) === -1) {
                    cols.push(col);
                }
            });
        });
        data.forEach((row) => {
            let values = [];
            cols.forEach((col) => {
                let value = row[col];
                if (value === undefined) {
                    values.push('null');
                } else if (is(value, SqlFragment)) {
                    values.push(value.sql);
                    bindings.push(...value.bindings);
                } else {
                    values.push('?');
                    bindings.push(value);
                }
            });
            rows.push(`(${values.join(', ')})`);
        });
        return [cols.map((col) => this.quote(col)), rows, bindings];
    }

    /**
     * Make assignment list
     * 
     * @param {Object} data 
     * @returns {SqlFragment}
     */
    _makeAssignments(data) {
        let result = new SqlFragment();
        forEach(data, (value, col) => {
            if (is(value, SqlFragment)) {
                result.add(`${this.quote(col)} = ${value.sql}`, value.bindings);
            } else {
                result.add(`${this.quote(col)} = ?`, [value]);
            }
        });
        return result;
    }
}

export default QueryBuilder;

export {
    SqlFragment,
    Condition,
    Join,
};
