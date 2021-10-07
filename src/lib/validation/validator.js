import validate from 'validate.js';
import { Mixture } from '../mixture.js';
import App from '../app.js';

const parseDate = (date) => {
    return new Date(date);
}

const formatDate = (date, options) => {
    if (options.dateOnly) {
        return (new Date(date)).toLocaleDateString();
    }
    return (new Date(date)).toLocaleString();
}

validate.extend(validate.validators.datetime, {
    parse: (value) => {
        return parseDate(value).getTime();
    },
    format: (value, options) => {
        return formatDate(value, options);
    },
});

class Rule
{
    _options = {};

    constructor(name, options = true) {
        this._options[name] = options;
    }

    validate(attribute, data) {
        let constraints = {};
        constraints[attribute] = this._options;
        return validate(data, constraints);
    }
}

/**
 * Class that runs validation
 * 
 * @class
 * @augments Mixture
 */
class Validator extends Mixture
{
    /**
     * @protected
     * @var {Boolean}
     */
    _every;

    /**
     * Rule chain
     * 
     * @protected
     * @var {Array}
     */
    _chain = [];

    /**
     * @param {Boolean} [every=true] When true, indicates that none of rules should fail 
     */
    constructor(every = true) {
        super();
        this._every = every;
    }

    /**
     * Validate an attribute
     * 
     * @param {String} attribute Attribute being validated
     * @param {Object} data Data to run validation against
     * @returns {Promise}
     */
    async validate(attribute, data) {
        let last = this._chain[this._chain.length - 1];
        for (let rule of this._chain) {
            let result = rule.validate(attribute, data);
            if (result instanceof Promise) {
                try {
                    result = await result;
                } catch (err) {
                    result = err;
                }
            }
            if (result === undefined) {
                if (this._every) {
                    continue;
                } else {
                    break;
                }
            }
            if (this._every || rule === last) {
                return Promise.reject(result);
            }
        }
        return Promise.resolve();
    }

    /**
     * Create a new instance of validator
     * 
     * @param {Boolean} [every=true] When true, indicates that none of rules should fail 
     * @returns {Validator}
     */
    newValidator(every = true) {
        return new this.constructor(every);
    }

    /**
     * Create a new instance of conditional validator
     * 
     * @param {Function} condition Function that checks whether validation should run 
     * @param {Boolean} [every=true] When true, indicates that none of rules should fail 
     * @returns {ConditionalValidator}
     */
    newConditionalValidator(condition, every = true) {
        return new ConditionalValidator(condition, every);
    }

    /**
     * Build nested validation chain when all rules should pass
     * 
     * @param {Function} callback Function that builds the nested chain
     * @returns {Validator}
     */
    and(callback) {
        return this._join(true, callback);
    }

    /**
     * Build nested validation chain when at least one rule should pass
     * 
     * @param {Function} callback Function that builds the nested chain
     * @returns {Validator}
     */
    or(callback) {
        return this._join(false, callback);
    }

    /**
     * Build nested conditional validation chain
     * 
     * @param {Function} condition
     * @param {Function} callback Function that builds the nested chain
     * @param {Boolean} [every=true] When true, indicates that none of rules should fail 
     * @returns {Validator}
     */
    when(condition, callback, every = true) {
        let chain = this.newConditionalValidator(condition, every);
        callback(chain);
        this._chain.push(chain);
        return this;
    }

    /**
     * Join nested validation chain
     * 
     * @protected
     * @param {Boolean} every 
     * @param {Function} callback 
     * @returns {Validator}
     */
    _join(every, callback) {
        let chain = this.newValidator(every);
        callback(chain);
        this._chain.push(chain);
        return this;
    }

    /**
     * Append rule that checks if attribute value is after the given date
     * 
     * @param {any} date 
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    after(date, options = {}) {
        return this.date({
            ...options,
            earliest: parseDate(date),
        });
    }

    /**
     * Append rule that checks if attribute value is before the given date
     * 
     * @param {any} date 
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    before(date, options = {}) {
        return this.date({
            ...options,
            latest: parseDate(date),
        });
    }

    /**
     * Append rule that checks if attribute value is between min and max
     * 
     * @param {Number} min 
     * @param {Number} max
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    between(min, max, options = {}) {
        return this.number({
            ...options,
            lessThanOrEqualTo: max,
            greaterThanOrEqualTo: min,
        });
    }

    /**
     * Append rule that checks if attribute value is valid date
     * 
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    date(options = {}) {
        return this.datetime({
            ...options,
            dateOnly: true,
        });
    }

    /**
     * Append rule that checks if attribute value is valid datetime
     * 
     * @param {Object|Boolean} [options=true] 
     * @returns {Validator}
     */
    datetime(options = true) {
        this._chain.push(new Rule('datetime', options));
        return this;
    }

