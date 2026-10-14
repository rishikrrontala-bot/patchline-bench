#!/usr/bin/env python3
"""Private-key, bounded Adaption workflow. Never includes credentials in proofs."""
import argparse, hashlib, json, ssl, urllib.request, urllib.error, math, os, re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / 'proof'
BASE = 'https://api.prod.adaptionlabs.ai/api/v1/'
MODEL = 'Qwen/Qwen3.5-0.8B'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('Redirect refused')

def credential():
    path = ROOT.parent / '.secrets/adaption.env'
    key = next((s.split('=', 1)[1].strip().strip('\"\'') for s in path.read_text().splitlines() if s.startswith('ADAPTION_API_KEY=')), '')
    if not key: raise RuntimeError('Private credential not configured')
    return key

def request(path, body=None, method=None):
    key = credential()
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
        method=method, headers={'Authorization': 'Bearer '+key, 'Accept': 'application/json', 'Content-Type':'application/json'})
    opener = urllib.request.build_opener(NoRedirect(), urllib.request.HTTPSHandler(context=ssl.create_default_context(cafile='/etc/ssl/cert.pem')))
    try:
        with opener.open(req, timeout=45) as response: return json.load(response)
    except urllib.error.HTTPError as error:
        detail=error.read(4000).decode(errors='replace').replace(key,'[omitted]')
        raise RuntimeError(f'API HTTP {error.code}: {detail}') from None
    except Exception as error:
        raise RuntimeError(str(error).replace(key,'[omitted]')) from None

def save(name, data):
    (PROOF / ('adaption-'+name+'.json')).write_text(json.dumps(data, indent=2)+'\n')

def dataset_summary(data):
    return {k:data.get(k) for k in ['dataset_id','name','status','row_count','configured_column_mapping','error_data']}

def state(): return json.loads((PROOF/'adaption-raw-state.json').read_text())

def raw_upload_payload():
    return {'source':{'name':'patchline-bench-verified-raw.jsonl','file_format':'jsonl','processing_mode':'raw','column_mapping':{'prompt':'prompt','completion':'completion'}}}

