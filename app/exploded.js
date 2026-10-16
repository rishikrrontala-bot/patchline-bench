// Scroll closes the visible exploded stack; reverse scroll opens it again.
const bounded=p=>Math.min(1,Math.max(0,Number.isFinite(p)?p:0));
export function assemblyOffset(progress,index,reduced=false,compact=false){
 const p=reduced?0:bounded(progress);
 const closure=bounded(p*1.25-index*.05);
 const openGap=compact?58:78;
 return (compact?110:180)+(2.5-index)*(7+(openGap-7)*(1-closure));
}
export function assemblyPose(progress,index,reduced=false,compact=false){
 const p=reduced?0:bounded(progress);
 return `translate3d(-50%, ${assemblyOffset(p,index,reduced,compact)}px, 0) rotateX(${60-12*p}deg) rotateZ(${-16+8*p}deg) scale(${1+.07*p})`;
}
export function mountAssembly(doc = document, win = window) {
  const section = doc.getElementById('assembly');
  if (!section) return () => {};
  const layers = [...section.querySelectorAll('[data-layer]')];
  const callouts = [...section.querySelectorAll('[data-part-label]')];
  const slider = doc.getElementById('assembly-progress');
  const percent = doc.getElementById('assembly-percentage');
  const description = doc.getElementById('layer-description');
  const labels = [...section.querySelectorAll('[data-layer-label]')];
  const light=doc.getElementById('assembly-light'),ground=doc.getElementById('assembly-ground'),phase=doc.getElementById('assembly-phase');
  const reduce = win.matchMedia('(prefers-reduced-motion: reduce)');
  const descriptions = [
    'Six concept layers, held apart. Scroll to bring them together.',
    'The carrier and spacer align beneath the sensing electronics.',
    'The open mount seats around the illustrative sensor interface.',
    'The controller and signal interface settle into the cradle.',
    'The pale cover closes over the electronics.',
    'One assembled concept. The real bench modules still connect by wires.'
  ];
  let frame = 0, manualProgress = null;
  function paint(p) {
    const progress = reduce.matches ? 0 : Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0));
    const compact=win.innerWidth<=600||win.innerHeight<=850;
    layers.forEach((layer, i) => { layer.style.transform = assemblyPose(progress, i, reduce.matches, compact); });
    callouts.forEach((label,i)=>{label.style.transform=`translate3d(0px, ${assemblyOffset(progress,i,reduce.matches,compact)+(compact?120:139)}px, 0)`;label.style.opacity=String(.85*(1-progress)**2);});
    if(light)light.style.opacity=String(progress*.82);
    if(ground){ground.style.opacity=String(.12+.2*progress);ground.style.transform=`translateX(-50%) scale(${.75+.35*progress})`;}
    if(phase)phase.textContent=reduce.matches?'STATIC EXPLODED VIEW':progress<.15?'LAYERS OPEN':progress<.9?'COMING TOGETHER':'ASSEMBLED CONCEPT';
    const active = Math.min(layers.length-1, Math.floor(progress * layers.length));
    labels.forEach((label, i) => label.classList.toggle('active', i === active));
    description.textContent = reduce.matches ? 'All six layers remain separated in this static view. These are design concepts; the actual sensing modules connect by wires.' : descriptions[active];
    slider.value = String(Math.round(progress * 100));
    slider.disabled = reduce.matches;
    percent.textContent = String(Math.round(progress * 100));
  }
  function fromScroll() {
    frame = 0;
    if(manualProgress!==null){paint(manualProgress);return;}
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - win.innerHeight);
    paint(Math.max(0, Math.min(1, -rect.top / travel)));
  }
  function schedule() { if (!frame) frame = win.requestAnimationFrame(fromScroll); }
  function fromControl() { if(reduce.matches){paint(1);return;}manualProgress=Number(slider.value)/100;paint(manualProgress); }
  function returnToScroll(){manualProgress=null;schedule();}
  function keyboardScroll(event={}){if(event.target!==slider&&['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(event.key))returnToScroll();}
  win.addEventListener('scroll', schedule, { passive: true });
  win.addEventListener('wheel',returnToScroll,{passive:true});
  win.addEventListener('touchmove',returnToScroll,{passive:true});
  win.addEventListener('keydown',keyboardScroll);
  win.addEventListener('resize', schedule);
  reduce.addEventListener('change', schedule);
  slider.addEventListener('input', fromControl);
  fromScroll();
  return () => {
    if (frame) win.cancelAnimationFrame(frame);
    win.removeEventListener('scroll', schedule);
    win.removeEventListener('wheel',returnToScroll);
    win.removeEventListener('touchmove',returnToScroll);
    win.removeEventListener('keydown',keyboardScroll);
    win.removeEventListener('resize', schedule);
    reduce.removeEventListener('change', schedule);
    slider.removeEventListener('input', fromControl);
  };
}
