import AbstractRepository from './base.js';
import App from '../app.js';
import {
    SqlClientSymbol,
} from '../sql/base-client.js';
import { 
    Assertion,
    Negation,
    Condition,
    Assert,
} from '../query/query.js';
import { 
    is,
    isFunction,
} from '../helpers.js';

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
    get(key) {
        let sql = this._client.newQuery()
            .table(this._table)
            .where(this._keyName, '=', key)
            .select(1);
        return this._client.fetchRow(sql)
            .then((result) => {
                if (result !== null) {
                    return this._hydrateModel(result);
                }
                throw this._notExistsError(key);
            });
    }

    /**
     * @override
     * @inheritdoc
     */
    search(query) {
        let normQuery = this.normalizeQuery(query);
        let sql = this._consumeQuery(normQuery)
            .select(normQuery.limit, normQuery.start);
        return this._client.fetch(sql)
            .then((results) => {
                return this._hydrateCollection(results);
            });
    }

    /**
     * @override
     * @inheritdoc
     */
    store(object) {
        if (!object.hasKey()) {
            let sql = this._client.newQuery()
                .table(this._table)
                .insert(this._consumeModel(object));
            return this._client.insert(sql)
                .then((insertId) => {
                    object.setKey(insertId);
                    return object;
                });
        }
        let sql = this._client.newQuery()
            .table(this._table)
            .where(this._keyName, '=', object.getKey())
            .update(this._consumeModel(object), 1);
        return this._client.update(sql)
            .then(() => {
                return object;
            });
    }

    /**
     * @override
     * @inheritdoc
     */
    delete(key) {
        let sql = this._client.newQuery()
            .table(this._table)
            .where(this._keyName, '=', key)
            .delete(1);
        return this._client.delete(sql)
            .then((deleted) => {
                if (deleted === 0) {
                    throw this._notExistsError(key);
                }
                return true;
            });
    }
    
    /**
     * @override
     * @inheritdoc
     */
    exists(query) {
        let normQuery = this.normalizeQuery(query);
        let sql = this._consumeQuery(normQuery, true, true)
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
    count(query = null) {
        return this._aggregate('count(*)', query || {});
    }
    
    /**
     * @override
     * @inheritdoc
     */
    sum(attribute, query = null) {
        return this._aggregate((builder) => `sum(${builder.quote(attribute)})`, query);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    avg(attribute, query = null) {
        return this._aggregate((builder) => `avg(${builder.quote(attribute)})`, query);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    min(attribute, query = null) {
        return this._aggregate((builder) => `min(${builder.quote(attribute)})`, query);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    max(attribute, query = null) {
        return this._aggregate((builder) => `max(${builder.quote(attribute)})`, query);
    }

    /**
     * Convert query to SQL
     * 
     * @param {Query} query 
     * @param {Boolean} [skipOrder=false]
     * @param {Boolean} [skipGroup=false]
     * @returns {QueryBuilder}
     */
    _consumeQuery(query, skipOrder = false, skipGroup = false) {
        let builder = this._client.newQuery();
        builder.table(this._table);
        if (!query.condition.isEmpty) {
            builder.where((where) => {
                this._buildCondition(query.condition, where);
            });
        }
        if (!skipOrder && query.order.length !== 0) {
            query.order.forEach((sort) => {
                builder.orderBy(sort.prop, sort.direction);
            });
        }
        if (!skipGroup && query.group.length !== 0) {
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
                argument = JSON.stringify(argument);
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
            case Assert.EQ: return where.eq(prop, val);
            case Assert.NEQ: return where.neq(prop, val);
            case Assert.LT: return where.lt(prop, val);
            case Assert.LTE: return where.lte(prop, val);
            case Assert.GT: return where.gt(prop, val);
            case Assert.GTE: return where.gte(prop, val);
            case Assert.IN: return where.in(prop, val);
            case Assert.NOT_IN: return where.notIn(prop, val);
            case Assert.CONTAINS: return where.contains(prop, val);
            case Assert.STARTS: return where.startsWith(prop, val);
        }
        throw new Error(`Invalid assertion operator: ${operator}`);
    }

    /**
     * Run aggregation query
     * 
     * @param {String} select
     * @param {Query} query 
     * @returns {Promise}
     */
    _aggregate(select, query) {
        let normQuery = this.normalizeQuery(query);
        let builder = this._consumeQuery(normQuery, true, true);
        let sql = builder.columnRaw(isFunction(select) ? select(builder) : select)
            .select();
        return this._client.fetchValue(sql);
    }
}

export default SqlRepository;