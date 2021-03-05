import knex from 'knex';
import {
    is,
    isFunction,
    argsToArray,
    getProp,
    isObject,
} from '../helpers.js';
import {
    Component,
    Mixture,
} from '../mixture.js';

const makePromise = (query) => {
    return new Promise((resolve, reject) => {
        return query.then(resolve).catch(reject);
    });
}

class WhereComponent extends Component
{
    static methods() {
        return {
            where(column, operator, expr) {
                if (isFunction(column)) {
                    this._query.where((query) => {
                        column(new Where(query, this._client));
                    });
                } else {
                    this._query.where(column, operator, expr);
                }
                return this;
            },
            whereRaw(sql, bindings) {
                this._query.whereRaw(sql, bindings);
                return this;
            },
        };
    }
}

class OrderComponent extends Component
{
    static methods() {
        return {
            orderBy(...cols) {
                this._query.orderBy(...cols);
                return this;
            },
            orderByRaw(sql, bindings = []) {
                this._query.orderByRaw(sql, bindings);
                return this;
            },
        };
    }
}

class LimitComponent extends Component
{
    static methods() {
        return {
            limit(value) {
                this._query.limit(value);
                return this;
            }
        };
    }
}

class QueryWrapper extends Mixture
{
    _query;
    _client;
    
    constructor(query, client) {
        super();
        this._query = query;
        this._client = client;
    }

    toSql() {
        return this._query.toSQL().toNative();
    }

    getNativeQuery() {
        return this._query;
    }

    execute() {
        return makePromise(this._query);
    }

    raw(expr, bindings = []) {
        return this._client.raw(expr, bindings);
    }

    _newSubquery(query) {
        return new this.constructor(query, this._client);
    }

    _callMethod(method, ...args) {
        this._query[method](...argsToArray(args).map((arg) => {
            if (isFunction(arg)) {
                return (query) => {
                    arg(this._newSubquery(query));
                };
            }
            if (is(arg, QueryWrapper)) {
                return arg.getNativeQuery();
            }
            return arg;
        }));
        return this;
    }
}

class Where extends QueryWrapper
{
    where(...args) {
        return this._callMethod('where', ...args);
    }

    eq(column, expr) {
        return this._callMethod('where', column, '=', expr);
    }

    neq(column, expr) {
        return this._callMethod('where', column, '!=', expr);
    }

    lt(column, expr) {
        return this._callMethod('where', column, '<', expr);
    }

    lte(column, expr) {
        return this._callMethod('where', column, '<=', expr);
    }

    gt(column, expr) {
        return this._callMethod('where', column, '>', expr);
    }

    gte(column, expr) {
        return this._callMethod('where', column, '>=', expr);
    }

    contains(column, expr) {
        return this._callMethod('where', column, 'like', `%${expr}%`);
    }

    startsWith(column, expr) {
        return this._callMethod('where', column, 'like', `${expr}%`);
    }

    or(...args) {
        return this._callMethod('orWhere', ...args);
    }

    not(...args) {
        return this._callMethod('whereNot', ...args);
    }

    in(column, expr) {
        return this._callMethod('whereIn', column, expr);
    }

    notIn(column, expr) {
        return this._callMethod('whereNotIn', column, expr);
    }

    isNull(column) {
        return this._callMethod('whereNull', column);
    }

    isNotNull(column) {
        return this._callMethod('whereNotNull', column);
    }

    exists(expr) {
        return this._callMethod('whereExists', expr);
    }

    notExists(expr) {
        return this._callMethod('whereNotExists', expr);
    }

    between(column, min, max) {
        return this._callMethod('whereBetween', column, [min, max]);
    }

    notBetween(column, min, max) {
        return this._callMethod('whereNotBetween', column, [min, max]);
    }

    whereRaw(sql, bindings) {
        this._query.whereRaw(sql, bindings);
        return this;
    }
}

class Join extends QueryWrapper
{
    on(...args) {
        return this._callMethod('on', ...args);
    }

