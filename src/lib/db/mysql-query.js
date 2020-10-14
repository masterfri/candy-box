import Query from '../query/query';

class MysqlQuery extends Query
{
    constructor(...args) {
        super(...args);
        this._table = null;
        this._select = [];
        this._join = [];
    }

    select(cols) {
        this._select.push(cols);
    }

    from(table) {
        this._table = table;
    }

    
}

export default MysqlQuery;