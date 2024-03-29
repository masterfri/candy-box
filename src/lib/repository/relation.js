import {
    is, 
    isArray,
    isFunction,
    isNil,
    dedupe } from '../helpers.js';
import Query, {
    Assert,
    Sort } from '../query/query.js';
import Document, {
    Attribute } from '../structures/document.js';

class Relation
{
    /**
     * @var {Document}
     * @protected
     */
    _holder;

    /**
     * @var {RelationConfig}
     * @protected
     */
    _config;

    /**
     * @protected
     * @var {any}
     */
    _value = undefined;

    /**
     * @protected
     * @var {Promise}
     */
    _promise = null;

    /**
     * @param {Document} holder
     * @param {AbstractRepository} repository 
     * @param {String} localKey
     * @param {String} foreignKey
     * @param {RelationQuery} query
     */
    constructor(holder, config) {
        this._holder = holder;
        this._config = config;
    }

    /**
     * Assign related value
     * 
     * @param {any} value
     * @returns {Relation}
     */
    set(value) {
        this._value = this._normalizeValue(value);
        this._promise = Promise.resolve(this._value);
        return this;
    }

    /**
     * Resolve related value
     * 
     * @returns {Promise}
     */
    get() {
        if (this._promise === null) {
            this._promise = this._resolve();
        }
        return this._promise;
    }

    /**
     * Load portion of related values
     * 
     * @param {Number} start 
     * @param {Number} count 
     * @returns {Promise}
     */
    slice(start, count) {
        let key = this._holder.get(this.localKey);
        let query = this._newQuery([key])
            .startFrom(start)
            .limitTo(count);
        return this.repository.search(query);
    }

    /**
     * Clear related value
     * 
     * @returns {Relation}
     */
    clear() {
        this._value = undefined;
        this._promise = null;
        return this;
    }

    /**
     * Get fresh related value
     * 
     * @returns {Promise}
     */
    fresh() {
        this.clear();
        return this.get();
    }

    /**
     * Init relation with empty value
     * 
     * @returns {any}
     */
    init() {
        this.set([]);
        return this._value;
    }

    /**
     * Export resolved value into plain object
     * 
     * @param {Function} [callback=null] 
     * @returns {Array|null}
     */
    export(callback = null) {
        if (this._value !== undefined) {
            return this._value.map((item) => {
                return callback === null ? item.export() : callback(item);
            });
        }
        return null;
    }

    /**
     * Load relations on specified target
     * 
     * @param {Document|Array} target
     * @param {String|Array|Function|QueryCollection} relation
     * @param {Boolean} [skipResolved=true]
     * @returns {Promise}
     */
    static resolve(target, relation, skipResolved = true) {
        if (is(target, Document)) {
            target = [target];
        } else if (!isArray(target)) {
            throw new Error('Invalid target to load relations on');
        }

        if (target.length === 0) {
            return Promise.resolve();
        }

        let guide = target[0];
        let relations;
        if (is(relation, QueryCollection)) {
            relations = relation;
        } else {
            relations = new QueryCollection();
            if (isFunction(relation)) {
                relation(relations);
            } else {
                relations.query(relation);
            }
        }
        
        return Promise.all(relations.queries.map((query) => {
            let relation = guide[query.name];
            return relation._resolveFor(target, query, skipResolved);
        }));
    }

    /**
     * Determines if relation is resolved
     * 
     * @returns {Boolean}
     */
    get isResolved() {
        return this._value !== undefined;
    }

    /**
     * Resolved value
     * 
     * @var {any}
     */
    get value() {
        return this._value;
    }

    /**
     * Alias for `value`
     * 
     * @var {any}
     */
    get $() {
        return this._value;
    }

    /**
     * Related repository
     * 
     * @var {AbstractRepository}
     */
    get repository() {
        return this._config.repository;
    }

    /**
     * Local key name
     * 
     * @var {String}
     */
    get localKey() {
        return this._config.localKey;
    }

    /**
     * Foreign key name
     * 
     * @var {String}
     */
    get foreignKey() {
        return this._config.foreignKey;
    }

    /**
     * Resolve relation value
     * 
     * @returns {Promise}
     */
    _resolve() {
        let key = this._holder.get(this.localKey);
        return this.repository
            .search(this._newQuery([key]))
            .then((result) => {
                let query = this._config.query;
                this._value = this._consumeResult(result);
                if (query.hasLinked) {
                    return Relation.resolve(result, query.linked, false)
                        .then(() => this._value);
                }
                return this._value;
            });
    }

