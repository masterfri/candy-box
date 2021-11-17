import jwt from 'jsonwebtoken';
import { readFile } from 'fs';
import App from '../app.js';

class Webtoken
{
    /**
     * @protected
     * @var {String}
     */
    _password;

    /**
     * @protected
     * @var {Promise}
     */
    _keyPair;

    /**
     * @protected
     * @var {Number}
     */
    _ttl;

    /**
     * @param {Object} config 
     */
    constructor(config) {
        this._ttl = config.ttl || 3600;
        if (config.keyPair !== undefined) {
            let privatePath = config.keyPair.private;
            let publicPath = config.keyPair.public;
            this._keyPair = this._loadKeypair(privatePath, publicPath);
            this._password = null;
        } else if (config.password !== undefined) {
            this._keyPair = null;
            this._password = config.password;
        }
    }

    /**
     * Sign data
     * 
     * @param {Object} data 
     * @returns {Promise}
     */
    sign(data) {
        if (this._keyPair !== null) {
            return this._keyPair.then(({privateKey}) => {
                return this._sign(data, privateKey, {
                    expiresIn: this._ttl,
                    algorithm: 'RS256',
                });
            });
        }
        return this._sign(data, this._password, {
            expiresIn: this._ttl,
        });
    }

    /**
     * Decode and verify token
     * 
     * @param {String} token 
     * @returns {Promise}
     */
    verify(token) {
        if (this._keyPair !== null) {
            return this._keyPair.then(({publicKey}) => {
                return this._verify(token, publicKey, {
                    algorithm: 'RS256',
                });
            });
        }
        return this._verify(token, this._password, {});
    }

    /**
     * Load keypair
     * 
     * @param {String} privatePath 
     * @param {String} publicPath 
     * @returns {Promise}
     */
    _loadKeypair(privatePath, publicPath) {
        return new Promise((resolve, reject) => {
            readFile(privatePath, (err, privateKey) => {
                if (err) {
                    reject(err);
                } else {
                    readFile(publicPath, (err, publicKey) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                privateKey,
                                publicKey,
                            });
                        }
                    });
                }
            });
        });
    }

    /**
     * Sign data with specific configuration
     * 
     * @param {Object} data 
     * @param {String|Buffer} keyOrPwd 
     * @param {Object} options 
     * @returns {Promise}
     */
    _sign(data, keyOrPwd, options) {
        return new Promise((resolve, reject) => {
            jwt.sign(data, keyOrPwd, options, (err, token) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    }

    /**
     * Verify token with specific configuration
     * 
     * @param {String} token 
     * @param {String|Buffer} keyOrPwd 
     * @param {Object} options 
     * @returns {Promise}
     */
    _verify(token, keyOrPwd, options) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, keyOrPwd, options, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}

const WebtokenSymbol = Symbol('Webtoken');

const webtoken = () => App.make(WebtokenSymbol);

export default Webtoken;

export {
    WebtokenSymbol,
    webtoken,
}