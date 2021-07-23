import mysql from 'mysql2';
import AbstractSqlClient from './base-client.js';
import MysqlQueryBuilder from './mysql-query-builder.js';
import { isFunction } from '../helpers.js';

class MysqlClient extends AbstractSqlClient
{
    /**
     * @var {any}
     */
    _endpoint;

    /**
     * @param {Object} options 
     */
    constructor(options) {
        super();
        if (options.usePool === true) {
            this._endpoint = mysql.createPool(options);
            if (isFunction(options.setupConnection)) {
                this._endpoint.on('connection', (connection) => {
                    options.setupConnection(connection);
                });
            }
        } else {
            this._endpoint = mysql.createConnection(options);
            if (isFunction(options.setupConnection)) {
                options.setupConnection(this._endpoint);
            }
        }
    }

    /**
     * @inheritdoc
     */
    newQuery() {
        return new MysqlQueryBuilder();
    }

    /**
     * @inheritdoc
     */
    end() {
        return new Promise((resolve, reject) => {
            this._endpoint.end((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * @inheritdoc
     */
    _executeInternal(sql, bindings = []) {
        return new Promise((resolve, reject) => {
            this._endpoint.query(sql, bindings, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    /**
     * @inheritdoc
     */
    _insertInternal(sql, bindings = []) {
        return this._executeInternal(sql, bindings)
            .then((result) => result.insertId);
    }

    /**
     * @inheritdoc
     */
    _updateInternal() {
        return this._executeInternal(sql, bindings)
            .then((result) => result.changedRows);
    }

    /**
     * @inheritdoc
     */
    _deleteInternal() {
        return this._executeInternal(sql, bindings)
            .then((result) => result.affectedRows);
    }
}

export default MysqlClient;