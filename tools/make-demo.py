#!/usr/bin/env python3
"""Edit real CUA browser captures with inspectable evidence cards; never synthesize UI outcomes."""
from pathlib import Path
import json,subprocess,os,shutil
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=Path(__file__).resolve().parent.parent
CAP=ROOT/'proof/demo-capture'; OUT=ROOT/'artifacts/demo'; WORK=CAP/'edit'
WORK.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
FF=Path(os.environ.get('FFMPEG','/private/tmp/patchline-video-tools/node_modules/ffmpeg-static/ffmpeg'))
FONT=Path('/System/Library/Fonts/Supplemental')
def font(n,kind='sans'):
 return ImageFont.truetype(str(FONT/({'serif':'Georgia.ttf','sans':'Arial.ttf','mono':'Andale Mono.ttf'}[kind])),n)
BONE='#EFE6E1';INK='#212121';MUTED='#667670';TERRA='#CE5B3A';NAVY='#101B2D'
def text(d,xy,t,n=28,fill=INK,kind='sans'):d.text(xy,t,font=font(n,kind),fill=fill)
def lines(d,xy,rows,n=28,fill=INK,kind='sans',gap=None):
 for i,t in enumerate(rows):text(d,(xy[0],xy[1]+i*(gap or n*1.45)),t,n,fill,kind)
def base(index,title,kicker):
 im=Image.new('RGB',(1280,720),BONE);d=ImageDraw.Draw(im)
 text(d,(58,32),'PATCHLINE / BENCH',17,INK,'mono');text(d,(950,32),'RISHIK RONTALA',17,INK,'mono');d.line((58,72,1222,72),fill=MUTED,width=1)
 text(d,(58,100),index+' / '+kicker,16,TERRA,'mono');text(d,(58,143),title,51,INK,'serif')
 d.line((58,660,1222,660),fill=MUTED,width=1);text(d,(58,681),'NONCLINICAL RESEARCH / SYNTHETIC DATA',14,MUTED,'mono');text(d,(951,681),'BUILT BY RISHIK',14,MUTED,'mono')
 return im,d
def save(name,im):im.save(WORK/(name+'.png'))
im,d=base('01','Before trusting a signal, inspect it.','THE PROBLEM')
lines(d,(60,255),['A smart-bandage idea needs a testable foundation.','What was measured? What was simulated?','When should the software refuse to proceed?'],31,gap=67)
text(d,(60,531),'Board design + firmware + local model + observatory',29,TERRA)
save('problem',im)
im,d=base('04','A prediction is not permission.','ARCHITECTURE')
items=[('SIMULATOR','Seeded signal families'),('FEATURES','24 statistics'),('MODEL','32 tanh units / 3 outputs'),('POLICY','Independent quality gate')]
for i,(a,b) in enumerate(items):
 x=58+i*296;d.rectangle((x,266,x+270,405),outline=MUTED,width=1);text(d,(x+16,290),a,18,TERRA,'mono');lines(d,(x+16,333),[b] if len(b)<22 else b.split(' / '),21,gap=29)
 if i<3:text(d,(x+276,314),'›',27,MUTED)
