import validate from 'validate.js';
import moment from 'moment';
import {
    Mixture, 
} from '../mixture';

const DateHelper = {
    templates: {
        parse: {
            date: 'YYYY-MM-DD',
            datetime: 'YYYY-MM-DD hh:mm:ss',
            get: (options) => {
                return options.dateOnly
                    ? DateHelper.templates.parse.date
                    : DateHelper.templates.parse.datetime;
            },
        },
        format: {
            date: 'MM/DD/YYYY',
            datetime: 'MM/DD/YYYY hh:mm:ss',
            get: (options) => {
                return options.dateOnly
                    ? DateHelper.templates.format.date
                    : DateHelper.templates.format.datetime;
            },
        },
    },
    parse: (date, options) => {
        if (typeof date === 'string') {
            return moment
                .utc(date, DateHelper.templates.parse.get(options));
        }
        if (moment.isMoment(date)) {
            return date;
        }
        return moment(date);
    },
    format: (date, options) => {
        return moment
            .utc(date)
            .format(DateHelper.templates.format.get(options));
    },
};

validate.extend(validate.validators.datetime, {
    parse: (value, options) => {
        return DateHelper.parse(value, options).valueOf();
    },
    format: (value, options) => {
        return DateHelper.format(value, options);
    },
});

class Rule
{
    constructor(name, options = true) {
        this.options = {};
        this.options[name] = options;
    }

    validate(attribute, data) {
        let constraints = {};
        constraints[attribute] = this.options;
        return validate(data, constraints);
    }
}

class Validator extends Mixture
{
    constructor(every = true) {
        super();
        this._every = every;
        this._chain = [];
    }

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

    make(every = true) {
        return new Validator(every);
    }

    makeConditional(condition, every = true) {
        return new ConditionalValidator(condition, every);
    }

    and(callback) {
        return this.join(true, callback);
    }

    or(callback) {
        return this.join(false, callback);
    }

    when(condition, callback, every = true) {
        let chain = this.makeConditional(condition, every);
        callback(chain);
        this._chain.push(chain);
        return this;
    }

    join(every, callback) {
        let chain = this.make(every);
        callback(chain);
        this._chain.push(chain);
        return this;
    }

    after(date, options = {}) {
        return this.date({
            ...options,
            earliest: DateHelper.parse(date, options),
        });
    }

    before(date, options = {}) {
        return this.date({
            ...options,
            latest: DateHelper.parse(date, options),
        });
    }

    between(min, max, options = {}) {
        return this.number({
            ...options,
            lessThanOrEqualTo: max,
            greaterThanOrEqualTo: min,
        });
    }

    date(options = {}) {
        return this.datetime({
            ...options,
            dateOnly: true,
        });
    }

    datetime(options = true) {
        this._chain.push(new Rule('datetime', options));
        return this;
    }

    email(options = true) {
        this._chain.push(new Rule('email', options));
        return this;
    }

    equals(options) {
        this._chain.push(new Rule('equality', options));
        return this;
    }

    except(list, options = {}) {
        this._chain.push(new Rule('exclusion', {
            ...options,
            within: list,
        }));
        return this;
    }

    format(options) {
        this._chain.push(new Rule('format', options));
        return this;
    }

    in(list, options = {}) {
        this._chain.push(new Rule('inclusion', {
            ...options,
            within: list,
        }));
        return this;
    }

    integer(options = {}) {
        return this.number({
            ...options,
            onlyInteger: true,
        });
    }
    
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

    max(val, options = {}) {
        return this.number({
            ...options,
            lessThanOrEqualTo: val,
        });
    }

    min(val, options = {}) {
        return this.number({
            ...options,
            greaterThanOrEqualTo: val,
        });
    }

    number(options = true) {
        this._chain.push(new Rule('numericality', options));
        return this;
    }

    present(options = true) {
        this._chain.push(new Rule('presence', options));
        return this;
    }

    required(options = {}) {
        return this.present({
            ...options,
            allowEmpty: false,
        });
    }

    type(options) {
        this._chain.push(new Rule('type', options));
        return this;
    }

    url(options = true) {
        this._chain.push(new Rule('url', options));
        return this;
    }
}

class ConditionalValidator extends Validator
{
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

class ValidationError extends Error
{
    constructor(errors, message = 'Validation failed') {
        super(message);
        this._errors = errors;
    }

    getErrors(key = null) {
        if (key === null) {
            return this._errors;
        }
        return this._errors[key];
    }
}

const ValidatorSymbol = Symbol('Validator');

export default Validator;

export {
    ValidationError,
    DateHelper,
    ValidatorSymbol,
};