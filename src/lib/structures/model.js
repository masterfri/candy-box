import Collection from './collection';
import TypedCollection from './typed-collection';
import {
    Mixture,
} from '../mixture';
import {
    makeMutator,
    onlyProps,
    getProps,
    isFunction,
    isObject,
} from '../helpers';

const setupAttribute = (target, name, defs) => {
    let descriptor = {
        enumerable: true,
        configurable: false,
    };
    
    if (defs.get !== undefined) {
        descriptor.get = () => {
            return defs.get(target.get(name));
        }
    } else {
        descriptor.get = () => {
            return target.get(name);
        }
    }
    
    if (defs.set !== undefined) {
        descriptor.set = (val) => {
            target.set(name, defs.set(val, target.get(name)));
        }
    } else if (defs.type === Array) {
        if (defs.elementsType !== undefined) {
            descriptor.set = (val) => {
                target.set(name, new TypedCollection(defs.elementsType, val));
            }
        } else {
            descriptor.set = (val) => {
                target.set(name, new Collection(val));
            }
        }
    } else if (defs.type !== undefined) {
        let mutator = makeMutator(defs.type);
        descriptor.set = (val) => {
            target.set(name, mutator(val));
        }
    } else {
        descriptor.set = (val) => {
            target.set(name, val);
        }
    }
    
    Object.defineProperty(target, name, descriptor);
    
    if (defs.default !== undefined) {
        target[name] = defs.default;
    } else if (defs.type === Array) {
        target[name] = [];
    }
}

const setupAttributes = (target, defs) => {
    for (let name in defs) {
        setupAttribute(target, name, 
            isFunction(defs[name]) 
                ? {type: defs[name]} 
                : defs[name]
        );
    }
}

const toNative = (thing) => {
    if (thing instanceof Model) {
        return thing.toObject();
    }
    
    if (thing instanceof Collection) {
        return toNative(thing.items);
    }
    
    if (thing instanceof Array) {
        return thing.map((item) => toNative(item));
    }
    
    if (isObject(thing)) {
        let flat = {};
        Object.keys(thing).forEach((key) => {
            flat[key] = toNative(thing[key]);
        });
        return flat;
    }
    
    return thing;
}

const isEqual = (a, b) => {
    return a === b;
}

class Model extends Mixture
{
    /**
     * Constructor
     * 
     * @param {object} attributes
     */ 
    constructor(attributes = {}, safe = true, change = true) {
        super();
        this._attributes = {};
        this._originals = {};
        this._watchChanges = false;
        setupAttributes(this, this.attributes());
        this.assign(attributes, safe, change);
    }
    
    assign(attributes, safe = true, change = true) {
        this._watchChanges = change;
        
        if (safe) {
            attributes = onlyProps(attributes, Object.keys(this.attributes()));
        }
        
        Object.assign(this, attributes);
        
        this._watchChanges = true;
    }
    
    get(name) {
        return (name in this._attributes) ? this._attributes[name] : null;
    }
    
    original(name) {
        return (name in this._originals) ? this._originals[name] : this.get(name);
    }
    
    set(name, value) {
        this.touch(name, value);
        this._attributes[name] = value;
    }
    
    touch(name, value) {
        if (this._watchChanges && !this.isChanged(name)) {
            let current = this.get(name);
            if (!isEqual(current, value)) {
                this._originals[name] = current;
            }
        }
    }
    
    revert(attributes = undefined) {
        if (attributes === undefined) {
            this.assign(this._originals, false, false);
            this._originals = {};
        } else {
            (attributes instanceof Array ? attributes : [attributes]).forEach((name) => {
                if (this.isChanged(name)) {
                    this._attributes[name] = this._originals[name];
                    delete this._originals[name];
                }
            });
        }
    }
    
    sync() {
        this._originals = {};
    }
    
    isChanged(name) {
        return (name in this._originals);
    }
    
    toObject() {
        return toNative(this.getValues());
    }
    
    getKeyName() {
        return 'id';
    }
    
    getKey() {
        return this._attributes[this.getKeyName()];
    }
    
    setKey(value) {
        this._attributes[this.getKeyName()] = value;
    }
    
    hasKey() {
        return Boolean(this.getKey());
    }
    
    getValues(names = undefined) {
        return getProps(this, names || Object.keys(this._attributes));
    }
    
    getChanges() {
        return this.getValues(Object.keys(this._originals));
    }
}

export default Model;