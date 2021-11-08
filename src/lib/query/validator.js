import { assertIsArray,
    assertIsObject,
    assertIsString,
    assertIsPrimitive,
    forEach, 
    isArray,  
    isObject,
    isNumber,
    assertIsNumber } from '../helpers.js';
import { Assert,
    Sort } from './query.js';

class QueryValidator 
{
    /**
     * @protected
     * @var {Array}
     */
    _where = [];

    /**
     * @protected
     * @var {Array}
     */
    _sort = [];

    /**
     * @protected
     * @var {Array}
     */
    _group = [];

    /**
     * @protected
     * @var {Number}
     */
    _offset = 0;

    /**
     * @protected
     * @var {Number|false}
     */
    _limit = false;

    /**
     * @protected
     * @var {Array}
     */
    _errors = [];

    /**
     * @param {Object} data 
     */
    constructor(data) {
        assertIsObject(data);
        if (data.where !== undefined) {
            this._decomposeCondition(data.where);
        }
        if (data.sort !== undefined) {
            this._decomposeSort(data.sort);
        }
        if (data.group !== undefined) {
            this._decomposeGroup(data.group);
        }
        if (data.start !== undefined) {
            assertIsNumber(data.start);
            this._offset = data.start;
        }
        if (data.limit !== undefined) {
            assertIsNumber(data.limit);
            this._limit = data.limit;
        }
    }

    /**
     * Perform query validation
     * 
     * @param {Object} options
     * @returns {Promise}
     */
    async validate(options) {
        let {filterable, sortable, groupable, limit} = options;
        await this._validateCondition(filterable);
        this._validateSort(sortable);
        this._validateGroup(groupable);
        this._validateLimit(limit);
        if (this._errors.length !== 0) {
            return Promise.reject(this._errors);
        }
    }

    /**
     * @var {Array}
     */
    get errors() {
        return this._errors;
    }

    /**
     * @protected
     * @param {Object} data 
     */
    _decomposeCondition(data) {
        assertIsArray(data);
        switch (data[0]) {
            case Assert.IS:
                assertIsArray(data[1]);
                data[1].forEach((or) => {
                    assertIsArray(or);
                    or.forEach((and) => {
                        this._decomposeCondition(and);
                    });
                });
                break;
            case Assert.IS_NOT:
                this._decomposeCondition(data[1]);
                break;
            case Assert.IN:
            case Assert.NOT_IN:
                assertIsArray(data[2]);
                this._decomposeAssertion(data);
                break;
            case Assert.CONTAINS:
            case Assert.STARTS:
                assertIsString(data[2]);
                this._decomposeAssertion(data);
                break;
            case Assert.EQ:
            case Assert.NEQ:
            case Assert.LT:
            case Assert.LTE:
            case Assert.GT:
            case Assert.GTE:
                assertIsPrimitive(data[2]);
                this._decomposeAssertion(data);
                break;
            default:
                throw new Error('Invalid assertion operator');
        }
    }

    /**
     * @protected
     * @param {Object} data 
     */
    _decomposeAssertion(data) {
        let [_op, prop, argument] = data;
        let args = this._where[prop];
        if (args === undefined) {
            args = [];
            this._where[prop] = args;
        }
        (isArray(argument) ? argument : [argument])
            .forEach((arg) => {
                if (args.indexOf(arg) === -1) {
                    args.push(arg);
                }
            });
    }

    /**
     * @protected
     * @param {Object} data 
     */
    _decomposeSort(data) {
        assertIsArray(data);
        data.forEach((sort) => {
            assertIsArray(sort);
            let [prop, dir] = sort;
            assertIsString(prop);
            switch (dir) {
                case Sort.ASC:
                case Sort.DESC:
                    if (this._sort.indexOf(prop) === -1) {
                        this._sort.push(prop);
                    }
                    break;
                default:
                    throw new Error('Invalid sort direction');
            }
        });
    }

    /**
     * @protected
     * @param {Object} data 
     */
    _decomposeGroup(data) {
        assertIsArray(data);
        data.forEach((prop) => {
            assertIsString(prop);
            if (this._group.indexOf(prop) === -1) {
                this._group.push(prop);
            }
        });
    }

    /**
     * @protected
     * @param {any} filterable 
     * @returns {Promise}
     */
    _validateCondition(filterable) {
        if (isArray(filterable) || isObject(filterable)) {
            let attributes = isArray(filterable) 
                ? filterable 
                : Object.keys(filterable);
            Object.keys(this._where).forEach((prop) => {
                if (attributes.indexOf(prop) === -1) {
                    this._addError(`Attribute is not filterable`, prop);
                }
            });
            if (isObject(filterable)) {
                let tasks = [];
                forEach(filterable, (chain, attribute) => {
                    if (isObject(chain) && this._where[attribute] !== undefined) {
                        tasks.push(
                            this._validateAttribute(chain, attribute, this._where[attribute])
                        );
                    }
                });
                return Promise.all(tasks);
            }
        } else if (filterable === false && Object.keys(this._where).length !== 0) {
            this._addError('Condition is not allowed for this query');
        }
        return Promise.resolve();
    }

    /**
     * @protected
     * @param {Validator} chain 
     * @param {String} attribute 
     * @param {Array} values
     */    
    async _validateAttribute(chain, attribute, values) {
        try {
            for (let value of values) {
                await chain.validate('value', {value});
            }
        } catch (err) {
            Object.keys(err).map((key) => {
                err[key].forEach((error) => {
                    this._addError(error, attribute);
                });
            });
        }
    }

    /**
     * @protected
     * @param {any} sortable 
     */
    _validateSort(sortable) {
        if (isArray(sortable)) {
            this._sort.forEach((prop) => {
                if (sortable.indexOf(prop) === -1) {
                    this._addError(`Attribute is not sortable`, prop);
                }
            });
        } else if (sortable === false && decomposed._sort.length !== 0) {
            this._addError('Sorting is not allowed for this query');
        }
    }

    /**
     * @protected
     * @param {any} groupable 
     */
    _validateGroup(groupable) {
        if (isArray(groupable)) {
            this._group.forEach((prop) => {
                if (groupable.indexOf(prop) === -1) {
                    this._addError(`Attribute is not groupable`, prop);
                }
            });
        } else if (groupable === false && this._group.length !== 0) {
            this._addError('Grouping is not allowed for this query');
        }
    }

    /**
     * @protected
     * @param {Number} limit 
     */
    _validateLimit(limit) {
        if (isNumber(limit)) {
            if (this._limit === false || this._limit > limit) {
                this._addError(`Query limit should be set to a number less or equal to ${limit}`);
            }
        }
    }

    /**
     * @protected
     * @param {String} error 
     * @param {String} attribute 
     */
    _addError(error, attribute) {
        this._errors.push({error, attribute});
    }
}

const validateQuery = (data, options, attribute) => {
    try {
        let queryValidator = new QueryValidator(data);
        return queryValidator
            .validate(options)
            .catch((err) => {
                let errors = {};
                err.forEach((e) => {
                    let key = e.attribute ? `${attribute}.${e.attribute}` : attribute;
                    if (errors[key] === undefined) {
                        errors[key] = [e.error];
                    } else {
                        errors[key].push(e.error);
                    }
                });
                return errors;
            });
    } catch (err) {
        return assign(attribute, ['Invalid query structure']);
    }
}

export default validateQuery;