def upload():
    existing = PROOF/'adaption-raw-state.json'
    if existing.exists():
        print('Raw upload already recorded; inspect its existing dataset instead.'); return
    file = ROOT/'data/adaption-bench-review.jsonl'
    content=file.read_bytes(); rows=[json.loads(line) for line in content.splitlines()]
    if len(rows)!=1000: raise RuntimeError('Expected exactly 1000 rows')
    for row in rows:
        if set(row)!= {'prompt','completion'} or not all(isinstance(v,str) for v in row.values()): raise RuntimeError('Invalid instruction row')
        completion=json.loads(row['completion'])
        if set(completion)!= {'decision','reasons','hardwareActuation'} or completion['decision'] not in ['hold','review'] or completion['hardwareActuation'] is not False: raise RuntimeError('Unsafe completion schema')
    created=request('datasets', raw_upload_payload())
    info=created['upload_instructions']; parsed=urlparse(info['url'])
    if parsed.scheme!='https' or not (parsed.hostname or '').endswith('.amazonaws.com') or info['method']!='PUT': raise RuntimeError('Unexpected presigned upload destination')
    # Presigned S3 upload gets file bytes only, never the Adaption bearer credential.
    req=urllib.request.Request(info['url'],data=content,method='PUT',headers={'Content-Type':'application/octet-stream'})
    opener=urllib.request.build_opener(NoRedirect(),urllib.request.HTTPSHandler(context=ssl.create_default_context(cafile='/etc/ssl/cert.pem')))
    st={'dataset_id':created['dataset_id'],'rows':len(rows),'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content),'processing_mode':'raw','training_started':False,'credit_cap':100}
    save('raw-state',st)
    try:
        with opener.open(req,timeout=45) as result: result.read()
    except Exception: raise RuntimeError('Presigned upload failed; URL withheld') from None
    completed=request('datasets/'+st['dataset_id']+'/upload/complete',{'file_size_bytes':len(content),'sha256':st['sha256']})
    save('raw-complete',completed); print(json.dumps(completed))

def inspect():
    models=request('autoscientist/models');save('models',models)
    ds=request('datasets/'+state()['dataset_id']) if (PROOF/'adaption-raw-state.json').exists() else request('datasets/28d6f159-dcf9-4370-abc8-4c930ab42478')
    summary=dataset_summary(ds);save('dataset',summary);print(json.dumps(summary,indent=2))

def recommend():
    st=state(); response=request('autoscientist/recommend-hyperparams',{'dataset_id':st['dataset_id'],'model':MODEL,'augmentation_domain_rows':0,'augmentation_general_rows':0})
    save('recommendation',response);print(json.dumps(response,indent=2))


def proposal():
    data=json.loads((PROOF/'adaption-proposed-training.json').read_text())
    if data.get('dataset_id') != state()['dataset_id'] or data.get('model') != MODEL:
        raise RuntimeError('Proposal differs from verified dataset or selected model')
    if data.get('max_iterations') != 1 or data.get('augmentation_domain_rows') != 0 or data.get('augmentation_general_rows') != 0:
        raise RuntimeError('Only one iteration with no augmentation is permitted')
    if data.get('training_method') != 'instruction' or data.get('data_format') != 'instruction':
        raise RuntimeError('Only nonclinical instruction fine-tuning is permitted')
    if data.get('column_mapping') != {'prompt':'original_prompt','completion':'original_completion'}:
        raise RuntimeError('Use verified original processed columns')
    if data.get('hyperparams') != json.loads((PROOF/'adaption-recommendation.json').read_text())['hyperparams']:
        raise RuntimeError('Recipe differs from inspected one-epoch recommendation')
    if data['hyperparams'].get('n_epochs') != 1 or data['hyperparams'].get('training_type') != 'lora':
        raise RuntimeError('Only one-epoch LoRA is permitted')
    return data

def config_hash(data):
    return hashlib.sha256(json.dumps(data,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def validate_quote(data, quote):
    credits=quote.get('quotedTotalCredits')
    if quote.get('verified') is not True or isinstance(credits,bool) or not isinstance(credits,(int,float)) or not math.isfinite(credits) or not 0 <= credits <= 100:
        raise RuntimeError('An explicitly verified provider quote at or below 100 credits is required')
    if quote.get('configurationSha256') != config_hash(data):
        raise RuntimeError('Quote is not bound to this exact dataset and recipe')
    if not isinstance(quote.get('providerEvidence'),str) or not quote['providerEvidence'].strip():
        raise RuntimeError('Provider quote evidence is required')
    try: observed=datetime.fromisoformat(quote['observedAt'].replace('Z','+00:00'))
    except Exception: raise RuntimeError('Quote timestamp is invalid') from None
    if observed.tzinfo is None or not 0 <= (datetime.now(timezone.utc)-observed).total_seconds() <= 7200:
        raise RuntimeError('Quote must have been verified within the last two hours')

def quote_template():
    data=proposal()
    print(json.dumps({'verified':False,'quotedTotalCredits':None,'configurationSha256':config_hash(data),'providerEvidence':'','observedAt':datetime.now(timezone.utc).isoformat()},indent=2))

def launch():
    data=proposal(); quote_path=PROOF/'adaption-price-quote.json'
    if not quote_path.exists(): raise RuntimeError('Training blocked: provider price quote is missing')
    quote=json.loads(quote_path.read_text());validate_quote(data,quote)
    prior=PROOF/'adaption-training-run.json'
    if prior.exists(): raise RuntimeError('A saved run already exists; use status instead of creating another job')
    # Exclusive claim deliberately survives uncertain network failure. Never blindly retry a paid POST.
    try:
        fd=os.open(PROOF/'adaption-launch-claim.json',os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    except FileExistsError: raise RuntimeError('Launch already claimed; reconcile provider runs before any retry') from None
    with os.fdopen(fd,'w') as f:json.dump({'configurationSha256':config_hash(data),'claimedAt':datetime.now(timezone.utc).isoformat()},f)
    run=request('autoscientist',data);save('training-run',run)
    st=state();st.update({'training_started':True,'run_id':run['id'],'quotedTotalCredits':quote['quotedTotalCredits']});save('raw-state',st)
    print(json.dumps({k:run.get(k) for k in ['id','status','model','dataset_id','max_iterations','training_method']},indent=2))

def status():
    run=json.loads((PROOF/'adaption-training-run.json').read_text());id=run['id']
    if not isinstance(id,str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,128}',id): raise RuntimeError('Invalid saved run ID')
    response=request('autoscientist/'+id);save('training-run',response)
    print(json.dumps({k:response.get(k) for k in ['id','status','model','iterations_completed','max_iterations','best_win_rate','download_available','error']},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['inspect','upload','recommend','quote-template','launch','status']);args=parser.parse_args()
    try: {'inspect':inspect,'upload':upload,'recommend':recommend,'quote-template':quote_template,'launch':launch,'status':status}[args.action]()
    except Exception as error: raise SystemExit(str(error))
