import Query, {
    Assertion,
    Condition,
    Logic,
} from '../query/query.js';
import { 
    is,
    isNumber,
} from '../helpers.js';

/**
 * Query for repositories
 * 
 * @class
 */
class RepositoryQuery extends Query 
{
    /**
     * @protected
     * @var {Object}
     */
    _scopes = {};

    /**
     * Set query scopes
     * 
     * @param {String} name 
     * @param {any} params 
     */
    setScope(name, params = true) {
        this._scopes[name] = params;
    }

    /**
     * Unset query scope
     * 
     * @param {String} name 
     */
    unsetScope(name) {
        delete this._scopes[name];
    }

    /**
     * Query scopes
     * 
     * @readonly
     * @var {Object}
     */
    get scopes() {
        return this._scopes;
    }
}

/**
 * Class that perform (de-)serialization of queries
 * 
 * @class
 */
class SerializedRepositoryQuery
{
    /**
     * @param {Object|RepositoryQuery} query 
     */
    constructor(query) {
        if (is(query, RepositoryQuery)) {
            this._data = {};
            if (!query.condition.isEmpty()) {
                this._data.where = this._serializeCondition(query.condition);
            }
            if (query.order.length !== 0) {
                this._data.sort = this._serializeOrder(query.order);
            }
            if (query.group.length !== 0) {
                this._data.group = this._serializeGroup(query.group);
            }
            if (Object.keys(query.scopes).length !== 0) {
                this._data.scopes = this._serializeScopes(query.scopes);
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
     * Serialize query condition
     * 
     * @protected
     * @param {Condition} condition 
     * @returns {Array}
     */
    _serializeCondition(condition) {
        return [
            condition.logic,
            condition.wheres.map((where) => {
                if (is(where, Assertion)) {
                    return [
                        where.operator,
                        where.property,
                        where.argument,
                    ];
                }
                if (is(where, Condition)) {
                    return this._serializeCondition(where);
                }
                throw new TypeError('Illegal assertion type');
            }),
        ];
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
     * Serialize query scopes
     * 
     * @protected
     * @param {Object} scopes
     * @returns {Object}
     */
    _serializeScopes(scopes) {
        return {...scopes};
    }

    /**
     * Unserialize query condition
     * 
     * @protected
     * @param {Condition} condition 
     * @param {Array} where 
     */
    _unserializeCondition(condition, where) {
        condition.use(where[0]);
        this._unserializeSubcondition(condition, where[1]);
    }

    /**
     * Unserialize query sub condition
     * 
     * @protected
     * @param {Condition} condition 
     * @param {Array} wheres 
     */
    _unserializeSubcondition(condition, wheres) {
        wheres.forEach((where) => {
            switch (where[0]) {
                case Logic.AND:
                case Logic.OR:
                case Logic.NOT:
                    condition.makeSubcondition((sub) => {
                        condition.where(sub);
                        this._unserializeSubcondition(sub, where[1]);
                    }, where[0]);
                    break;
                default:
                    condition.where(where[1], where[0], where[2]);
                    break;
            }
        });
    }

    /**
     * Unserialize sort order
     * 
     * @protected
     * @param {RepositoryQuery} query 
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
     * @param {RepositoryQuery} query 
     * @param {Array} group 
     */
    _unserializeGroup(query, group) {
        query.groupBy(...group);
    }

    /**
     * Unserialize query scopes
     * 
     * @protected
     * @param {RepositoryQuery} query 
     * @param {Object} scopes
     */
    _unserializeScopes(query, scopes) {
        Object.keys(scopes).forEach((name) => {
            query.setScope(name, scopes[name]);
        });
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
     * @returns {RepositoryQuery}
     */
    toQuery() {
        let query = new RepositoryQuery();
        if (this._data.where !== undefined) {
            this._unserializeCondition(query.condition, this._data.where);
        }
        if (this._data.sort !== undefined) {
            this._unserializeOrder(query, this._data.sort);
        }
        if (this._data.group !== undefined) {
            this._unserializeGroup(query, this._data.group);
        }
        if (this._data.scopes !== undefined) {
            this._unserializeScopes(query, this._data.scopes);
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

export default RepositoryQuery;

export {
    SerializedRepositoryQuery,
}