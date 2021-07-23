import {
    isObject,
    get,
    isNull,
    isArray } from '../helpers.js';
import {
    AbstractIdentityResolver } from './identity.js';

class CredentialsResolver extends AbstractIdentityResolver
{
    /**
     * @protected
     * @var {Array|Object}
     */
    _attributes;

    /**
     * @protected
     * @var {String}
     */
    _pwdAttribute;

    /**
     * @param {Array|Object} [attributes=['login','password']]
     * @param {String} [pwdAttribute='password']
     */
    constructor(attributes = ['login', 'password'], pwdAttribute = 'password') {
        super();
        if (isArray(attributes)) {
            this._attributes = {};
            attributes.forEach((attr) => {
                this._attributes[attr] = attr;
            });
        } else {
            this._attributes = attributes;
        }
        this._pwdAttribute = pwdAttribute;
    }

    /**
     * @inheritdoc
     */
    resolve(request, source) {
        let credentials = this._detectCredentials(request);
        if (credentials !== null) {
            return source.getByCredentials(credentials, this._pwdAttribute);
        }
        return false;
    }

    /**
     * Check if request has credentials
     * 
     * @param {Request} request 
     * @returns {Object|null}
     */
    _detectCredentials(request) {
        let credentials = {};
        let data = request.body;
        if (isObject(data)) {
            for (let key in this._attributes) {
                let value = get(data, this._attributes[key]);
                if (isNull(value)) {
                    return null;
                }
                credentials[key] = value;
            }
            return credentials;
        }
        return null;
    }
}

export {
    CredentialsResolver,
}