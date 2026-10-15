const text=(x,y,s,cls='')=>`<text x="${x}" y="${y}" class="${cls}">${escape(s)}</text>`
const escape=s=>String(s??'—').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const node=(id,x,y,w=100,h=55,label=id,key=id)=>({id,x,y,w,h,label,key})
const fig2009={w:960,h:740,nodes:[node('M',310,20,540,85,'存储器 M','M[200]'),node('MAR',160,280),node('MDR',510,280),node('R0',190,425),node('R1',190,535),node('A',510,425),node('ALU',505,515,145,60,'ALU · ADD',null),node('AC',530,625),node('PC',790,435),node('IR',790,610,130)],bus:['M100 150H930','M100 205H930','M100 245H930','M100 365H930'],labels:[[900,140,'CB'],[900,195,'DB'],[900,235,'AB'],[115,350,'CPU内部总线'],[790,712,'IR → 指令译码部件']],paths:{
 'bus-r0':'M310 365V452H290','bus-r1':'M310 365V562H290','bus-pc':'M810 365V435','ir-decode':'M855 665V690',
 'pc-mar':'M840 435V365H210V335','pc-inc':'M890 465H940V550H840V490','address':'M210 280V245H785V105','mem-read':'M675 105V205H570V280','mdr-ir':'M560 335V365H825V610','r1-mar':'M190 562H110V365H210V335','mdr-a':'M560 335V365H560V425','r0-alu':'M190 452H135V365H625V515','a-alu':'M560 480V515','alu-ac':'M578 575V625','ac-mdr':'M580 680V710H435V365H540V335','mem-write':'M535 280V205H675V105'
 },controls:[['R0in',350,475,290,465],['R1in',350,585,290,575],['PCin',940,475,890,475],['PCout',935,400,840,400],['MARin',70,300,160,300],['MDRinE',710,305,610,305],['MDRout',670,348,585,348],['IRin',945,630,920,630],['R1out',70,525,110,525],['Ain',420,450,510,450],['R0out',70,410,135,410],['ADD',430,545,505,545],['ACin',435,650,530,650],['ACout',680,700,580,700],['MDRin',420,310,510,310],['MDRoutE',440,265,535,265],['MemR',360,130,400,105],['MemW',500,130,540,105],['PC+1',720,530,840,530]]}
const fig2015={w:1080,h:680,nodes:[node('SR',105,125,170,65,'移位寄存器 SR'),node('ALU',105,255,170,65,'ALU', 'ALU'),node('T',95,405,90,55),node('MUX',370,425,120,75,'MUX','MUX'),node('R0',510,130),node('R1',510,250),node('R2',510,370),node('R3',510,490),node('MAR',755,130),node('MDR',755,250),node('PC',755,370),node('IR',755,490,100,55,'IR',null),node('CU',745,580,125,55,'控制部件 CU',null),node('M',975,250,100,110,'主存','M[200]')],bus:['M665 65V625','M930 65V625'],labels:[[650,653,'CPU内部总线'],[880,645,'主存总线'],[382,560,'0：2'],[460,560,'1：总线'],[410,95,'①'],[465,150,'②'],[465,270,'③'],[260,340,'④'],[275,440,'⑤'],[445,585,'⑥'],[445,408,'⑦'],[330,500,'⑧'],[465,522,'⑨'],[350,395,'⑦→④ 补全'],[475,610,'⑥→⑨ 补全']],paths:{
 'r3-bus':'M610 517H665','bus-ir':'M665 517H755','ir-cu':'M805 545V580',
 'pc-t':'M755 397H665V585H140V460','r1-t':'M610 277H665V585H140V460','r2-t':'M610 397H665V585H140V460','t-a':'M140 405V320','two-mux':'M400 555V500','mux-b':'M430 425V355H245V320','alu-sr':'M190 255V190','sr-pc':'M190 125V75H665V397H755','sr-r2':'M190 125V75H665V397H610','sr-r0':'M190 125V75H665V157H610','r1-mar':'M610 277H665V157H755','address':'M855 157H930V280H975','mem-read':'M975 325H930V277H855','mdr-mux':'M755 277H665V585H460V500'
 },controls:[['PCout',730,350,700,397],['Tin',235,440,185,440],['MUXop=0',315,480,370,480],['MUXop=1',315,480,370,480],['ALUop=add',355,270,275,270],['ALUop=mova',355,270,275,270],['ALUop=sub',355,270,275,270],['SRop=mov',350,150,275,150],['SRop=left',350,150,275,150],['SRout',350,97,190,97],['PCin',850,350,855,397],['R1out',615,230,645,277],['R2out',615,350,645,397],['R2in',470,397,510,397],['R0in',465,157,510,157],['MARin',850,110,805,130],['MDRout',715,235,700,277],['MEMop=read',960,205,1025,250]]}