    /**
     * Append rule that checks if attribute value is valid email
     * 
     * @param {Object|Boolean} [options=true] 
     * @returns {Validator}
     */
    email(options = true) {
        this._chain.push(new Rule('email', options));
        return this;
    }

    /**
     * Append rule that checks if attribute value is equal to value of another attribute
     * 
     * @param {String|Object} options
     * @returns {Validator}
     */
    equals(options) {
        this._chain.push(new Rule('equality', options));
        return this;
    }

    /**
     * Append rule that checks whether attribute value is missing in the given list
     * 
     * @param {Array} list
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    except(list, options = {}) {
        this._chain.push(new Rule('exclusion', {
            ...options,
            within: list,
        }));
        return this;
    }

    /**
     * Append rule that checks if attribute value does match the given format
     * 
     * @param {String|Object} options
     * @returns {Validator}
     */
    format(options) {
        this._chain.push(new Rule('format', options));
        return this;
    }

    /**
     * Append rule that checks whether attribute value does present in the given list
     * 
     * @param {Array} list
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    in(list, options = {}) {
        this._chain.push(new Rule('inclusion', {
            ...options,
            within: list,
        }));
        return this;
    }

    /**
     * Append rule that checks if attribute value is integer
     * 
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    integer(options = {}) {
        return this.number({
            ...options,
            onlyInteger: true,
        });
    }
    
    /**
     * Append rule that checks if the length of attribute value is in the given range
     * 
     * @param {Number} left Left range
     * @param {Number} [right=undefined] Right range, equals to left if undefined is given
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    length(left, right = undefined, options = {}) {
        if (right === undefined) {
            this._chain.push(new Rule('length', {
                ...options,
                is: left,
            }));
        } else {
            this._chain.push(new Rule('length', {
                ...options,
                minimum: left,
                maximum: right,
            }));
        }
        return this;
    }

    /**
     * Append rule that checks whether attribute value is not greater than the given maximum
     * 
     * @param {Number} val
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    max(val, options = {}) {
        return this.number({
            ...options,
            lessThanOrEqualTo: val,
        });
    }

    /**
     * Append rule that checks whether attribute value is not less than the given minimum
     * 
     * @param {Number} val
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    min(val, options = {}) {
        return this.number({
            ...options,
            greaterThanOrEqualTo: val,
        });
    }

    /**
     * Append rule that checks whether attribute value is valid number
     * 
     * @param {Object|Boolean} [options=true] 
     * @returns {Validator}
     */
    number(options = true) {
        this._chain.push(new Rule('numericality', options));
        return this;
    }

    /**
     * Append rule that checks presence of attribute in the object
     * 
     * @param {Object|Boolean} [options=true] 
     * @returns {Validator}
     */
    present(options = true) {
        this._chain.push(new Rule('presence', options));
        return this;
    }

    /**
     * Append rule that checks if attribute value is not empty
     * 
     * @param {Object} [options={}] 
     * @returns {Validator}
     */
    required(options = {}) {
        return this.present({
            ...options,
            allowEmpty: false,
        });
    }

    /**
     * Append rule that checks if attribute value has valid type
     * 
     * @param {String|Object} options 
     * @returns {Validator}
     */
    type(options) {
        this._chain.push(new Rule('type', options));
        return this;
    }

    /**
     * Append rule that checks if attribute value is valid URL
     * 
     * @param {Object|Boolean} [options=true] 
     * @returns {Validator}
     */
    url(options = true) {
        this._chain.push(new Rule('url', options));
        return this;
    }
}

class ConditionalValidator extends Validator
{
    _condition;

    constructor(condition, every = true) {
        super(every);
        this._condition = condition;
    }

    validate(attribute, data) {
        if (this._condition(attribute, data)) {
            return super.validate(attribute, data);
        }
        return Promise.resolve();
    }
}

/**
 * This error is raised when validation fails
 * 
 * @class
 * @augments Error
 */
class ValidationError extends Error
{
    /**
     * @protected
     * @var {Object}
     */
    _errors;

    /**
     * @param {Object} errors
     * @param {String} [message='Validation failed']
     */
    constructor(errors, message = 'Validation failed') {
        super(message);
        this._errors = errors;
    }

    /**
     * Get validation errors
     * 
     * @param {String|null} [key=null]
     * @returns {Object|Array}
     */
    getErrors(key = null) {
        if (key === null) {
            return this._errors;
        }
        return this._errors[key];
    }

    /**
     * All errors
     * 
     * @var {Object}
     */
    get errors() {
        return this._errors;
    }
}

const ValidatorSymbol = Symbol('Validator');

const validator = () => App.make(ValidatorSymbol);

export default Validator;

export {
    ValidationError,
    ValidatorSymbol,
    validator,
};