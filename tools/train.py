"""Train a small signal-family classifier from scratch. Not clinical risk."""
from pathlib import Path
import json, hashlib, time
import numpy as np
root=Path(__file__).resolve().parent.parent
rng=np.random.default_rng(81204)
start=time.monotonic()
def load(name):
 data=json.loads((root/'data'/f'{name}.json').read_text());return data,np.array([r['features'] for r in data],dtype=np.float64),np.array([r['label'] for r in data],dtype=int)
train,X,y=load('train');validation,V,vy=load('validation');test,T,ty=load('test')
assert len(set(r['seed'] for r in train+validation+test))==len(train+validation+test)
assert X.shape[1]==24 and np.isfinite(X).all() and np.isfinite(V).all() and np.isfinite(T).all()
mean=X.mean(axis=0);scale=X.std(axis=0);scale[scale<1e-9]=1
Z=(X-mean)/scale;VZ=(V-mean)/scale;TZ=(T-mean)/scale
W1=rng.normal(0,.12,(24,32));b1=np.zeros(32);W2=rng.normal(0,.12,(32,3));b2=np.zeros(3)
def forward(z):
 h=np.tanh(z@W1+b1);logits=h@W2+b2;logits-=logits.max(axis=1,keepdims=True);p=np.exp(logits);p/=p.sum(axis=1,keepdims=True);return h,p
best=None;best_loss=float('inf');history=[];targets=np.eye(3)[y]
for epoch in range(600):
 h,p=forward(Z);g=(p-targets)/len(y)
 dW2=h.T@g+1e-4*W2;db2=g.sum(axis=0);dh=(g@W2.T)*(1-h*h);dW1=Z.T@dh+1e-4*W1;db1=dh.sum(axis=0)
 rate=.08/(1+epoch/400)
 W1-=rate*dW1;b1-=rate*db1;W2-=rate*dW2;b2-=rate*db2
 if epoch%10==0:
  _,vp=forward(VZ);loss=float(-np.log(np.maximum(vp[np.arange(len(vy)),vy],1e-15)).mean());history.append({'epoch':epoch,'validationLoss':loss})
  if loss<best_loss:best_loss=loss;best=(W1.copy(),b1.copy(),W2.copy(),b2.copy(),epoch)
W1,b1,W2,b2,epoch=best
_,p=forward(TZ);pred=p.argmax(axis=1);cm=np.zeros((3,3),dtype=int)
for a,b in zip(ty,pred):cm[a,b]+=1
f1=[]
for c in range(3):
 tp=cm[c,c];fp=cm[:,c].sum()-tp;fn=cm[c,:].sum()-tp;f1.append(float(2*tp/(2*tp+fp+fn)) if 2*tp+fp+fn else 0)
model={'schema':'patchline-bench-model-v1','provenance':'synthetic-only','labels':['steady','shift','sensor_fault'],'features':24,'windowSamples':24,'mean':mean.tolist(),'scale':scale.tolist(),'weights1':W1.tolist(),'bias1':b1.tolist(),'weights2':W2.tolist(),'bias2':b2.tolist(),'trainingSeed':81204,'selectedEpoch':epoch,'scope':'Classifies injected simulator families. Probabilities are not clinical infection risk. No therapy output.'}
(root/'model/model.json').write_text(json.dumps(model,separators=(',',':'))+'\n')
report={'schema':'patchline-bench-training-proof-v1','trainingRuns':len(train),'validationRuns':len(validation),'heldOutRuns':len(test),'uniqueRunSeeds':len(set(r['seed'] for r in train+validation+test)),'splitPolicy':'Run-level independent seeds; scaler fitted to training only; epoch selected on validation; held-out test used once for report','heldOutAccuracy':float((pred==ty).mean()),'macroF1':float(np.mean(f1)),'perClassF1':dict(zip(model['labels'],f1)),'confusionMatrix':cm.tolist(),'selectedEpoch':epoch,'history':history,'seconds':time.monotonic()-start,'modelSHA256':hashlib.sha256((root/'model/model.json').read_bytes()).hexdigest(),'scope':model['scope']}
(root/'proof/training.json').write_text(json.dumps(report,indent=2)+'\n')
# Independently computed Python predictions support browser parity testing.
(root/'proof/inference-parity.json').write_text(json.dumps([{'index':i,'id':test[i]['id'],'features':test[i]['features'],'probabilities':p[i].tolist()} for i in [*range(10),*range(100,110),*range(200,210)]],indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='history'},indent=2))
