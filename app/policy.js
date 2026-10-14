import {validateWindow,CHANNELS,FAMILIES} from './simulator.js';
// This module cannot issue hardware commands. Rehearsal is a logged UI event only.
export function assess(window,prediction){
 const w=validateWindow(window),reasons=[];
 if(w.provenance!=='synthetic')reasons.push('Imported and bench signals have no validated model or calibration evidence');
 if(w.samples.length!==24)reasons.push('A complete 24-sample window is required');
 for(const ch of CHANNELS){
  if(w.samples.some(s=>s[ch]===null))reasons.push(`${ch}: missing readings`);
  let held=1;
  for(let i=1;i<w.samples.length;i++){held=w.samples[i][ch]!==null&&w.samples[i][ch]===w.samples[i-1][ch]?held+1:1;if(held===4)reasons.push(`${ch}: four identical readings; inspect sensor`);}
 }
 if(!prediction||typeof prediction!=='object')reasons.push('Model result missing');
 else if(prediction.status!=='estimated')reasons.push(prediction.reason||'Model abstained');
 else if(!FAMILIES.includes(prediction.label)||!Number.isFinite(prediction.confidence)||prediction.confidence<0||prediction.confidence>1)reasons.push('Invalid model label or confidence');
 else if(prediction.label==='sensor_fault')reasons.push('Model estimates an injected sensor fault');
 else if(prediction.confidence<0.8)reasons.push('Model confidence below the declared demo review threshold');
 return Object.freeze({state:reasons.length?'hold':'review',reasons:Object.freeze(reasons),hardwareActuation:false});
}
export function createRehearsal(){
 let current=null,approved=null;
 return Object.freeze({
  clear(){current=null;approved=null;},
  load(window,prediction){const w=validateWindow(window);current={key:JSON.stringify(w),policy:assess(w,prediction)};approved=null;return current.policy;},
  approve(){if(!current||current.policy.state!=='review')throw new Error('Current window is held');approved=current.key;},
  run(){if(!current||current.policy.state!=='review'||approved!==current.key)throw new Error('Review this exact window first');approved=null;return Object.freeze({event:'virtual_rehearsal',hardwareActuation:false,therapyDose:null,message:'Software state transition only; no light or ultrasound command'});}
 });
}
