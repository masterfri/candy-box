import Message from './message.js';

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

const getCodeDescription = (code) => {
    switch (code) {
        case Status.OK: return 'Ok';
        case Status.CREATED: return 'Created';
        case Status.ACCEPTED: return 'Accepted';
        case Status.BAD_REQUEST: return 'Bad request';
        case Status.UNAUTHORIZED: return 'Unauthorized';
        case Status.FORBIDDEN: return 'Forbidden';
        case Status.NOT_FOUND: return 'Not found';
        case Status.METHOD_NOT_ALLOWED: return 'Method not allowed';
        case Status.UNPROCESSABLE_ENTITY: return 'Unprocessable entity';
        case Status.TOO_MANY_REQUESTS: return 'Too many requests';
        case Status.INTERNAL_SERVER_ERROR: return 'Internal server error';
        case Status.SERVICE_UNAVAILABLE: return 'Service unavailable';
    }
    return 'Unknown error';
}

/**
 * Base class for response
 * 
 * @class
 * @augments Message
 */
class Response extends Message
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
     * @param {any} [body=null] 
     * @param {Number} [status=Status.OK] 
     * @param {String} [message='Ok'] 
     * @param {Object} [headers={}] 
     */
    constructor(body = null, status = Status.OK, message = 'Ok', headers = {}) {
        super(body, headers);
        this._status = status;
        this._message = message;
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
}

/**
 * This error is raised when http request fails
 * 
 * @class
 * @augments Error
 */
 class HttpError extends Error
 {
     /**
      * @protected
      * @var {Number}
      */
     _code;
 
     /**
      * @param {Number} code
      * @param {String} [message=undefined]
      */
     constructor(code, message = undefined) {
        super(message === undefined ? getCodeDescription(code) : message);
        this._code = code;
     }
 
     /**
      * Http code
      * 
      * @var {Number}
      */
     get code() {
         return this._code;
     }
 }

export default Response;

export {
    Status,
    HttpError,
    isErrorCode,
};