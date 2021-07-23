import { AbstractIdentitySource } from './identity.js';
import Query from '../query/query.js';

class IdentityRepository extends AbstractIdentitySource
{
    /**
     * @var {AbstractRepository}
     */
    _repository;

    /**
     * @param {AbstractRepository} repository
     */
    constructor(repository) {
        super();
        this._repository = repository;
    }

    /**
     * @inheritdoc
     */
    _getId(instance) {
        return instance.getKey();
    }

    /**
     * @inheritdoc
     */
    _findById(id) {
        return this._repository.get(id)
            .catch(() => {
                return null;
            });
    }

    /**
     * @inheritdoc
     */
    _findByAttributes(attributes) {
        let query = new Query();
        query.where(attributes);
        query.limitTo(1);
        return this._repository.search(query)
            .then((results) => {
                return results.first();
            });
    }
}

export default IdentityRepository;