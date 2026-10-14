"""Reproducible dry-bench signal hub. No medical treatment circuitry."""
from pathlib import Path
import json, math, uuid
root=Path(__file__).resolve().parent.parent
nets={1:'GND',2:'+3V3',3:'SDA',4:'SCL',5:'PH_SIG',6:'MOIST_SIG',7:'GLUCOSE_SIG'}
connectors=[('J1','HOST: 1GND 2V3 3SDA 4SCL',10,8,[1,2,3,4]),('J2','ADC BUS',30,8,[1,2,3,4]),('J3','TEMP BUS',50,8,[1,2,3,4]),('J4','pH conditioned',10,26,[5,1,2]),('J5','Moisture conditioned',25,26,[6,1,2]),('J6','Glucose conditioned',40,26,[7,1,2]),('J7','ADC: A0 A1 A2 GND',50,26,[5,6,7,1])]
paths=[]
def route(net,layer,width,*points):
 for a,b in zip(points,points[1:]):paths.append({'net':net,'layer':layer,'width':width,'a':a,'b':b})
for net,y in [(1,8),(2,10.54),(3,13.08),(4,15.62)]:route(net,'F.Cu',.6 if net<3 else .35,(10,y),(30,y),(50,y))
route(1,'F.Cu',.6,(10,8),(6,8),(6,28.54),(10,28.54))
route(1,'B.Cu',.6,(10,28.54),(25,28.54),(40,28.54),(46,28.54),(46,33.62),(50,33.62))
route(2,'B.Cu',.6,(10,10.54),(8,10.54),(8,31.08),(10,31.08),(25,31.08),(40,31.08))
route(5,'F.Cu',.35,(10,26),(10,23),(50,23),(50,26))
route(6,'B.Cu',.35,(25,26),(25,24),(52,24),(52,28.54),(50,28.54))
route(7,'F.Cu',.35,(40,26),(44,26),(44,31.08),(50,31.08))
pads=[{'ref':ref,'pin':i+1,'net':n,'x':x,'y':round(y+2.54*i,4),'diameter':1.8,'drill':1} for ref,_,x,y,ns in connectors for i,n in enumerate(ns)]
# Connectivity includes junctions and plated pads joining front/back.
def point(p):return tuple(round(v,4) for v in p)
def onsegment(p,a,b):
 cross=(p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]);return abs(cross)<1e-7 and min(a[0],b[0])-1e-7<=p[0]<=max(a[0],b[0])+1e-7 and min(a[1],b[1])-1e-7<=p[1]<=max(a[1],b[1])+1e-7
checks=[]
for net in nets:
 np=[p for p in pads if p['net']==net];nodes=set()
 for p in np:
  for layer in ['F.Cu','B.Cu']:nodes.add((*point((p['x'],p['y'])),layer))
 for s in paths:
  if s['net']==net:nodes|={(*point(s['a']),s['layer']),(*point(s['b']),s['layer'])}
 graph={p:set() for p in nodes}
 for p in np:
  a=(*point((p['x'],p['y'])),'F.Cu');b=(*point((p['x'],p['y'])),'B.Cu');graph[a].add(b);graph[b].add(a)
 for s in paths:
  if s['net']==net:
   hits=[p for p in nodes if p[2]==s['layer'] and onsegment(p[:2],s['a'],s['b'])]
   for a in hits:graph[a].update(hits)
 seen=set();stack=[next(iter(nodes))]
 while stack:
  a=stack.pop()
  if a not in seen:seen.add(a);stack.extend(graph[a]-seen)
 assert nodes<=seen,f'Disconnected net {nets[net]}'
 checks.append({'net':nets[net],'pads':len(np),'connected':True,'layerAware':True})
