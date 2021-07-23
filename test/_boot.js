import App from '../src/lib/app.js';
import Validator, {
    ValidatorSymbol,
} from '../src/lib/validation/validator.js'; 
import Crypto, {
    CryptoSymbol,
} from '../src/lib/security/crypto.js';
import Webtoken, {
    WebtokenSymbol,
} from '../src/lib/security/webtoken.js';
import {
    TransportSymbol,
} from '../src/lib/transport/base.js';
import HttpTransport from '../src/lib/transport/http.js';
import {
    ServerSymbol,
} from '../src/lib/server/base.js';
import HttpServer from '../src/lib/server/http.js';
import {
    SqlClientSymbol,
} from '../src/lib/sql/base-client.js';
import MysqlClient from '../src/lib/sql/mysql-client.js';

App.configure({
    server: {
        host: '127.0.0.1',
        port: 8088,
    },
    transport: {
        baseURL: 'http://127.0.0.1:8088/',
    },
    db: {
        usePool: true,
        host: 'localhost',
        user: 'homestead',
        database: 'test',
        password : 'secret',
    },
    crypto: {
        password: 'secret',
        salt: 'salt',
    },
    webtoken: {
        keyPair: {
            private: 'test/_jwtRS256.key',
            public: 'test/_jwtRS256.key.pub',
        },
    },
});

App.boot((box, config) => {
    box.factory(ValidatorSymbol, () => new Validator());
    box.singleton(CryptoSymbol, () => new Crypto(config.crypto));
    box.singleton(WebtokenSymbol, () => new Webtoken(config.webtoken));
    box.singleton(TransportSymbol, () => new HttpTransport(config.transport || {}));
    box.singleton(ServerSymbol, () => new HttpServer(config.server || {}));
    box.singleton(SqlClientSymbol, () => new MysqlClient(config.db || {}));
});