import {
    scrypt,
    createCipheriv,
    createDecipheriv,
    createHash,
    createHmac } from 'crypto';
import App from '../app.js';

class Crypto
{
    /**
     * @protected
     * @var {String}
     */
    _password;

    /**
     * @protected
     * @var {String}
     */
     _salt;

    /**
     * @protected
     * @var {number}
     */
    _keyBytes;

    /**
     * @protected
     * @var {String}
     */
    _algo;

    /**
     * @protected
     * @var {Promise}
     */
    _key;

    /**
     * @protected
     * @var {Buffer}
     */
    _iv;

    /**
     * @param {Object} config 
     */
    constructor(config) {
        this._password = config.password;
        this._salt = config.salt;
        this._iv = this._createIv();
        switch (Number(config.keySize || 256)) {
            case 256:
                this._keyBytes = 32;
                this._algo = 'aes-256-cbc';
                break;
            case 196:
                this._keyBytes = 24;
                this._algo = 'aes-196-cbc';
                break;
            case 128:
                this._keyBytes = 16;
                this._algo = 'aes-128-cbc';
                break;
            default:
                throw new Error('Invalid key size, supported sizes are: 128, 196 and 256');
        }
    }

    /**
     * Encrypt string data
     * 
     * @param {String} data 
     * @param {String} [inputEncoding='utf8']
     * @param {String} [outputEncoding='base64']
     * @returns {Promise} 
     */
    encrypt(data, inputEncoding = 'utf8', outputEncoding = 'base64') {
        return this._generateKey()
            .then((key) => {
                let iv = Buffer.from(this._iv);
                let cipher = createCipheriv(this._algo, key, iv);
                let encrypted = cipher.update(data, inputEncoding, outputEncoding);
                encrypted += cipher.final(outputEncoding);
                return encrypted;
            });
    }

    /**
     * Decrypt string data
     * 
     * @param {String} data 
     * @param {String} [outputEncoding='utf8']
     * @param {String} [inputEncoding='base64']
     * @returns {Promise} 
     */
    decrypt(data, outputEncoding = 'utf8', inputEncoding = 'base64') {
        return this._generateKey()
            .then((key) => {
                let iv = Buffer.from(this._iv);
                let decipher = createDecipheriv(this._algo, key, iv);
                let decrypted = decipher.update(data, inputEncoding, outputEncoding);
                decrypted += decipher.final(outputEncoding);
                return decrypted;
            });
    }

    /**
     * Create hash of the given string
     * 
     * @param {String} data 
     * @param {String} [outputEncoding='base64']
     * @param {String} [algorithm='sha256']
     * @returns {String}
     */
    hash(data, outputEncoding = 'base64', algorithm = 'sha256') {
        let hash = createHash(algorithm);
        hash.update(data);
        return hash.digest(outputEncoding);
    }

    /**
     * Create HMAC digests of the given string
     * 
     * @param {String} data 
     * @param {String} [outputEncoding='base64']
     * @param {String} [algorithm='sha256']
     * @returns {String}
     */
    hmac(data, outputEncoding = 'base64', algorithm = 'sha256') {
        let hmac = createHmac(algorithm, this._password);
        hmac.update(data);
        return hmac.digest(outputEncoding);
    }

    /**
     * Generate key if not done yet
     * 
     * @protected
     * @returns {Promise}
     */
    _generateKey() {
        if (this._key === undefined) {
            this._key = new Promise((resolve, reject) => {
                scrypt(this._password, this._salt, this._keyBytes, (err, key) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(key);
                    }
                });
            });
        }
        return this._key;
    }

    /**
     * Create IV for the encryption
     */
    _createIv() {
        let hash = createHash('sha256');
        let iv = Buffer.allocUnsafe(16);
        hash.update(this._password);
        hash.digest().copy(iv, 0, 0, 16);
        return iv;
    }
}

const CryptoSymbol = Symbol('Crypto');

const crypto = () => App.make(CryptoSymbol);

export default Crypto;

export {
    CryptoSymbol,
    crypto,
};