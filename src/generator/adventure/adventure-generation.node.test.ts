// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAdventureTeam } from './generateAdventureTeam';
const p=(id,types)=>({id,name:`P${id}`,types,introducedGeneration:1,evolutionFamilyId:`f${id}`,stats:{hp:80,attack:id%2?110:60,defense:70,specialAttack:id%2?60:110,specialDefense:70,speed:80},specialTags:[],isPseudoLegendary:false,isFossil:false,isStarter:false});
const c=(id,types)=>({candidateKey:`c${id}`,sourcePokemon:p(id,types),resolvedPokemon:p(id,types),evolutionPath:[],evolutionFamilyId:`f${id}`,speciesGroupId:String(id),acquisitionOptions:[]});
const config={gameId:'g',enabledContentPacks:['b'],teamSize:3,stage:'main_story',mode:'adventure',allowedMethods:['wild'],allowTradeEvolution:false,starterRule:'allow',legendaryRule:'allow'};

test('adventure generation returns a complete valid team and respects locks',()=>{
 const candidates=[c(1,['fire']),c(2,['water']),c(3,['grass']),c(4,['electric']),c(5,['rock']),c(6,['flying'])];
 let seed=123456789; const rng=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 const locked={candidate:candidates[0],locked:true};
 const result=generateAdventureTeam(candidates,config,[locked],rng);
 assert.equal(result.complete,true);
 assert.equal(result.team.length,3);
 assert.equal(result.team.some(x=>x.locked&&x.candidate.candidateKey==='c1'),true);
});