const fig2022={w:1040,h:650,nodes:[node('M',5,140,90,175,'主存',null),node('MAR',150,135),node('MDR',340,135),node('PC',540,135),node('IR',760,190,120,55),node('Y',175,355),node('ALU',410,415,150,65,'ALU',null),node('Z',460,550),node('FR',260,550,140,55,'FR · SF / OF',null),node('GPR',765,375,155,125,'GPRs 通用寄存器组',null)],bus:['M40 70H1000','M145 300H990'],labels:[[430,45,'系统总线'],[165,280,'CPU内部总线'],[475,405,'A       B'],[640,245,'IR / FR → CU'],[700,525,'rd 4位'],[925,525,'rs 4位']],paths:{
 'pc-mar':'M590 190V300H200V190','address':'M200 135V70H45V140','mem-read':'M45 140V70H390V135','mdr-ir':'M390 190V300H820V245','gpr-y':'M845 375V300H225V355','gpr-b':'M845 375V300H530V415','y-a':'M225 410V450H350V385H445V415','alu-z':'M485 480V550','alu-fr':'M460 480V515H330V550','z-gpr':'M510 605V625H660V300H735V440H765'
 },controls:[['PCout',710,250,590,250],['MARin',270,152,250,152],['Read',985,140,985,70],['MDRout',480,235,400,235],['IRin',970,212,880,212],['MDRin',480,152,440,152],['Yin',330,380,275,380],['GPRout',1000,345,845,345],['ALUop=加',670,450,560,450],['Zout',730,575,660,575],['GPRin',840,565,840,500],['rs=1',1000,490,920,490],['rs=2',1000,490,920,490],['rd=3',675,490,765,490]]}
const fig2024={w:940,h:390,nodes:[node('A',25,32,145,55,'A · 32位','A'),node('B',25,125,145,55,'B · 32位','B'),node('IMM',20,265,170,55,'IR[31:20] · 12位','IR[31:20]'),node('EXT',260,260,170,60,'扩展器','扩展结果'),node('MUX',490,140,120,155,'MUX','ALU的B端'),node('ALU',700,85,100,190,'ALU',null),node('F',830,115,100,60,'F · 32位','F'),node('FLAGS',830,230,100,75,'OF SF ZF CF',null)],bus:[],labels:[[500,132,'0'],[500,325,'1'],[15,350,'Ext=0 零扩展；Ext=1 符号扩展'],[580,365,'ALUctr：000 加；001 减；010 左移']],paths:{
 'a-alu':'M170 59H665V115H700','b-mux':'M170 152H490','ir-ext':'M190 292H260','ext-mux':'M430 290H460V265H490','mux-alu':'M610 215H700','alu-f':'M800 150H830','alu-flags':'M800 240H830'
 },controls:[['Ext=0',320,385,320,320],['Ext=1',320,385,320,320],['ALUBsrc=0',580,88,550,140],['ALUBsrc=1',580,88,550,140],['ALUctr=000',750,355,750,263],['ALUctr=010',750,355,750,263]]}
