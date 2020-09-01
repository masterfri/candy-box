import Collection from './collection';
import {
    makeMutator, 
    argsToArray,
} from '../helpers';

class TypedCollection extends Collection
{
    constructor(type, items = []) {
        let mutator = makeMutator(type);
        super(items.map(mutator));
        this._mutator = mutator;
        this._type = type;
    }
    
    make(items = []) {
        return new TypedCollection(this._type, items);
    }
    
    push(...args) {
        return this._items.push(...argsToArray(args).map(this._mutator));
    }
    
    unshift(...args) {
        return this._items.unshift(...argsToArray(args).map(this._mutator));
    }
    
    splice(...args) {
        return this._items.splice(
            ...argsToArray(args, 0, 2)
            .concat(argsToArray(args, 2).map(this._mutator))
        );
    }
}

export default TypedCollection;