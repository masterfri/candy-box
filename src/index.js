import Query from './lib/query/query';

let query = new Query((cond) => {
    cond.equals('a', null);
});

console.log(query.getCondition());

console.log(
    query.getCondition().isValid({a: 5})
);