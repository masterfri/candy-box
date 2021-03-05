import Box from './box.js';

const AppData = {
    props: {},
    config: {},
    box: new Box(),
};

const ENV = 'env';

const App = {
    use(b) {
        AppData.box = b;
    },

    configure(cfg) {
        AppData.config = {
            ...AppData.config,
            ...cfg,
        };
    },

    setProp(key, value) {
        AppData.props[key] = value;
    },

    getProp(key, fallback = null) {
        if (key in AppData.props) {
            return AppData.props[key];
        }
        return fallback;
    },

    setEnv(name) {
        App.setProp(ENV, name);
    },

    getEnv() {
        return App.getProp(ENV, undefined);
    },

    make(name, ...params) {
        return AppData.box.make(name, ...params);
    },

    boot(invoker) {
        invoker(AppData.config);
    },
};

export default App;