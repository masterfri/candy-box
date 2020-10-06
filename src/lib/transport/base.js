import {
    Mixture, 
} from '../mixture';
import qs from 'qs';

class BaseTransport extends Mixture
{
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

const TransportSymbol = Symbol('Transport');

export default BaseTransport;

export {
    TransportSymbol,
};