// Explicit button control only. Scrolling never changes the assembly state.
const bounded=p=>Math.min(1,Math.max(0,Number.isFinite(p)?p:0));
export function assemblyOffset(progress,index,compact=false){
 const p=bounded(progress),closure=bounded(p*1.25-index*.05),openGap=compact?58:78;
 return (compact?110:180)+(2.5-index)*(7+(openGap-7)*(1-closure));
}
export function assemblyPose(progress,index,compact=false){
 const p=bounded(progress);
 return `translate3d(-50%, ${assemblyOffset(p,index,compact)}px, 0) rotateX(${60-12*p}deg) rotateZ(${-16+8*p}deg) scale(${1+.07*p})`;
}
export function mountAssembly(doc=document,win=window){
 const section=doc.getElementById('assembly'),button=doc.getElementById('assembly-toggle');
 if(!section||!button)return()=>{};
 const layers=[...section.querySelectorAll('[data-layer]')],callouts=[...section.querySelectorAll('[data-part-label]')];
 const description=doc.getElementById('layer-description'),light=doc.getElementById('assembly-light'),ground=doc.getElementById('assembly-ground'),phase=doc.getElementById('assembly-phase'),stage=doc.getElementById('patch-assembly');
 let assembled=false;
 function paint(){
  const p=assembled?1:0,compact=win.innerWidth<=600||win.innerHeight<=850;
  layers.forEach((layer,i)=>{layer.style.transform=assemblyPose(p,i,compact);});
  callouts.forEach((label,i)=>{label.style.transform=`translate3d(0px, ${assemblyOffset(p,i,compact)+(compact?120:139)}px, 0)`;label.style.opacity=assembled?'0':'.85';});
  if(light)light.style.opacity=assembled?'.82':'0';
  if(ground){ground.style.opacity=assembled?'.32':'.12';ground.style.transform=`translateX(-50%) scale(${assembled?1.1:.75})`;}
  if(phase)phase.textContent=assembled?'ASSEMBLED CONCEPT':'LAYERS OPEN';
  if(description)description.textContent=assembled?'One assembled concept. Click Open layers to inspect the stack again.':'Six concept layers, held apart. Click Assemble patch to bring them together.';
  if(stage)stage.setAttribute('aria-label',assembled?'Assembled illustrative patch concept':'Six separate illustrative patch layers');
  section.setAttribute('data-assembly-state',assembled?'assembled':'open');
  button.textContent=assembled?'Open layers':'Assemble patch';
  button.setAttribute('aria-expanded',String(!assembled));
 }
 function toggle(){assembled=!assembled;paint();}
 button.addEventListener('click',toggle);
 win.addEventListener('resize',paint);
 paint();
 return()=>{button.removeEventListener('click',toggle);win.removeEventListener('resize',paint);};
}
