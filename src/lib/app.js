import Box from './box.js';

const AppData = {
    props: {},
    config: {},
    box: new Box(),
    registerStages: [],
    bootStages: [],
    exposed: {},
};

const ENV = 'env';

const pushWithPriority = (array, element, priority) => {
    let index = array.findIndex((el) => el.p > priority);
    if (index === -1) {
        array.push({p: priority, e: element});
    } else {
        array.splice(index, 0, {p: priority, e: element});
    }
}

const App = {
    /**
     * Set box to use
     * 
     * @param {Box} b 
     */
    use(b) {
        AppData.box = b;
    },

    /**
     * Get current box
     * 
     * @returns {Box}
     */
    box() {
        return AppData.box;
    },

    /**
     * Set application configuration
     * 
     * @param {Object} cfg 
     */
    configure(cfg) {
        AppData.config = {
            ...AppData.config,
            ...cfg,
        };
    },

    /**
     * Set application property value
     * 
     * @param {String} key 
     * @param {any} value 
     */
    set(key, value) {
        AppData.props[key] = value;
    },

    /**
     * Get application property value
     * 
     * @param {String} key 
     * @param {any} fallback 
     * @returns {any}
     */
    get(key, fallback = null) {
        if (key in AppData.props) {
            return AppData.props[key];
        }
        return fallback;
    },

    /** 
     * Get/set application environment
     * 
     * @param {...any} args
     */
    env(...args) {
        if (args.length === 0) {
            return App.get(ENV, undefined);
        }
        App.set(ENV, args[0]);
    },

    /**
     * Make application component
     * 
     * @param {String} name 
     * @param  {...any} params 
     * @returns {any}
     */
    make(name, ...params) {
        return AppData.box.make(name, ...params);
    },

    /**
     * Add registration stage
     * 
     * @param {Function} invoker 
     * @param {Number} priority
     */
    register(invoker, priority = 0) {
        pushWithPriority(AppData.registerStages, invoker, priority);
    },

    /**
     * Add boot stage
     * 
     * @param {Function} invoker 
     * @param {Number} priority
     */
    boot(invoker, priority = 0) {
        pushWithPriority(AppData.bootStages, invoker, priority);
    },

    /**
     * Expose stuff to be available during boot
     * 
     * @param {String} name 
     * @param {any} stuff 
     */
    expose(name, stuff) {
        AppData.exposed[name] = stuff;
    },

    /**
     * Run application
     */
    run() {
        let allStages = [
            ...AppData.registerStages,
            ...AppData.bootStages,
        ];
        
        allStages.forEach((invoker) => {
            invoker.e({
                ...AppData.exposed,
                box: AppData.box, 
                config: AppData.config, 
                props: AppData.props,
            });
        });
    }
};

export default App;