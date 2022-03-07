import AbstractRepository from './base.js';
import App from '../app.js';
import { SqlClientSymbol } from '../sql/base-client.js';
import { 
    Assertion,
    Negation,
    Condition,
    Assert } from '../query/query.js';
import { 
    is,
    isFunction,
    forEach } from '../helpers.js';

class SqlRepository extends AbstractRepository
{
    /**
     * @param {any} type 
     * @param {String}
     * @param {AbstractSqlClient} client 
     */
    constructor(type, table, client = null) {
        super(type);
        this._table = table;
        this._client = client !== null ? client : App.make(SqlClientSymbol);
    }

    /**
     * @override
     * @inheritdoc
     */
    _getInternal(key) {
        let sql = this._client.newQuery()
            .table(this._table)
            .where(this._keyName, '=', key)
            .select(1);
        return this._client.fetchRow(sql);
    }

    /**
     * @override
     * @inheritdoc
     */
    _searchInternal(query) {
        let sql = this._toSqlBuilder(query)
            .select(query.limit, query.start);
        return this._client.fetch(sql);
    }

    /**
     * @override
     * @inheritdoc
     */
    _storeInternal(key, data) {
        if (key === null) {
            return this._performInsert(data);
        }
        return this._performUpdate(key, data);
    }

    /**
     * Perform SQL insert
     * 
     * @param {Object} data
     * @returns {Promise}
     */
    _performInsert(data) {
        let sql = this._client.newQuery()
            .table(this._table)
            .insert(this._toSqlInput(data));
        return this._client.insert(sql)
            .then((insertId) => {
                data[this._keyName] = insertId;
                return data;
            });
    }

    /**
     * Perform SQL update
     * 
     * @param {Number} key
     * @param {Object} data
     * @returns {Promise}
     */
    _performUpdate(key, data) {
        let sql = this._client.newQuery()
            .table(this._table)
            .where(this._keyName, '=', key)
            .update(this._toSqlInput(data), 1);
        return this._client.update(sql)
            .then(() => {
                return data;
            });
    }

    /**
     * @override
     * @inheritdoc
     */
    _deleteInternal(key) {
        let sql = this._client.newQuery()
            .table(this._table)
            .where(this._keyName, '=', key)
            .delete(1);
        return this._client.delete(sql)
            .then((deleted) => {
                return deleted !== 0;
            });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _existsInternal(query) {
        let sql = this._toSqlBuilder(query, true, true)
            .column(this._keyName)
            .select(1);
        return this._client.fetch(sql)
            .then((results) => {
                return results.length !== 0;
            });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _countInternal(query) {
        return this._aggregate(query, 'count(*)', 'count()');
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _sumInternal(attribute, query) {
        return this._aggregate(query, (builder) => `sum(${builder.quote(attribute)})`, 'sum()');
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _avgInternal(attribute, query) {
        return this._aggregate(query, (builder) => `avg(${builder.quote(attribute)})`, 'avg()');
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _minInternal(attribute, query) {
        return this._aggregate(query, (builder) => `min(${builder.quote(attribute)})`, 'min()');
    }
    
    /**
     * @override
     * @inheritdoc
     */
    _maxInternal(attribute, query) {
        return this._aggregate(query, (builder) => `max(${builder.quote(attribute)})`, 'max()');
    }

    /**
     * Convert data to SQL input
     * 
     * @param {Object} data
     * @returns {Object}
     */
    _toSqlInput(data) {
        let result = {};
        forEach(data, (val, key) => {
            result[key] = this._client.toSqlValue(val);
        });
        return result;
    }

    /**
     * Convert query to SQL builder
     * 
     * @param {Query} query 
     * @param {Boolean} [skipOrder=false]
     * @param {Boolean} [skipGroup=false]
     * @returns {QueryBuilder}
     */
    _toSqlBuilder(query, skipOrder = false, skipGroup = false) {
        let builder = this._client.newQuery();
        builder.table(this._table);
        if (!query.condition.isEmpty) {
            builder.where((where) => {
                this._buildCondition(query.condition, where);
            });
        }
        if (skipOrder === false && query.order.length !== 0) {
            query.order.forEach((sort) => {
                builder.orderBy(sort.prop, sort.direction);
            });
        }
        if (skipGroup === false && query.group.length !== 0) {
            builder.groupBy(...query.group);
        }
        return builder;
    }

    /**
     * Build where statement
     * 
     * @param {Condition} condition 
     * @param {Condition} where 
     */
    _buildCondition(condition, where) {
        condition.wheres.forEach((or) => {
            where.or();
            or.forEach((and) => {
                this._buildAssertion(and, where);
            });
        });
    }

    /**
     * Build assertion
     * 
     * @param {Condition|Assertion|Negation} assertion 
     * @param {Condition} where 
     */
    _buildAssertion(assertion, where) {
        if (is(assertion, Condition)) {
            where.where((where) => {
                this._buildCondition(assertion, where);
            });
        } else if (is(assertion, Negation)) {
            where.not();
            this._buildAssertion(assertion.subject, where);
        } else {
            let {property, operator, argument} = assertion;
            let pathStart = property.indexOf('.');
            if (pathStart !== -1) {
                let column = property.slice(0, pathStart);
                let path = property.slice(pathStart + 1);
                property = where.json(column, path);
            }
            this._buildExpression(where, operator, property, argument);
        }
    }

    /**
     * Add expression to query
     * 
     * @param {Condition} where 
     * @param {String} operator 
     * @param {String} prop
     * @param {any} val
     * @returns {Condition}
     */
    _buildExpression(where, operator, prop, val) {
        switch (operator) {
            case Assert.EQ:
                return val === null
                    ? where.isNull(prop)
                    : where.eq(prop, this._client.toSqlValue(val));
            case Assert.NEQ:
                return val === null
                    ? where.isNotNull(prop)
                    : where.neq(prop, this._client.toSqlValue(val));
            case Assert.LT: 
                return where.lt(prop, this._client.toSqlValue(val));
            case Assert.LTE: 
                return where.lte(prop, this._client.toSqlValue(val));
            case Assert.GT: 
                return where.gt(prop, this._client.toSqlValue(val));
            case Assert.GTE: 
                return where.gte(prop, this._client.toSqlValue(val));
            case Assert.IN: 
                return where.in(prop, val.map((v) => this._client.toSqlValue(v)));
            case Assert.NOT_IN: 
                return where.notIn(prop, val.map((v) => this._client.toSqlValue(v)));
            case Assert.CONTAINS:
                return where.contains(prop, this._client.toSqlValue(val));
            case Assert.STARTS: 
                return where.startsWith(prop, this._client.toSqlValue(val));
        }
        throw new Error(`Invalid assertion operator: ${operator}`);
    }

    /**
     * Run aggregation query
     * 
     * @param {Query} query 
     * @param {String} select
     * @param {String} alias
     * @returns {Promise}
     */
    _aggregate(query, select, alias) {
        let builder = this._toSqlBuilder(query);
        let {group} = query;
        let sel = isFunction(select) ? select(builder) : select;
        let numerize = (v) => isNaN(v) ? v : Number(v);
        if (group.length === 0) {
            builder.columnRaw(builder.alias(sel, alias));
            return this._client
                .fetchValue(builder.select())
                .then((result) => numerize(result));
        }
        builder.column(...group);
        builder.columnRaw(builder.alias(sel, alias));
        return this._client.fetch(builder.select(query.limit, query.start))
            .then((rows) => {
                return rows.map((row) => {
                    let result = Object.assign({}, row);
                    result[alias] = numerize(result[alias]);
                    return result;
                });
            });
    }
}

export default SqlRepository;