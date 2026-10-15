import {examDiagram} from './exam-diagrams.js'
import { lessons } from './models.js'
const esc = s => String(s??'—').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const txt=(x,y,s,cls='')=>`<text x="${x}" y="${y}" class="${cls}">${esc(s)}</text>`
const table=(heads,rows)=>`<div class="lab-table"><table><thead><tr>${heads.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
const svg=(body,label,w=660,h=350)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>${body}</svg>`
function datapath(f){
 const nodes={PC:[530,140],MAR:[80,140],MDR:[305,140],R0:[30,335],R1:[165,335],IR:[300,335],Y:[435,335],ALU:[435,445],Z:[580,445]}
 const paths={
  'pc-mar':'M585 200V265H135V200', 'r1-mar':'M220 335V265H135V200',
  'mdr-ir':'M360 200V265H355V335', 'r0-y':'M85 335V265H490V335',
  'mem-mdr':'M345 95V140', 'mdr-mem':'M380 140V110H410V95',
  'pc-inc':'M640 165H675V115H585V140',
  'mdr-alu':'M360 200V265H560V425H525V445', 'y-alu':'M490 395V445',
  'alu-z':'M545 475H580', 'z-mdr':'M635 445V265H360V200'
 }
 const endpoint={'pc-mar':['PC','MAR'],'r1-mar':['R1','MAR'],'mdr-ir':['MDR','IR'],'r0-y':['R0','Y'],'mem-mdr':['MDR'],'mdr-mem':['MDR'],'pc-inc':['PC'],'mdr-alu':['MDR','ALU'],'y-alu':['Y','ALU'],'alu-z':['ALU','Z'],'z-mdr':['Z','MDR']}
 let content='<path d="M40 265H680" class="lab-bus"/>'+txt(40,249,'CPU 共享内部总线','lab-value')
 // Draw inactive paths first so the current transfer is always visible on the shared bus.
 const entries=Object.entries(paths).sort(([a],[b])=>Number(f.links?.includes(a)||false)-Number(f.links?.includes(b)||false))
 for(const [id,d] of entries)content+=`<path d="${d}" class="lab-wire ${f.links?.includes(id)?'active':''}"/>`
 content+=`<path d="M135 140V55H240" class="lab-wire ${f.links?.some(k=>['mem-mdr','mdr-mem'].includes(k))?'active':''}"/>`
 content+=txt(146,120,'地址 MAR','lab-value')+txt(608,104,'独立 +1','lab-value')
 const memoryActive=f.links?.some(k=>['mem-mdr','mdr-mem'].includes(k))
 content+=`<g class="lab-register ${memoryActive?'active':''}"><rect x="240" y="15" width="210" height="80" rx="7"/>${txt(252,37,'存储器 M')}${txt(252,59,'[100] = ADD R0,(R1)','lab-value')}${txt(252,80,'[200] = '+f.state['M[200]'],'lab-value')}</g>`
 for(const [id,[x,y]] of Object.entries(nodes)){
  const active=Object.entries(endpoint).some(([k,ab])=>f.links?.includes(k)&&ab.includes(id)),val=id==='ALU'?'Y + 总线数据':f.state[id]
  content+=`<g class="lab-register ${active?'active':''}"><rect x="${x}" y="${y}" width="110" height="60" rx="7"/>${txt(x+9,y+21,id)}${txt(x+9,y+45,val,'lab-value'+(String(val).length>11?' lab-value-long':''))}</g>`
 }
 return svg(content,'带共享内部总线、Y与Z暂存器和独立PC增量器的数据通路。虚线高亮表示本拍传送方向，当前值另列文字表。',720,530)
}
function graph(f){
 const coords={A:[55,140],B:[235,55],C:[235,245],D:[415,140]};let content=''
 for(const [u,v,w] of f.edges||[]){const [x,y]=coords[u],[xx,yy]=coords[v],active=f.active?.includes(u+'-'+v);content+=`<path d="M${x+28} ${y}L${xx-30} ${yy}" class="lab-wire ${active?'active':''}"/>${txt((x+xx)/2,(y+yy)/2-13,w,'lab-weight')}`}
 for(const [id,[x,y]] of Object.entries(coords)){content+=`<g class="lab-register ${f.activeNode===id?'active':''}"><circle cx="${x}" cy="${y}" r="28"/>${txt(x-7,y+6,id)}${txt(x-48,y+49,`ve=${f.state.ve[id]} · vl=${f.state.vl[id]}`,'lab-value')}</g>`}
 return svg(content,'AOE图：A到B为2，A到C为4，B到D为3，C到D为2。高亮边对应当前计算。',480,320)
}
function diagram(lesson,f){
 if(lesson.kind==='exam')return examDiagram(lesson,f)
 if(lesson.kind==='datapath')return datapath(f)
 if(lesson.kind==='critical')return graph(f)
 if(lesson.kind==='pipeline'){
  const cycle=f.state.cycle;let b=''
  for(let c=1;c<=f.rows[0].length;c++)b+=txt(201+(c-1)*52,30,`C${c}`)
  f.rows.forEach((row,i)=>{b+=txt(8,77+i*70,f.instructions[i]);row.forEach((stage,c)=>{if(!stage||c+1>cycle)return;const x=185+c*52,y=48+i*70;b+=`<g class="lab-stage ${c+1===cycle?'active':''} ${['冻结','等候'].includes(stage)?'waiting':''}"><rect x="${x}" y="${y}" width="48" height="44" rx="5"/>${txt(x+7,y+27,stage)}</g>`})})
  return svg(b,`流水线第${cycle}周期，高亮格子为本周期。详细阶段见文字过程表。`,640,265)
 }
 if(lesson.kind==='disk'){
  const x=v=>45+v/lesson.max*565;let b='<path d="M45 90H610" class="lab-track"/>'
  for(const n of [0,10,40,50,70,99])b+=`<path d="M${x(n)} 83v14" class="lab-tick"/>${txt(x(n)-9,119,n)}`
  b+=`<g class="lab-register active"><circle cx="${x(f.state.position)}" cy="90" r="12"/>${txt(Math.min(520,Math.max(15,x(f.state.position)-45)),58,'当前 '+f.state.position)}</g>`
  b+=txt(35,165,f.state.path.join(' → '),'lab-path');b+=txt(35,203,`累计移动 ${f.state.distance}；完成请求 ${f.state.done.length}/3`)
  return svg(b,'当前磁头位置与累计移动路径。',660,245)
 }
 if(lesson.kind==='pages'){
  return `<div class="lab-request-strip" aria-label="访问序列">${lesson.requests.map((p,i)=>`<span class="${i===f.state.index?'active':''} ${i<f.state.index?'done':''}">${p}${i===f.state.index?'<small>当前</small>':''}</span>`).join('')}</div><div class="lab-slots">${f.state.slots.map((p,i)=>`<div class="lab-slot ${i===f.activeSlot?'active':''}"><span>页框 ${i+1}</span><strong>${p===null?'空':p}</strong><small>${lesson.policy==='Clock'?`访问位 ${f.state.bits[i]}${i===f.state.hand?' · 下次起点':''}`:''}</small></div>`).join('')}</div><p class="lab-stat">缺页 ${f.state.faults} 次 · 命中 ${f.state.hits} 次</p>`
 }
 if(lesson.kind==='window')return `<div class="lab-window"><p>发送方：窗口 [${f.state.base}，${f.state.base+3}]</p><div class="lab-request-strip">${Array.from({length:8},(_,i)=>`<span class="${i>=f.state.base&&i<f.state.base+4?'in-window':''} ${i===f.packet?'active':''}">${i}<small>${f.state.retransmitted.includes(i)?'补发':i===1&&f.state.base<=1&&f.state.sent.includes(1)?'丢失':i<f.state.base?'已确认':f.state.sent.includes(i)?'已发':''}</small></span>`).join('')}</div><p>接收方下一期待：${f.state.receiverBase}</p><p>已按序交付：${f.state.received.join('、')||'无'}；失序缓存：${f.state.buffered.join('、')||'无'}</p></div>`
 if(lesson.kind==='banker')return `<div class="lab-work"><span>Work 当前可用</span><strong>${f.state.work}</strong><span>检查对象 ${esc(f.state.checking)}</span></div>`+table(['进程','Allocation','Need','Finish'],f.state.need.map((n,i)=>[`P${i+1}`,f.state.allocation[i],n,String(f.state.finish[i])]))
 return ''
}
function stateRows(l,f){
 const s=f.state
 if(l.kind==='exam')return [['微操作',f.micro||'尚未执行'],['控制信号',(f.signals||[]).join('，')||'未新增／未指定'],...Object.entries(s)]
 if(l.kind==='datapath')return Object.entries(s)
 if(l.kind==='critical')return [...Object.keys(s.ve).map(k=>[k,`ve=${s.ve[k]}；vl=${s.vl[k]}`]),['工期 T',s.T],...s.activities.map(a=>[a.edge,`e=${a.e}，l=${a.l}，余量=${a.slack}；${a.critical?'关键':'非关键'}`])]
 if(l.kind==='pages')return [['页框',s.slots.map(x=>x??'空').join(' / ')],['缺页 / 命中',`${s.faults} / ${s.hits}`],...(l.policy==='Clock'?[['访问位 / 下次指针',s.bits.join('/')+'；页框 '+(s.hand+1)]]:[])]
 if(l.kind==='banker')return [['Work',s.work],['Available（检查中不真实修改）',s.available],['安全序列前缀',s.sequence.join(' → ')||'无']]
 if(l.kind==='pipeline')return f.instructions.map((text,i)=>[text,s.cycle?(f.rows[i][s.cycle-1]||(s.cycle<=f.rows[i].indexOf('IF')?'未开始':'已完成')):'未开始'])
 if(l.kind==='window')return [['发送窗口基序号',s.base],['接收下一期待',s.receiverBase],['已交付',s.received.join(',')||'无'],['缓存',s.buffered.join(',')||'无'],['本次补发',s.retransmitted.join(',')||'无']]
 return [['磁头位置',s.position],['累计距离',s.distance],['已服务',s.done.join(' → ')||'无'],['路径',s.path.join(' → ')]]
}
function changedRows(l,frames,index){
 const now=stateRows(l,frames[index]),prev=new Map(index?stateRows(l,frames[index-1]):[])
 return now.map(([k,v])=>[k,v,index&&String(prev.get(k))!==String(v)?`← ${prev.get(k)??'无'}（本步变化）`:index?'保持':'初始'])
}
export function mountLearningLabs(container,doc,{signal,render,base,onActivate}){
 for(const spec of lessons.filter(s=>s.doc===doc)){
  const heading=spec.anchor?container.querySelector(`[id="${spec.anchor}"]`):[...container.querySelectorAll('h2,h3,h4')].find(h=>h.firstChild?.textContent.trim()===spec.heading)
  if(!heading)continue
  let option=spec.options?.[0],lesson=spec.make(option),index=0,quiz=false,revealed=true,moving=true,zoomed=false
  const root=document.createElement('details');root.className='learning-lab';root.dataset.lesson=spec.id
  const label=document.createElement('summary');label.textContent='逐步演示 · '+lesson.title;root.append(label)
  const activate=()=>{if(!spec.anchor&&heading.dataset.section)onActivate?.(heading.dataset.section)}
  root.addEventListener('click',activate,{signal});root.addEventListener('toggle',()=>{if(root.open)activate()},{signal})
  const panel=document.createElement('div');panel.className='lab-panel';root.append(panel)
  const question=spec.anchor?(heading.closest('.study-question')||heading):null
  let before=question?question.nextElementSibling:heading.nextElementSibling
  while(!question && before && !/^H[1-4]$/.test(before.tagName) && !before.querySelector('details.knowledge-figures'))before=before.nextElementSibling
  // Keep each original heading marker adjacent to its heading for deep links.
  if(before&&/^H[1-4]$/.test(before.tagName)){const marker=before.previousElementSibling;if(marker?.tagName==='P'&&marker.querySelector('a[id]')&&!marker.textContent.trim())before=marker}
  if(question)question.after(root);else container.insertBefore(root,before)
  const draw=()=>{
   const f=lesson.frames[index],hidden=quiz&&!revealed&&index>0,view=hidden?lesson.frames[index-1]:f
   panel.classList.toggle('lab-motion-paused',!moving)
   panel.innerHTML=`${lesson.source?`<p class="exam-source">据 ${lesson.source.year} 年第 ${lesson.source.number} 题图重绘 · <a href="#/doc/${encodeURIComponent(lesson.source.doc)}?section=${lesson.source.anchor}">查看题干与原图 ↗</a></p>`:''}<p class="lab-intro">${esc(lesson.intro)}</p>${spec.options?`<label class="lab-select">切换情形 <select aria-label="${esc(spec.heading)}演示情形">${spec.options.map(v=>`<option ${v===option?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`:''}<div class="lab-controls"><button type="button" data-act="prev" ${index===0?'disabled':''}>← 上一步</button><button type="button" data-act="next" ${index===lesson.frames.length-1?'disabled':''}>下一步 →</button><button type="button" data-act="reset">重新开始</button>${lesson.kind==='exam'?`<button type="button" data-act="motion" aria-pressed="${moving}">${moving?'暂停流动':'播放流动'}</button><button type="button" data-act="zoom" aria-pressed="${zoomed}">${zoomed?'适应宽度':'放大图'}</button>`:''}<button type="button" data-act="quiz" aria-pressed="${quiz}">${quiz?'退出自测':'自测模式'}</button></div><nav class="lab-step-strip" aria-label="${esc(spec.heading)}演示步骤">${lesson.frames.map((v,i)=>`<button type="button" data-step="${i}" aria-label="第${i}步${quiz&&!revealed?'':'：'+esc(v.title)}" ${i===index?'aria-current="step"':''}>${i===0?'初始':lesson.kind==='datapath'||lesson.kind==='pipeline'||lesson.clocked?'C'+i:'步骤'+i}</button>`).join('')}</nav><p class="lab-progress" role="status" aria-live="polite">${hidden?'待预测':'当前'} ${index}/${lesson.frames.length-1} · ${hidden?'请先预测本步结果':esc(f.title)}</p>${hidden?`<div class="lab-question"><p>${esc(f.question||'根据上一状态，下一步应执行什么？哪些值会改变，是否满足结束条件？')}</p><button type="button" data-act="reveal">揭示本步结果</button><small>图中保留上一步状态，揭示后再检查自己的推断。</small></div>`:''}${lesson.kind==='exam'?`<p class="exam-legend">橙线：数据流；紫虚线：控制；灰色未强调，不代表0；—为未定。${lesson.clocked?'按原题节拍显示。':'逻辑步骤，不按拍计数。'}</p>${hidden?'':`<div class="exam-micro"><strong>${esc(f.micro||'初始状态')}</strong><p>控制：${esc(f.signals?.join('，')||'未新增／未指定')}</p></div>`}`:''}<div class="lab-diagram lab-diagram--${lesson.kind} ${zoomed?'is-zoomed':''}">${diagram(lesson,view)}</div>${hidden?'':`<div class="lab-why"><strong>这一步为什么这样做</strong><p>${esc(f.why)}</p></div>${table(['对象','当前值','与上一步比较'],changedRows(lesson,lesson.frames,index))}`}<details class="lab-text"><summary>文字版 · 分支、循环与停止条件</summary><pre>${esc(lesson.flow)}</pre></details><details class="lab-text"><summary>完整过程表 · 从初始到结束</summary>${hidden?'<p>揭示当前步骤后，可展开核对完整过程。</p>':table(['步','动作','状态与原因'],lesson.frames.map((v,i)=>[i,v.title,stateRows(lesson,v).map(([k,x])=>`${k}：${x}`).join('；')+'。'+v.why]))}</details><details class="lab-text"><summary>适用条件、公式与易混点</summary><p>${esc(lesson.condition)}</p><div data-lab-formula></div>${table(['区分','判断依据'],lesson.compare)}</details>`
   const marker=panel.querySelector('marker');if(marker){marker.id='lab-arrow-'+spec.id;panel.querySelectorAll('.lab-wire,.exam-flow,.exam-control').forEach(path=>path.setAttribute('marker-end',`url(#${marker.id})`));const hint=document.createElement('p');hint.className='lab-diagram-hint';hint.textContent=lesson.kind==='exam'?'图按题目结构重绘，数据线与控制线分别标示；点“放大图”可放大并横向查看，所有值同时列于文字表。':lesson.kind==='datapath'?'虚线高亮表示本拍传送方向；粗横线为共享内部总线。仅画数据传送，控制信号从略，窄屏可横向查看。':lesson.kind==='critical'?'点为事件，边上数字为活动时长；高亮边参与本步计算。各事件时间同时列在下方文字表。':'高亮表示当前计算或阶段；窄屏可横向查看，数值同时列于下方文字表。';panel.querySelector('.lab-diagram').before(hint)}
   render(lesson.formula,base,panel.querySelector('[data-lab-formula]'))
   const step=panel.querySelector('[aria-current=step]'),strip=step.parentElement;if(step.offsetLeft<strip.scrollLeft)strip.scrollLeft=step.offsetLeft;else if(step.offsetLeft+step.offsetWidth>strip.scrollLeft+strip.clientWidth)strip.scrollLeft=step.offsetLeft+step.offsetWidth-strip.clientWidth
  }
  panel.addEventListener('click',e=>{
   const btn=e.target.closest('button');if(!btn)return
   const act=btn.dataset.act
   if(btn.dataset.step!==undefined){index=Number(btn.dataset.step);revealed=!quiz||index===0}
   else if(act==='prev'){index=Math.max(0,index-1);revealed=!quiz||index===0}
   else if(act==='next'){index=Math.min(lesson.frames.length-1,index+1);revealed=!quiz}
   else if(act==='reset'){index=0;revealed=true}
   else if(act==='quiz'){quiz=!quiz;revealed=!quiz||index===0}
   else if(act==='reveal')revealed=true
   else if(act==='zoom'){zoomed=!zoomed;panel.querySelector('.lab-diagram').classList.toggle('is-zoomed',zoomed);btn.textContent=zoomed?'适应宽度':'放大图';btn.setAttribute('aria-pressed',String(zoomed));return}
   else if(act==='motion'){moving=!moving;panel.classList.toggle('lab-motion-paused',!moving);btn.textContent=moving?'暂停流动':'播放流动';btn.setAttribute('aria-pressed',String(moving));return}
   else return
   draw();const focus=btn.dataset.step!==undefined?`[data-step="${index}"]`:`[data-act="${act==='reveal'?'quiz':act}"]`;const nextFocus=panel.querySelector(focus);(nextFocus&&!nextFocus.disabled?nextFocus:panel.querySelector('[aria-current=step]'))?.focus({preventScroll:true})
  },{signal})
  panel.addEventListener('change',e=>{if(e.target.matches('select')){option=e.target.value;lesson=spec.make(option);index=0;revealed=true;label.textContent='逐步演示 · '+lesson.title;draw();panel.querySelector('select').focus({preventScroll:true})}},{signal})
  draw()
 }
}
