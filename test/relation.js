import assert from 'assert';
import Model from '../src/lib/structures/model.js';
import ResidentRepository from '../src/lib/repository/resident.js';
import RelationAttribute, {
    Relation,
} from '../src/lib/repository/relation.js';

let humans;
let pets;

class HumanModel extends Model
{
    attributes() {
        return {
            id: Number,
            name: String,
            sex: String,
            parent_id: Number,
            children: RelationAttribute.oneToMany(humans, 'parent_id'),
            boys: RelationAttribute.oneToMany(humans, 'parent_id')
                .where('sex', '=', 'male')
                .ascendingBy('name'),
            parent: RelationAttribute.oneToOne(humans, 'parent_id'),
            pets: RelationAttribute.oneToMany(pets, 'owner_id'),
        };
    }
}

class PetModel extends Model
{
    attributes() {
        return {
            id: Number,
            name: String,
            owner_id: Number,
            owner: RelationAttribute.oneToOne(humans, 'owner_id'),
            owner_with_girls: RelationAttribute.oneToOne(humans, 'owner_id')
                .with((relations) => {
                    relations.query('children')
                        .where('sex', '=', 'female');
                }),
        };
    }
}

describe('Relations', function() {
    before(function (done) {
        humans = new ResidentRepository(HumanModel);
        pets = new ResidentRepository(PetModel);
        Promise.all([
            humans.store(new HumanModel({
                name: 'Jack',
                sex: 'male',
            })).then((jack) => {
                return Promise.all([
                    humans.store(new HumanModel({
                        name: 'Bob',
                        sex: 'male',
                        parent_id: jack.id,
                    })),
                    humans.store(new HumanModel({
                        name: 'Eva',
                        sex: 'female',
                        parent_id: jack.id,
                    })),
                    humans.store(new HumanModel({
                        name: 'Andy',
                        sex: 'male',
                        parent_id: jack.id,
                    })),
                    pets.store(new PetModel({
                        name: 'Larry',
                        owner_id: jack.id,
                    })),
                    pets.store(new PetModel({
                        name: 'Pit',
                        owner_id: jack.id,
                    })),
                ]);
            }),
            humans.store(new HumanModel({
                name: 'Lina',
                sex: 'female',
            })).then((lina) => {
                return Promise.all([
                    humans.store(new HumanModel({
                        name: 'Migel',
                        sex: 'male',
                        parent_id: lina.id,
                    })),
                    pets.store(new PetModel({
                        name: 'Petty',
                        owner_id: lina.id,
                    })),
                ]);
            }),
        ]).then(() => done());
    });
    describe('#oneToOne', function() {
        it('Relation should load', function(done) {
            humans.search({name: 'Bob'}).then((result) => {
                assert.strictEqual(result.length, 1);
                return result.first();
            }).then((bob) => {
                return bob.parent.get();
            }).then((jack) => {
                assert.strictEqual(jack.name, 'Jack');
                return pets.search({name: 'Petty'});
            }).then((result) => {
                assert.strictEqual(result.length, 1);
                return result.first();
            }).then((petty) => {
                return petty.owner.get().then((lina) => {
                    assert.strictEqual(lina.name, 'Lina');
                    assert.strictEqual(petty.owner.value.name, 'Lina');
                    done();
                });
            }).catch(done);
        });
        it('Relation value should be null when nothing is related', function(done) {
            humans.search({name: 'Jack'}).then((result) => {
                assert.strictEqual(result.length, 1);
                return result.first();
            }).then((jack) => {
                return jack.parent.get();
            }).then((nothing) => {
                assert.strictEqual(nothing, null);
                done();
            }).catch(done);
        });
    });
    describe('#oneToMany', function() {
        it('Relation should load', function(done) {
            humans.search({name: 'Jack'}).then((result) => {
                assert.strictEqual(result.length, 1);
                return result.first();
            }).then((jack) => {
                return jack.children.get();
            }).then((children) => {
                assert.strictEqual(children.length, 3);
                return humans.search({name: 'Lina'});
            }).then((result) => {
                assert.strictEqual(result.length, 1);
                return result.first();
            }).then((lina) => {
                return lina.pets.get().then((pets) => {
                    assert.strictEqual(pets.length, 1);
                    assert.strictEqual(pets.first().name, 'Petty');
                    assert.strictEqual(lina.pets.value.length, 1);
                    done();
                });
            }).catch(done);
        });
        it('Relation should load considering conditions and order', function(done) {
            humans.search({name: 'Jack'}).then((result) => {
                assert.strictEqual(result.length, 1);
                return result.first();
            }).then((jack) => {
                return jack.boys.get();
            }).then((boys) => {
                assert.deepStrictEqual(boys.all().map(boy => boy.name), ['Andy', 'Bob']);
                done();
            }).catch(done);
        });
        it('Relation value should be empty collection when nothing is related', function(done) {
            humans.search({name: 'Eva'}).then((result) => {
                assert.strictEqual(result.length, 1);
                return result.first();
            }).then((eva) => {
                return eva.children.get();
            }).then((nothing) => {
                assert.strictEqual(nothing.length, 0);
                done();
            }).catch(done);
        });
    });
    describe('#Eager loading', function() {
        it('Relation value should be loaded with liked relations', function(done) {
            pets.search({name: 'Larry'}).then((result) => {
                assert.strictEqual(result.length, 1);
                return result.first();
            }).then((larry) => {
                return larry.owner_with_girls.get();
            }).then((jack) => {
                assert.strictEqual(jack.name, 'Jack');
                assert.strictEqual(jack.children.value.length, 1);
                assert.strictEqual(jack.children.value.first().name, 'Eva');
                done();
            }).catch(done);
        });
        it('Relations should be loaded on multiple models', function(done) {
            humans.search({}).then((humans) => {
                return Relation.resolve(humans, (relations) => {
                    relations.query('parent')
                        .with('pets');
                    relations.query('children')
                        .where('sex', '=', 'male')
                        .ascendingBy('name');
                }).then(() => {
                    let andy = humans.find((human) => human.name === 'Andy');
                    assert.ok(andy !== undefined);
                    let jack = andy.parent.value;
                    assert.ok(jack !== undefined);
                    assert.strictEqual(jack.name, 'Jack');
                    let pets = jack.pets.value;
                    assert.strictEqual(pets.length, 2);
                    jack = humans.find((human) => human.name === 'Jack');
                    let boys = jack.children.value;
                    assert.deepStrictEqual(boys.all().map(boy => boy.name), ['Andy', 'Bob']);
                    done();
                });
            }).catch(done);
        });
    });
});