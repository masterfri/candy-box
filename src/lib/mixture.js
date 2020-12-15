import {
    isFunction,
    isSubclass,
} from './helpers';

const isTrait = (target) => {
    return isSubclass(target, Trait);
}

const forbidConstructor = (obj) => {
    throw new InterfaceError(
        `Illegal attempt to construct an instance of ${obj.constructor.name}`
    );
}

const getPrototypeChain = (begin) => {
    let chain = [begin];
    let proto = begin;
    while ((proto = Object.getPrototypeOf(proto)) !== null) {
        chain.push(proto);
    }
    return chain;
}

const collectTraitMethods = (trait) => {
    let result = {};
    getPrototypeChain(trait).forEach(proto => {
        if (proto.hasOwnProperty('methods')) {
            let methods = proto.methods();
            for (let name in methods) {
                if (result[name] === undefined) {
                    result[name] = methods[name];
                }
            }
        }
    });
    return result;
}

/**
 * Base class for all traits
 * 
 * @class
 */
class Trait
{
    /**
     * This constructor should never by called
     */
    constructor() {
        forbidConstructor(this);
    }

    /**
     * Extend class behavior
     * 
     * @static
     * @param {Object} object Object being booted
     * @see Mixture
     */
    static boot(object) {
        let methods = collectTraitMethods(this);
        Object.keys(methods).forEach(method => {
            let objectMethod = object[method];
            if (!isFunction(objectMethod)) {
                if (objectMethod === undefined && !object.hasOwnProperty(method)) {
                    Object.defineProperty(object, method, {
                        enumerable: false,
                        configurable: false,
                        writable: false,
                        value: methods[method].bind(object),
                    });
                }
            }
        });
    }
}

/**
 * This class allows to attach traits to inherited subclasses
 * 
 * @class
 */
class Mixture
{
    /**
     * @example
     * class Productor extends Trait
     * {
     *     static methods() {
     *         return {
     *             product(a, b) {
     *                 return a * b;
     *             }
     *         };
     *     }
     * }
     *
     * class Math extends Mixture
     * {
     *     mixins() {
     *         return [
     *             Productor,
     *         ];
     *     }
     * }
     * 
     * let math = new Math();
     * math.product(3, 5) => 15
     */
    constructor() {
        this.mixins().forEach(mixin => {
            if (isTrait(mixin)) {
                mixin.boot(this);
            }
        });
    }

    /**
     * This method provides a list of mixins
     * 
     * @returns {Array}
     */
    mixins() {
        return [];
    }
}

export {
    Trait,
    Mixture,
}