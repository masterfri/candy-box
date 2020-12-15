import Query, {
    Condition,
    Assert,
    Logic,
    Assertion,
} from '../query/query';
import {
    is,
    isFunction,
    isObject,
    assertType,
} from '../helpers';

class RawSql
{
    constructor(sql, bindings = []) {
        this._sql = sql;
        this._bindings = bindings;
    }

    get sql() {
        return this._sql;
    }

    get bindings() {
        return this._bindings;
    }
}

class On
{
    constructor(left, operator, right) {
        this._left = left;
        this._operator = operator;
        this._right = right;
    }

    get left() {
        return this._left;
    }

    get operator() {
        return this._operator;
    }

    get right() {
        return this._right;
    }
}

class SqlCondition extends Condition
{
    where(...args) {
        if (args.length === 1 && is(args[0], RawSql)) {
            this._wheres.push(args[0]);
            return this;
        }
        return super.where(...args);
    }

    has(table, condition) {
        return this.where(table, Assert.HAS, this.makeSubquery(table, condition));
    }

    doesntHave(table, condition) {
        return this.where(table, Assert.NOT_HAS, this.makeSubquery(table, condition));
    }

    makeSubquery(table, condition) {
        let query = new SqlQuery();
        query.from(table);
        if (isFunction(condition)) {
            condition(query);
        } else {
            query.where(condition);
        }
        return query;
    }
}

class JoinCondition extends SqlCondition
{
    constructor(...args) {
        super();
        if (args.length !== 0) {
            this.on(...args);
        }
    }

    on(...args) {
        if (args.length === 3) {
            this._wheres.push(new On(args[0], args[1], args[2]));
            return this;
        }
        
        if (args.length === 2) {
            this.on(args[0], Assert.EQ, args[1]);
            return this;
        }
        
        if (is(args[0], Condition) || is(args[0], RawSql)) {
            this._wheres.push(args[0]);
            return this;
        }
        
        if (is(args[0], Array)) {
            for (let arg of args[0]) {
                this.on(...arg);
            }
            return this;
        }
        
        if (isFunction(args[0])) {
            args[0](this);
            return this;
        }
        
        if (isObject(args[0])) {
            for (let prop in args[0]) {
                this.on(prop, Assert.EQ, args[0][prop]);
            }
            return this;
        }
        
        this.on(args[0], Assert.NEQ, null);

        return this;
    }
    
    onEquals(prop, value) {
        return this.on(prop, value);
    }
    
    onNotEquals(prop, value) {
        return this.on(prop, Assert.NEQ, value);
    }
    
    onLessThan(prop, value) {
        return this.on(prop, Assert.LT, value);
    }
    
    onLessThanOrEquals(prop, value) {
        return this.on(prop, Assert.LTE, value);
    }
    
    onGreaterThan(prop, value) {
        return this.on(prop, Assert.GT, value);
    }
    
    onGreaterThanOrEquals(prop, value) {
        return this.on(prop, Assert.GTE, value);
    }
}

class Join
{
    constructor(table, ...args) {
        this._table = table;
        this._condition = new JoinCondition(...args);
        // TODO join type
    }

    get table() {
        return this._table;
    }

    get condition() {
        return this._condition;
    }
}

class SqlQuery extends Query
{
    _table = null;
    _select = [];
    _join = [];

    newCondition() {
        return new SqlCondition();
    }

    select(cols) {
        if (is(cols, Array)) {
            this._select.push(...cols);
        } else {
            this._select.push(cols);
        }
        return this;
    }

    from(table) {
        this._table = table;
        return this;
    }

    join(table, ...on) {
        this._join.push(new Join(table, ...on));
        return this;
    }

    get columns() {
        return this._select;
    }

    get table() {
        return this._table;
    }

    get joinedTables() {
        return this._join;
    }
}

class SqlGrammar
{
    constructor() {
        this._quotes = ['[', ']'];
    }

    selectSequence() {
        return [
            this.buildColumns,
            this.buildTable,
            this.buildJoin,
            this.buildWhere,
            this.buildGroup,
            this.buildHaving,
            this.buildOrder,
            this.buildLimit,
            this.buildOffset,
        ];
    }

    select(query) {
        let bindings = [];
        let sql = this.selectSequence()
            .map((method) => method.call(this, query, bindings))
            .filter((part) => part !== null)
            .join(' ');
        return new RawSql(sql, bindings);
    }

    buildColumns(query, bindings) {
        // TODO: aliases
        if (query.columns.length === 0) {
            return 'select *';
        }
        return 'select ' +
            query.columns.map((col) => {
                return this.prepareColumn(col, query.table, bindings);
            }).join(', ');
    }

    buildTable(query) {
        // TODO: aliases
        if (query.table === null) {
            throw new Error('Table name not specified');
        }
        return 'from ' + 
            this.qualifyIdentifier(query.table);
    }

    buildJoin(query, bindings) {
        if (query.joinedTables.length === 0) {
            return null;
        }
        return query.joinedTables.map((join) => {
            return 'join ' + 
                this.qualifyIdentifier(join.table) + 
                ' on ' + 
                this.buildJoinCondition(query.table, join.table, join.condition, bindings);
        }).join(' ');
    }

