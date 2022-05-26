import { is,
    promise } from '../helpers.js';

class Middleware
{
    /**
     * @protected
     * @var {Array}
     */
    _handlers = [];

    /**
     * @param {Array} [handlers=[]]
     */
    constructor(handlers = []) {
        handlers.forEach((handler) => {
            this.append(handler);
        });
    }

    /**
     * Prepend handler
     * 
     * @param {Function|Middleware} handler 
     * @returns {Middleware}
     */
    prepend(handler) {
        this._handlers.push(handler);
        return this;
    }

    /**
     * Append handler
     * 
     * @param {Function|Middleware} handler 
     * @returns {Middleware}
     */
    append(handler) {
        this._handlers.unshift(handler);
        return this;
    }

    /**
     * Remove handler
     * 
     * @param {Function|Middleware} handler 
     * @returns {Middleware}
     */
    remove(handler) {
        let i = this._handlers.indexOf(handler);
        if (i !== -1) {
            this._handlers.splice(i, 1);
        }
        return this;
    }

    /**
     * Merge midlleware
     * 
     * @param {Array|Function|Middleware} middleware 
     * @returns {Middleware}
     */
    merge(middleware) {
        return new Middleware(this._handlers.concat(middleware));
    }

    /**
     * Run middleware
     * @param {any} context 
     * @param {Function} next 
     * @returns {any}
     */
    run(context, next) {
        return this._runHandler(this._handlers.length - 1, context, next);
    }

    /**
     * Run single handler
     * @protected
     * @param {Number} index 
     * @param {any} context 
     * @param {Function} next 
     * @returns {any}
     */
    _runHandler(index, context, next) {
        if (index >= 0) {
            let handler = this._handlers[index];
            if (is(handler, Middleware)) {
                return handler.run(context, (context) => {
                    return this._runHandler(index - 1, context, next);
                });
            }
            return handler(context, (context) => {
                return this._runHandler(index - 1, context, next);
            });
        } else {
            return next(context);
        }
    }
}

export default Middleware;