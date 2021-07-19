import assert from 'assert';
import './_boot.js';
import Request, {Method} from '../src/lib/transport/request.js';
import Response from '../src/lib/transport/response.js';
import {ServerSymbol} from '../src/lib/server/base.js';
import App from '../src/lib/app.js';
import Model from '../src/lib/structures/model.js';
import ResidentRepository from '../src/lib/repository/resident.js';
import {Authenticator, Gate} from '../src/lib/auth/auth.js';
import {hashPassword} from '../src/lib/auth/identity.js';
import {CredentialsResolver} from '../src/lib/auth/credentials.js';
import {WebtokenResolver, WebtokenTrace} from '../src/lib/auth/webtoken.js';
import IdentityRepository from '../src/lib/auth/repository.js';

class LoginRequest extends Request
{
    method() {
        return Method.POST;
    }

    route() {
        return '/login';
    }
}

class AdminRequest extends Request
{
    route() {
        return '/admin';
    }
}

class ManagerRequest extends Request
{
    route() {
        return '/manager';
    }
}

class ArgumentRequest extends Request
{
    route() {
        return '/argument';
    }
}

class User extends Model
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

let server = null;
let repository = new ResidentRepository(User);
let source = new IdentityRepository(repository);
let auth = new Authenticator(source, [
    new WebtokenResolver()
], new WebtokenTrace());
let gate = new Gate(auth);

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
        server = App.make(ServerSymbol);
        server
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
        server.stop().then(done);
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
        it('Gate should deny unauthorized requests', function(done) {
            let managerReq = new ManagerRequest();
            let transport = managerReq.transport();
            transport.unstickHeader('authorization');
            managerReq.send(() => {
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
            });
        });
    });
});