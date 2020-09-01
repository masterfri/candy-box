import {
    Mixture, 
    Interface,
} from '../mixture';
import {
    Method,
} from '../transport/base';
import {
    PlainRequest,
} from '../transport/request';

class ServerInterface extends Interface
{
    static methods() {
        return [
            'start',
            'route',
            'get',
            'post',
            'put',
            'delete',
            'stop', 
        ];
    }
}

class BaseServer extends Mixture
{
    mixins() {
        return [
            ServerInterface,
        ];
    }

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
        mapping.forEach((request) => {
            this.register(
                request.method.toLowerCase(), request.route, 
                request.factory, target
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

export {
    ServerInterface,
    BaseServer,
};