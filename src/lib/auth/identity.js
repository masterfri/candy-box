import {
    isFunction,
    skipProps,
    abstractMethodError } from '../helpers.js';
import { CryptoSymbol } from '../security/crypto.js';
import App from '../app.js';

const hashPassword = (password) => {
    return App.make(CryptoSymbol).hmac(password);
}

class Identity
{
    /**
     * @protected
     * @var {any}
     */
    _id;

    /**
     * @protected
     * @var {Promise}
     */
    _instance;

    /**
     * @protected
     * @var {Function}
     */
    _loader;

    /**
     * @param {any} id 
     * @param {any} instance
     */
    constructor(id, instance) {
        this._id = id;
        if (isFunction(instance)) {
            this._loader = instance;
        } else {
            this._instance = Promise.resolve(instance);
        }
    }

    /**
     * Load instance of this identity
     * 
     * @param {Boolean} [refresh=false]
     * @returns {Promise}
     */
    getInstance(refresh = false) {
        if (this._instance === undefined || refresh) {
            this._instance = this._loader(this._id);
        }
        return this._instance;
    }

    /**
     * Unique ID of identity
     * 
     * @var {any}
     */
    get id() {
        return this._id;
    }
}

/**
 * Base class for all identity sources
 * 
 * @class
 * @abstract
 */
class AbstractIdentitySource
{
    /**
     * Get identity by its ID
     * 
     * @param {any} id
     * @returns {Promise}
     */
    getById(id) {
        return this.getInstance(id)
            .then((instance) => {
                if (instance === null) {
                    throw new UnknownIdentityError();
                }
                return new Identity(id, instance);
            });
    }

    /**
     * Get identity by its credentials
     * 
     * @param {Object} credentials
     * @param {String} [pwdAttribute='password']
     * @returns {Promise}
     */
    getByCredentials(credentials, pwdAttribute = 'password') {
        let attributes = skipProps(credentials, [pwdAttribute]);
        return this._findByAttributes(attributes)
            .then((instance) => {
                if (instance !== null) {
                    let password = credentials[pwdAttribute];
                    if (this.validatePassword(password, instance, pwdAttribute)) {
                        return new Identity(this._getId(instance), instance);
                    }
                }
                throw new UnknownIdentityError();
            });
    }

    /**
     * Check password against identity instance
     * 
     * @param {String} password 
     * @param {any} instance 
     * @param {String} pwdAttribute 
     * @returns {Boolean}
     */
    validatePassword(password, instance, pwdAttribute) {
        return instance[pwdAttribute] === hashPassword(password);
    }

    /**
     * Get instance by ID
     * 
     * @param {any} id 
     * @returns {Promise}
     */
    getInstance(id) {
        return this._findById(id);
    }

    /**
     * Get ID from identity instance
     * 
     * @abstract
     * @param {any} instance
     * @returns {any}
     */
    _getId() {
        abstractMethodError('_getId');
    }

    /**
     * Find instance by its ID
     * 
     * @abstract
     * @param {any} id
     * @returns {Promise}
     */
    _findById() {
        abstractMethodError('_findById');
    }

    /**
     * Find instance by attribute values
     * 
     * @abstract
     * @param {Object} attributes
     * @returns {Promise}
     */
    _findByAttributes() {
        abstractMethodError('_findByAttributes');
    }
}

class AbstractIdentityResolver
{
    /**
     * Attempt to resolve identity from request
     * 
     * @param {BaseRequest} request 
     * @param {AbstractIdentitySource} source 
     * @returns {Promise|Identity|false}
     */
    resolve() {
        abstractMethodError('resolve');
    }
}

class AbstractIdentityTrace
{
    /**
     * Put trace to response
     * 
     * @param {Response} response 
     * @param {Identity} identity
     * @returns {Promise}
     */
    put() {
        abstractMethodError('put');
    }
}

class UnknownIdentityError extends Error
{
    /**
     * @param {String} [message='Unknown identity']
     */
    constructor(message = 'Unknown identity') {
        super(message);
    }
}

const IdentitySourceSymbol = Symbol('IdentitySource');

export default Identity;

export {
    hashPassword,
    AbstractIdentitySource,
    AbstractIdentityResolver,
    AbstractIdentityTrace,
    UnknownIdentityError,
    IdentitySourceSymbol,
}