    /**
     * Resolve related values for the given holders
     * 
     * @protected
     * @param {Array} holders 
     * @param {RelationQuery} relationQuery
     * @param {Boolean} skipResolved
     * @returns {Promise}
     */
     _resolveFor(holders, relationQuery, skipResolved) {
        let attr = relationQuery.name;
        let localKey = this.localKey;
        let effective = skipResolved
            ? holders.filter((holder) => !holder[attr].isResolved)
            : holders;
        let keys = effective
            .map((holder) => holder.get(localKey))
            .filter((key) => key !== null);
        if (keys.length === 0) {
            return Promise.resolve([]);
        }
        let query = this._newQuery(dedupe(keys));
        relationQuery.applyTo(query);
        return this.repository.search(query)
            .then((result) => {
                effective.forEach((holder) => {
                    let key = holder.get(localKey);
                    let foreignKey = this.foreignKey;
                    holder[attr].set(this._consumeResult(
                        result.filter((document) => document.get(foreignKey) === key)
                    ));
                });
                if (relationQuery.hasLinked) {
                    let subholders = this._collectFrom(holders, attr);
                    return Relation.resolve(subholders, relationQuery.linked, skipResolved)
                        .then(() => result);
                }
                return result;
            });
    }

    /**
     * Collect relation attribute from documents
     * 
     * @protected
     * @param {Array} holders 
     * @param {String} attr 
     * @return {Array}
     */
    _collectFrom(holders, attr) {
        let result = [];
        holders.forEach((holder) => {
            let value = holder[attr].value;
            if (isArray(value)) {
                result.push(...value);
            } else if (is(value, Document)) {
                result.push(value);
            }
        });
        return dedupe(result);
    }

    /**
     * Create related value from queried result
     * 
     * @protected
     * @param {Array} result 
     * @returns {any}
     */
    _consumeResult(result) {
        return result;
    }

    /**
     * Normalize assigned value
     * 
     * @protected
     * @param {any} value 
     * @returns {any}
     */
    _normalizeValue(value) {
        if (isArray(value)) {
            return value.map((doc) => this._toDocument(doc));
        }
        if (isNil(value)) {
            return [];
        }
        return [this._toDocument(value)];
    }

    /**
     * Conver value to a document
     * 
     * @param {any} value 
     * @returns {Document}
     */
    _toDocument(value) {
        if (is(value, Document)) {
            return value;
        }
        return this.repository.newDocument(value);
    }
 
    /**
     * Make new query instance
     * 
     * @protected
     * @param {Array} keys
     * @returns {Query}
     */
    _newQuery(keys) {
        let query = new Query();
        query.where(this.foreignKey, Assert.IN, keys);
        this._config.query.applyTo(query);
        return query;
    }
}

class RelationQuery
{
    /**
     * @protected
     * @var {String}
     */
    _name;

    /**
     * @protected
     * @var {QueryCollection}
     */
    _with = new QueryCollection();

    /**
     * @protected
     * @var {Array}
     */
    _wheres = [];

    /**
     * @protected
     * @var {Array}
     */
    _order = [];

    /**
     * @param {String} name 
     */
    constructor(name) {
        this._name = name;
    }

    /**
     * Add condition to relation query
     * 
     * @param  {...any} args
     * @returns {RelationQuery}
     */
    where(...args) {
        this._wheres.push((cond) => {
            cond.where(...args);
        });
        return this;
    }

    /**
     * Add sort order to relation query
     * 
     * @param  {...any} args
     * @returns {RelationQuery}
     */
    orderBy(...args) {
        this._order.push((query) => {
            query.orderBy(...args);
        });
        return this;
    }

    /**
     * Add ascending sort order to relation query
     * 
     * @param {String} prop 
     * @returns {RelationQuery}
     */
    ascendingBy(prop) {
        return this.orderBy(prop, Sort.ASC);
    }
    
    /**
     * Add descending sort order to relation query
     * 
     * @param {String} prop 
     * @returns {RelationQuery}
     */
    descendingBy(prop) {
        return this.orderBy(prop, Sort.DESC);
    }

    /**
     * Setup following relation
     * 
     * @param {any} relation 
     * @returns {RelationQuery}
     */
    with(relation) {
        if (isFunction(relation)) {
            relation(this._with);
        } else {
            this._with.query(relation);
        }
        return this;
    }

    /**
     * Alternate query
     * 
     * @param {Query} query
     */
    applyTo(query) {
        this._wheres.forEach((where) => {
            where(query.condition);
        });
        this._order.forEach((sort) => {
            sort(query);
        });
    }

    /**
     * Name of relation
     * 
     * @var {String}
     */
    get name() {
        return this._name;
    }

    /**
     * Linked relations
     * 
     * @var {QueryCollection}
     */
    get linked() {
        return this._with;
    }

    /**
     * Determines if query has linked relations
     * 
     * @var {Boolean}
     */
    get hasLinked() {
        return this._with.length !== 0;
    }
}

class QueryCollection
{
    /**
     * @protected
     * @var {Array}
     */
    _queries = [];

    /**
     * Add relation query
     * 
     * @param {String|Array} name 
     * @returns {RelationQuery|Array}
     */
    query(name) {
        if (isArray(name)) {
            return name.map((rel) => this.query(rel));
        }
        let query = new RelationQuery(name);
        this._queries.push(query);
        return query;
    }

    /**
     * List of queries
     * 
     * @var {Array}
     */
    get queries() {
        return this._queries;
    }

    /**
     * Number of queries
     * 
     * @var {Number}
     */
    get length() {
        return this._queries.length;
    }
}

