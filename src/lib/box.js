const constructorName = (constructor) => {
    if (typeof constructor === 'function') {
        return constructor.name;
    }
    return constructor;
}

class Box 
{
    constructor() {
        this._candies = new Map();
    }
    
    factory(name, factory) {
        this._candies.set(name, new Candy(factory));
    }
    
    singleton(name, factory) {
        this._candies.set(name, new CandySingleton(factory));
    }
    
    make(name, ...params) {
        if (!this._candies.has(name)) {
            throw Error(`Can not resolve implementation for "${constructorName(name)}"`);
        }
        return this._candies.get(name).instance(...params);
    }
}

class Candy
{
    constructor(factory) {
        this._factory = factory;
    }
    
    instance(...params) {
        return this._factory(...params);
    }
}

class CandySingleton extends Candy
{
    constructor(factory) {
        super(factory);
        this._instance = null;
    }
    
    instance() {
        if (this._instance === null) {
            this._instance = this._factory();
        }        
        return this._instance;
    }
}

export default Box;