import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
const files=['index.html','README.md','LIMITATIONS.md','DESIGN.md','proof/training.json','proof/inference-parity.json','proof/board-connectivity.json','proof/firmware-build.json','proof/adaption-status.json','proof/adaption-raw-audit.json','proof/exploded-view.gif','proof/reference-style-exploded.jpg','artifacts/Patchline-Bench.html','artifacts/Patchline-Bench-v2.html','artifacts/Patchline-Bench-source.zip'];
for(const dir of ['app','model','hardware','firmware','docs']){for(const f of await fs.readdir(path.join(root,dir),{withFileTypes:true})){if(f.isFile()&&!f.name.endsWith('.cpp'))files.push(`${dir}/${f.name}`);}}
for(const name of files){const source=path.resolve(root,name);if(!source.startsWith(root+path.sep))throw Error('Invalid public path');await fs.mkdir(path.dirname(path.join(out,name)),{recursive:true});await fs.copyFile(source,path.join(out,name));}
console.log(`Built ${files.length} explicitly selected public files. No API credentials or provider account files.`);