    buildWhere(query, bindings) {
        if (query.condition.isEmpty()) {
            return null;
        }
        return 'where ' + 
            this.buildCondition(query.table, query.condition, bindings);
    }

    buildGroup(query, bindings) {
        if (query.group.length === 0) {
            return null;
        }
        return 'group by ' + 
            query.group.map((col) => {
                return this.prepareColumn(col, query.table, bindings);
            }).join(', ');
    }

    buildHaving(query, bindings) {
        // TODO implement
        return null;
    }

    buildOrder(query, bindings) {
        if (query.order.length === 0) {
            return null;
        }
        return 'order by ' + 
            query.order.map((sort) => {
                return this.prepareColumn(sort.prop, query.table, bindings) + 
                    (sort.isDescending ? ' desc' : '');
            }).join(', ');
    }

    buildOffset(query) {
        return query.start !== 0 ? `offset ${query.start}` : null;
    }

    buildLimit(query) {
        return query.limit !== false ? `limit ${query.limit}` : null;
    }

    buildJoinCondition(table, joinTable, condition, bindings) {
        let expr = condition.wheres.map((on) => {
            if (is(on, Condition)) {
                return '(' + this.buildJoinCondition(table, joinTable, on, bindings) + ')';
            } else if (is(on, On)) {
                return this.buildOnAssertion(on.operator, table, on.left, joinTable, on.right);
            } else if (is(on, RawSql)) {
                this.addBindings(bindings, on);
                return on.sql;
            } else if (is(on, Assertion)) {
                return this.buildAssertion(on.operator, table, on.property, on.argument, bindings);
            } else {
                throw new Error('Invalid assertion');
            }
        }).join(condition.logic === Logic.OR ? ' or ' : ' and ');
        if (condition.logic === Logic.NOT) {
            return 'not(' + expr + ')';
        }
        return expr;
    }

    buildCondition(table, condition, bindings) {
        let expr = condition.wheres.map((where) => {
            if (is(where, Condition)) {
                return '(' + this.buildCondition(table, where, bindings) + ')';
            } else if (is(where, RawSql)) {
                this.addBindings(bindings, where);
                return where.sql;
            } else if (is(where, Assertion)) {
                return this.buildAssertion(where.operator, table, where.property, where.argument, bindings);
            }
        }).join(condition.logic === Logic.OR ? ' or ' : ' and ');
        if (condition.logic === Logic.NOT) {
            return 'not(' + expr + ')';
        }
        return expr;
    }

    buildOnAssertion(operator, table, left, joinTable, right) {
        if ([Assert.EQ, Assert.NEQ, Assert.LT, Assert.LTE, 
            Assert.GT, Assert.GTE].indexOf(operator) !== -1) {
            return this.qualifyColumnName(left, table) +
                operator +
                this.qualifyColumnName(right, joinTable);
        }
        throw new Error('Unsupported operator');
    }

    buildAssertion(operator, table, column, argument, bindings) {
        if ([Assert.EQ, Assert.NEQ].indexOf(operator) !== -1) {
            if (argument === null) {
                return this.qualifyColumnName(column, table) +
                    (operator === Assert.NEQ ? ' is not null' : ' is null');
            } else {
                bindings.push(argument);
                return this.qualifyColumnName(column, table) +
                    operator + '?';
            }
        }
        if ([Assert.LT, Assert.LTE, Assert.GT, Assert.GTE].indexOf(operator) !== -1) {
            bindings.push(argument);
            return this.qualifyColumnName(column, table) +
                operator + '?';
        }
        if ([Assert.IN, Assert.NOT_IN].indexOf(operator) !== -1) {
            bindings.push(...argument);
            return this.qualifyColumnName(column, table) +
                (operator === Assert.NOT_IN ? ' not ' : ' ') +
                'in(' + argument.map(() => '?').join(',') + ')';
        }
        if ([Assert.HAS, Assert.NOT_HAS].indexOf(operator) !== -1) {
            assertType(argument, SqlQuery);
            let subquery = this.select(argument);
            this.addBindings(bindings, subquery);
            return (operator === Assert.NOT_HAS ? 'not ' : '') +
                'exists(' + subquery.sql + ')';
        }
        throw new Error('Unsupported operator');
    }

    qualifyColumnName(col, table) {
        if (col.indexOf('.') === -1) {
            return [
                this.qualifyIdentifier(table),
                this.qualifyIdentifier(col),
            ].join('.');
        } else {
            return col.split('.')
                .map((identifier) => this.qualifyIdentifier(identifier))
                .join('.');
        }
    }

    qualifyIdentifier(name) {
        return (name === '*') 
            ? name 
            : this.enclose(name, this._quotes[0], this._quotes[1]);
    }

    enclose(str, l, r) {
        return (str.substr(0, l.length) === l) 
            ? str 
            : [l, str, r].join('');
    }

    prepareColumn(col, table, bindings) {
        if (is(col, RawSql)) {
            this.addBindings(bindings, col);
            return col.sql;
        }
        return this.qualifyColumnName(col, table);
    }

    addBindings(set, rawSql) {
        if (rawSql.bindings.length !== 0) {
            set.push(...rawSql.bindings);
        }
    }
}

export default SqlQuery;

export {
    RawSql,
    On,
    JoinCondition,
    Join,
    SqlGrammar,
}