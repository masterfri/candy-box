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

class Response
{
    constructor(body = null, status = Status.OK, message = 'Ok', props = {}) {
        this._status = status;
        this._message = message;
        this._body = body;
        this._props = props;
    }

    getStatus() {
        return this._status;
    }

    getMessage() {
        return this._message;
    }

    getBody() {
        return this._body;
    }

    getProps() {
        return this._props;
    }
}

export default Response;

export {
    Status,
    isErrorCode,
};