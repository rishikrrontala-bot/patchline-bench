"""Package trusted local ES modules and SVGs into an offline HTML artifact."""
from pathlib import Path
import base64,re,json
root=Path(__file__).resolve().parent.parent
cache={}
def uri(mime,content):return 'data:'+mime+';base64,'+base64.b64encode(content).decode()
def module(path):
 path=path.resolve()
 if path in cache:return cache[path]
 if not path.is_relative_to(root/'app'):raise ValueError('Unexpected module path')
 text=path.read_text()
 if path.name=='main.js':
  for name in ['model/model.json','proof/training.json']:
   value=json.dumps(json.loads((root/name).read_text()),separators=(',',':'))
   text=text.replace("fetch('"+name+"')",'Promise.resolve({ok:true,json:async()=>('+value+')})')
 text=re.sub(r"(from\s*)['\"](\./[^'\"]+)['\"]",lambda m:m[1]+json.dumps(module(path.parent/m[2])),text)
 result=uri('text/javascript',text.encode());cache[path]=result;return result
html=(root/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="app/style.css">','<style>'+(root/'app/style.css').read_text()+'</style>')
for f in (root/'hardware').glob('*.svg'):html=html.replace('src="hardware/'+f.name+'"','src="'+uri('image/svg+xml',f.read_bytes())+'"')
for name in ['proof/training.json','model/model.json','hardware/board.svg','firmware/README.md']:
 f=root/name;mime='application/json' if f.suffix=='.json' else 'image/svg+xml' if f.suffix=='.svg' else 'text/plain'
 html=html.replace('href="'+name+'"','download="'+f.name+'" href="'+uri(mime,f.read_bytes())+'"')
html=html.replace('src="app/main.js"','src="'+module(root/'app/main.js')+'"').replace('href="./"','href="#"')
output=root/'artifacts/Patchline-Bench.html';output.write_text(html)
print(json.dumps({'file':str(output),'bytes':output.stat().st_size,'localModules':len(cache),'externalDependencies':0}))
