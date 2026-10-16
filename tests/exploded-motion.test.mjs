import test from 'node:test';
import assert from 'node:assert/strict';
import {assemblyPose,assemblyOffset} from '../app/exploded.js';
test('assembly scroll poses are bounded, reversible and finite',()=>{
 for(let i=0;i<6;i++){
  assert.equal(assemblyPose(-10,i),assemblyPose(0,i));
  assert.equal(assemblyPose(12,i),assemblyPose(1,i));
  assert.equal(assemblyPose(NaN,i),assemblyPose(0,i));
  assert.equal(assemblyPose(.5,i),assemblyPose(.5,i));
  assert.ok(!/NaN|Infinity/.test(assemblyPose(.5,i)));
 }
 assert.notEqual(assemblyPose(0,4),assemblyPose(1,4));
});
test('reduced motion uses one static exploded pose for every scroll position',()=>{
 for(let i=0;i<6;i++)assert.equal(assemblyPose(0,i,true),assemblyPose(1,i,true));
});
import {mountAssembly} from '../app/exploded.js';
function fixture(reduced=false,width=1280){
 const listeners=new Map();
 const event=()=>({listeners:new Map(),addEventListener(k,f){this.listeners.set(k,f)},removeEventListener(k,f){assert.equal(this.listeners.get(k),f);this.listeners.delete(k)},emit(k){this.listeners.get(k)?.()}});
 const layers=Array.from({length:6},()=>({style:{}}));
 const labels=Array.from({length:6},()=>({active:false,classList:{toggle(k,v){this.owner.active=v}}}));labels.forEach(x=>x.classList.owner=x);
 let top=0;
 const section={offsetHeight:2300,getBoundingClientRect:()=>({top}),querySelectorAll:q=>q==='[data-layer]'?layers:q==='[data-part-label]'?Array.from({length:6},()=>({style:{}})):labels};
 const slider={...event(),value:'0',disabled:false},percent={},description={};
 const media={...event(),matches:reduced};
 let pending=null,cancelled=false;
 const win={...event(),innerHeight:1000,innerWidth:width,matchMedia:()=>media,requestAnimationFrame:f=>{pending=f;return 7},cancelAnimationFrame:id=>{assert.equal(id,7);pending=null;cancelled=true}};
 const doc={getElementById:id=>({'assembly':section,'assembly-progress':slider,'assembly-percentage':percent,'layer-description':description}[id])};
 return{doc,win,media,slider,percent,description,layers,labels,setTop:t=>top=t,flush:()=>{const f=pending;pending=null;f?.()},hasPending:()=>pending!==null,isCancelled:()=>cancelled};
}
test('controller renders initially, reverses scroll and coalesces pending frames',()=>{
 const f=fixture();const stop=mountAssembly(f.doc,f.win);
 assert.equal(f.percent.textContent,'0');assert.equal(f.labels[0].active,true);
 f.setTop(-1300);f.win.emit('scroll');assert.ok(f.hasPending());f.win.emit('resize');f.flush();
 assert.equal(f.percent.textContent,'100');assert.equal(f.labels[5].active,true);
 f.setTop(0);f.win.emit('scroll');f.flush();assert.equal(f.percent.textContent,'0');
 f.slider.value='50';f.slider.emit('input');assert.equal(f.percent.textContent,'50');assert.equal(f.labels[3].active,true);
 assert.equal(f.layers[4].style.transform,assemblyPose(.5,4));
 f.slider.value='200';f.slider.emit('input');assert.equal(f.percent.textContent,'100');
 f.setTop(0);f.win.emit('scroll');f.flush();assert.equal(f.percent.textContent,'100');
 f.win.emit('wheel');f.flush();assert.equal(f.percent.textContent,'0');
 f.win.emit('scroll');stop();assert.ok(f.isCancelled());assert.equal(f.win.listeners.size,0);assert.equal(f.media.listeners.size,0);assert.equal(f.slider.listeners.size,0);
});
test('controller switches to static reduced-motion and restores scroll when preference changes',()=>{
 const f=fixture(true,390);const stop=mountAssembly(f.doc,f.win);
 assert.equal(f.slider.disabled,true);assert.equal(f.percent.textContent,'0');assert.match(f.description.textContent,/static view/);
 assert.equal(f.layers[4].style.transform,assemblyPose(1,4,true,true));
 f.slider.value='0';f.slider.emit('input');assert.equal(f.percent.textContent,'0');
 f.setTop(-650);f.win.emit('scroll');f.flush();assert.equal(f.percent.textContent,'0');
 f.media.matches=false;f.media.emit('change');f.flush();assert.equal(f.slider.disabled,false);assert.equal(f.percent.textContent,'50');
 stop();
});
test('missing assembly is a safe no-op',()=>{assert.doesNotThrow(()=>mountAssembly({getElementById:()=>null},{})());});

test('short desktop viewport uses the compact layer geometry',()=>{const f=fixture(false,1280);f.win.innerHeight=720;const stop=mountAssembly(f.doc,f.win);assert.equal(f.layers[0].style.transform,assemblyPose(0,0,false,true));f.slider.value='100';f.slider.emit('input');assert.equal(f.layers[5].style.transform,assemblyPose(1,5,false,true));stop();});

test('reference sequence closes all six layers without crossing or reopening',()=>{
 for(const compact of [false,true]){
  let previous=Infinity;
  for(let step=0;step<=100;step++){
   const p=step/100,ys=Array.from({length:6},(_,i)=>assemblyOffset(p,i,false,compact));
   for(let i=1;i<ys.length;i++)assert.ok(ys[i-1]>ys[i],`layers cross at ${p}`);
   const span=ys[0]-ys[5];assert.ok(span<=previous+1e-9);previous=span;
  }
  for(let i=1;i<6;i++)assert.equal(assemblyOffset(1,i-1,false,compact)-assemblyOffset(1,i,false,compact),7);
 }
 assert.ok(assemblyOffset(0,0)-assemblyOffset(0,5)>assemblyOffset(1,0)-assemblyOffset(1,5));
});