lines(d,(58,465),['1,200 training / 300 validation / 300 held-out test runs','Training-only normalization. Exported weights run in your browser.','Human review enables one inert event. No actuator channel.'],26,gap=47)
save('architecture',im)
im,d=base('04','The code that runs the model.','ACTUAL SOURCE / app/inference.js')
source=(ROOT/'app/inference.js').read_text().splitlines()
# Show the actual compact forward-pass body, with wrapping only for readability.
import textwrap
rows=[]
for l in source[11:21]:rows+=textwrap.wrap(l,width=105,replace_whitespace=False,drop_whitespace=False) or ['']
d.rectangle((58,231,1222,619),fill=NAVY)
for i,l in enumerate(rows[:17]):text(d,(80,249+i*20),l,16,'#F4F1EA','mono')
save('source',im)
im,d=base('04','Missing measurements stay missing.','FIRMWARE / REAL BUILD ARTIFACTS')
lines(d,(58,252),['ESP32-S3 Feather  +  ADS1115  +  TMP117','Checked I²C transactions and conversion timeouts.','Uncalibrated channels report null, alongside raw readings.','Both target modes compiled. No physical device tested.'],29,gap=62)
text(d,(58,545),'Bus fault or stale data → hold, reset, collect fresh samples.',27,TERRA)
save('firmware',im)
im,d=base('05','Publish the misses, too.','HELD-OUT SYNTHETIC EVIDENCE')
text(d,(58,245),'89.7%',89,INK,'serif');text(d,(61,352),'synthetic accuracy / 300 test runs',22,MUTED)
text(d,(58,422),'31 / 100',60,TERRA,'serif');text(d,(61,501),'injected sensor faults classified as steady',22,INK)
labels=['steady','shift','fault'];matrix=[[100,0,0],[0,100,0],[31,0,69]]
text(d,(740,228),'PREDICTED FAMILY',16,MUTED,'mono')
for j,l in enumerate(labels):text(d,(794+j*130,270),l,18,INK,'mono')
for i,l in enumerate(labels):
 text(d,(642,322+i*79),l,18,INK,'mono')
 for j,v in enumerate(matrix[i]):
  x=770+j*130;y=309+i*79;d.rectangle((x,y,x+111,y+65),fill=('#E2D2C9' if i==j else '#F6F0ED'),outline=MUTED);text(d,(x+35,y+17),str(v),26,TERRA if (i==2 and j==0) else INK)
text(d,(58,592),'Simulator labels are not physiology or clinical validation.',27,TERRA)
save('evidence',im)
im,d=base('05','Tested software. Unmeasured hardware.','VERIFICATION')
text(d,(58,247),'33',93,INK,'serif');text(d,(231,283),'project checks passing',32,INK)
text(d,(58,370),'10',93,INK,'serif');text(d,(231,407),'offline Adaption workflow checks',32,INK)
lines(d,(58,530),['Determinism · inference parity · review resets · fault recovery','No patient outcomes, assembled PCB test or clinical claim.'],26,gap=46)
save('tests',im)
im,d=base('06','Start with research teams.','BUSINESS HYPOTHESIS / UNVALIDATED')
lines(d,(58,248),['Free core: simulator, local inference, inspectable evidence.','Potential buyers: student engineering and early sensor teams.'],28,gap=55)
text(d,(58,389),'$29 / month',64,TERRA,'serif');text(d,(58,474),'Proposed future team plan. Paid features are not built.',26,INK)
lines(d,(58,535),['Shared experiment histories, calibration records and reports.','20 paying teams = $580/month before costs. Illustration only.'],24,gap=42)
save('business',im)
im,d=base('06','Small windows. Local inference.','SCALABILITY + NEXT VALIDATION')
lines(d,(58,247),['24 samples per inference. Small, fixed-size matrices.','Bounded serial frames and import files.','A pause over 10 seconds requires a fresh collection window.','Sensor readings stay in the browser in this version.'],30,gap=65)
text(d,(58,548),'Next: physical assembly, calibration and target-user interviews.',26,TERRA)
save('scale',im)
im,d=base('07','Inspect. Reproduce. Challenge.','PATCHLINE BENCH')
lines(d,(58,261),['Explore the live app','patchline-bench.vercel.app'],36,gap=58)
lines(d,(58,436),['Source + model evidence + limitations','github.com/rishikrrontala-bot/patchline-bench'],26,gap=47)
save('close',im)
# No narration or music is generated. Browser footage is real, edited and chapter paced.
clips={}
for folder in ['hero','assembly','overview','review','rehearsal','workflow']:
 files=sorted((CAP/folder).glob('*.png'))
 if not files:raise RuntimeError('Missing captured footage '+folder)
 clips[folder]=files