    or(...args) {
        return this._callMethod('orOn', ...args);
    }

    eq(...args) {
        return this._callMethod('onVal', ...args);
    }

    in(column, expr) {
        return this._callMethod('onIn', column, expr);
    }

    notIn(column, expr) {
        return this._callMethod('onNotIn', column, expr);
    }

    isNull(column) {
        return this._callMethod('onNull', column);
    }

    isNotNull(column) {
        return this._callMethod('onNotNull', column);
    }

    exists(expr) {
        return this._callMethod('onExists', expr);
    }

    notExists(expr) {
        return this._callMethod('onNotExists', expr);
    }

    between(column, min, max) {
        return this._callMethod('onBetween', column, [min, max]);
    }

    notBetween(column, min, max) {
        return this._callMethod('onNotBetween', column, [min, max]);
    }
}

class Having extends QueryWrapper
{
    having(...args) {
        return this._callMethod('having', ...args);
    }

    eq(column, expr) {
        return this._callMethod('having', column, '=', expr);
    }

    neq(column, expr) {
        return this._callMethod('having', column, '!=', expr);
    }

    lt(column, expr) {
        return this._callMethod('having', column, '<', expr);
    }

    lte(column, expr) {
        return this._callMethod('having', column, '<=', expr);
    }

    gt(column, expr) {
        return this._callMethod('having', column, '>', expr);
    }

    gte(column, expr) {
        return this._callMethod('having', column, '>=', expr);
    }

    contains(column, expr) {
        return this._callMethod('having', column, 'like', `%${expr}%`);
    }

    startsWith(column, expr) {
        return this._callMethod('having', column, 'like', `${expr}%`);
    }

    or(...args) {
        return this._callMethod('orHaving', ...args);
    }

    not(...args) {
        this._query._not(true);
        return this._callMethod('having', ...args);
    }

    in(column, expr) {
        return this._callMethod('havingIn', column, expr);
    }

    notIn(column, expr) {
        return this._callMethod('havingNotIn', column, expr);
    }

    isNull(column) {
        return this._callMethod('havingNull', column);
    }

    isNotNull(column) {
        return this._callMethod('havingNotNull', column);
    }

    exists(expr) {
        return this._callMethod('havingExists', expr);
    }

    notExists(expr) {
        return this._callMethod('havingNotExists', expr);
    }

    between(column, min, max) {
        return this._callMethod('havingBetween', column, [min, max]);
    }

    notBetween(column, min, max) {
        return this._callMethod('havingNotBetween', column, [min, max]);
    }

    havingRaw(sql, bindings) {
        this._query.havingRaw(sql, bindings);
        return this;
    }
}

class Select extends QueryWrapper
{
    components() {
        return [
            WhereComponent,
            OrderComponent,
            LimitComponent,
        ];
    }

    from(table) {
        this._query.from(table);
        return this;
    }

    select(...cols) {
        this._query.column(...cols);
        return this;
    }

    distinct(...cols) {
        this._query.distinct(...cols);
        return this;
    }

    selectRaw(expr, bindings = []) {
        this._query.column(this.raw(expr, bindings));
        return this;
    }

    innerJoin(...args) {
        return this._join('innerJoin', ...args);
    }

    leftJoin(...args) {
        return this._join('leftJoin', ...args);
    }

    leftOuterJoin(...args) {
        return this._join('leftOuterJoin', ...args);
    }

    rightJoin(...args) {
        return this._join('rightJoin', ...args);
    }

    rightOuterJoin(...args) {
        return this._join('rightOuterJoin', ...args);
    }

    fullOuterJoin(...args) {
        return this._join('fullOuterJoin', ...args);
    }

    crossJoin(...args) {
        return this._join('crossJoin', ...args);
    }

    having(column, operator, expr) {
        if (isFunction(column)) {
            this._query.having((query) => {
                column(new Having(query, this._client));
            });
        } else {
            this._query.having(column, operator, expr);
        }
        return this;
    }

    havingRaw(sql, bindings) {
        this._query.havingRaw(sql, bindings);
        return this;
    }

