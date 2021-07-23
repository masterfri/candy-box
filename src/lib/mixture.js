import {
    isFunction,
    isSubclass } from './helpers.js';

const isComponent = (target) => {
    return isSubclass(target, Component);
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

const collectComponentMethods = (component) => {
    let result = {};
    getPrototypeChain(component).forEach(proto => {
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
 * Base class for all components
 * 
 * @class
 */
class Component
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
        let methods = collectComponentMethods(this);
        Object.keys(methods).forEach((method) => {
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
 * This class allows to attach components to inherited subclasses
 * 
 * @class
 */
class Mixture
{
    /**
     * @example
     * class Productor extends Component
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
     *     components() {
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
        this.components().forEach(component => {
            if (isComponent(component)) {
                component.boot(this);
            }
        });
    }

    /**
     * This method provides a list of components
     * 
     * @returns {Array}
     */
    components() {
        return [];
    }
}

export {
    Component,
    Mixture,
}