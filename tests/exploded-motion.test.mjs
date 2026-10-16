import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assemblyPose,assemblyOffset,mountAssembly} from '../app/exploded.js';
function event(){return{listeners:new Map(),attributes:{},style:{},addEventListener(k,f){this.listeners.set(k,f)},removeEventListener(k,f){assert.equal(this.listeners.get(k),f);this.listeners.delete(k)},emit(k){this.listeners.get(k)?.()},setAttribute(k,v){this.attributes[k]=v}};}
function fixture(width=1280,height=1000){
 const layers=Array.from({length:6},()=>event()),callouts=Array.from({length:6},()=>event()),section={...event(),querySelectorAll:q=>q==='[data-layer]'?layers:callouts};
 const button=event(),description={},phase={},light=event(),ground=event(),stage=event(),win={...event(),innerWidth:width,innerHeight:height};
 const doc={getElementById:id=>({'assembly':section,'assembly-toggle':button,'layer-description':description,'assembly-phase':phase,'assembly-light':light,'assembly-ground':ground,'patch-assembly':stage}[id])};
 return{doc,win,section,button,layers,callouts,description,phase,light,ground,stage};
}
test('assembly poses are bounded, deterministic and finite',()=>{for(let i=0;i<6;i++){assert.equal(assemblyPose(-10,i),assemblyPose(0,i));assert.equal(assemblyPose(12,i),assemblyPose(1,i));assert.equal(assemblyPose(NaN,i),assemblyPose(0,i));assert.ok(!/NaN|Infinity/.test(assemblyPose(.5,i)));}});
test('button closes the patch and the same button opens it again',()=>{
 const f=fixture(),stop=mountAssembly(f.doc,f.win);
 assert.equal(f.button.textContent,'Assemble patch');assert.equal(f.button.attributes['aria-expanded'],'true');
 assert.equal(f.layers[5].style.transform,assemblyPose(0,5));
 f.button.emit('click');assert.equal(f.button.textContent,'Open layers');assert.equal(f.section.attributes['data-assembly-state'],'assembled');assert.equal(f.button.attributes['aria-expanded'],'false');assert.equal(f.layers[5].style.transform,assemblyPose(1,5));assert.equal(f.light.style.opacity,'.82');assert.equal(f.callouts[0].style.opacity,'0');
 f.button.emit('click');assert.equal(f.button.textContent,'Assemble patch');assert.equal(f.phase.textContent,'LAYERS OPEN');assert.equal(f.layers[5].style.transform,assemblyPose(0,5));stop();
});
test('scrolling, wheel, touch and page keys cannot change the assembly',()=>{
 const f=fixture(),stop=mountAssembly(f.doc,f.win);f.button.emit('click');const pose=f.layers[4].style.transform;
 for(const k of ['scroll','wheel','touchmove','keydown']){assert.equal(f.win.listeners.has(k),false);f.win.emit(k);assert.equal(f.layers[4].style.transform,pose);}stop();
});
test('rapid reversal keeps the last requested state and cleans up listeners',()=>{
 const f=fixture(),stop=mountAssembly(f.doc,f.win);
 for(let i=0;i<11;i++)f.button.emit('click');assert.equal(f.layers[3].style.transform,assemblyPose(1,3));
 f.button.emit('click');assert.equal(f.layers[3].style.transform,assemblyPose(0,3));stop();assert.equal(f.win.listeners.size,0);assert.equal(f.button.listeners.size,0);
});
test('resize preserves the requested state with compact phone and short desktop geometry',()=>{
 const f=fixture(),stop=mountAssembly(f.doc,f.win);f.button.emit('click');f.win.innerHeight=720;f.win.emit('resize');assert.equal(f.layers[5].style.transform,assemblyPose(1,5,true));f.win.innerWidth=390;f.win.innerHeight=844;f.win.emit('resize');assert.equal(f.layers[0].style.transform,assemblyPose(1,0,true));stop();
});
test('native button and reduced-motion CSS keep both states accessible without motion',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../app/style.css',import.meta.url),'utf8');
 assert.match(html,/<button id="assembly-toggle" type="button" aria-controls="patch-assembly"/);assert.doesNotMatch(html,/assembly-progress/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.closure-scene \.assembly-layer[^}]+transition:none/);
 const f=fixture();const stop=mountAssembly(f.doc,f.win);f.button.emit('click');assert.equal(f.section.attributes['data-assembly-state'],'assembled');stop();
});
test('missing assembly or button is a safe no-op',()=>{assert.doesNotThrow(()=>mountAssembly({getElementById:()=>null},{})());});
test('closure preserves layer order and finishes with seven-pixel spacing',()=>{
 for(const compact of [false,true]){let previous=Infinity;for(let step=0;step<=100;step++){const p=step/100,ys=Array.from({length:6},(_,i)=>assemblyOffset(p,i,compact));for(let i=1;i<6;i++)assert.ok(ys[i-1]>ys[i]);const span=ys[0]-ys[5];assert.ok(span<=previous+1e-9);previous=span;}for(let i=1;i<6;i++)assert.equal(assemblyOffset(1,i-1,compact)-assemblyOffset(1,i,compact),7);}
});
