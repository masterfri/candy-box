import Collection from '../structures/collection';
import { 
    assertType,
} from '../helpers';
import BaseRepository, {
    EntityNotFoundError,
 } from './base';
import {
    CountAggregator,
    SumAggregator,
    AvgAggregator,
    MinAggregator,
    MaxAggregator,
} from '../query/aggregators';

const makeSorter = (sort) => {
    return (a, b) => {
        for (let order of sort) {
            let sign = order.compare(a[order.prop], b[order.prop]);
            if (sign !== 0) {
                return sign;
            }
        }
        return 0;
    }
}

const assertKeyFound = (key) => {
    if (key === -1) {
        throw new EntityNotFoundError(`Element with key '${key}' was not found in repository`);
    }
}

class ResidentRepository extends BaseRepository
{
    constructor(type, collection = null) {
        super(type);
        this._nextKey = 0;
        this.attachTo(collection !== null ? collection : new Collection());
    }
    
    attachTo(collection) {
        assertType(collection, Collection);
        collection.forEach((object) => {
            assertType(object, this._type);
            this.updateNextKey(object.getKey());
        });
        this._items = collection;
    }
    
    nextKey() {
        return ++this._nextKey;
    }
    
    updateNextKey(key) {
        if (isNaN(key)) {
            throw new TypeError('Element key should be numeric');
        }
        if (key > this._nextKey) {
            this._nextKey = Number(key);
        }
    }
    
    findIndex(key) {
        return this._items.findIndex((item) => item.getKey() == key);
    }
    
    getIndex(index) {
        return this._items.at(index);
    }

    purge() {
        this._items.clear();
    }
    
    get(key) {
        return new Promise((resolve) => {
            let index = this.findIndex(key);
            assertKeyFound(index);
            resolve(this.getIndex(index));
        });
    }
    
    search(query) {
        return new Promise((resolve) => {
            let normQuery = this.normalizeQuery(query);
            let condition = normQuery.condition;
            let results = this._items.filter((item) => condition.isValid(item));

            if (normQuery.order.length !== 0) {
                results = results.sort(makeSorter(normQuery.order));
            }
            
            if (normQuery.group.length !== 0) {
                let groups = results.group(normQuery.group);
                results = new Collection(groups.map((g) => g.items[0]));
            }
            
            if (normQuery.limit !== false) {
                resolve(results.slice(normQuery.start, normQuery.start + normQuery.limit));
            } else if (normQuery.start !== 0) {
                resolve(results.slice(normQuery.start));
            } else {
                resolve(results);
            }
        });
    }
    
    store(object) {
        return new Promise((resolve) => {
            assertType(object, this._type);

            if (!object.hasKey()) {
                object.setKey(this.nextKey());
                this._items.push(object);
            } else {
                let index = this.findIndex(object.getKey());
                if (index === -1) {
                    this._items.push(object);
                } else {
                    this._items.insert(object, index);
                }
                this.updateNextKey(object.getKey());
            }
            
            resolve(object);
        });
    }
    
    delete(key) {
        return new Promise((resolve) => {
            let index = this.findIndex(key);
            assertKeyFound(index);
            this._items.removeIndex(index);

            resolve(true);
        });
    }
    
    exists(query) {
        return new Promise((resolve) => {
            let normQuery = this.normalizeQuery(query);
            let condition = normQuery.condition;
            let result = this._items.some((item) => {
                return condition.isValid(item)
            });

            resolve(result);
        });
    }
    
    count(query = null) {
        if (query === null) {
            return Promise.resolve(this._items.length);
        }

        return this.aggregate(query, null, new CountAggregator());
    }
    
    sum(attribute, query = null) {
        return this.aggregate(query, attribute, new SumAggregator());
    }
    
    avg(attribute, query = null) {
        return this.aggregate(query, attribute, new AvgAggregator());
    }
    
    min(attribute, query = null) {
        return this.aggregate(query, attribute, new MinAggregator());
    }
    
    max(attribute, query = null) {
        return this.aggregate(query, attribute, new MaxAggregator());
    }
    
    forEach(query, callback) {
        if (query === null) {
            this._items.forEach((item) => {
                callback(item);
            });    
        } else {
            let normQuery = this.normalizeQuery(query);
            let condition = normQuery.condition;
            this._items.forEach((item) => {
                if (condition.isValid(item)) {
                    callback(item);
                }
            });
        }
    }
    
    aggregate(query, attribute, aggregator) {
        return new Promise((resolve) => {
            this.forEach(query, (item) => {
                aggregator.add(attribute === null ? item : item[attribute]);
            });
        
            resolve(aggregator.getResult());
        });
    }
}

export default ResidentRepository;