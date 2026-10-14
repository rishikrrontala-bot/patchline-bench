import {extractFeatures,validateWindow,FAMILIES} from './simulator.js';
const finiteArray=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(x=>typeof x==='number'&&Number.isFinite(x));
export function validateModel(m){
 if(!m||m.schema!=='patchline-bench-model-v1'||m.provenance!=='synthetic-only'||m.features!==24||m.windowSamples!==24||JSON.stringify(m.labels)!==JSON.stringify(FAMILIES))throw new Error('Unsupported synthetic model');
 if(!finiteArray(m.mean,24)||!finiteArray(m.scale,24)||m.scale.some(x=>x<=0)||!finiteArray(m.bias1,32)||!finiteArray(m.bias2,3)||!Array.isArray(m.weights1)||m.weights1.length!==24||m.weights1.some(r=>!finiteArray(r,32))||!Array.isArray(m.weights2)||m.weights2.length!==32||m.weights2.some(r=>!finiteArray(r,3)))throw new Error('Invalid model dimensions or numbers');
 return m;
}
export function predict(window,model){
 const w=validateWindow(window),m=validateModel(model);
 if(w.samples.length!==24)return {status:'abstain',reason:'This model was trained on24-sample windows',probabilities:null};
 const features=extractFeatures(w);const z=features.map((x,i)=>(x-m.mean[i])/m.scale[i]);
 if(z.some(x=>!Number.isFinite(x)||Math.abs(x)>10))return {status:'abstain',reason:'Feature magnitude is outside the declared training envelope',probabilities:null};
 const h=m.bias1.map((b,j)=>Math.tanh(b+z.reduce((sum,x,i)=>sum+x*m.weights1[i][j],0)));
 const logits=m.bias2.map((b,j)=>b+h.reduce((sum,x,i)=>sum+x*m.weights2[i][j],0));
 const max=Math.max(...logits),exps=logits.map(x=>Math.exp(x-max)),sum=exps.reduce((a,b)=>a+b,0),probabilities=exps.map(x=>x/sum);
 if(probabilities.some(x=>!Number.isFinite(x)))throw new Error('Invalid inference');
 const index=probabilities.indexOf(Math.max(...probabilities));
 return {status:'estimated',label:m.labels[index],confidence:probabilities[index],probabilities,scope:'Synthetic signal-family likelihoods, not infection probability'};
}
