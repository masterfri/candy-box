import Box from './box';
import App from './app';
import Validator, {
    ValidatorSymbol,
} from './validation/validator'; 
import {
    TransportSymbol,
} from './transport/base';
import HttpTransport from './transport/http';
import {
    ServerSymbol,
} from './server/base';
import HttpServer from './server/http';

const boot = (config = {}) => {
    let box = new Box();
    box.factory(ValidatorSymbol, () => new Validator());
    box.singleton(TransportSymbol, () => new HttpTransport(config.transport || {}));
    box.singleton(ServerSymbol, () => new HttpServer(config.server || {}));
    App.use(box);
}

export default boot;