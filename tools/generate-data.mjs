import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {generateWindow,extractFeatures,FAMILIES} from '../app/simulator.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const splits={train:{runsPerFamily:400,startSeed:10001},validation:{runsPerFamily:100,startSeed:1000001},test:{runsPerFamily:100,startSeed:2000001}};
const manifest={schema:'patchline-bench-data-v1',provenance:'synthetic',labels:'Injected simulator family only, not infection/physiology',splitPolicy:'Avalanche-mixed unique seeded runs; adjacent IDs cannot encode family baselines. Distinct seeded runs. No row-level random split. Features exclude metadata and family labels.',splits:{}};
for(const [name,options] of Object.entries(splits)){
 const runs=[];
 for(let family=0;family<FAMILIES.length;family++)for(let i=0;i<options.runsPerFamily;i++){
  let seed=options.startSeed+family*100000+i;
  seed=Math.imul(seed^(seed>>>16),0x85ebca6b)>>>0;seed=Math.imul(seed^(seed>>>13),0xc2b2ae35)>>>0;seed=(seed^(seed>>>16))>>>0;
  if(seed===0)throw new Error('Zero mixed seed; choose another run ID');
  const window=generateWindow(FAMILIES[family],seed,24);
  runs.push({id:`${name}-${seed}`,seed,label:family,family:FAMILIES[family],features:extractFeatures(window),window});
 }
 fs.writeFileSync(path.join(root,'data',`${name}.json`),JSON.stringify(runs));
 manifest.splits[name]={runs:runs.length,runsPerFamily:options.runsPerFamily,startSeed:options.startSeed};
}
fs.writeFileSync(path.join(root,'data/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
