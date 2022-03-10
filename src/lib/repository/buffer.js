import ResidentRepository from './resident.js';

class BufferRepository extends ResidentRepository
{
    /**
     * @var {AbstractRepository}
     * @protected
     */
    _endpoint;

    /**
     * @var {Query|Object}
     * @protected
     */
    _query;

    /**
     * @var {Promise}
     * @protected
     */
    _fetch;

    /**
     * @param {AbstractRepository} endpoint 
     * @param {Query|Object} [query={}] 
     */
    constructor(endpoint, query = {}) {
        super(endpoint.type);
        this._endpoint = endpoint;
        this._query = query;
    }

    /**
     * @inheritdoc
     */
    get(key) {
        return this.prefetch()
            .then(() => super.get(key));
    }

    /**
     * @inheritdoc
     */
    search(query) {
        return this.prefetch()
            .then(() => super.search(query));
    }

    /**
     * @inheritdoc
     */
    store(document) {
        return this.prefetch()
            .then(() => {
                return this._endpoint.store(document)
                    .then((document) => {
                        let index = this._findIndex(document.getKey());
                        let data = this._consumeDocument(document);
                        if (index === -1) {
                            this._items.push(data);
                        } else {
                            this._items[index] = data;
                        }
                        return document;
                    });
            });
    }

    /**
     * @inheritdoc
     */
    delete(key) {
        return this.prefetch()
            .then(() => {
                return this._endpoint.delete(key)
                    .then(() => super.delete(key));
            });
    }

    /**
     * @inheritdoc
     */
    exists(query) {
        return this.prefetch()
            .then(() => super.exists(query));
    }

    /**
     * @inheritdoc
     */
    count(query = null) {
        return this.prefetch()
            .then(() => super.count(query));
    }

    /**
     * @inheritdoc
     */
    sum(attribute, query = null) {
        return this.prefetch()
            .then(() => super.sum(attribute, query));
    }

    /**
     * @inheritdoc
     */
    avg(attribute, query = null) {
        return this.prefetch()
            .then(() => super.avg(attribute, query));
    }

    /**
     * @inheritdoc
     */
    min(attribute, query = null) {
        return this.prefetch()
            .then(() => super.min(attribute, query));
    }
    
    /**
     * @inheritdoc
     */
    max(attribute, query = null) {
        return this.prefetch()
            .then(() => super.max(attribute, query));
    }

    /**
     * Fetch data from endpoint
     * 
     * @param {Query|Object} query 
     * @returns {Promise}
     */
    prefetch(query = null) {
        if (query !== null) {
            this._query = query;
            this._fetch = undefined;
        }
        if (this._fetch === undefined) {
            this._fetch = this._endpoint.search(this._query)
                .then((results) => {
                    this._items = results.map((doc) => this._consumeDocument(doc));
                })
                .catch((e) => {
                    this._fetch = undefined;
                    throw e;
                });
        }
        return this._fetch;
    }
}

export default BufferRepository;