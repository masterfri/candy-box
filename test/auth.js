import assert from 'assert';
import './_boot.js';
import { 
    BaseRequest,
    Method } from '../src/lib/transport/request.js';
import Response from '../src/lib/transport/response.js';
import { server } from '../src/lib/server/base.js';
import App from '../src/lib/app.js';
import Document from '../src/lib/structures/document.js';
import ResidentRepository from '../src/lib/repository/resident.js';
import {
    Authenticator, 
    Gate,
    GateSymbol } from '../src/lib/auth/auth.js';
import { hashPassword } from '../src/lib/auth/identity.js';
import { CredentialsResolver } from '../src/lib/auth/credentials.js';
import { WebtokenResolver, 
    WebtokenTrace } from '../src/lib/auth/webtoken.js';
import IdentityRepository from '../src/lib/auth/repository.js';
import RestRepository from '../src/lib/repository/rest.js';
import RepositoryProxy from '../src/lib/repository/proxy.js';
import RepositoryRequestMap from '../src/lib/repository/request-map.js';

class LoginRequest extends BaseRequest
{
    method() {
        return Method.POST;
    }

    route() {
        return '/login';
    }
}

class AdminRequest extends BaseRequest
{
    route() {
        return '/admin';
    }
}

class ManagerRequest extends BaseRequest
{
    route() {
        return '/manager';
    }
}

class ArgumentRequest extends BaseRequest
{
    route() {
        return '/argument';
    }
}

class User extends Document
{
    attributes() {
        return {
            id: Number,
            login: String,
            password: String,
            role: String,
        };
    }
}

let repository = new ResidentRepository(User);
let source = new IdentityRepository(repository);
let auth = new Authenticator(source, [
    new WebtokenResolver()
], new WebtokenTrace());
let gate = new Gate(auth);
let proxy = new RepositoryProxy(repository);
let mapping = new RepositoryRequestMap('/users');
proxy
    .protectWrite('admin')
    .protectRead('manager');
App.box().singleton(GateSymbol, () => gate);

