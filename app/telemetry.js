import {CHANNELS,validateWindow} from './simulator.js';
export function parseFrame(line){
 if(typeof line!=='string'||line.length>4096)throw new Error('Telemetry frame exceeds 4 KB');
 const f=JSON.parse(line),keys=['schema','seq','t','provenance',...CHANNELS,'raw','status','hardware_actuation'];
 if(!f||Array.isArray(f)||Object.keys(f).length!==keys.length||keys.some(k=>!Object.hasOwn(f,k))||f.schema!=='patchline-bench-frame-v1'||f.hardware_actuation!==false||!['bench','synthetic'].includes(f.provenance)||!Number.isInteger(f.seq)||f.seq<0||f.seq>4294967295||!Number.isFinite(f.t)||f.t<0||f.t>1e9)throw new Error('Unsupported telemetry frame');
 if(!f.status||Object.keys(f.status).length!==4||CHANNELS.some(ch=>!Object.hasOwn(f.status,ch)||!['measured','simulated','uncalibrated','invalid','missing'].includes(f.status[ch])))throw new Error('Invalid channel status');
 for(const ch of CHANNELS){const measured=['measured','simulated'].includes(f.status[ch]);if(measured?!Number.isFinite(f[ch]):f[ch]!==null)throw new Error('Reading contradicts status');if(f.provenance==='bench'&&f.status[ch]==='simulated')throw new Error('Bench cannot claim simulated calibration');}
 if(!f.raw||Object.keys(f.raw).length!==3||['ph_v','moisture_v','glucose_v'].some(k=>!Object.hasOwn(f.raw,k)||(f.raw[k]!==null&&!Number.isFinite(f.raw[k]))))throw new Error('Invalid raw voltages');
 return f;
}
// Arrival gaps use the browser's monotonic clock, independently of device timestamps.
export function createFrameBuffer(now=()=>performance.now()){
 let frames=[],last=null,lastArrival=null;
 function clear(){frames=[];last=null;lastArrival=null;}
 return {clear,push(line){
  try{
   const f=parseFrame(line),arrival=now();
   if(!Number.isFinite(arrival))throw new Error('Invalid telemetry arrival clock');
   if(lastArrival!==null&&(arrival-lastArrival>10000||arrival<lastArrival))clear();
   if(last&&(f.t<=last.t||f.seq!==((last.seq+1)>>>0)||f.provenance!==last.provenance))throw new Error('Telemetry discontinuity; collecting a new window');
   frames.push(f);last=f;lastArrival=arrival;
   if(frames.length>24)frames.shift();
   if(frames.length<24)return null;
   return validateWindow({schema:'patchline-bench-window-v1',provenance:'bench',seed:null,family:null,samples:frames.map(f=>Object.fromEntries(['t',...CHANNELS].map(k=>[k,f[k]])))});
  }catch(error){clear();throw error;}
 }};
}
