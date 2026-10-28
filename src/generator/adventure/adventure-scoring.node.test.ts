// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefensiveProfile } from './getDefensiveProfile';
import { getOffensiveProfile } from './getOffensiveProfile';
import { scoreAdventureTeam } from './scoreAdventureTeam';
const p=(id,types,atk=80,spa=80)=>({id,name:`P${id}`,types,introducedGeneration:1,evolutionFamilyId:`f${id}`,stats:{hp:80,attack:atk,defense:80,specialAttack:spa,specialDefense:80,speed:80},specialTags:[],isPseudoLegendary:false,isFossil:false,isStarter:false});
const c=(id,types,atk=80,spa=80)=>({candidateKey:`c${id}`,sourcePokemon:p(id,types,atk,spa),resolvedPokemon:p(id,types,atk,spa),evolutionPath:[],evolutionFamilyId:`f${id}`,speciesGroupId:String(id),acquisitionOptions:[]});
const cfg=(custom={})=>({gameId:'g',enabledContentPacks:['b'],teamSize:3,stage:'main_story',mode:'adventure',allowedMethods:['wild'],allowTradeEvolution:false,starterRule:'allow',legendaryRule:'allow',customRules:custom});

test('detects 4x weaknesses and immunities',()=>{
 const garchomp=getDefensiveProfile(['dragon','ground']);
 assert.equal(garchomp.multipliers.ice,4);
 const flying=getDefensiveProfile(['flying']);
 assert.equal(flying.multipliers.ground,0);
});

test('classifies physical special and mixed profiles',()=>{
 assert.equal(getOffensiveProfile(p(1,['normal'],120,60).stats),'physical');
 assert.equal(getOffensiveProfile(p(2,['normal'],60,120).stats),'special');
 assert.equal(getOffensiveProfile(p(3,['normal'],90,85).stats),'mixed');
});

test('shared weaknesses reduce adventure score',()=>{
 const exposed=[c(1,['grass']),c(2,['grass']),c(3,['grass'])];
 const varied=[c(4,['water']),c(5,['fire']),c(6,['electric'])];
 assert.ok(scoreAdventureTeam(exposed,cfg()).total < scoreAdventureTeam(varied,cfg()).total);
});

test('monotype required type is exempt from repeated-type penalty',()=>{
 const team=[c(1,['ghost']),c(2,['ghost']),c(3,['ghost'])];
 const normal=scoreAdventureTeam(team,cfg());
 const mono=scoreAdventureTeam(team,cfg({monotype:'ghost'}));
 assert.ok(mono.redundancy > normal.redundancy);
});