short=[('hero',15,'01 / THE PROBLEM'),('assembly',20,'02 / SIX-LAYER CONCEPT + ACTUAL PCB'),('overview',8,'03 / LOCAL SIGNAL OBSERVATORY'),('workflow',32,'03 / REVIEW → INERT EVENT → FAULT HOLD'),('architecture',12,'04 / SEPARATE MODEL AND POLICY'),('source',13,'04 / ACTUAL INFERENCE SOURCE'),('evidence',15,'05 / HELD-OUT SIMULATION + MISSED FAULTS'),('business',15,'06 / PROPOSED BUSINESS MODEL'),('scale',10,'06 / LOCAL COMPUTE + NEXT VALIDATION'),('close',10,'07 / BUILT BY RISHIK RONTALA')]
full=[('hero',10,'01 / PATCHLINE BENCH'),('problem',25,'01 / THE RESEARCH PROBLEM'),('assembly',40,'02 / CONCEPT ASSEMBLY + ACTUAL PCB'),('overview',12,'03 / FOUR SYNTHETIC CHANNELS'),('workflow',48,'03 / REVIEW → INERT EVENT → FAULT HOLD'),('scale',10,'03 / IMPORTED + STALE SIGNALS STAY HELD'),('architecture',20,'04 / MODEL + POLICY ARCHITECTURE'),('source',20,'04 / ACTUAL INFERENCE SOURCE'),('firmware',15,'04 / COMPILED FIRMWARE / UNTESTED HARDWARE'),('evidence',23,'05 / SYNTHETIC MODEL EVIDENCE'),('tests',12,'05 / EXECUTED SOFTWARE CHECKS'),('business',27,'06 / PROPOSED BUSINESS / UNVALIDATED DEMAND'),('scale',18,'06 / LOCAL SCALING + NEXT VALIDATION'),('close',20,'07 / BUILT BY RISHIK RONTALA')]
def run(args):subprocess.run([str(FF),'-hide_banner','-loglevel','error','-y']+args,check=True)
def render(version,timeline):
 paths=[];chapters=[];elapsed=0
 for n,(name,duration,label) in enumerate(timeline):
  overlay=Image.new('RGBA',(1280,720),(0,0,0,0));od=ImageDraw.Draw(overlay);od.rectangle((0,669,1280,720),fill=NAVY);text(od,(35,686),label,16,'#F4F1EA','mono');overlay.save(WORK/'lower.png')
  dest=WORK/(version+'-'+str(n)+'.mp4');frames=int(duration*30)
  if name in clips:
   # Each frame is an actual browser screenshot. Timing is conformed to chapter duration.
   rate=len(clips[name])/duration
   inputs=['-framerate',str(rate),'-i',str(CAP/name/'%05d.png')]
   filt='[0:v]scale=1200:660:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:0:color=0xEFE6E1[base];[base][1:v]overlay=0:0,fps=30,tpad=stop_mode=clone:stop_duration=5,format=yuv420p[v]'
  else:
   inputs=['-loop','1','-framerate','30','-i',str(WORK/(name+'.png'))]
   filt='[0:v][1:v]overlay=0:0,fps=30,tpad=stop_mode=clone:stop_duration=5,format=yuv420p[v]'
  run(inputs+['-i',str(WORK/'lower.png'),'-filter_complex',filt,'-map','[v]','-frames:v',str(frames),'-an','-c:v','libx264','-preset','fast','-crf','20','-threads','4',str(dest)])
  paths.append(dest);chapters.append({'start':elapsed,'duration':duration,'scene':name,'label':label});elapsed+=duration
 concat=WORK/(version+'.concat');concat.write_text(''.join("file '"+str(p)+"'\n" for p in paths))
 output=OUT/('Patchline-Bench-'+('2m30s' if version=='short' else '5m00s')+'-silent.mp4')
 run(['-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(output)])
 assert elapsed==({'short':150,'full':300}[version]);return {'file':str(output.relative_to(ROOT)),'seconds':elapsed,'chapters':chapters,'bytes':output.stat().st_size}
if __name__=='__main__':
 report={'capture':'Actual public browser captures; the assembly uses eleven fully framed captured poses. Chapter-paced edited walkthrough with evidence cards. No generated UI outcomes or audio.','videos':[render('short',short),render('full',full)]}
 (ROOT/'proof/demo-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
