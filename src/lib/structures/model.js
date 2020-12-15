import Collection from './collection';
import TypedCollection from './typed-collection';
import {
    Mixture,
} from '../mixture';
import {
    makeMutator,
    objectDiff,
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

/**
 * Base class for all models
 * 
 * @class
 * @augments Mixture
 */
class Model extends Mixture
{
    /**
     * Model attributes values
     * 
     * @protected
     * @var {Object}
     */
    _attributes = {};
    
    /**
     * Saved state values
     * 
     * @protected
     * @var {Object}
     */
    _state = {};

    /**
     * @param {Object} [attributes={}] Data to fill model attributes
     * @param {Boolean} [saveState=false] Save state after attributes has been assigned
     */ 
    constructor(attributes = {}, saveState = false) {
        super();
        setupAttributes(this, this.attributes());
        this.assign(attributes);
        if (saveState) {
            this.saveState();
        }
    }

    /**
     * This method provides list of model attributes
     * 
     * @returns {Object}
     * @example
     * class Package extends Model
     * {
     *     attributes() {
     *         return {
     *             color: {
     *                 type: String,
     *                 default: 'orange',
     *             },
     *             weight: {
     *                 type: Number,
     *             },
     *             nested_packages: {
     *                 type: Array,
     *                 elementsType: Package,
     *             },
     *         };
     *     }
     * }
     */
    attributes() {
        return {};
    }
    
    /**
     * Assign model attributes
     * 
     * @param {Object} attributes 
     */
    assign(attributes) {
        Object.assign(this, attributes);
    }
    
    /**
     * Get model attribute value
     * 
     * @param {String} name Attribute name
     * @returns {any}
     */
    get(name) {
        return (name in this._attributes) ? this._attributes[name] : null;
    }
    
    /**
     * Get model attribute value
     * 
     * @param {String} name Attribute name
     * @param {any} value Value to assign
     */
    set(name, value) {
        this._attributes[name] = value;
    }
    
    /**
     * Convert model to plain object
     * 
     * @returns {Object}
     */
    toObject() {
        return toNative(this._attributes);
    }
    
    /**
     * Get model key name
     * 
     * @returns {String}
     */
    getKeyName() {
        return 'id';
    }
    
    /**
     * Get model key value
     * 
     * @returns {String}
     */
    getKey() {
        return this.get(this.getKeyName());
    }
    
    /**
     * Assign model key value
     * 
     * @param {any} value 
     */
    setKey(value) {
        this.set(this.getKeyName(), value);
    }
    
    /**
     * Check if model key was assigned
     * 
     * @returns {Boolean}
     */
    hasKey() {
        return this.getKey() !== null;
    }
    
    /**
     * Get values of model attributes
     * 
     * @returns {Object}
     */
    getAttributeValues() {
        return {...this._attributes};
    }

    /**
     * Make a copy of the model
     * 
     * @returns {Model}
     */
    clone() {
        return new this.constructor(this.getAttributeValues());
    }

    /**
     * Memorize current attribute values
     */
    saveState() {
        this._state = {...this._attributes};
    }

    /**
     * Restore memorized attribute values
     */
    revertState() {
        this._attributes = {...this._state};
    }

    /**
     * Forget memorized attribute values
     */
    clearState() {
        this._state = {};
    }

    /**
     * Get list of attributes that were changed since the moment they were memorized
     * 
     * @returns {Object}
     */
    diffState() {
        return objectDiff(this._state, this._attributes);
    }
}

export default Model;