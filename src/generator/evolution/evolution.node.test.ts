// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { canEvolve } from './canEvolve';
import { resolveReachableEvolutions } from './resolveReachableEvolutions';

const config = (overrides = {}) => ({ gameId:'platinum', enabledContentPacks:['platinum-base'], teamSize:6, stage:'main_story', mode:'random', allowedMethods:['wild','evolution'], allowTradeEvolution:false, starterRule:'allow', legendaryRule:'allow', ...overrides });

test('trade evolution is blocked unless enabled', () => {
  const trade = { fromId:93, toId:94, conditions:[{type:'trade'}] };
  assert.equal(canEvolve(trade, config()), false);
  assert.equal(canEvolve(trade, config({allowTradeEvolution:true})), true);
});

test('Gastly resolves to Haunter without trade and Gengar with trade', () => {
  const steps = [
    { fromId:92, toId:93, conditions:[{type:'level',minLevel:25}] },
    { fromId:93, toId:94, conditions:[{type:'trade'}] }
  ];
  assert.deepEqual(resolveReachableEvolutions(92, steps, config()).map(x=>x.pokemonId), [93]);
  const withTrade = resolveReachableEvolutions(92, steps, config({allowTradeEvolution:true}));
  assert.deepEqual(withTrade.map(x=>x.pokemonId), [94]);
  assert.equal(withTrade[0].path.length, 2);
});

test('returns every reachable final in branching evolutions', () => {
  const steps = [
    { fromId:133, toId:134, conditions:[{type:'item',itemId:'water-stone'}] },
    { fromId:133, toId:135, conditions:[{type:'item',itemId:'thunder-stone'}] }
  ];
  assert.deepEqual(resolveReachableEvolutions(133, steps, config()).map(x=>x.pokemonId).sort(), [134,135]);
});

test('supports multi-depth branches and protects against cycles', () => {
  const deep = [
    { fromId:1, toId:2, conditions:[] },
    { fromId:2, toId:3, conditions:[] },
    { fromId:2, toId:4, conditions:[] }
  ];
  assert.deepEqual(resolveReachableEvolutions(1, deep, config()).map(x=>x.pokemonId).sort(), [3,4]);
  const cyclic = [{fromId:1,toId:2,conditions:[]},{fromId:2,toId:1,conditions:[]}];
  const result = resolveReachableEvolutions(1, cyclic, config());
  assert.equal(result.length, 1);
  assert.equal(result[0].pokemonId, 2);
});

test('game condition must include selected game while normal adventure conditions are satisfiable', () => {
  const allowed = { fromId:1,toId:2,conditions:[{type:'game',gameIds:['platinum']},{type:'friendship'},{type:'time',value:'day'},{type:'gender',value:'male'},{type:'move_known',moveId:'x'},{type:'special',conditionId:'spin'}] };
  assert.equal(canEvolve(allowed, config()), true);
  assert.equal(canEvolve(allowed, config({gameId:'diamond'})), false);
});
