// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { canAddCandidateToTeam } from '../constraints/canAddCandidateToTeam';
import { validateTeam } from './validateTeam';

const p=(id,types,extra={})=>({id,name:`P${id}`,types,introducedGeneration:1,evolutionFamilyId:extra.family??`f${id}`,stats:{hp:1,attack:1,defense:1,specialAttack:1,specialDefense:1,speed:1},specialTags:extra.tags??[],isPseudoLegendary:false,isFossil:false,isStarter:extra.starter??false});
const c=(id,types,extra={})=>({candidateKey:`c${id}`,sourcePokemon:p(id,types,extra),resolvedPokemon:p(id,types,extra),evolutionPath:[],evolutionFamilyId:extra.family??`f${id}`,speciesGroupId:extra.species??String(id),acquisitionOptions:[]});
const config=(overrides={})=>({gameId:'g',enabledContentPacks:['b'],teamSize:2,stage:'main_story',mode:'random',allowedMethods:['wild'],allowTradeEvolution:false,starterRule:'allow',legendaryRule:'allow',...overrides});

test('rejects duplicate evolution family and species group',()=>{
 const first=c(1,['fire'],{family:'fam'});
 assert.equal(canAddCandidateToTeam(c(2,['water'],{family:'fam'}),[first],config()),false);
 assert.equal(canAddCandidateToTeam(c(3,['grass'],{species:'1'}),[first],config()),false);
});

test('enforces maxSharedType while building',()=>{
 const cfg=config({customRules:{maxSharedType:1}});
 assert.equal(canAddCandidateToTeam(c(2,['fire','flying']),[c(1,['fire'])],cfg),false);
 assert.equal(canAddCandidateToTeam(c(3,['water']),[c(1,['fire'])],cfg),true);
});

test('validates exact-one starter and legendary',()=>{
 const cfg=config({teamSize:2,starterRule:'require_one',legendaryRule:'require_one'});
 let result=validateTeam([c(1,['fire'],{starter:true}),c(2,['water'],{tags:['legendary']})],cfg);
 assert.equal(result.valid,true);
 result=validateTeam([c(1,['fire'],{starter:true}),c(3,['grass'],{starter:true})],cfg);
 assert.deepEqual(result.issues.map(x=>x.code).sort(),['missing_required_legendary','too_many_starters'].sort());
});

test('reports duplicate and too-small constraints explicitly',()=>{
 const cfg=config({teamSize:3});
 const result=validateTeam([c(1,['fire'],{family:'fam'}),c(2,['water'],{family:'fam'})],cfg);
 assert.equal(result.valid,false);
 assert.equal(result.issues.some(x=>x.code==='team_too_small'),true);
 assert.equal(result.issues.some(x=>x.code==='duplicate_evolution_family'),true);
});
