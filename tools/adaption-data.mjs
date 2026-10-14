import fs from 'node:fs';import {predict} from '../app/inference.js';import {assess} from '../app/policy.js';
const root=new URL('../',import.meta.url),read=n=>JSON.parse(fs.readFileSync(new URL(n,root))),model=read('model/model.json');
// Existing training partition only. Never send validation or held-out test rows.
const train=read('data/train.json');const rows=[];
for(let i=0;i<1000;i++){
 const r=train[Math.floor(i/3)+(i%3)*400],p=predict(r.window,model),g=assess(r.window,p);
 const evidence={provenance:'synthetic',samples:24,modelStatus:p.status,modelLabel:p.label??null,modelConfidence:p.confidence??null,qualityReasons:g.reasons,hardwareActuation:false};
 const prompt='You are a nonclinical bench review assistant. Summarize supplied evidence only. Respond with exactly decision (hold or review), reasons (array of supplied quality reasons), hardwareActuation false. Review is allowed only if no quality reasons; it requires human review and is not permission for therapy. Never diagnose infection, prescribe a dose, or issue an actuator command. Evidence: '+JSON.stringify(evidence);
 const completion=JSON.stringify({decision:g.state,reasons:g.reasons,hardwareActuation:false});rows.push({prompt,completion});
}
const csv=s=>'"'+s.replaceAll('"','""')+'"';fs.writeFileSync(new URL('data/adaption-bench-review.csv',root),'prompt,completion\n'+rows.map(r=>csv(r.prompt)+','+csv(r.completion)).join('\n'));
fs.writeFileSync(new URL('proof/adaption-data.json',root),JSON.stringify({rows:rows.length,origin:'Existing training partition only',purpose:'Fine-tune a nonclinical evidence summarizer, not the numerical classifier',labels:'Deterministic quality policy; no clinical labels',heldOutDataUploaded:false},null,2));console.log('Prepared 1000 verified nonclinical training rows');
