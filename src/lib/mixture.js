import {
    isFunction,
    isSubclass,
} from './helpers';

const hasMixin = (mixin, instance) => {
    if (Mixture.prototype.isPrototypeOf(instance)) {
        return instance.mixins().some(target => isMixin(target, mixin));
    }
    return false;
}

const isMixin = (target, parent) => {
    return target === parent || isSubclass(target, parent);
}

const isTrait = (target) => {
    return isSubclass(target, Trait);
}

const isInterface = (target) => {
    return isSubclass(target, Interface);
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

const collectInterfaceMethods = (iface) => {
    let result = [];
    getPrototypeChain(iface).forEach(proto => {
        if (proto.hasOwnProperty('methods')) {
            let methods = proto.methods();
            for (let name of methods) {
                if (result.indexOf(name) === -1) {
                    result.push(name);
                }
            }
        }
    });
    return result;
}

class Interface 
{
    constructor() {
        forbidConstructor(this);
    }

    static validate(object, throwException = false) {
        let methods = collectInterfaceMethods(this);
        for (let method of methods) {
            if (!isFunction(object[method])) {
                if (throwException) {
                    throw new InterfaceError(
                        `${object.constructor.name} must implement ${this.constructor.name}::${method}`
                    );
                }
                return false;
            }
        }
        return true;
    }

    static [Symbol.hasInstance](instance) {
        return hasMixin(this, instance);
    }
}

class Trait
{
    constructor() {
        forbidConstructor(this);
    }

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

    static [Symbol.hasInstance](instance) {
        return hasMixin(this, instance);
    }
}

class Mixture
{
    constructor() {
        this.mixins().forEach(mixin => {
            if (isTrait(mixin)) {
                mixin.boot(this);
            }
        });

        this.mixins().forEach(mixin => {
            if (isInterface(mixin)) {
                mixin.validate(this, true);
            }
        });
    }

    mixins() {
        return [];
    }
}

class InterfaceError extends Error {
}

export {
    Interface,
    Trait,
    Mixture,
    InterfaceError,
}