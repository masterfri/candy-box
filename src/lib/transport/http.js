import axios from 'axios';
import { safeCall } from '../helpers.js';
import AbstractTransport from './base.js';
import { ValidationError } from '../validation/validator.js';
import Response, {
    Status,
    isErrorCode } from './response.js';

/**
 * BaseRequest for HTTP transport
 * 
 * @class
 */
class HttpRequest
{
    /**
     * @protected
     * @var {Number}
     */
    _uploadSize = 0;

    /**
     * @protected
     * @var {Number}
     */
    _uploaded = 0;

    /**
     * @protected
     * @var {Number}
     */
    _downloadSize = 0;

    /**
     * @protected
     * @var {Number}
     */
    _downloaded = 0;

    /**
     * @protected
     * @var {Object}
     */
    _source;

    /**
     * @protected
     * @var {Promise}
     */
    _promise;

    /**
     * @param {AxiosInstance} client
     * @param {Object} config 
     */
    constructor(client, config = {}) {
        this._source = axios.CancelToken.source();
        this._promise = client.request({
            ...config,
            onUploadProgress: (e) => {
                this._uploaded = e.loaded;
                this._uploadSize = e.total;
                safeCall(config.onUploadProgress, e, this); 
            },
            onDownloadProgress: (e) => {
                this._downloaded = e.loaded;
                this._downloadSize = e.total;
                safeCall(config.onDownloadProgress, e, this); 
            },
            cancelToken: this._source.token,
        });
        safeCall(config.onNewRequest, this);
    }
    
    /**
     * @inheritdoc
     * @override
     */
    cancel(message) {
        this._source.cancel(message);
    }
    
    /**
     * @inheritdoc
     * @override
     */
    then(callback) {
        this._promise = this._promise.then(callback);
        return this;
    }

    /**
     * @inheritdoc
     * @override
     */
    catch(callback) {
        this._promise = this._promise.catch(callback);
        return this;
    }
    
    /**
     * Size of request content
     * 
     * @var {Number}
     */
    get uploadSize() {
        return this._uploadSize;
    }
    
    /**
     * Number of bytes that already uploaded
     * 
     * @var {Number}
     */
    get uploaded() {
        return this._uploaded;
    }
    
    /**
     * Percent-wise amount of uploaded content
     * 
     * @var {Number}
     */
    get uploadPercent() {
        return this._uploadSize > 0 ? (100 * this._uploaded / this._uploadSize) : 0;
    }
    
    /**
     * Size of response content
     * 
     * @var {Number}
     */
    get downloadSize() {
        return this._downloadSize;
    }
    
    /**
     * Number of bytes that already downloaded
     * 
     * @var {Number}
     */
    get downloaded() {
        return this._downloaded;
    }
    
    /**
     * Percent-wise amount of downloaded content
     * 
     * @var {Number}
     */
    get downloadPercent() {
        return this._downloadSize > 0 ? (100 * this._downloaded / this._downloadSize) : 0;
    }

    /**
     * Tells the request is cancellable
     * 
     * @var {Boolean}
     */
    get isCancellable() {
        return true;
    }

    /**
     * Request promise
     * 
     * @var {Promise}
     */
    get promise() {
        return this._promise;
    }
}

/**
 * HTTP transport
 * 
 * @class
 * @augments AbstractTransport
 */
class HttpTransport extends AbstractTransport
{
    /**
     * @protected
     * @var {AxiosInstance}
     */
    _client;

    /**
     * @param {Object} [config={}] 
     */
    constructor(config = {}) {
        super();
        this._client = this._createClient(config);
    }
    
    /**
     * Create HTTP client
     * 
     * @protected
     * @param {Object} config 
     * @returns {AxiosInstance}
     */
    _createClient(config) {
        return axios.create(config);
    }

    /**
     * Make new HTTP request
     * 
     * @protected
     * @param {Object} options 
     * @returns {HttpRequest}
     */
    _makeRequest(options) {
        return new HttpRequest(this._client, options);
    }

    /**
     * @override
     * @inheritdoc
     */
    _sendInternal(request, options) {
        return this._makeRequest({
            ...this._buildOptions(request),
            ...options,
            validateStatus: () => true,
        }).promise.then((result) => {
            return this._processResponse(result, options);
        });
    }

    /**
     * Process response
     * 
     * @param {Object} result 
     * @param {Object} options 
     * @returns {Response}
     */
    _processResponse(result, options) {
        let {data, status, statusText, headers} = result;
        if (status === Status.UNPROCESSABLE_ENTITY) {
            throw new ValidationError(data);
        }
        let responseClass = options.expect || Response;
        let response = new responseClass(data, status, statusText, headers);
        if (isErrorCode(status)) {
            throw response;
        }
        return response;
    }
}

export default HttpTransport;