describe('Http server', function() {
    before(function (done) {
        let resolver = new CredentialsResolver();
        gate.define('admin', (identity) => {
            return identity.getInstance()
                .then((user) => user.role === 'admin');
        });
        gate.define('manager', () => {
            return Promise.resolve(true);
        });
        gate.define('argument', (_, request, foo) => {
            return Promise.resolve(request.get('foo') === foo);
        });
        server()
            .route(LoginRequest, (request) => {
                return auth.resolveWith(request, resolver)
                    .then((identity) => {
                        return auth.putTrace(new Response(), identity);
                    });
            })
            .route(AdminRequest, (request) => {
                return gate.pass('admin', request).then((identity) => {
                    return identity.getInstance();
                }).then((user) => {
                    return new Response({
                        id: user.id,
                        login: user.login,
                    });
                });
            })
            .route(ManagerRequest, (request) => {
                return gate.pass('manager', request).then((identity) => {
                    return identity.getInstance();
                }).then((user) => {
                    return new Response({
                        id: user.id,
                        login: user.login,
                    });
                });
            })
            .route(ArgumentRequest, (request) => {
                return gate.pass('argument', request, 'bar').then(() => {
                    return new Response();
                });
            })
            .map(mapping, proxy)
            .start()
            .then(() => {
                return Promise.all([
                    repository.store(new User({
                        login: 'admin',
                        password: hashPassword('admin'),
                        role: 'admin',
                    })),
                    repository.store(new User({
                        login: 'manager',
                        password: hashPassword('manager'),
                        role: 'manager',
                    })),
                ]);
            }).then(() => {
                done();
            });
    });
    after(function (done) {
        server().stop().then(done);
    });
    describe('#login', function() {
        it('Login request should pass with valid data', function(done) {
            let request = new LoginRequest({
                login: 'admin',
                password: 'admin',
            });
            request.send().then((response) => {
                let authorization = response.getHeader('authorization');
                assert.ok(authorization !== undefined);
                done();
            }).catch(done);
        });
        it('Login request should fail with invalid data', function(done) {
            let request = new LoginRequest({
                login: 'admin',
                password: 'manager',
            });
            request.send().then(() => {
                done('Login request should fail');
            }).catch((error) => {
                assert.strictEqual(error.status, 401);
                done();
            }).catch(done);
        });
        it('Gate should allow authorized requests', function(done) {
            let request = new LoginRequest({
                login: 'admin',
                password: 'admin',
            });
            request.send().then((response) => {
                let authorization = response.getHeader('authorization');
                let adminReq = new AdminRequest();
                let transport = adminReq.transport();
                transport.stickHeader('authorization', authorization);
                return adminReq.send().then((response) => {
                    assert.strictEqual(response.get('login'), 'admin');
                    let managerReq = new ManagerRequest();
                    return managerReq.send();
                }).then(() => {
                    let argReq = new ArgumentRequest({foo: 'bar'});
                    return argReq.send();
                }).then(() => {
                    done();
                });
            }).catch(done);
        });
        it('Proxy gate should allow authorized requests', function(done) {
            let request = new LoginRequest({
                login: 'admin',
                password: 'admin',
            });
            let transport = request.transport();
            request.send().then((response) => {
                let authorization = response.getHeader('authorization');
                transport.stickHeader('authorization', authorization);
                let repo = new RestRepository(User, mapping);
                return repo.store(new User({login: 'candy'}))
                    .then(() => {
                        let request = new LoginRequest({
                            login: 'manager',
                            password: 'manager',
                        });
                        return request.send().then((response) => {
                            let authorization = response.getHeader('authorization');
                            transport.stickHeader('authorization', authorization);
                            return repo.search({login: 'candy'});
                        }).then((results) => {
                            assert.strictEqual(results.length, 1);
                        });
                    }).then(() => {
                        done();
                    });
            }).catch(done);
        });
        it('Gate should deny unauthorized requests', function(done) {
            let managerReq = new ManagerRequest();
            let transport = managerReq.transport();
            transport.unstickHeader('authorization');
            managerReq.send().then(() => {
                done('Request without authorization should be denied');
            }).catch((error) => {
                assert.strictEqual(error.status, 401);
                let request = new LoginRequest({
                    login: 'manager',
                    password: 'manager',
                });
                request.send().then((response) => {
                    let authorization = response.getHeader('authorization');
                    transport.stickHeader('authorization', authorization);
                    let adminReq = new AdminRequest();
                    return adminReq.send().then(() => {
                        done('Request with limited access should be denied');
                    }).catch((error) => {
                        assert.strictEqual(error.status, 403);
                        let argReq = new ArgumentRequest({foo: 'foo'});
                        return argReq.send().then(() => {
                            done('Request with with invalid argument should be denied');
                        }).catch((error) => {
                            assert.strictEqual(error.status, 403);
                            done();
                        });
                    });
                }).catch(done);
            }).catch(done);
        });
        it('Proxy gate should deny unauthorized requests', function(done) {
            let repo = new RestRepository(User, mapping);
            let request = new LoginRequest({
                login: 'manager',
                password: 'manager',
            });
            let transport = request.transport();
            transport.unstickHeader('authorization');
            repo.search({login: 'candy'})
                .then(() => {
                    done('Unaunthenticated request should be denied');
                }).catch((error) => {
                    assert.strictEqual(error.status, 401);
                    return request.send().then((response) => {
                        let authorization = response.getHeader('authorization');
                        transport.stickHeader('authorization', authorization);
                        return repo.store(new User({login: 'box'}));
                    }).then(() => {
                        done('Write protected method should be unavailable');
                    }).catch((error) => {
                        assert.strictEqual(error.status, 403);
                        done();
                    });
                }).catch(done);
        });
    });
});