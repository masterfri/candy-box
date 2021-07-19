import {
    is,
} from '../helpers.js';
import Identity, {
    AbstractIdentityResolver,
    UnknownIdentityError,
} from './identity.js';

const DenyReason = {
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
};

class Authenticator
{
    /**
     * @protected
     * @var {AbstractIdentitySource}
     */
    _source;

    /**
     * @protected
     * @var {Array}
     */
    _resolvers;

    /**
     * @protected
     * @var {AbstractIdentityTrace}
     */
    _trace;

    /**
     * @param {AbstractIdentitySource} source
     * @param {Array} resolvers 
     * @param {AbstractIdentityTrace} trace
     */
    constructor(source, resolvers, trace) {
        this._source = source;
        this._resolvers = resolvers;
        this._trace = trace;
    }

    /**
     * Resolve identity from request
     * 
     * @param {Request} request 
     * @returns {Promise}
     */
    resolveIdentity(request) {
        for (let resolver of this._resolvers) {
            let result = this._tryResolver(request, resolver);
            if (is(result, Promise)) {
                return result;
            }
        }
        return Promise.reject(
            new AuthorizationError(DenyReason.UNAUTHENTICATED)
        );
    }

    /**
     * Resolve request identity
     * 
     * @param {Request} request 
     * @param {AbstractIdentityResolver} resolver 
     * @returns {Promise}
     */
    resolveWith(request, resolver) {
        let result = this._tryResolver(request, resolver);
        if (is(result, Promise)) {
            return result;
        }
        return Promise.reject(
            new AuthorizationError(DenyReason.UNAUTHENTICATED)
        );
    }

    /**
     * Put trace to response
     * 
     * @param {Response} response 
     * @param {Identity} identity
     * @returns {Promise}
     */
    putTrace(response, identity) {
        return this._trace.put(response, identity);
    }

    /**
     * Attempt to resolve request identity
     * 
     * @param {Request} request 
     * @param {AbstractIdentityResolver} resolver 
     * @returns {Promise|false}
     */
    _tryResolver(request, resolver) {
        let result = resolver.resolve(request, this._source);
        if (is(result, Identity)) {
            return Promise.resolve(result);
        }
        if (is(result, Promise)) {
            return result.catch((error) => {
                if (is(error, UnknownIdentityError)) {
                    return Promise.reject(
                        new AuthorizationError(DenyReason.UNAUTHENTICATED)
                    );
                }
                return Promise.reject(error);
            });
        }
        return false;
    }
}

class Gate
{
    /**
     * @protected
     * @var {Map}
     */
    _gatekeepers;

    /**
     * @protected
     * @var {Authenticator}
     */
    _auth;

    /**
     * @param {Authenticator} auth 
     */
    constructor(auth) {
        this._auth = auth;
        this._gatekeepers = new Map();
    }

    /**
     * Define a gatekeeper
     * 
     * @param {String} name 
     * @param {Function} gatekeeper 
     * @returns {Gate}
     */
    define(name, gatekeeper) {
        this._gatekeepers.set(name, gatekeeper);
        return this;
    }

    /**
     * Attempt to pass a gatekeeper
     * 
     * @param {String} name 
     * @param {Request} request 
     * @param  {...any} args 
     * @returns {Promise}
     */
    pass(name, request, ...args) {
        if (!this._gatekeepers.has(name)) {
            return Promise.reject(
                new AuthorizationError(DenyReason.FORBIDDEN)
            );
        }
        return this._auth
            .resolveIdentity(request)
            .then((identity) => {
                let gatekeeper = this._gatekeepers.get(name);
                return gatekeeper(identity, request, ...args)
                    .then((passed) => {
                        if (passed) {
                            return identity;
                        }
                        throw new AuthorizationError(DenyReason.FORBIDDEN);
                    });
            });
    }
}

class AuthorizationError extends Error
{
    /**
     * @protected
     * @var {Number}
     */
    _reason;

    /**
     * @param {Number} reason
     * @param {String} message
     */
    constructor(reason, message) {
        super(message);
        this._reason = reason;
    }
 
    /**
     * Reason of failure
     * 
     * @var {Number}
     */
    get reason() {
        return this._reason;
    }
}

const AuthenticatorSymbol = Symbol('Authenticator');
const GateSymbol = Symbol('Gate');

export {
    Authenticator,
    Gate,
    AuthorizationError,
    DenyReason,
    AuthenticatorSymbol,
    GateSymbol,
}