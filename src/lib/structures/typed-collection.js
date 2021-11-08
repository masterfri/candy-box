import Collection from './collection.js';
import { makeMutator } from '../helpers.js';

/**
 * Collection with strict type of elements
 * 
 * @class
 * @augments Collection
 */
class TypedCollection extends Collection
{
    /**
     * @protected
     * @var {Function}
     */
    _mutator;

    /**
     * @protected
     * @var {any}
     */
    _type;

    /**
     * @param {any} type Type of elements being stored into collection
     * @param {Array} [items=[]] Initial set of elements 
     */
    constructor(type, items = []) {
        let mutator = makeMutator(type);
        super(items.map(mutator));
        this._mutator = mutator;
        this._type = type;
    }
    
    /**
     * @override
     * @inheritdoc
     */
    newCollection(items = []) {
        return new this.constructor(this._type, items);
    }
    
    /**
     * @override
     * @inheritdoc
     */
    push(...args) {
        return this._items.push(
            ...Array.from(args)
                .map(this._mutator)
        );
    }
    
    /**
     * @override
     * @inheritdoc
     */
    unshift(...args) {
        return this._items.unshift(
            ...Array.from(args)
                .map(this._mutator)
        );
    }
    
    /**
     * @override
     * @inheritdoc
     */
    splice(...args) {
        return this._items.splice(
            ...Array.from(args).slice(0, 2)
                .concat(
                    Array.from(args)
                        .slice(2)
                        .map(this._mutator)
                )
        );
    }
}

export default TypedCollection;