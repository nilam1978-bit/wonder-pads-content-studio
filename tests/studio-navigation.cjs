// Run: node tests/studio-navigation.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../simple-studio.jsx'),'utf8');
const memory=new Map(),actions=[];
const sessionStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value))};
const ctx={sessionStorage};vm.createContext(ctx);
vm.runInContext(source.slice(0,source.indexOf('function StudioSectionHeader')),ctx);
const dispatch=action=>actions.push(action);
const current=()=>actions.at(-1)?.view;
const open=(view,from)=>ctx.studioOpen(dispatch,view,from);
const back=view=>ctx.studioBack(dispatch,view);
// Old Create or My Work session state must never hijack an explicit Home action.
for(const section of ['create','work','brand']){
 sessionStorage.setItem('wpr-simple-section',section);ctx.studioShow(dispatch,'home');
 assert.equal(current(),'home');assert.equal(sessionStorage.getItem('wpr-simple-section'),'home');
}
// Ready-made and Reuse each return to their writing entry, with its original origin.
open('words','home');open('ready-content','words');back('ready-content');assert.equal(current(),'words');back('words');assert.equal(current(),'home');
open('words','work');open('repurpose','words');open('history','repurpose');
back('history');assert.equal(current(),'repurpose');back('repurpose');assert.equal(current(),'words');
back('words');assert.equal(current(),'home');assert.equal(sessionStorage.getItem('wpr-simple-section'),'work');
// Reopening the tool from its History must not introduce a Back loop.
open('words','home');open('repurpose','words');open('history','repurpose');open('repurpose','history');
back('repurpose');assert.equal(current(),'words');
// Launch has its own History origin as well.
memory.clear();open('launch','home');open('history','launch');back('history');assert.equal(current(),'launch');back('launch');assert.equal(current(),'home');
// A History opened independently from My Work returns there.
open('history','work');back('history');assert.equal(sessionStorage.getItem('wpr-simple-section'),'work');
// Missing, stale, and self-referential origins use safe entry defaults.
memory.clear();back('ready-content');assert.equal(current(),'words');
memory.set('wpr-back-repurpose','repurpose');assert.equal(ctx.studioParent('repurpose'),'words');
memory.set('wpr-back-history','create');assert.equal(ctx.studioParent('history'),'home');
assert.equal(ctx.studioBackLabel('ready-content'),'Back to your words');
console.log('PASS: contextual Back, explicit Home, My Work origins, missing origins, and loop-free History returns.');
