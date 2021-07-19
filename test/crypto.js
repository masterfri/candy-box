import assert from 'assert';
import './_boot.js';
import {CryptoSymbol} from '../src/lib/security/crypto.js';
import App from '../src/lib/app.js';

describe('Crypto', function() {
    describe('#hash', function() {
        it('String should be hashed correctly', function() {
            let crypto = App.make(CryptoSymbol);
            let hashed = crypto.hash('secret texts', 'hex');
            assert.strictEqual(hashed, 'd615ecd2197ed4c1a33ba64a7fca361fe5ef4de3fdc85bed7c21e3c070865f9c');
        });
    });
    describe('#hmac', function() {
        it('String HMAC digest should created correctly', function() {
            let crypto = App.make(CryptoSymbol);
            let hashed = crypto.hmac('secret texts', 'hex');
            assert.strictEqual(hashed, '3ba8f4d421c3f605bf7b9b957286f64a2adf9d864abf90d7bcaaa2aa4e637855');
        });
    });
    describe('#encrypt/decrypt', function() {
        it('String should be successfully encrypted then decrypted', function(done) {
            let crypto = App.make(CryptoSymbol);
            let string = 'secret texts';
            crypto.encrypt(string).then((data) => {
                return crypto.decrypt(data);
            }).then((result) => {
                assert.strictEqual(result, string);
                done();
            }).catch(done);
        });
    });
});