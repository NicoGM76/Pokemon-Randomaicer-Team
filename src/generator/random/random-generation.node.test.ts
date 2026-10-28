// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRandomTeam } from './generateRandomTeam';

const p=(id,extra={})=>({id,name:`P${id}`,types:extra.types??['normal'],introducedGeneration:1,evolutionFamilyId:`f${id}`,stats:{hp:1,attack:1,defense:1,specialAttack:1,specialDefense:1,speed:1},specialTags:extra.tags??[],isPseudoLegendary:false,isFossil:false,isStarter:extra.starter??false});
const c=(id,extra={})=>({candidateKey:`c${id}`,sourcePokemon:p(id,extra),resolvedPokemon:p(id,extra),evolutionPath:[],evolutionFamilyId:`f${id}`,speciesGroupId:String(id),acquisitionOptions:[]});
const cfg=(overrides={})=>({gameId:'g',enabledContentPacks:['b'],teamSize:3,stage:'main_story',mode:'random',allowedMethods:['wild'],allowTradeEvolution:false,starterRule:'allow',legendaryRule:'allow',...overrides});

test('generates requested team size when enough candidates exist',()=>{
 const result=generateRandomTeam([c(1),c(2),c(3),c(4)],cfg(),[]);
 assert.equal(result.team.length,3); assert.equal(result.complete,true); assert.equal(result.validation.valid,true);
});

test('returns incomplete result without relaxing when pool is too small',()=>{
 const result=generateRandomTeam([c(1),c(2)],cfg(),[]);
 assert.equal(result.team.length,2); assert.equal(result.complete,false); assert.equal(result.validation.issues.some(x=>x.code==='team_too_small'),true);
});

test('preserves locked slots and fills around them',()=>{
 const locked={candidate:c(1),locked:true};
 const result=generateRandomTeam([c(1),c(2),c(3),c(4)],cfg(),[locked]);
 assert.equal(result.team.some(s=>s.candidate.candidateKey==='c1'&&s.locked),true);
 assert.equal(result.team.length,3);
});

test('satisfies required starter and legendary when available',()=>{
 const candidates=[c(1,{starter:true}),c(2,{tags:['legendary']}),c(3),c(4)];
 const result=generateRandomTeam(candidates,cfg({starterRule:'require_one',legendaryRule:'require_one'}),[]);
 assert.equal(result.validation.valid,true);
 assert.equal(result.team.filter(s=>s.candidate.resolvedPokemon.isStarter).length,1);
 assert.equal(result.team.filter(s=>s.candidate.resolvedPokemon.specialTags.includes('legendary')).length,1);
});

test('never exceeds requested size when required categories cannot both fit',()=>{
 const candidates=[c(1,{starter:true}),c(2,{tags:['legendary']})];
 const result=generateRandomTeam(candidates,cfg({teamSize:1,starterRule:'require_one',legendaryRule:'require_one'}),[]);
 assert.equal(result.team.length,1);
 assert.equal(result.complete,false);
});