class OneToOne extends Relation
{
    /**
     * @inheritdoc
     * @override
     */
    _consumeResult(result) {
        return result.length !== 0 ? result[0] : null;
    }

    /**
     * @inheritdoc
     * @override
     */
    _normalizeValue(value) {
        if (isNil(value)) {
            return null;
        }
        return this._toDocument(value);
    }

    /**
     * @inheritdoc
     * @override
     */
    set(value) {
        super.set(value);
        if (!isNil(this._value)) {
            let valueKey = this._value.get(this.foreignKey);
            if (valueKey) {
                this._holder.set(this.localKey, valueKey);
            }
        }
    }

    /**
     * @inheritdoc
     * @override
     */
    init() {
        this.set(null);
        return this._value;
    }

    /**
     * Export resolved value into plain object
     * 
     * @param {Function} [callback=null] 
     * @returns {Object|null}
     */
    export(callback = null) {
        if (this._value !== undefined) {
            return callback === null ? this._value.export() : callback(this._value);
        }
        return null;
    }
}

class OneToMany extends Relation
{
    /**
     * @inheritdoc
     * @override
     */
    set(value) {
        super.set(value);
        let key = this._holder.get(this.localKey);
        if (key) {
            this._value.forEach((document) => {
                document.set(this.foreignKey, key);
            });
        }
    }
}

class RelationConfig 
{
    /**
     * @protected
     * @var {AbstractRepository}
     */
     _repository;

     /**
      * @protected
      * @var {String}
      */
    _localKey;
 
     /**
      * @protected
      * @var {String}
      */
    _foreignKey;

    /**
     * @protected
     * @var {RelationQuery}
     */
    _query;

    /**
     * @param {AbstractRepository} repository
     * @param {String} localKey
     * @param {String} foreignKey
     */
    constructor(repository, localKey, foreignKey) {
        this._repository = repository;
        this._localKey = localKey;
        this._foreignKey = foreignKey;
        this._query = new RelationQuery();
    }

    /**
     * Repository which relation is referred to
     * 
     * @var {AbstractRepository}
     */
    get repository() {
        return this._repository;
    }

    /**
     * Local key name
     * 
     * @var {String}
     */
    get localKey() {
        return this._localKey;
    }

    /**
     * Foreign key name
     * 
     * @var {String}
     */
    get foreignKey() {
        return this._foreignKey;
    }

    /**
     * Relation query
     * 
     * @var {RelationQuery}
     */
    get query() {
        return this._query;
    }
}

class RelationAttribute extends Attribute
{
    /**
     * @var {Function}
     * @protected
     */
    _relation;

    /**
     * @var {RelationConfig}
     * @protected
     */
    _config;

    /**
     * @param {Relation} relation
     */
    constructor(relation, repository, localKey, foreignKey) {
        super();
        this._relation = relation;
        this._config = new RelationConfig(repository, localKey, foreignKey);
    }
   
    /**
     * Initialize attribute
     * 
     * @param {Document} target 
     * @param {String} name 
     */
    init(target, name) {
        let relation = new this._relation(target, this._config);
        Object.defineProperty(target, name, {
            enumerable: true,
            configurable: false,
            get: () => relation,
            set: (val) => {
                relation.set(val);
            },
        });
    }

    /**
     * Add condition to relation query
     * 
     * @param  {...any} args
     * @returns {RelationAttribute}
     */
    where(...args) {
        this._config.query.where(...args);
        return this;
    }

    /**
     * Add sort order to relation query
     * 
     * @param  {...any} args
     * @returns {RelationAttribute}
     */
    orderBy(...args) {
        this._config.query.orderBy(...args);
        return this;
    }

    /**
     * Add ascending sort order to relation query
     * 
     * @param {String} prop 
     * @returns {RelationAttribute}
     */
    ascendingBy(prop) {
        return this.orderBy(prop, Sort.ASC);
    }
    
    /**
     * Add descending sort order to relation query
     * 
     * @param {String} prop 
     * @returns {RelationAttribute}
     */
    descendingBy(prop) {
        return this.orderBy(prop, Sort.DESC);
    }

    /**
     * Setup following relation
     * 
     * @param  {...any} args 
     * @returns {RelationAttribute}
     */
    with(...args) {
        this._config.query.with(...args);
        return this;
    }

    /**
     * Make 1-1 relation attribute
     * 
     * @param {AbstractRepository} repository
     * @param {String} localKey
     * @param {String} foreignKey
     * @returns {RelationAttribute}
     */
    static oneToOne(repository, localKey, foreignKey = 'id') {
        return new RelationAttribute(OneToOne, repository, localKey, foreignKey);
    }

    /**
     * Make 1-N relation attribute
     * 
     * @param {AbstractRepository} repository
     * @param {String} foreignKey
     * @param {String} localKey
     * @returns {RelationAttribute}
     */
    static oneToMany(repository, foreignKey, localKey = 'id') {
        return new RelationAttribute(OneToMany, repository, localKey, foreignKey);
    }
}

export default RelationAttribute;

export {
    Relation,
    RelationConfig,
    OneToOne,
    OneToMany,
};