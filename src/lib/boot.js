import Box from './box.js';
import App from './app.js';
import Validator, {
    ValidatorSymbol,
} from './validation/validator.js'; 
import {
    TransportSymbol,
} from './transport/base.js';
import HttpTransport from './transport/http.js';
import {
    ServerSymbol,
} from './server/base.js';
import HttpServer from './server/http.js';

const boot = (config = {}) => {
    let box = new Box();
    box.factory(ValidatorSymbol, () => new Validator());
    box.singleton(TransportSymbol, () => new HttpTransport(config.transport || {}));
    box.singleton(ServerSymbol, () => new HttpServer(config.server || {}));
    App.use(box);
}

export default boot;