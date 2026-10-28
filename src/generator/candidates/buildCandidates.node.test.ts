// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCandidates } from './buildCandidates';

const p = (id,name,types,gen=1,extra={}) => ({ id,name,types,introducedGeneration:gen,evolutionFamilyId:extra.family ?? `${id}-line`, stats:{hp:50,attack:50,defense:50,specialAttack:50,specialDefense:50,speed:50},specialTags:extra.tags??[],isPseudoLegendary:extra.pseudo??false,isFossil:extra.fossil??false,isStarter:extra.starter??false });
const baseDataset = () => ({
 metadata:{schemaVersion:1,datasetVersion:'test',generatedAt:'x'},
 pokemon:[p(1,'Base',['normal']),p(2,'Final',['fire']),p(3,'BranchA',['water']),p(4,'BranchB',['electric']),p(5,'Legend',['psychic'],1,{tags:['legendary']}),p(6,'NewGen',['grass'],9)],
 forms:[{id:'final-cosmetic',pokemonId:2,name:'Pretty',formType:'cosmetic',countsAsSameSpecies:true},{id:'final-regional',pokemonId:2,name:'Regional',formType:'regional',types:['dark'],countsAsSameSpecies:true}],
 games:[{id:'game',name:'Game',generation:9}], contentPacks:[{id:'base',gameId:'game',name:'Base',type:'base'}],
 availability:[
  {pokemonId:1,gameId:'game',contentPackId:'base',stage:'main_story',method:'wild'},
  {pokemonId:1,gameId:'game',contentPackId:'base',stage:'main_story',method:'gift'},
  {pokemonId:2,formId:'final-regional',gameId:'game',contentPackId:'base',stage:'main_story',method:'wild'},
  {pokemonId:5,gameId:'game',contentPackId:'base',stage:'main_story',method:'wild'},
  {pokemonId:6,gameId:'game',contentPackId:'base',stage:'main_story',method:'wild'}
 ],
 evolutions:[{fromId:1,toId:3,conditions:[]},{fromId:1,toId:4,conditions:[]}]
});
const config = (custom={},overrides={}) => ({gameId:'game',enabledContentPacks:['base'],teamSize:6,stage:'main_story',mode:'custom',allowedMethods:['wild','gift','evolution'],allowTradeEvolution:false,starterRule:'allow',legendaryRule:'allow',customRules:custom,...overrides});

test('splits reachable branch finals and merges acquisition routes', () => {
 const result=buildCandidates(baseDataset(),config());
 const branches=result.filter(x=>[3,4].includes(x.resolvedPokemon.id));
 assert.equal(branches.length,2);
 for(const c of branches) assert.equal(c.acquisitionOptions.length,2);
 assert.equal(new Set(result.map(x=>x.candidateKey)).size,result.length);
});

test('cosmetic forms are not candidates while explicit regional forms are', () => {
 const result=buildCandidates(baseDataset(),config());
 assert.equal(result.some(x=>x.form?.id==='final-cosmetic'),false);
 assert.equal(result.some(x=>x.form?.id==='final-regional'),true);
});

test('candidate stores source and resolved pokemon deterministically', () => {
 const result=buildCandidates(baseDataset(),config());
 const branch=result.find(x=>x.resolvedPokemon.id===3);
 assert.equal(branch.sourcePokemon.id,1);
 assert.equal(branch.evolutionFamilyId,'1-line');
 assert.equal(branch.speciesGroupId,'3');
});

test('filters current generation, regional-only and special categories', () => {
 let result=buildCandidates(baseDataset(),config({onlyCurrentGeneration:true}));
 assert.deepEqual(result.map(x=>x.resolvedPokemon.id),[6]);
 result=buildCandidates(baseDataset(),config({onlyRegionalForms:true}));
 assert.equal(result.length,1); assert.equal(result[0].form.id,'final-regional');
 result=buildCandidates(baseDataset(),config({mythicalRule:'allow'}, {legendaryRule:'exclude'}));
 assert.equal(result.some(x=>x.resolvedPokemon.id===5),false);
});
