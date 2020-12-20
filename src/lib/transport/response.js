import {
    Mixture, 
} from '../mixture';

const Status = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

const isErrorCode = (code) => {
    return code >= 400;
}

/**
 * Base class for response
 * 
 * @class
 * @augments Mixture
 */
class Response extends Mixture
{
    /**
     * @protected
     * @var {Number}
     */
    _status;

    /**
     * @protected
     * @var {String}
     */
    _message;

    /**
     * @protected
     * @var {any}
     */
    _body;

    /**
     * @protected
     * @var {Object}
     */
    _props;

    /**
     * @param {any} [body=null] 
     * @param {Number} [status=Status.OK] 
     * @param {String} [message='Ok'] 
     * @param {Object} [props={}] 
     */
    constructor(body = null, status = Status.OK, message = 'Ok', props = {}) {
        super();
        this._status = status;
        this._message = message;
        this._body = body;
        this._props = props;
    }

    /**
     * Response status
     * 
     * @var {Number}
     */
    get status() {
        return this._status;
    }

    /**
     * Response message
     * 
     * @var {String}
     */
    get message() {
        return this._message;
    }

    /**
     * Response body
     * 
     * @var {any}
     */
    get body() {
        return this._body;
    }

    /**
     * Response properties
     * 
     * @var {Object}
     */
    get props() {
        return this._props;
    }
}

export default Response;

export {
    Status,
    isErrorCode,
};