    groupBy(...cols) {
        this._query.groupBy(...cols);
        return this;
    }

    groupByRaw(sql, bindings = []) {
        this._query.groupByRaw(sql, bindings);
        return this;
    }

    offset(value) {
        this._query.offset(value);
        return this;
    }

    union(queries, wrap = true) {
        return this._set('union', queries, wrap);
    }

    unionAll(queries, wrap = true) {
        return this._set('unionAll', queries, wrap);
    }

    intersect(queries, wrap = true) {
        return this._set('intersect', queries, wrap);
    }

    take(limit = null, offset = null) {
        if (limit !== null) {
            this.limit(limit);
        }
        if (offset !== null) {
            this.offset(offset);
        }
        return this._fetchRows();
    }

    takeRow() {
        this.limit(1);
        return this._fetchRow();
    }

    takeValue(column = null) {
        this.limit(1);
        return this._fetchScalar(column);
    }

    takeColumn(column = null, limit = null, offset = null) {
        if (limit !== null) {
            this.limit(limit);
        }
        if (offset !== null) {
            this.offset(offset);
        }
        return this._fetchColumn(column);
    }

    count(column = '*', distinct = false) {
        return this._stat(distinct ? 'countDistinct' : 'count', column);
    }

    min(column) {
        return this._stat('min', column);
    }

    max(column) {
        return this._stat('max', column);
    }

    sum(column, distinct = false) {
        return this._stat(distinct ? 'sumDistinct' : 'sum', column);
    }

    avg(column, distinct = false) {
        return this._stat(distinct ? 'avgDistinct' : 'avg', column);
    }

    _fetchRows() {
        return this.execute();
    }

    _fetchRow() {
        return this._fetchRows()
            .then((rows) => rows.length === 0 ? null : rows[0]);
    }

    _fetchScalar(column = null) {
        return this._fetchRow()
            .then((row) => row === null ? null : getProp(row, column));
    }

    _fetchColumn(column = null) {
        return this._fetchRows()
            .then((rows) => rows.map((row) => getProp(row, column)));
    }

    _stat(method, column) {
        if (isObject(column)) {
            this._query[method](column);
            return this._fetchRows();
        } else {
            this._query[method]({_result: column});
            return this._fetchScalar();
        }
    }

    _set(method, queries, wrap) {
        if (!is(queries, Array)) {
            queries = [queries];
        }
        this._query[method](
            queries.map((callback) => {
                return (query) => {
                    callback(new Select(query, this._client));
                }
            }),
            wrap
        );
        return this;
    }

    _join(method, table, left, right) {
        if (isFunction(left)) {
            this._query[method](table, (query) => {
                left(new Join(query, this._client));
            });
        } else {
            this._query[method](table, left, right);
        }
        return this;
    }
}

class Insert extends QueryWrapper
{
    values(data) {
        this._query.insert(data);
        return this;
    }

    returning(cols) {
        this._query.returning(cols);
        return this;
    }
}

class Update extends QueryWrapper
{
    components() {
        return [
            WhereComponent,
            OrderComponent,
            LimitComponent,
        ];
    }

    set(data) {
        this._query.update(data);
        return this;
    }
}

class Delete extends QueryWrapper
{
    components() {
        return [
            WhereComponent,
            OrderComponent,
            LimitComponent,
        ];
    }
}

class SqlClient
{
    constructor(config) {
        this._client = knex(config);
    }

    execute(sql, bindings = []) {
        return makePromise(this._client.raw(sql, bindings));
    }

    select(cols = '*') {
        let query = new Select(this._client.select(), this._client);
        if (cols !== '*') {
            query.select(cols);
        }
        return query;
    }

    insert(table) {
        return new Insert(this._client(table), this._client);
    }

    update(table) {
        return new Update(this._client(table), this._client);
    }

    delete(table) {
        return new Delete(this._client(table), this._client);
    }
}

const SqlSymbol = Symbol('Sql');

export default SqlClient;

export {
    SqlSymbol,
};