import {
    Mixture, 
} from '../mixture';
import {
    PlainRequest,
    Method,
} from '../transport/request';

class BaseServer extends Mixture
{
    route(request, target) {
        this.register(
            request.prototype.method.call({}).toLowerCase(),
            request.prototype.route.call({}),
            (data, query) => new request(data, query),
            target
        );
        return this;
    }

    map(mapping, target) {
        mapping.forEach((request, method) => {
            this.register(
                request.method.toLowerCase(), request.route, 
                request.factory, target[method].bind(target)
            );
        });
        return this;
    }

    get(path, target) {
        this.register(
            'get', path, 
            (data, query) => new PlainRequest(path, Method.GET, data, query),
            target
        );
        return this;
    }

    post(path, target) {
        this.register(
            'post', path, 
            (data, query) => new PlainRequest(path, Method.POST, data, query),
            target
        );
        return this;
    }

    put(path, target) {
        this.register(
            'put', path, 
            (data, query) => new PlainRequest(path, Method.PUT, data, query),
            target
        );
        return this;
    }

    delete(path, to) {
        this.register(
            'delete', path, 
            (data, query) => new PlainRequest(path, Method.DELETE, data, query),
            target
        );
        return this;
    }
}

const ServerSymbol = Symbol('Server');

export default BaseServer;

export {
    ServerSymbol,
};