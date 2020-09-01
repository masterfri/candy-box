import {
    Mixture, 
    Interface,
} from '../mixture';
import qs from 'qs';

const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';
const DELETE = 'DELETE';

class TransportRequestInterface extends Interface
{
    static methods() {
        return [
            'cancel',
            'then',
            'catch', 
        ];
    }
}

class TransportInterface extends Interface
{
    static methods() {
        return [
            'send', 
        ];
    }
}

class RequestInterface extends Interface
{
    static methods() {
        return [
            'method',
            'route',
            'getQuery',
            'getData',
            'getErrors',
            'validate',
            'send',
        ];
    }
}

class BaseTransport extends Mixture
{
    mixins() {
        return [
            TransportInterface,
        ];
    }

    buildOptions(request) {
        return {
            method: request.method(),
            url: this.buildUrl(request),
            data: request.getData(),
        };
    }

    buildUrl(request) {
        let data = request.getData();
        let params = {...request.getQuery()};
        let url = request.route().split('/')
            .map((part) => {
                if (part.indexOf(':') !== -1) {
                    let [prefix, key] = part.split(':', 2);
                    let value;
                    if (key in params) {
                        value = params[key];
                        delete params[key];
                    } else if (key in data) {
                        value = data[key];
                    } else {
                        return null;
                    }
                    return prefix + value;
                }
                return part;
            })
            .filter((part) => {
                return part !== null;
            })
            .join('/');
        if (Object.keys(params).length !== 0) {
            url += '?' + qs.stringify(params);
        }
        return url;
    }
}

const Method = {
    GET,
    POST,
    PUT,
    DELETE, 
};

export {
    TransportRequestInterface,
    TransportInterface,
    RequestInterface,
    BaseTransport,
    Method,
};