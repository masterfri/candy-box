import { get,
    forEach } from '../helpers.js';

class Message
{
    /**
     * @protected
     * @var {Object}
     */
    _body;

    /**
     * @protected
     * @var {Object}
     */
    _headers = {};

    /**
     * @param {Object} [body={}]
     * @param {Object} [headers={}]
     */
    constructor(body = {}, headers = {}) {
        this._body = body;
        this.headers = headers;
    }

    /**
     * Get data from message
     * 
     * @param {String} path
     * @param {any} [fallback=null]
     * @returns {any}
     */
    get(key, fallback = null) {
        return get(this._body, key, fallback);
    }

    /**
     * Set message header
     * 
     * @param {String} name 
     * @param {String} value 
     * @returns {BaseRequest}
     */
    setHeader(name, value) {
        this._headers[name.toLowerCase()] = value;
        return this;
    }

    /**
     * Get message header
     * 
     * @param {String} name 
     * @returns {String}
     */
    getHeader(name) {
        return this._headers[name.toLowerCase()];
    }

    /**
     * Message body
     * 
     * @var {Object}
     */
    get body() {
        return this._body;
    }

    /**
     * Message headers
     * 
     * @var {Object}
     */
    get headers() {
        return this._headers;
    }

    /**
     * Message headers
     * 
     * @var {Object}
     */
    set headers(headers) {
        forEach(headers, (value, key) => {
            this.setHeader(key, value);
        });
    }
}

export default Message;