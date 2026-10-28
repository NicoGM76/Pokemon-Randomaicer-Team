// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { regenerateSlot } from './regenerateSlot';
import { regenerateTeam } from './regenerateTeam';
const p=id=>({id,name:`P${id}`,types:['normal'],introducedGeneration:1,evolutionFamilyId:`f${id}`,stats:{hp:1,attack:1,defense:1,specialAttack:1,specialDefense:1,speed:1},specialTags:[],isPseudoLegendary:false,isFossil:false,isStarter:false});
const c=id=>({candidateKey:`c${id}`,sourcePokemon:p(id),resolvedPokemon:p(id),evolutionPath:[],evolutionFamilyId:`f${id}`,speciesGroupId:String(id),acquisitionOptions:[]});
const cfg={gameId:'g',enabledContentPacks:['b'],teamSize:2,stage:'main_story',mode:'random',allowedMethods:['wild'],allowTradeEvolution:false,starterRule:'allow',legendaryRule:'allow'};

test('slot regeneration excludes current candidate and preserves index',()=>{
 const team=[{candidate:c(1),locked:false},{candidate:c(2),locked:false}];
 const result=regenerateSlot(team,0,[c(1),c(2),c(3)],cfg);
 assert.equal(result.changed,true); assert.notEqual(result.team[0].candidate.candidateKey,'c1'); assert.equal(result.team[1].candidate.candidateKey,'c2');
});

test('slot regeneration reports no alternative',()=>{
 const team=[{candidate:c(1),locked:false},{candidate:c(2),locked:false}];
 const result=regenerateSlot(team,0,[c(1),c(2)],cfg);
 assert.equal(result.changed,false); assert.equal(result.reason,'no_alternative');
});

test('team regeneration preserves locks',()=>{
 const team=[{candidate:c(1),locked:true},{candidate:c(2),locked:false}];
 const result=regenerateTeam(team,[c(1),c(2),c(3)],cfg);
 assert.equal(result.team.some(s=>s.candidate.candidateKey==='c1'&&s.locked),true);
});
