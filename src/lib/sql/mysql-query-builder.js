import QueryBuilder, {
    Condition,
    Join } from './base-query-builder.js';

class MysqlCondition extends Condition
{
}

class MysqlJoin extends Join
{
    /**
     * @returns {MysqlCondition}
     */
    _newCondition() {
        return new MysqlCondition(this._builder, this._fragment);
    }
}

class MysqlQueryBuilder extends QueryBuilder
{
    /**
     * @inheritdoc
     */
    json(column, path) {
        return this.raw(`json_extract(${this.quote(column)}, ?)`, [`$.${path}`]);
    }
    
    /**
     * @inheritdoc
     */
    quote(name) {
        return name.split('.')
            .map(c => '`' + c + '`')
            .join('.');
    }

    /**
     * @inheritdoc
     */
    _newCondition(fragment) {
        return new MysqlCondition(this, fragment);
    }

    /**
     * @inheritdoc
     */
    _newJoin(fragment) {
        return new MysqlJoin(this, fragment);
    }
}

export default MysqlQueryBuilder;