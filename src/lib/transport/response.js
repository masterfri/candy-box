class Response
{
    constructor(body = null, status = 200, message = 'Ok', props = {}) {
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