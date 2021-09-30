import { Mixture } from '../mixture.js';
import {
    is,
    getProp, 
    isObject,
    isNil} from '../helpers.js';
import { abstractMethodError } from '../helpers.js';
import { SqlFragment } from './base-query-builder.js';
import App from '../app.js';

const toMysqlDate = (d) => {
    return (new Date(d.getTime() - d.getTimezoneOffset() * 60000))
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
}

/**
 * Base sql client class
 * 
 * @abstract
 * @class
 * @augments Mixture
 */
class AbstractSqlClient extends Mixture
{
    /**
     * Run sql query
     * 
     * @param {String|SqlFragment} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    execute(sql, bindings = []) {
        if (is(sql, SqlFragment)) {
            return this._executeInternal(sql.sql, sql.bindings);
        }
        return this._executeInternal(sql, bindings);
    }

    /**
     * Run insert query
     * 
     * @param {String|SqlFragment} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    insert(sql, bindings = []) {
        if (is(sql, SqlFragment)) {
            return this._insertInternal(sql.sql, sql.bindings);
        }
        return this._insertInternal(sql, bindings);
    }

    /**
     * Run update query
     * 
     * @param {String|SqlFragment} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    update(sql, bindings = []) {
        if (is(sql, SqlFragment)) {
            return this._updateInternal(sql.sql, sql.bindings);
        }
        return this._updateInternal(sql, bindings);
    }

    /**
     * Run delete query
     * 
     * @param {String|SqlFragment} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    delete(sql, bindings = []) {
        if (is(sql, SqlFragment)) {
            return this._deleteInternal(sql.sql, sql.bindings);
        }
        return this._deleteInternal(sql, bindings);
    }

    /**
     * Create new query builder instance
     * 
     * @returns {QueryBuilder}
     */
    newQuery() {
        abstractMethodError('newQuery');
    }

    /**
     * Terminate all connections
     * 
     * @returns {Promise}
     */
    end() {
        abstractMethodError('end');
    }

    /**
     * Fetch multiple rows
     * 
     * @param {String} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise} 
     */
    fetch(sql, bindings = []) {
        return this.execute(sql, bindings);
    }

    /**
     * Fetch single row
     * 
     * @param {String} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    fetchRow(sql, bindings = []) {
        return this.fetch(sql, bindings)
            .then((rows) => rows.length === 0 ? null : rows[0]);
    }

    /**
     * Fetch single column
     * 
     * @param {String} sql 
     * @param {Array} [bindings=[]] 
     * @param {String} [column=null]
     * @returns {Promise}
     */
    fetchColumn(sql, bindings = [], column = null) {
        return this.fetch(sql, bindings)
            .then((rows) => rows.map((row) => getProp(row, column)));
    }

    /**
     * Fetch scalar value
     * 
     * @param {String} sql 
     * @param {Array} [bindings=[]] 
     * @param {String} [column=null]
     * @returns {Promise}
     */
    fetchValue(sql, bindings = [], column = null) {
        return this.fetchRow(sql, bindings)
            .then((row) => row === null ? null : getProp(row, column));
    }

    /**
     * Format value before usage
     * 
     * @param {any} val 
     * @returns {any}
     */
    toSqlValue(val) {
        if (is(val, Date)) {
            return toMysqlDate(val);
        }
        if (isObject(val)) {
            return JSON.stringify(val);
        }
        if (isNil(val)) {
            return '';
        }
        return val;
    }

    /**
     * Run sql query
     * 
     * @abstract
     * @protected
     * @param {String} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    _executeInternal() {
        abstractMethodError('_executeInternal');
    }

    /**
     * Run INSERT sql query
     * 
     * @abstract
     * @protected
     * @param {String} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    _insertInternal() {
        abstractMethodError('_insertInternal');
    }

    /**
     * Run UPDATE sql query
     * 
     * @abstract
     * @protected
     * @param {String} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    _updateInternal() {
        abstractMethodError('_updateInternal');
    }

    /**
     * Run DELETE sql query
     * 
     * @abstract
     * @protected
     * @param {String} sql
     * @param {Array} [bindings=[]]
     * @returns {Promise}
     */
    _deleteInternal() {
        abstractMethodError('_deleteInternal');
    }
}

const SqlClientSymbol = Symbol('SqlClient');

const sqlClient = () => App.make(SqlClientSymbol);

export default AbstractSqlClient;

export {
    SqlClientSymbol,
    sqlClient,
};