# Detect centerline shorts in this orthogonal two-layer design; this is NOT KiCad DRC.
for a in paths:
 for b in paths:
  if a['net']==b['net'] or a['layer']!=b['layer']:continue
  for p in [a['a'],a['b']]:assert not onsegment(p,b['a'],b['b']),f'Short {a} {b}'
  if a['a'][0]==a['b'][0] and b['a'][1]==b['b'][1]:
   p=(a['a'][0],b['a'][1]);assert not(onsegment(p,a['a'],a['b']) and onsegment(p,b['a'],b['b'])),f'Crossing {a} {b}'
for s in paths:
 for p in pads:
  if p['net']!=s['net']:assert not onsegment((p['x'],p['y']),s['a'],s['b']),f'Track crosses foreign pad {p}'
# Geometric copper gaps, using conservative square bounding boxes for all pads.
# This covers track width/pad size, unlike a centerline crossing check. It is
# still not a manufacturing DRC: mask, silkscreen and fabrication rules differ.
def point_segment_distance(p,a,b):
 dx,dy=b[0]-a[0],b[1]-a[1]
 t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
 return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
def segment_distance(a,b,c,d):
 # Orthogonal segments only, matching the generator's routing contract.
 assert (a[0]==b[0] or a[1]==b[1]) and (c[0]==d[0] or c[1]==d[1])
 if a[0]==b[0] and c[1]==d[1] and onsegment((a[0],c[1]),a,b) and onsegment((a[0],c[1]),c,d):return 0
 if a[1]==b[1] and c[0]==d[0] and onsegment((c[0],a[1]),a,b) and onsegment((c[0],a[1]),c,d):return 0
 return min(point_segment_distance(a,c,d),point_segment_distance(b,c,d),point_segment_distance(c,a,b),point_segment_distance(d,a,b))
def pad_box(p):
 r=p['diameter']/2
 return [(p['x']-r,p['y']-r),(p['x']+r,p['y']-r),(p['x']+r,p['y']+r),(p['x']-r,p['y']+r)]
gaps=[]
for i,a in enumerate(paths):
 for b in paths[i+1:]:
  if a['net']!=b['net'] and a['layer']==b['layer']:gaps.append(segment_distance(a['a'],a['b'],b['a'],b['b'])-(a['width']+b['width'])/2)
 for p in pads:
  if p['net']==a['net']:continue
  box=pad_box(p)
  assert not any(box[0][0]<=v[0]<=box[2][0] and box[0][1]<=v[1]<=box[2][1] for v in (a['a'],a['b'])), 'Track endpoint inside foreign pad'
  gaps.append(min(segment_distance(a['a'],a['b'],box[j],box[(j+1)%4]) for j in range(4))-a['width']/2)
for i,a in enumerate(pads):
 for b in pads[i+1:]:
  if a['net']!=b['net']:
   ra,rb=a['diameter']/2,b['diameter']/2
   gaps.append(math.hypot(max(0,abs(a['x']-b['x'])-ra-rb),max(0,abs(a['y']-b['y'])-ra-rb)))
minimum_gap=min(gaps)
assert minimum_gap>=.25,f'Copper gap below 0.25 mm: {minimum_gap}'
board={'schema':'patchline-bench-hub-v1','size_mm':[65,40],'nets':nets,'pads':pads,'tracks':paths,'connectors':connectors,'hardware_actuation':False,'review_status':'Bench prototype; layer-aware connectivity and geometric copper gaps checked, KiCad ERC/DRC and assembly not run'}
(root/'hardware/netlist.json').write_text(json.dumps(board,indent=2)+'\n')
uid_counter=0
def uid():
 global uid_counter
 uid_counter+=1
 return str(uuid.uuid5(uuid.NAMESPACE_URL,f'patchline-bench-v1/{uid_counter}'))
