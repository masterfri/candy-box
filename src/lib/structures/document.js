import {
    makeMutator,
    toArray,
    is,
    valueOf,
    isNil } from '../helpers.js';
import collect from './typed-collection.js';

class Attribute
{
    /**
     * @protected
     * @var {any}
     */
    _defaults;

    /**
     * @param {any} [defaults=undefined]
     */
    constructor(defaults = undefined) {
        this._defaults = defaults;
    }

    /**
     * Initialize attribute
     * 
     * @param {Document} target 
     * @param {String} name 
     */
    init(target, name) {
        Object.defineProperty(target, name, {
            enumerable: true,
            configurable: false,
            get: () => this.get(target, name),
            set: (val) => {
                this.set(target, name, val);
            },
        });
        if (this._defaults !== undefined) {
            target.set(name, valueOf(this._defaults));
        }
    }

    /**
     * Get value from target
     * 
     * @param {Document} target 
     * @param {String} attribute 
     * @returns {any}
     */
    get(target, attribute) {
        return target.get(attribute);
    }

    /**
     * Set value on target
     * 
     * @param {Document} target 
     * @param {String} name 
     * @param {any} val 
     */
    set(target, name, val) {
        target.set(name, val);
    }

    /**
     * Make numeric attribute
     * 
     * @param {Number} [defaults=undefined]
     * @param {Boolean} [nullable=true]
     * @returns {TypedAttribute}
     */
    static number(defaults = undefined, nullable = true) {
        return new TypedAttribute(Number, defaults, nullable);
    }

    /**
     * Make string attribute
     * 
     * @param {String} [defaults=undefined]
     * @param {Boolean} [nullable=true]
     * @returns {TypedAttribute}
     */
    static string(defaults = undefined, nullable = true) {
        return new TypedAttribute(String, defaults, nullable);
    }

    /**
     * Make boolean attribute
     * 
     * @param {Boolean} [defaults=false]
     * @param {Boolean} [nullable=true]
     * @returns {TypedAttribute}
     */
    static boolean(defaults = false, nullable = true) {
        return new TypedAttribute(Boolean, defaults, nullable);
    }

    /**
     * Make object attribute
     * 
     * @param {Function} [type=Object]
     * @param {Object} [defaults=undefined]
     * @param {Boolean} [nullable=true]
     * @returns {TypedAttribute}
     */
    static object(type = Object, defaults = undefined, nullable = true) {
        return new TypedAttribute(type, defaults, nullable);
    }

    /**
     * Make array attribute
     * 
     * @param {Array} [defaults=[]]
     * @param {Boolean} [nullable=true]
     * @returns {TypedAttribute}
     */
    static array(defaults = [], nullable = true) {
        return new TypedAttribute(Array, defaults, nullable);
    }

    /**
     * Make array attribute
     * 
     * @param {Function} type
     * @param {Array} [defaults=[]]
     * @param {Boolean} [nullable=true]
     * @returns {TypedAttribute}
     */
    static collection(type, defaults = [], nullable = true) {
        return new CollectionAttribute(type, defaults, nullable);
    }
}

class TypedAttribute extends Attribute
{
    /**
     * @protected
     * @var {Function}
     */
    _mutator;    

    /**
     * @param {Function} [type=null] 
     * @param {any} [defaults=undefined]
     * @param {Boolean} [nullable=true]
     */
    constructor(type = null, defaults = undefined, nullable = true) {
        super(defaults);
        this._mutator = this._makeMutator(type, nullable);
    }

    /**
     * Set value on target
     * 
     * @param {Document} target 
     * @param {String} name 
     * @param {any} val 
     */
    set(target, name, val) {
        target.set(name, this._mutator(val));
    }

    /**
     * Make mutator for attribute
     * 
     * @param {Function} type 
     * @param {Boolean} nullable
     * @returns {Function}
     */
    _makeMutator(type, nullable) {
        return makeMutator(type, nullable);
    }
}

class CollectionAttribute extends TypedAttribute
{
     /**
     * @param {Function} type
     * @param {any} [defaults=[]]
     * @param {Boolean} [nullable=true]
     */
    constructor(type, defaults = [], nullable = true) {
        super(type, () => this._mutator(defaults), nullable);
        this._mutator = this._makeMutator(type, nullable);
    }

    /**
     * @inheritdoc
     */
    _makeMutator(type, nullable) {
        if (nullable) {
            return (v) => isNil(v) ? null : collect(toArray(v), type)
        }
        return (v) => collect(toArray(v), type)
    }
}

/**
 * Base class for all documents
 * 
 * @class
 */
class Document
{
    /**
     * Document attributes values
     * 
     * @protected
     * @var {Object}
     */
    _attributes = {};

    /**
     * @param {Object} [attributes={}] Data to fill document attributes
     */ 
    constructor(attributes = {}) {
        this._setupAttributes();
        this.assign(attributes);
    }

    /**
     * This method provides list of document attributes
     * 
     * @returns {Object}
     * @example
     * class Package extends Document
     * {
     *     attributes() {
     *         return {
     *             color: Attribute.string('orange'),
     *             weight: Attribute.number(),
     *             nested_packages: Attribute.collection(Package),
     *         };
     *     }
     * }
     */
    attributes() {
        return {};
    }
    
    /**
     * Assign document attributes
     * 
     * @param {Object} attributes 
     */
    assign(attributes) {
        Object.assign(this, attributes);
    }
    
    /**
     * Get document attribute value
     * 
     * @param {String} name Attribute name
     * @returns {any}
     */
    get(name) {
        return (name in this._attributes) 
            ? this._attributes[name] 
            : null;
    }
    
    /**
     * Get document attribute value
     * 
     * @param {String} name Attribute name
     * @param {any} value Value to assign
     */
    set(name, value) {
        this._attributes[name] = value;
    }
    
    /**
     * Export attributes from the document
     * 
     * @returns {Object}
     */
    export() {
        return Object.assign({}, this._attributes);
    }
    
    /**
     * Get document key name
     * 
     * @returns {String}
     */
    getKeyName() {
        return 'id';
    }
    
    /**
     * Get document key value
     * 
     * @returns {any}
     */
    getKey() {
        return this.get(this.getKeyName());
    }
    
    /**
     * Assign document key value
     * 
     * @param {any} value 
     */
    setKey(value) {
        this.set(this.getKeyName(), value);
    }
    
    /**
     * Check if document key was assigned
     * 
     * @returns {Boolean}
     */
    hasKey() {
        return this.getKey() !== null;
    }
    
    /**
     * Make a copy of the document
     * 
     * @returns {Document}
     */
    clone() {
        return new this.constructor(this._attributes);
    }

    /**
     * Setup document attributes
     * 
     * @protected
     */
    _setupAttributes() {
        let attrs = this.attributes();
        for (let name in attrs) {
            if (is(attrs[name], Attribute)) {
                attrs[name].init(this, name);
            } else {
                (new TypedAttribute(attrs[name])).init(this, name);
            }
        }
    }
}

export default Document;

export {
    Attribute,
    TypedAttribute,
    CollectionAttribute,
}