import Box from './box.js';
import App from './app.js';
import Validator, {
    ValidatorSymbol,
} from './validation/validator.js'; 
import Crypto, {
    CryptoSymbol,
} from './security/crypto.js';
import Webtoken, {
    WebtokenSymbol,
} from './security/webtoken.js';
import {
    TransportSymbol,
} from './transport/base.js';
import HttpTransport from './transport/http.js';
import {
    ServerSymbol,
} from './server/base.js';
import HttpServer from './server/http.js';
import {
    SqlClientSymbol,
} from './sql/base-client.js';
import MysqlClient from './sql/mysql-client.js';

const boot = (config = {}) => {
    let box = new Box();
    box.factory(ValidatorSymbol, () => new Validator());
    box.singleton(CryptoSymbol, () => new Crypto(config.crypto));
    box.singleton(WebtokenSymbol, () => new Webtoken(config.webtoken));
    box.singleton(TransportSymbol, () => new HttpTransport(config.transport || {}));
    box.singleton(ServerSymbol, () => new HttpServer(config.server || {}));
    box.singleton(SqlClientSymbol, () => new MysqlClient(config.db || {}));
    App.use(box);
}

export default boot;