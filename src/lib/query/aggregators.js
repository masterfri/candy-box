import {
    isNumber,
    isString } from '../helpers.js';

class Aggregator
{
    _result;

    constructor(initial = null) {
        this._result = initial;
    }
    
    isValid(value) {
        return true;
    }
    
    add(value) {
        if (this.isValid(value)) {
            this._result = this.count(value);
        }
    }
    
    count(value) {
        return value;
    }
    
    get result() {
        return this._result;
    } 
}

class CountAggregator extends Aggregator
{
    constructor() {
        super(0);
    }
    
    count(value) {
        return this._result + 1;
    }
}

class NumberAggregator extends Aggregator
{
    constructor() {
        super(0);
    }
    
    isValid(value) {
        return isNumber(value);
    }
}

class SumAggregator extends NumberAggregator
{
    count(value) {
        return this._result + value;
    }
}

class AvgAggregator extends SumAggregator
{
    _num = 0;

    constructor() {
        super();
    }
    
    count(value) {
        this._num++;
        return super.count(value);
    }
    
    get result() {
        return this._num === 0 ? 0 : this._result / this._num;
    }
}

class SelectionAggregator extends Aggregator
{
    isValid(value) {
        return isNumber(value) || isString(value);
    }
    
    count(value) {
        return this.isBest(value) ? value : this._result;
    }
}

class MinAggregator extends SelectionAggregator
{
    isBest(value) {
        return this._result === null || value < this._result;
    }
}

class MaxAggregator extends SelectionAggregator
{
    isBest(value) {
        return this._result === null || value > this._result;
    }
}

export {
    CountAggregator,
    SumAggregator,
    AvgAggregator,
    MinAggregator,
    MaxAggregator,
};