import {
    isNumber,
    isString,
} from '../helpers';

class Aggregator
{
    constructor(initial = null) {
        this.result = initial;
    }
    
    isValid(value) {
        return true;
    }
    
    add(value) {
        if (this.isValid(value)) {
            this.result = this.count(value);
        }
    }
    
    count(value) {
        return value;
    }
    
    getResult() {
        return this.result;
    } 
}

class CountAggregator extends Aggregator
{
    constructor() {
        super(0);
    }
    
    count(value) {
        return this.result + 1;
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
        return this.result + value;
    }
}

class AvgAggregator extends SumAggregator
{
    constructor() {
        super()
        this.num = 0;
    }
    
    count(value) {
        this.num++;
        return super.count(value);
    }
    
    getResult() {
        return this.num === 0 ? 0 : this.result / this.num;
    }
}

class SelectionAggregator extends Aggregator
{
    isValid(value) {
        return isNumber(value) || isString(value);
    }
    
    count(value) {
        return this.isBest(value) ? value : this.result;
    }
}

class MinAggregator extends SelectionAggregator
{
    isBest(value) {
        return this.result === null || value < this.result;
    }
}

class MaxAggregator extends SelectionAggregator
{
    isBest(value) {
        return this.result === null || value > this.result;
    }
}

export {
    CountAggregator,
    SumAggregator,
    AvgAggregator,
    MinAggregator,
    MaxAggregator,
};