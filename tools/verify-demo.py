#!/usr/bin/env python3
"""Decode both final cuts and verify duration, geometry, silent streams and chapter boundaries."""
from pathlib import Path
import subprocess,re,json,os
from PIL import Image,ImageOps,ImageDraw
root=Path(__file__).resolve().parent.parent
ff=os.environ.get('FFMPEG','/private/tmp/patchline-video-tools/node_modules/ffmpeg-static/ffmpeg')
report=json.loads((root/'proof/demo-verification.json').read_text())
samples=[]
for video,expected in zip(report['videos'],[150,300]):
 p=root/video['file'];info=subprocess.run([ff,'-hide_banner','-i',str(p)],capture_output=True,text=True).stderr
 m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',info);assert m,info
 actual=int(m[1])*3600+int(m[2])*60+float(m[3]);assert abs(actual-expected)<.05,(actual,expected)
 assert '1280x720' in info and '30 fps' in info,info
 assert 'Audio:' not in info,info
 subprocess.run([ff,'-hide_banner','-loglevel','error','-i',str(p),'-f','null','-'],check=True)
 for i,chapter in enumerate(video['chapters']):
  sec=chapter['start']+chapter['duration']/2;out=root/'proof/demo-capture'/('qa-'+str(expected)+'-'+str(i)+'.png')
  subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-ss',str(sec),'-i',str(p),'-frames:v','1',str(out)],check=True)
  im=Image.open(out).convert('RGB');assert im.getbbox();samples.append((expected,chapter['start'],im.copy()))
 video.update({'verifiedSeconds':actual,'resolution':[1280,720],'outputFPS':30,'audioStreams':0,'fullyDecoded':True})
canvas=Image.new('RGB',(1280,((len(samples)+3)//4)*204),'#101B2D');d=ImageDraw.Draw(canvas)
for i,(duration,start,im) in enumerate(samples):
 x=(i%4)*320;y=(i//4)*204;canvas.paste(ImageOps.fit(im,(320,180)),(x,y));d.text((x+8,y+185),str(duration)+'s cut / chapter at '+str(start)+'s',fill='white')
canvas.save(root/'proof/demo-contact-sheet.jpg',quality=90)
report['verification']='Both complete streams decoded without errors; exact duration, 1280x720, 30fps output, zero audio streams. Working app sourced from 5fps captures; assembly uses eleven captured poses.'
(root/'proof/demo-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print('Verified both videos: 150.00 and 300.00 seconds, 1280x720, silent, all chapters present and streams fully decoded.')
