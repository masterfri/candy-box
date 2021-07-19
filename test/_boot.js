import boot from '../src/lib/boot.js';

boot({
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