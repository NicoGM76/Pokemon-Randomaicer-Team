// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUpdateReport, normalizeEvolutionDetail } from './update-pokemon-data';

const current={pokemon:[{id:1,name:'A'}],forms:[{id:'a-base',pokemonId:1}],evolutions:[{fromId:1,toId:2,conditions:[{type:'level',minLevel:16}]}]};

test('reports new species and forms',()=>{
 const incoming={pokemon:[{id:1,name:'A'},{id:3,name:'New'}],forms:[{id:'a-base',pokemonId:1},{id:'new-form',pokemonId:3}],evolutions:current.evolutions};
 const report=buildUpdateReport(current,incoming);
 assert.deepEqual(report.newSpecies,[3]); assert.deepEqual(report.newForms,['new-form']);
});

test('reports changed evolution chains',()=>{
 const incoming={...current,evolutions:[{fromId:1,toId:2,conditions:[{type:'level',minLevel:18}]}]};
 const report=buildUpdateReport(current,incoming);
 assert.equal(report.changedEvolutionChains.length,1);
});

test('normalizes known evolution triggers and reports unknown ones',()=>{
 const known=normalizeEvolutionDetail({trigger:{name:'trade'},min_level:null,item:null,time_of_day:'',gender:null,known_move:null});
 assert.deepEqual(known.conditions,[{type:'trade'}]); assert.deepEqual(known.unknownConditions,[]);
 const unknown=normalizeEvolutionDetail({trigger:{name:'dance-under-moon'},min_level:null,item:null,time_of_day:'',gender:null,known_move:null});
 assert.equal(unknown.unknownConditions.includes('trigger:dance-under-moon'),true);
});
