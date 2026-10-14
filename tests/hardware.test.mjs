import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const root=new URL('../',import.meta.url).pathname;
const python=code=>execFileSync('python3',['-c',code],{cwd:root,encoding:'utf8'});
test('board geometry detects intersections and measures separated copper independently',()=>{
 python(`import runpy, math
m=runpy.run_path('tools/board.py')
d=m['segment_distance']
assert d((0,0),(4,0),(2,-2),(2,2))==0
assert d((0,0),(4,0),(2,0),(6,0))==0
assert d((0,0),(4,0),(0,2),(4,2))==2
assert d((0,0),(1,0),(4,4),(4,5))==5
assert d((0,0),(0,1),(4,4),(5,4))==5
try: d((0,0),(1,1),(0,2),(2,2))
except AssertionError: pass
else: raise AssertionError('Nonorthogonal routes must be rejected')
assert abs(m['minimum_gap']-.74)<1e-9
`);
});
test('board generator is byte-reproducible and all nets connect across plated pads',()=>{
 const files=['hardware/netlist.json','hardware/patchline-bench.kicad_pcb','hardware/board.svg','proof/board-connectivity.json'];
 const before=files.map(f=>readFileSync(join(root,f),'utf8'));
 python("import runpy;runpy.run_path('tools/board.py')");
 files.forEach((f,i)=>assert.equal(readFileSync(join(root,f),'utf8'),before[i]));
 const proof=JSON.parse(before[3]);assert.equal(proof.nets.length,7);assert.ok(proof.nets.every(n=>n.connected&&n.layerAware));assert.ok(proof.conservativeCopperGapMm>=proof.minimumRequiredGapMm);
 const board=JSON.parse(before[0]);assert.equal(board.hardware_actuation,false);assert.equal(board.pads.length,25);assert.equal(board.tracks.length,31);
});
test('native firmware handles transport faults and emits honest provenance in both modes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'patchline-native-'));
 try{
  for(const simulation of [0,1]){
   const binary=join(dir,`transport-${simulation}`);
   execFileSync('g++',['-std=c++17','-Wall','-Wextra','-Werror',`-DBENCH_SIMULATION=${simulation}`,'-Ifirmware/host-stubs','firmware/test_transport.cpp','-o',binary],{cwd:root});
   const frame=JSON.parse(execFileSync(binary,[],{encoding:'utf8'}));
   assert.equal(frame.hardware_actuation,false);assert.equal(frame.provenance,simulation?'synthetic':'bench');
   for(const channel of ['ph','moisture','glucose']){
    assert.equal(frame.status[channel],simulation?'simulated':'invalid');
    if(!simulation)assert.equal(frame[channel],null);
   }
   assert.equal(frame.status.temperature,simulation?'simulated':'measured');
  }
  const core=join(dir,'core');execFileSync('g++',['-std=c++17','-Wall','-Wextra','-Werror','firmware/test_core.cpp','-o',core],{cwd:root});execFileSync(core);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
