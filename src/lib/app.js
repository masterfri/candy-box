import Box from './box';
import Validator, {
    ValidatorInterface,
} from './validation/validator'; 
import {
    TransportInterface,
} from './transport/base';
import HttpTransport from './transport/http';
import {
    ServerInterface,
} from './server/base';
import HttpServer from './server/http';

const app = new Box();

const boot = (config = {}) => {
    app.factory(ValidatorInterface, () => new Validator());
    app.singleton(TransportInterface, () => new HttpTransport(config.transport || {}));
    app.singleton(ServerInterface, () => new HttpServer(config.server || {}));
}

export default app;

export {
    boot,
};