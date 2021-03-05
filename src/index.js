import Query from './lib/query/query.js';

let query = new Query((cond) => {
    cond.eq('a', null);
});

console.log(query.getCondition());

console.log(
    query.getCondition().isValid({a: 5})
);