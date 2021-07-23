import assert from 'assert';
import './_boot.js';
import Webtoken, {
    webtoken } from '../src/lib/security/webtoken.js';
import App from '../src/lib/app.js';

describe('Webtoken', function() {
    describe('#sign', function() {
        it('Data should be signed then verified using RSA keys', function(done) {
            let jwt = webtoken();
            let data = {
                secretKey: 'secretValue',
                otherKey: 'otherValue',
            };
            jwt.sign({data}).then((token) => {
                return jwt.verify(token);
            }).then((decoded) => {
                assert.deepStrictEqual(decoded.data, data);
                done();
            }).catch(done);
        });
        it('Data should be signed then verified using password', function(done) {
            let jwt = new Webtoken({
                password: 'secret',
            });
            let data = {
                secretKey: 'secretValue',
                otherKey: 'otherValue',
            };
            jwt.sign({data}).then((token) => {
                return jwt.verify(token);
            }).then((decoded) => {
                assert.deepStrictEqual(decoded.data, data);
                done();
            }).catch(done);
        });
    });
});