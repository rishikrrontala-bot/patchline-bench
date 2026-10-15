import {mountAssembly} from './exploded.js';
import {generateWindow,validateWindow,CHANNELS,toCSV} from './simulator.js';
import {predict} from './inference.js';
import {createRehearsal} from './policy.js';
import {createFrameBuffer} from './telemetry.js';
mountAssembly();
const $=id=>document.getElementById(id),fsm=createRehearsal();let model,window;
const titles=['pH signal','Temperature · °C','Wetness · %','Glucose signal · AU'];
const pretty=n=>n===null?'Missing':Number(n).toFixed(3);
function render(w){
 window=w;const prediction=predict(w,model),policy=fsm.load(w,prediction);$('approve').checked=false;$('approve').disabled=policy.state!=='review';$('rehearse').disabled=true;$('event').textContent='';$('error').textContent='';
 $('source').textContent=`${w.provenance.toUpperCase()} / ${w.samples.length} SAMPLES`;
 $('estimate').textContent=prediction.status==='estimated'?prediction.label.replace('_',' '):'Model abstained';
 $('model-note').textContent='Estimated simulator family. These likelihoods do not measure infection or treatment need.';
 $('likelihoods').replaceChildren();if(prediction.probabilities)prediction.probabilities.forEach((v,i)=>{const row=document.createElement('div');row.className='prob';const name=document.createElement('span'),num=document.createElement('span'),bar=document.createElement('progress');name.textContent=model.labels[i].replace('_',' ');num.textContent=`${(v*100).toFixed(1)}%`;bar.max=1;bar.value=v;bar.setAttribute('aria-label',name.textContent+' simulated family likelihood');row.append(name,num,bar);$('likelihoods').append(row);});
 $('gate').textContent=policy.state.toUpperCase();$('reason').textContent=policy.reasons.join('. ')||'Quality checks passed for a synthetic window. Manual review is required before virtual rehearsal.';
 $('charts').replaceChildren();CHANNELS.forEach((ch,i)=>{const values=w.samples.map(s=>s[ch]),valid=values.filter(x=>x!==null),lo=Math.min(...valid),hi=Math.max(...valid),span=hi-lo||1;const section=document.createElement('section');section.className='chart';const h=document.createElement('h3'),value=document.createElement('span'),range=document.createElement('div');h.textContent=titles[i];value.className='value';value.textContent=pretty(values.at(-1));const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 400 100');svg.setAttribute('role','img');svg.setAttribute('aria-label',valid.length?`${titles[i]}, minimum ${pretty(lo)}, maximum ${pretty(hi)}, ${values.length-valid.length} missing readings`:`${titles[i]}: all readings missing`);let d='',pen=false;values.forEach((v,j)=>{if(v===null){pen=false;return;}const x=j/(values.length-1)*400,y=90-(v-lo)/span*80;d+=`${pen?'L':'M'}${x.toFixed(2)},${y.toFixed(2)} `;pen=true;});const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);range.className='range';const a=document.createElement('span'),b=document.createElement('span');a.textContent=`MIN ${valid.length?pretty(lo):'—'}`;b.textContent=`MAX ${valid.length?pretty(hi):'—'}`;range.append(a,b);section.append(h,value,svg,range);$('charts').append(section);});
 $('readings').replaceChildren();w.samples.forEach(s=>{const tr=document.createElement('tr');['t',...CHANNELS].forEach(ch=>{const td=document.createElement('td');td.textContent=s[ch]===null?'':pretty(s[ch]);tr.append(td);});$('readings').append(tr);});
}
function fail(e){fsm.clear();$('gate').textContent='HOLD';$('reason').textContent='Input or connection error; last display retained for inspection';$('approve').disabled=true;$('error').textContent=e.message;$('rehearse').disabled=true;$('approve').checked=false;}
$('generate').addEventListener('click',()=>{try{render(generateWindow($('family').value,Number($('seed').value)));}catch(e){fail(e);}});
$('approve').addEventListener('change',()=>{if($('approve').checked){try{fsm.approve();$('rehearse').disabled=false;}catch(e){fail(e);}}else $('rehearse').disabled=true;});
$('rehearse').addEventListener('click',()=>{try{$('event').textContent=fsm.run().message;$('approve').checked=false;$('rehearse').disabled=true;}catch(e){fail(e);}});
$('upload').addEventListener('change',async()=>{try{const f=$('upload').files[0];if(!f)return;if(f.size>100000)throw new Error('File exceeds 100 KB');const data=JSON.parse(await f.text());data.provenance='imported';data.seed=null;data.family=null;render(validateWindow(data));}catch(e){fail(e);}finally{$('upload').value='';}});
$('export').addEventListener('click',()=>{if(!window)return;const url=URL.createObjectURL(new Blob([toCSV(window)],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download='patchline-bench-window.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
try{const [m,p]=await Promise.all([fetch('model/model.json'),fetch('proof/training.json')]);if(!m.ok||!p.ok)throw new Error('Unable to load model or evidence');model=await m.json();const proof=await p.json();$('metrics').textContent=`${(proof.heldOutAccuracy*100).toFixed(1)}% accuracy · ${(proof.macroF1*100).toFixed(1)}% macro F1 on 300 held-out simulated runs.`;render(generateWindow('steady',81204));}catch(e){fail(e);$('estimate').textContent='Model unavailable';$('generate').disabled=true;}

let serialPort=null,serialReader=null,closing=false,lastFrameAt=0;const frameBuffer=createFrameBuffer();
async function disconnect(){closing=true;try{if(serialReader)await serialReader.cancel();}catch{} }
$('disconnect').addEventListener('click',disconnect);
$('serial').disabled=!('serial' in navigator);
$('serial').addEventListener('click',async()=>{
 if(!model)return;try{
  serialPort=await navigator.serial.requestPort();await serialPort.open({baudRate:115200});closing=false;frameBuffer.clear();fsm.clear();$('approve').disabled=true;$('rehearse').disabled=true;$('generate').disabled=true;$('upload').disabled=true;$('serial').disabled=true;$('disconnect').disabled=false;$('serial-status').textContent='USB connected · collecting 24 frames · bench values remain held';
  serialReader=serialPort.readable.getReader();let pending='';const decoder=new TextDecoder();lastFrameAt=performance.now();
  while(!closing){const {value,done}=await serialReader.read();if(done)break;pending+=decoder.decode(value,{stream:true});if(pending.length>8192)throw new Error('Serial buffer limit reached');let idx;while((idx=pending.indexOf('\n'))>=0){const line=pending.slice(0,idx).trim();pending=pending.slice(idx+1);if(!line)continue;try{const w=frameBuffer.push(line);lastFrameAt=performance.now();if(w)render(w);}catch(e){frameBuffer.clear();fail(e);}}}
 }catch(e){fail(e);}finally{
  if(serialReader){serialReader.releaseLock();serialReader=null;}if(serialPort){try{await serialPort.close();}catch{}serialPort=null;}fsm.clear();$('approve').disabled=true;$('rehearse').disabled=true;$('serial').disabled=!('serial' in navigator);$('disconnect').disabled=true;$('generate').disabled=!model;$('upload').disabled=false;$('serial-status').textContent='USB disconnected · last display is retained for inspection; approval revoked';
 }
});
setInterval(()=>{if(serialPort&&performance.now()-lastFrameAt>10000){frameBuffer.clear();fsm.clear();$('approve').disabled=true;$('rehearse').disabled=true;$('gate').textContent='HOLD';$('reason').textContent='No valid telemetry received for 10 seconds; display is stale';}},1000);
