const constructorName = (constructor) => {
    if (typeof constructor === 'function') {
        return constructor.name;
    }
    if (typeof constructor === 'symbol') {
        return constructor.description;
    }
    if (typeof constructor === 'string') {
        return constructor;
    }
    return 'unknown';
}

class Box 
{
    constructor() {
        this._candies = new Map();
    }
 
    /**
     * Register component factory
     * 
     * @param {String|Function|Symbol} name 
     * @param {Function} factory 
     */
    factory(name, factory) {
        this._candies.set(name, new Candy(factory));
    }
    
    /**
     * Register signleton component factory
     * 
     * @param {String|Function|Symbol} name 
     * @param {Function} factory 
     */
    singleton(name, factory) {
        this._candies.set(name, new CandySingleton(factory));
    }
    
    /**
     * Make the component
     * 
     * @param {String|Function|Symbol} name 
     * @param  {...any} params 
     * @returns 
     */
    make(name, ...params) {
        if (!this._candies.has(name)) {
            throw Error(`Can not resolve implementation for "${constructorName(name)}"`);
        }
        return this._candies.get(name).instance(...params);
    }
}

class Candy
{
    /**
     * @param {Function} factory 
     */
    constructor(factory) {
        this._factory = factory;
    }
    
    /**
     * Make an instance of the component
     * 
     * @param  {...any} params 
     * @returns {any}
     */
    instance(...params) {
        return this._factory(...params);
    }
}

class CandySingleton extends Candy
{
    /**
     * @inheritdoc
     */
    constructor(factory) {
        super(factory);
        this._instance = null;
    }
    
    /**
     * Make a singleton component
     * 
     * @returns {any}
     */
    instance() {
        if (this._instance === null) {
            this._instance = this._factory();
        }        
        return this._instance;
    }
}

export default Box;