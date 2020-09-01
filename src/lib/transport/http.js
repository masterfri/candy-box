import axios from 'axios';
import {
    safeCall,
} from '../helpers';
import {
    BaseTransport,
} from './base';
import {
    ValidationError,
} from '../validation/validator';
import Response from './response';

class HttpRequest
{
    constructor(config = {}) {
        this._uploadSize = 0;
        this._uploaded = 0;
        this._downloadSize = 0;
        this._downloaded = 0;
        this._source = axios.CancelToken.source();
        this._promise = axios.request({
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
    }
    
    cancel(message) {
        this._source.cancel(message);
    }
    
    then(callback) {
        this._promise.then(callback);
        return this;
    }

    catch(callback) {
        this._promise.catch(callback);
        return this;
    }
    
    get uploadSize() {
        return this._uploadSize;
    }
    
    get uploaded() {
        return this._uploaded;
    }
    
    get uploadPercent() {
        return this._uploadSize > 0 ? (100 * this._uploaded / this._uploadSize) : 0;
    }
    
    get downloadSize() {
        return this._downloadSize;
    }
    
    get downloaded() {
        return this._downloaded;
    }
    
    get downloadPercent() {
        return this._downloadSize > 0 ? (100 * this._downloaded / this._downloadSize) : 0;
    }
}

class HttpTransport extends BaseTransport
{
    constructor(config = {}) {
        super();
        this._defaults = config;
    }
    
    request(options) {
        return new HttpRequest({
            ...this._defaults,
            ...options,
        });
    }

    send(request, options = {}) {
        return new Promise((resolve, reject) => {
            this.request({
                ...this.buildOptions(request),
                ...options,
                validateStatus: (status) => {
                    return true;
                },
            }).then((result) => {
                if (result.status === 422) {
                    reject(new ValidationError(result.data));
                }
                let response = new Response(
                    result.data,
                    result.status, 
                    result.statusText,
                    result.headers
                );
                if (result.status >= 300) {
                    reject(response);
                }
                resolve(response);
            }).catch((error) => {
                reject(error);
            });
        });
    }
}

export default HttpTransport;