export const examFigures={'2009':fig2009,'2015':fig2015,'2022':fig2022,'2024':fig2024}
export function examDiagram(lesson,f){
 const fig=examFigures[lesson.figure],active=new Set(f.data||[]),hot=new Set(f.hot||[]),signals=new Set(f.signals||[])
 let b=fig.bus.map(d=>`<path d="${d}" class="exam-bus"/>`).join('')
 for(const [id,d] of Object.entries(fig.paths))b+=`<path d="${d}" class="exam-wire"/>`
 for(const [id,d] of Object.entries(fig.paths))if(active.has(id))b+=`<path d="${d}" class="exam-flow"/><path d="${d}" class="exam-moving"/>`
 const bySpot=new Set()
 for(const [label,x,y,xx,yy] of fig.controls){const key=`${x},${y}`,on=signals.has(label);if(bySpot.has(key)&&!on)continue;if(!on&&fig.controls.some(c=>`${c[1]},${c[2]}`===key&&signals.has(c[0])))continue;bySpot.add(key);b+=`<path d="M${x} ${y}L${xx} ${yy}" class="exam-control ${on?'active':''}"/>${text(x,y-8,label,'exam-control-label '+(on?'active ':'')+(xx>x||x>fig.w-140?'edge':''))}`}
 const gates=lesson.figure==='2009'?[['R0out',135,410,'up'],['R1out',110,525,'up'],['PCout',840,405,'up'],['MDRout',560,350,'down'],['MDRoutE',535,265,'up'],['ACout',580,695,'down']]:lesson.figure==='2015'?[['SRout',190,97,'up']]:lesson.figure==='2022'?[['MDRout',390,230,'down'],['PCout',590,250,'down'],['GPRout',845,345,'up'],['Zout',660,575,'up']]:[]
 for(const [name,x,y,direction] of gates){const dy=direction==='up'?-1:1;b+=`<path d="M${x} ${y+10*dy}L${x-10} ${y-8*dy}H${x+10}Z" class="exam-gate ${signals.has(name)?'active':''}"/>`}
 for(const n of fig.nodes){
  let v=n.key===null?'':f.state[n.key]??'—'
  if(n.id==='FR')v=`SF=${f.state.SF??'—'} OF=${f.state.OF??'—'}`
  if(n.id==='GPR')v=`rs=${f.state.rs??'—'} rd=${f.state.rd??'—'}`
  if(n.id==='FLAGS')v=`${f.state.OF??'—'}/${f.state.SF??'—'}/${f.state.ZF??'—'}/${f.state.CF??'—'}`
  if(n.id==='M'&&n.key)v=(lesson.figure==='2009'?'M[100]=指令；M[200]=':'M[200] = ')+v
  const long=String(v).length>16
  const x=n.x,y=n.y,w=n.w,h=n.h
  let shape=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`
  if(n.id==='ALU'&&lesson.figure!=='2024')shape=lesson.figure==='2015'?`<path d="M${x} ${y+h}H${x+w*.4}L${x+w*.5} ${y+h-14}L${x+w*.6} ${y+h}H${x+w}L${x+w*.78} ${y}H${x+w*.22}Z"/>`:`<path d="M${x} ${y}H${x+w*.4}L${x+w*.5} ${y+14}L${x+w*.6} ${y}H${x+w}L${x+w*.78} ${y+h}H${x+w*.22}Z"/>`
  else if(n.id==='ALU')shape=`<path d="M${x} ${y}L${x+w} ${y+25}V${y+h-25}L${x} ${y+h}V${y+h/2+15}L${x+15} ${y+h/2}L${x} ${y+h/2-15}Z"/>`
  if(n.id==='MUX'&&lesson.figure==='2015')shape=`<path d="M${x+20} ${y}H${x+w-20}L${x+w} ${y+h}H${x}Z"/>`
  else if(n.id==='MUX')shape=`<path d="M${x} ${y}L${x+w} ${y+15}V${y+h-15}L${x} ${y+h}Z"/>`
  b+=`<g class="exam-node ${hot.has(n.id)?'active':''}"><title>${escape(n.label+'：'+v)}</title>${shape}${text(n.id==='ALU'?x+w/2:x+8,n.id==='ALU'?y+h*.35:y+22,n.label,'exam-node-label'+(n.id==='ALU'?' exam-center':''))}${text(n.id==='ALU'?x+w/2:x+8,n.id==='ALU'?y+h*.7:y+Math.min(46,h-8),v,(long?'exam-value small':'exam-value')+(n.id==='ALU'?' exam-center':''))}</g>`
 }
 b+=fig.labels.map(([x,y,t])=>text(x,y,t,'exam-caption')).join('')
 return `<svg class="exam-svg" data-figure="${lesson.figure}" viewBox="0 0 ${fig.w} ${fig.h}" role="img" aria-label="${escape(lesson.title)}；原题结构重绘，高亮本步数据与控制。完整状态见文字表。"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>${b}</svg>`
}
