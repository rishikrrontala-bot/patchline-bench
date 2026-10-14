// Scroll progress is direct and reversible; it never eases or hijacks scrolling.
export function assemblyPose(progress, index, reduced = false, compact = false) {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const separation = reduced ? 1 : p;
  const y = assemblyOffset(p,index,reduced,compact);
  return `translate3d(0px, ${y}px, 0) rotateX(65deg) rotateZ(-12deg)`;
}
export function assemblyOffset(progress,index,reduced=false,compact=false){
 const p=reduced?1:Math.min(1,Math.max(0,Number.isFinite(progress)?progress:0));
 return (420-index*(8+72*p))*(compact?.72:1);
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
  const reduce = win.matchMedia('(prefers-reduced-motion: reduce)');
  const descriptions = [
    'The proposed carrier supports a dry bench assembly. Scroll to separate the layers.',
    'A spacer illustrates separation between the carrier and electronics mount.',
    'The open mount leaves room for the wired sensing electronics.',
    'The signal interface represents conditioned pH, wetness and glucose-signal inputs.',
    'The controller collects telemetry. The actual ESP32-S3 module connects by wires.',
    'The cover is a mechanical concept. The separate PCB view shows the real passive hub routing.'
  ];
  let frame = 0, manualProgress = null;
  function paint(p) {
    const progress = reduce.matches ? 1 : Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0));
    const compact=win.innerWidth<=600||win.innerHeight<=850;
    layers.forEach((layer, i) => { layer.style.transform = assemblyPose(progress, i, reduce.matches, compact); });
    callouts.forEach((label,i)=>{label.style.transform=`translate3d(0px, ${assemblyOffset(progress,i,reduce.matches,compact)+(compact?75:90)}px, 0)`;label.style.opacity=String(.15+.85*progress);});
    const active = Math.min(layers.length-1, Math.floor(progress * layers.length));
    labels.forEach((label, i) => label.classList.toggle('active', i === active));
    description.textContent = reduce.matches ? 'All layers are separated in this static view. The carrier and cover are concepts; actual sensing modules connect by wires.' : descriptions[active];
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
