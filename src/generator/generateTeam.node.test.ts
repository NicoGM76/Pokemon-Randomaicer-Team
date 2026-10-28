// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTeam } from './generateTeam';
const p=(id,extra={})=>({id,name:`P${id}`,types:extra.types??['normal'],introducedGeneration:1,evolutionFamilyId:`f${id}`,stats:{hp:60,attack:extra.atk??80,defense:60,specialAttack:extra.spa??80,specialDefense:60,speed:60},specialTags:extra.tags??[],isPseudoLegendary:false,isFossil:false,isStarter:extra.starter??false});
const dataset={metadata:{schemaVersion:1,datasetVersion:'t',generatedAt:'x'},pokemon:[p(1,{starter:true,types:['fire']}),p(2,{tags:['legendary'],types:['psychic']}),p(3,{types:['water']}),p(4,{types:['grass']})],forms:[],games:[{id:'g',name:'G',generation:1}],contentPacks:[{id:'base',gameId:'g',name:'Base',type:'base'}],availability:[1,2,3,4].map(id=>({pokemonId:id,gameId:'g',contentPackId:'base',stage:'main_story',method:'wild'})),evolutions:[]};
const cfg=(mode,overrides={})=>({gameId:'g',enabledContentPacks:['base'],teamSize:2,stage:'main_story',mode,allowedMethods:['wild'],allowTradeEvolution:false,starterRule:'allow',legendaryRule:'allow',...overrides});

test('dispatches random adventure and custom modes',()=>{
 for(const mode of ['random','adventure','custom']) {
  const result=generateTeam(dataset,cfg(mode));
  assert.equal(result.team.length,2); assert.equal(result.complete,true);
 }
});

test('does not relax impossible custom filters',()=>{
 const result=generateTeam(dataset,cfg('custom',{teamSize:3,customRules:{monotype:'dragon'}}));
 assert.equal(result.generatedSize,0); assert.equal(result.complete,false);
});

test('can require starter and legendary together',()=>{
 const result=generateTeam(dataset,cfg('random',{starterRule:'require_one',legendaryRule:'require_one'}));
 assert.equal(result.validation.valid,true);
 assert.equal(result.team.some(s=>s.candidate.resolvedPokemon.isStarter),true);
 assert.equal(result.team.some(s=>s.candidate.resolvedPokemon.specialTags.includes('legendary')),true);
});

test('uses only locked members from current team during regeneration-style generation',()=>{
 const first=generateTeam(dataset,cfg('random'));
 first.team[0].locked=true;
 const result=generateTeam(dataset,cfg('random'),first.team);
 assert.equal(result.team.some(s=>s.locked&&s.candidate.candidateKey===first.team[0].candidate.candidateKey),true);
});
