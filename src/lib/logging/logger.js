import winston from 'winston';
import { Mixture } from '../mixture.js';
import App from '../app.js';
import { is, 
    isString } from '../helpers.js';

const CONSOLE = 'console';
const FILE = 'file';
const HTTP = 'http';

const ERROR = 'error';
const WARN = 'warn';
const INFO = 'info';
const VERBOSE = 'verbose';
const DEBUG = 'debug';
const SILLY = 'silly';

const PLAIN = 'plain';
const OBJECT = 'object';

class Logger extends Mixture 
{
    /**
     * @protected
     * @var {winston.Logger}
     */
    _log;

    /**
     * @protected
     * @var {winston.ProfileHandler}
     */
    _timer;

    /**
     * @param {Object} [config={}]
     */
    constructor(config = {}) {
        super();
        this._log = winston.createLogger({
            level: config.level || ERROR,
            transports: (config.transports || [{type: CONSOLE}]).map((transport) => {
                let {type, options} = transport;
                if (isString(type)) {
                    switch (type) {
                        case CONSOLE: 
                            return new winston.transports.Console(options || {});
                        case FILE: 
                            return new winston.transports.File(options || {});
                        case HTTP:
                            return new winston.transports.Http(options || {});
                    }
                    throw new Error(`Unknown logger transport ${type}`);
                }
                return new type(options || {});
            }),
            format: ((format) => {
                if (isString(format)) {
                    switch (format) {
                        case PLAIN:
                            return winston.format.combine(
                                winston.format.colorize(),
                                winston.format.timestamp(),
                                winston.format.metadata(),
                                winston.format.printf((info) => {
                                    let {metadata, level, message} = info;
                                    if (is(info, Error)) {
                                        message = info.stack;
                                    }
                                    let output = [`${metadata.timestamp} ${level}: ${message}`];
                                    for (let attr in metadata) {
                                        if (attr !== 'timestamp') {
                                            output.push(`${attr} = ${JSON.stringify(metadata[attr])}`);
                                        }
                                    }
                                    return output.join(', ');
                                })
                            );
                        case OBJECT:
                            return winston.format.combine(
                                winston.format.timestamp(),
                                winston.format.json()
                            );
                    }
                    throw new Error(`Unknown log format ${format}`);
                }
                return format(winston.format);
            })(config.format || PLAIN),
        });
    }

    /**
     * Add log entry
     * 
     * @param {...any} args 
     */
    log(...args) {
        this._log.log(...args);
    }

    /**
     * Add log entry at level "error"
     * 
     * @param {...any} args 
     */
    error(...args) {
        this.log(ERROR, ...args);
    }

    /**
     * Add log entry at level "warn"
     * 
     * @param {...any} args 
     */
    warn(...args) {
        this.log(WARN, ...args);
    }

    /**
     * Add log entry at level "info"
     * 
     * @param {...any} args 
     */
    info(...args) {
        this.log(INFO, ...args);
    }

    /**
     * Add log entry at level "verbose"
     * 
     * @param {...any} args 
     */
    verbose(...args) {
        this.log(VERBOSE, ...args);
    }

    /**
     * Add log entry at level "debug"
     * 
     * @param {...any} args 
     */
    debug(...args) {
        this.log(DEBUG, ...args);
    }

    /**
     * Add log entry at level "silly"
     * 
     * @param {...any} args 
     */
    silly(...args) {
        this.log(SILLY, ...args);
    }

    /**
     * Start profiler
     * 
     * @returns {winston.ProfileHandler}
     */
    profileStart() {
        this._timer = this._log.startTimer();
        return this._timer;
    }

    /**
     * Stop profiler
     * 
     * @param  {...any} args 
     */
    profileEnd(...args) {
        let [timer, message] = args;
        if (isString(timer)) {
            this._timer.done({message: timer});
        } else {
            timer.done({message});
        }
    }
}

const Transport = {
    CONSOLE,
    FILE,
    HTTP,
};

const Level = {
    ERROR,
    WARN,
    INFO,
    VERBOSE,
    DEBUG,
    SILLY,
};

const Format = {
    PLAIN,
    OBJECT,
};

const LoggerSymbol = Symbol('Logger');

const logger = () => App.make(LoggerSymbol);

export default Logger;

export {
    LoggerSymbol,
    logger,
    Transport,
    Level,
    Format,
};