pcb=['(kicad_pcb (version 20240108) (generator "pcbnew") (general (thickness 1.6)) (paper "A4")','(layers (0 "F.Cu" signal) (31 "B.Cu" signal) (36 "B.SilkS" user "b.silkscreen") (37 "F.SilkS" user "f.silkscreen") (38 "B.Mask" user) (39 "F.Mask" user) (44 "Edge.Cuts" user))','(setup (pad_to_mask_clearance 0))']
for n,name in nets.items():pcb.append(f'(net {n} "{name}")')
for ref,label,x,y,ns in connectors:
 pcb.append(f'(footprint "Connector_PinHeader_2.54mm:PinHeader_1x{len(ns):02d}_P2.54mm_Vertical" (layer "F.Cu") (at {x} {y}) (attr through_hole) (uuid "{uid()}") (property "Reference" "{ref}" (at 0 -2) (layer "F.SilkS") (effects (font (size 1 1) (thickness .15)))) (property "Value" "{label}" (at 3 0 90) (layer "F.SilkS") (effects (font (size .7 .7) (thickness .1))))')
 for i,n in enumerate(ns):pcb.append(f'(pad "{i+1}" thru_hole {"rect" if i==0 else "circle"} (at 0 {i*2.54}) (size 1.8 1.8) (drill 1) (layers "*.Cu" "*.Mask") (net {n} "{nets[n]}"))')
 pcb.append(')')
for s in paths:pcb.append(f'(segment (start {s["a"][0]} {s["a"][1]}) (end {s["b"][0]} {s["b"][1]}) (width {s["width"]}) (layer "{s["layer"]}") (net {s["net"]}) (uuid "{uid()}"))')
for a,b in zip([(0,0),(65,0),(65,40),(0,40)],[(65,0),(65,40),(0,40),(0,0)]):pcb.append(f'(gr_line (start {a[0]} {a[1]}) (end {b[0]} {b[1]}) (stroke (width .05) (type default)) (layer "Edge.Cuts") (uuid "{uid()}"))')
pcb.append('(gr_text "PATCHLINE BENCH / NO THERAPY" (at 32 37) (layer "F.SilkS") (effects (font (size 1 1) (thickness .15))))\n)')
(root/'hardware/patchline-bench.kicad_pcb').write_text('\n'.join(pcb)+'\n')
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 540" role="img" aria-labelledby="title"><title id="title">Patchline Bench 65 by40mm routed prototype hub</title><rect width="780" height="540" fill="#F4F1EA"/><g transform="translate(30 25) scale(11)"><rect width="65" height="40" fill="#151A18"/>']
for s in paths:svg.append(f'<path d="M{s["a"][0]} {s["a"][1]}L{s["b"][0]} {s["b"][1]}" fill="none" stroke="{"#DA532C" if s["layer"]=="F.Cu" else "#72A7C1"}" stroke-width="{s["width"]}"/>')
for p in pads:svg.append(f'<circle cx="{p["x"]}" cy="{p["y"]}" r=".9" fill="#E1CB8B"/><circle cx="{p["x"]}" cy="{p["y"]}" r=".5" fill="#151A18"/>')
for ref,label,x,y,ns in connectors:svg.append(f'<text x="{x-2}" y="{y-2}" fill="#F4F1EA" font-family="monospace" font-size="1">{ref}</text>')
svg.append('</g><g font-family="monospace" font-size="14" fill="#151A18"><text x="30" y="490">65 × 40 mm · front copper terra / back copper blue</text><text x="30" y="513">DRY BENCH ONLY · NO ACTUATOR · fabrication review pending</text></g></svg>')
(root/'hardware/board.svg').write_text(''.join(svg))
(root/'proof/board-connectivity.json').write_text(json.dumps({'nets':checks,'pads':len(pads),'tracks':len(paths),'shortCenterlinesDetected':0,'conservativeCopperGapMm':round(minimum_gap,6),'minimumRequiredGapMm':.25,'padGapMethod':'All pads conservatively bounded by 1.8 mm squares; same-layer copper tracks include their widths.','scope':'Custom layer-aware connectivity, centerline and geometric copper-gap checks only. Not KiCad DRC/ERC, clearance certification, electrical or manufacturing validation.'},indent=2)+'\n')
print(f'{len(pads)} pads / {len(paths)} tracks / {len(checks)} connected nets; no centerline shorts')
