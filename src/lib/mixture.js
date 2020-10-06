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
}

class Mixture
{
    constructor() {
        this.mixins().forEach(mixin => {
            if (isTrait(mixin)) {
                mixin.boot(this);
            }
        });
    }

    mixins() {
        return [];
    }
}

export {
    Trait,
    Mixture,
}