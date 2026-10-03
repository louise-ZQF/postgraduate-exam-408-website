import './style.css'
import {parseQuery,queryTerms,searchRecords,snippet,decodeIndex,subjects as subjectOrder} from './search.js'
import {Resources,Navigation} from './resources.js'
import {createReviewStore,scheduleReview,validateImport} from './review.js'

const BASE=import.meta.env.BASE_URL, VERSION=encodeURIComponent(__CONTENT_VERSION__)
const app=document.querySelector('#app'), resources=new Resources(), navigation=new Navigation()
const url=file=>`${BASE}${file}?v=${VERSION}`
const groups=['知识体系','小题','大题','错题补充'], searchScopes=['全部','知识点','小题','大题']
const indexFiles={'知识点':'search-v2-knowledge.json','小题':'search-v2-small.json','大题':'search-v2-big.json'}
let docs=[], docMap=new Map(), anchorMap={}, currentScope='全部', currentSubject='全部', liveQuery='', showCount=10, currentRoute='/', currentDoc=null, searchTimer, resultRequest=0
let relatedTopic='', articleModule, documentUnits=[], tocObserver, activeSection='', readerReady=false, practiceMode=false, searchScroll=0, searchKey='', reviewFilter='all'
let readingPositions={}
function notify(message){let box=document.getElementById('notification');if(!box){box=document.createElement('div');box.id='notification';box.setAttribute('role','status');document.body.append(box)}box.textContent=message;box.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>box.hidden=true,9000)}
let safeStorage
try{safeStorage=window.localStorage;practiceMode=safeStorage.getItem('408-practice')==='true';readingPositions=JSON.parse(safeStorage.getItem('408-reading')||'{}')}catch{safeStorage={getItem:()=>null,setItem:()=>{throw new Error('storage')}}}
const review=createReviewStore(safeStorage,notify)
function escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const favoriteList=()=>review.list(), favoriteId=(doc,anchor)=>doc+'#'+anchor, favoriteSet=()=>new Set(favoriteList().map(x=>x.id))
function storeFavorites(list){review.save(list);document.querySelectorAll('[data-favorite-count]').forEach(e=>e.textContent=list.length||'')}
function toggleFavorite(doc,anchor,title,text=''){
  const id=favoriteId(doc,anchor), list=favoriteList().slice(),index=list.findIndex(x=>x.id===id)
  if(index>=0)list.splice(index,1)
  else list.unshift({id,doc,anchor,title,text:text.slice(0,240),addedAt:Date.now(),status:'due',reviewCount:0,nextReviewAt:Date.now(),lastReviewedAt:null,history:[]})
  storeFavorites(list)
  document.querySelectorAll('[data-favorite-id]').forEach(b=>{if(b.dataset.favoriteId===id){b.textContent=index<0?'★ 已收藏':'☆ 收藏';b.setAttribute('aria-pressed',String(index<0))}})
}
function docUrl(id,anchor='',q=''){
  const params=new URLSearchParams();if(anchor)params.set('section',anchor)
  if(q){params.set('q',q);params.set('type',currentScope);params.set('subject',currentSubject)}
  return `#/doc/${encodeURIComponent(id)}${params.size?'?'+params:''}`
}
function searchUrl(q='',scope=currentScope,subject=currentSubject,topic=''){const p=new URLSearchParams();if(q)p.set('q',q);if(scope!=='全部')p.set('type',scope);if(subject!=='全部')p.set('subject',subject);if(topic)p.set('topic',topic);return '#/search'+(p.size?'?'+p:'')}
function syncInputs(){for(const input of app.querySelectorAll('#header-query,#main-search'))if(input.value!==liveQuery)input.value=liveQuery;const select=app.querySelector('#header-search select');if(select)select.value=currentScope;for(const radio of app.querySelectorAll('#hero-search [name="type"]'))radio.checked=radio.value===currentScope;if(currentDoc){for(const a of app.querySelectorAll('[data-toc-anchor]'))a.href=docUrl(currentDoc,a.dataset.tocAnchor,liveQuery);const back=app.querySelector('.reader-toolbar a');if(back)back.href=searchUrl(liveQuery)}}
function syncSearchUrl(){if(currentRoute==='/'||currentRoute==='/search')history.replaceState(null,'',searchUrl(liveQuery))}
function sourceUrl(doc){return doc.source}
function header(active, q = '') {
  const n = favoriteList().length
  return `<header class="site-header"><div class="header-inner"><a class="brand" href="#/" aria-label="408 知识库首页"><span class="brand-rule" aria-hidden="true"></span><span><b>408 知识库</b><small>知识 · 小题 · 大题</small></span></a><form class="header-search" role="search" id="header-search"><label class="visually-hidden" for="header-query">搜索 408 内容</label><select name="type" aria-label="搜索范围">${searchScopes.map(scope=>`<option value="${scope}" ${currentScope===scope?'selected':''}>${scope}</option>`).join('')}</select><input id="header-query" name="q" value="${escapeHtml(q)}" aria-label="搜索 408 正文内容" placeholder="搜索知识点、小题或大题" maxlength="100" autocomplete="off"><button type="submit">搜索</button></form><nav aria-label="主导航"><a href="#/" class="${active==='search'?'active':''}">搜索</a><a href="#/catalog" class="${active==='catalog'?'active':''}">资料目录</a><a href="#/favorites" class="${active==='favorites'?'active':''}">复习清单 <span class="favorite-count" data-favorite-count>${n || ''}</span></a></nav></div></header>`
}
function footer() { return `<footer class="site-footer">资料基于 <a href="https://github.com/yyx-dev/yyx-dev.github.io/tree/325bdaa/docs/408" target="_blank" rel="noopener noreferrer">yyx-dev</a> 与自有错题笔记整理，参考 <a href="https://github.com/liangbohan/postgraduate-exam-website" target="_blank" rel="noopener noreferrer">408 简纲 · liangbohan 及贡献者</a>（<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>），已精简、改写与纠错。<a href="https://github.com/louise-ZQF/postgraduate-exam-408-website/blob/main/CONTENT_REVIEW.md" target="_blank" rel="noopener noreferrer">审查记录 ↗</a></footer>` }
function docGrid() {
  return `<section class="browse" aria-labelledby="browse-title"><div class="section-head"><h2 id="browse-title">按资料浏览</h2><span>${docs.length} 篇 · 四科知识、题型与错题补充</span></div><div class="browse-grid">${groups.map(group => `<div class="browse-column"><h3>${group}</h3>${docs.filter(d=>d.group===group).map(d => `<a href="${docUrl(d.id)}"><span>${escapeHtml(d.subject)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>`).join('')}</div></section>`
}
function highlight(value,q){const needles=queryTerms(q).filter(Boolean).sort((a,b)=>b.length-a.length);if(!needles.length)return escapeHtml(value);const pattern=new RegExp(needles.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gi');let out='',last=0,m;while((m=pattern.exec(value))){out+=escapeHtml(value.slice(last,m.index))+'<mark>'+escapeHtml(m[0])+'</mark>';last=pattern.lastIndex}return out+escapeHtml(value.slice(last))}
function favoriteButton(doc,anchor,title,text='',className='favorite-button'){const id=favoriteId(doc,anchor),active=favoriteSet().has(id);return `<button type="button" class="${className}" data-favorite-id="${escapeHtml(id)}" data-doc="${escapeHtml(doc)}" data-anchor="${escapeHtml(anchor)}" data-title="${escapeHtml(title)}" data-text="${escapeHtml(text.slice(0,240))}" aria-label="收藏：${escapeHtml(title)}" aria-pressed="${active}">${active?'★ 已收藏':'☆ 收藏'}</button>`}
function resultHtml(r,q){const text=practiceMode&&r.stem?r.stem:r.text;return `<article class="result-card"><a class="result-link" href="${docUrl(r.doc,r.anchor,q)}"><div class="result-path">${r.type} · ${escapeHtml(r.subject)} · ${escapeHtml(r.path.slice(1).join(' / ')||r.section)}${r.year?' · '+r.year:''}</div><h3>${highlight(r.title,q)}</h3><p>${highlight(snippet(text,q),q)}</p><span class="open-link">定位到${r.type==='知识点'?'知识段落':'完整题目'} ↗${r.otherHits.length?' · 合并 '+(r.otherHits.length+1)+' 处命中':''}</span></a>${favoriteButton(r.doc,r.anchor,r.title,text)}</article>`}
async function renderResults(){
  const box=app.querySelector('#result-body');if(!box)return
  const request=++resultRequest, scope=currentScope, q=liveQuery.trim(), subject=currentSubject
  const chips=parseQuery(q).chips;if(relatedTopic)chips.push({label:'相关练习：'+relatedTopic.split(':')[1],kind:'topic'});app.querySelector('#query-chips').innerHTML=chips.map((c,i)=>`<button type="button" data-remove-chip="${i}" aria-label="取消筛选 ${escapeHtml(c.label)}">${escapeHtml(c.label)} ×</button>`).join('')
  const count=app.querySelector('#result-count')
  if(!q&&!relatedTopic){count.textContent='输入关键词，直达原文';box.innerHTML='<div class="empty quiet"><h3>从一个线索开始</h3><p>例如“计组 Cache”“OS 缺页”“2018 最小正整数”。</p></div>';return}
  const types=relatedTopic?['小题','大题']:scope==='全部'?['知识点','小题','大题']:[scope]
  if(types.some(t=>resources.state(url(indexFiles[t]))!=='ready')){count.textContent='正在加载搜索资料…';box.innerHTML='<p role="status">正在加载；首次使用后会缓存资料。</p>'}
  try {
    const parts=await Promise.all(types.map(t=>resources.load(url(indexFiles[t])).then(data=>decodeIndex(data,docs,t))))
    if(request!==resultRequest||!box.isConnected)return
    const candidates=parts.flat().filter(r=>!relatedTopic||(r.topicId===relatedTopic&&r.type!=='知识点'));const results=relatedTopic&&!q?candidates.sort((a,b)=>(b.year||0)-(a.year||0)).map(r=>({...r,otherHits:[]})):searchRecords(candidates,q,scope,subject)
    count.textContent=`${results.length} 条相关内容${results.length>showCount?' · 显示前 '+showCount+' 条':''}`
    box.innerHTML=results.length?`<div class="results">${results.slice(0,showCount).map(r=>resultHtml(r,q)).join('')}</div>${results.length>showCount?'<button class="show-more" id="show-more">查看更多</button>':''}`:'<div class="empty"><h3>没有找到匹配内容</h3><p>可以取消上方筛选，或换用较短的关键词。</p></div>'
    if(searchKey===searchUrl(q,scope,subject)&&searchScroll){requestAnimationFrame(()=>window.scrollTo(0,searchScroll));searchKey=''}
  }catch(err){if(request!==resultRequest||!box.isConnected)return;count.textContent='加载失败';box.innerHTML=`<div class="empty"><h3>搜索资料暂时未能加载</h3><p>${escapeHtml(err.message)}</p><button class="action" data-retry-search>重新加载</button></div>`}
}
function renderSearch(q=''){
  liveQuery=q;showCount=10
  app.innerHTML=`${header('search',q)}<main class="search-page"><section class="intro"><p class="eyebrow">计算机学科专业基础 · 408</p><h1>408 知识库</h1><p>搜索具体规则、题干和解题步骤，直接定位正文。</p><form class="hero-search" id="hero-search" role="search"><label for="main-search">搜索具体内容</label><div class="search-control"><input id="main-search" name="q" value="${escapeHtml(q)}" autocomplete="off" maxlength="100" placeholder="例如：计组 Cache、快表、2018 最小正整数"><button type="submit">搜索</button></div><fieldset class="search-scope"><legend>搜索范围</legend>${searchScopes.map(s=>`<label><input type="radio" name="type" value="${s}" ${s===currentScope?'checked':''}><span>${s}</span></label>`).join('')}</fieldset></form></section><section class="result-section"><div class="section-head"><h2>搜索结果</h2><span id="result-count" role="status"></span></div><div class="filters" aria-label="科目筛选">${['全部',...subjectOrder].map(s=>`<button class="filter ${s===currentSubject?'active':''}" data-subject="${s}" aria-pressed="${s===currentSubject}">${s}</button>`).join('')}</div><div id="query-chips" class="query-chips" aria-label="从查询中识别的条件"></div><div id="result-body"></div></section>${docGrid()}</main>${footer()}`
  renderResults()
}
function renderCatalog(){app.innerHTML=`${header('catalog',liveQuery)}<main class="catalog-page"><p class="eyebrow">资料目录</p><h1>按科目和阶段浏览</h1>${docGrid()}</main>${footer()}`}
function renderFavorites(){
  const list=favoriteList().filter(x=>reviewFilter==='all'||(reviewFilter==='today'?x.nextReviewAt<=Date.now():x.status===reviewFilter))
  const names={due:'待复习',familiar:'熟悉',mastered:'已掌握'}
  app.innerHTML=`${header('favorites',liveQuery)}<main class="favorites-page"><div class="section-head"><h1>复习清单</h1><span>${favoriteList().length} 条记录</span></div><div class="review-controls"><select id="review-filter" aria-label="筛选复习状态">${[['all','全部'],['today','今日到期'],['due','待复习'],['familiar','熟悉'],['mastered','已掌握']].map(([v,n])=>`<option value="${v}" ${reviewFilter===v?'selected':''}>${n}</option>`).join('')}</select><button class="action" data-export>导出备份</button><button class="action" data-import>导入备份</button><input type="file" id="review-file" accept="application/json,.json" hidden></div><p class="review-note">复习后按状态安排下次时间：待复习 1 天、熟悉 3 天、已掌握 14 天。记录保存在本机浏览器，导出可备份和迁移。</p>${list.length?'<div class="results">'+list.map(x=>`<article class="favorite-card"><div class="result-path">${escapeHtml(docMap.get(x.doc)?.subject||x.doc)} · ${names[x.status]||'待复习'} · 复习 ${x.reviewCount||0} 次</div><h2>${escapeHtml(x.title)}</h2><p>${escapeHtml(x.text)}</p>${x.needsRelocation?'<p class="warning">旧收藏无法可靠确认位置，请重新搜索定位；原记录已保留。</p>':''}<p class="review-date">下次复习：${new Date(x.nextReviewAt).toLocaleDateString('zh-CN')}${x.reason?' · 错因：'+escapeHtml(x.reason):''}</p><div class="favorite-actions"><a href="${x.needsRelocation?searchUrl(x.title):docUrl(x.doc,x.anchor)}">${x.needsRelocation?'重新定位':'查看原文'} ↗</a>${Object.entries(names).map(([v,n])=>`<button data-review-id="${escapeHtml(x.id)}" data-status="${v}">${n}</button>`).join('')}<button data-remove-favorite="${escapeHtml(x.id)}">删除</button></div>${x.history?.length?`<details><summary>复习历史</summary>${x.history.slice(-8).reverse().map(h=>`<p>${new Date(h.at).toLocaleDateString('zh-CN')} · ${names[h.status]} ${escapeHtml(h.reason)}</p>`).join('')}</details>`:''}</article>`).join('')+'</div>':'<div class="empty"><h2>这里暂时没有记录</h2><p>在知识点或题目旁收藏，或将做错的题加入复习。</p></div>'}</main>${footer()}`
}
function tocHtml(doc){
  let out='',open=false
  for(const s of doc.sections.filter(s=>s.level>1)){
    if(s.level===2){if(open)out+='</details>';out+=`<details class="toc-chapter" open><summary>${escapeHtml(s.title)}</summary>`;open=true}
    out+=`<a class="level-${s.level}" data-toc-anchor="${s.anchor}" href="${docUrl(doc.id,s.anchor,liveQuery)}">${escapeHtml(s.title)}</a>`
  }
  return out+(open?'</details>':'')
}
function markCurrent(anchor){
  activeSection=anchor
  for(const link of app.querySelectorAll('[data-toc-anchor]')){const active=link.dataset.tocAnchor===anchor;if(active){link.setAttribute('aria-current','location');link.closest('details')?.setAttribute('open','')}else link.removeAttribute('aria-current')}
  const doc=docMap.get(currentDoc),s=doc?.sections.find(s=>s.anchor===anchor),label=app.querySelector('#reading-location');if(label)label.textContent=s?.title||doc?.subject||''
  const sections=doc?.sections.filter(s=>s.level>1)||[],index=sections.findIndex(s=>s.anchor===anchor)
  for(const [id,delta] of [['previous-section',-1],['next-section',1]]){const a=app.querySelector('#'+id),dest=sections[index+delta];if(a){a.hidden=!dest;if(dest)a.href=docUrl(currentDoc,dest.anchor,liveQuery)}}
  for(const chapter of app.querySelectorAll('.toc-chapter'))chapter.open=Boolean(chapter.querySelector('[aria-current="location"]'))
  if(currentDoc && s){readingPositions[currentDoc]={anchor,at:Date.now()};try{safeStorage.setItem('408-reading',JSON.stringify(readingPositions))}catch{}}
}
function locate(anchor,query=''){
  const target=anchorMap[currentDoc]?.[anchor]?.target || document.getElementById(anchor)?.dataset.target || anchor
  if(!target)return
  if(!document.getElementById(target)){notify('这条定位已失效，请用顶部搜索重新定位；收藏记录仍保留。');return}
  articleModule.revealSearchTarget(target,query,queryTerms(query))
  const doc=docMap.get(currentDoc);let sec=doc.sections.find(s=>s.anchor===target)
  if(!sec){const el=document.getElementById(target);const headings=[...app.querySelectorAll('[data-section]')];sec=doc.sections.find(s=>s.anchor===headings.filter(h=>el&&(h.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING)).at(-1)?.dataset.section)}
  if(sec)markCurrent(sec.anchor)
}
function openDialog(id,trigger){const dialog=document.getElementById(id);if(!dialog)return;dialog.returnFocus=trigger;dialog.showModal();dialog.querySelector('button,a,input')?.focus()}
function closeDialog(dialog){dialog.close();dialog.returnFocus?.focus()}
async function renderDoc(id,anchor='',query='',force=false){
  const doc=docMap.get(id);if(!doc){location.hash='#/';return}
  if(currentDoc===id && readerReady&&!force){syncInputs();locate(anchor,query);return}
  const nav=navigation.next();tocObserver?.disconnect();currentDoc=id;readerReady=false
  const resume=readingPositions[id]
  app.innerHTML=`${header('doc',liveQuery)}<main class="reader"><aside class="reader-side"><a class="back-link" href="#/catalog">← 资料目录</a><div class="side-group">${groups.map(g=>`<h3>${g}</h3>${docs.filter(d=>d.group===g).map(d=>`<a class="${d.id===id?'current':''}" href="${docUrl(d.id)}">${d.subject}</a>`).join('')}`).join('')}</div></aside><article class="reader-article"><div class="reader-toolbar"><a href="${searchUrl(liveQuery)}">← 返回搜索</a><a href="${sourceUrl(doc)}" target="_blank" rel="noopener noreferrer">原始资料 ↗</a></div><header class="reader-title"><span>${doc.group} · ${doc.subject}</span><h1>${doc.title}</h1><p>规则与练习按知识节组织，星标可加入复习清单。</p>${resume?`<a class="resume-link" href="${docUrl(id,resume.anchor)}">继续上次阅读 ↗</a>`:''}</header><div class="markdown" id="article-body"><p role="status">正在加载正文…</p></div></article><aside class="reader-toc"><h3>本文目录</h3><div>${tocHtml(doc)}</div></aside></main><div class="reading-bar"><button class="action mobile-toc" data-open-toc>本文目录</button><span id="reading-location">${doc.subject}</span><a id="previous-section" hidden>上一节</a><a id="next-section" hidden>下一节</a><button class="action" id="toggle-practice" aria-pressed="${practiceMode}">${practiceMode?'练习模式':'阅读模式'}</button></div><dialog id="toc-dialog" aria-labelledby="toc-title"><div class="dialog-head"><h2 id="toc-title">本文目录</h2><button class="action" data-close-dialog>关闭</button></div><div>${tocHtml(doc)}</div></dialog><dialog id="image-dialog" aria-labelledby="image-title"><div class="dialog-head"><h2 id="image-title">查看原图</h2><button class="action" data-close-dialog>关闭</button></div><p id="image-caption"></p><div class="image-pan"><img alt=""></div></dialog>${footer()}`
  for(const dialog of app.querySelectorAll('dialog'))dialog.addEventListener('cancel',()=>{queueMicrotask(()=>dialog.returnFocus?.focus())})
  try {
    const [md,units,article]=await Promise.all([resources.load(url('docs/'+encodeURIComponent(id)+'.md'),{format:'text',signal:nav.signal,force}),resources.load(url('units/'+encodeURIComponent(id)+'.json'),{signal:nav.signal,force}),import('./article.js')])
    if(!nav.current())return
    articleModule=article;documentUnits=units;const container=app.querySelector('#article-body');article.renderMarkdown(md,BASE,container)
    for(const section of doc.sections){
      const a=document.getElementById(section.anchor),p=a?.parentElement,marker=p?.tagName==='P'?p:a,heading=marker?.nextElementSibling
      if(!heading||!/^H[1-4]$/.test(heading.tagName))continue
      heading.dataset.section=section.anchor;heading.id=section.anchor+'-heading'
      if(section.level>1){heading.insertAdjacentHTML('beforeend',favoriteButton(id,section.anchor,section.title,'','heading-favorite'));const related=document.createElement('a');related.className='related-practice';related.href=searchUrl('','全部',doc.subject,section.topicId);related.dataset.relatedTopic=section.topicId;related.textContent='相关练习 ↗';heading.append(related)}
    }
    initPractice(container,units)
    initImages(container)
    readerReady=true
    tocObserver=new IntersectionObserver(entries=>{const hits=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(hits.length)markCurrent(hits[0].target.dataset.section)},{rootMargin:'-120px 0px -60% 0px'})
    container.querySelectorAll('[data-section]').forEach(h=>tocObserver.observe(h))
    markCurrent(doc.sections.find(s=>s.level>1)?.anchor||'')
    if(anchor)requestAnimationFrame(()=>{if(nav.current())locate(anchor,query)})
    else window.scrollTo(0,0)
  }catch(err){if(!nav.current()||err.name==='AbortError')return;app.querySelector('#article-body').innerHTML=`<div class="empty"><h2>正文加载失败</h2><p>${escapeHtml(err.message)}</p><button class="action" data-retry-doc>重新加载</button></div>`}
}
function initImages(container){
  for(const img of container.querySelectorAll('img')){
    if(img.closest('a'))continue
    const button=document.createElement('button');button.type='button';button.className='image-zoom';button.setAttribute('aria-label',img.alt||'放大配图');img.replaceWith(button);button.append(img)
    button.addEventListener('click',()=>{const dialog=document.getElementById('image-dialog'),preview=dialog.querySelector('img');preview.src=img.src;preview.alt=img.alt;dialog.querySelector('#image-caption').textContent=img.alt;openDialog('image-dialog',button)})
  }
}
function initPractice(container,units){
  for(const unit of units){
    const el=document.getElementById(unit.questionId);if(!el)continue
    const solution=el.querySelector('.question-solution');solution.hidden=practiceMode
    const meta=document.createElement('div');meta.className='question-meta';meta.innerHTML=`<span>${unit.year?unit.year+' 年 · ':''}${unit.answerStatus==='missing'?'暂无资料答案':unit.answerStatus==='ambiguous'?'选项重复 · 暂不判分':unit.answerStatus==='verified'?escapeHtml(unit.reviewMethod)+' · '+unit.reviewedAt:'资料答案 · 待复核'}</span><a href="${escapeHtml(unit.source)}" target="_blank" rel="noopener noreferrer">题目来源 ↗</a>${unit.originalSource?`<a href="${escapeHtml(unit.originalSource)}" target="_blank" rel="noopener noreferrer">原题入口 ↗</a>`:''}`;el.prepend(meta)
    const nodes=[...el.querySelectorAll('.question-stem .exam-option,.question-stem .code-option')]
    if(nodes.length===unit.options.length && nodes.length){
      nodes.forEach((node,index)=>{const option=unit.options.find(o=>o.letter===node.querySelector('.exam-option-letter,.code-option-label').textContent)||unit.options[index];node.dataset.optionId=option.optionId;const input=document.createElement('input');input.type='radio';input.name=unit.questionId;input.value=node.dataset.optionId;input.setAttribute('aria-label',`${option.letter}：${option.text}`);input.className='practice-radio';input.hidden=!practiceMode;node.prepend(input);node.addEventListener('click',e=>{if(practiceMode&&!e.target.closest('a,button'))input.checked=true})})
      el.structured=true
    }
    const controls=document.createElement('div');controls.className='practice-controls';controls.innerHTML=`<button class="action" data-submit-question="${unit.questionId}">${unit.options.length?'提交并查看解析':'作答后查看解析'}</button>${el.structured?`<button class="action" data-shuffle-question="${unit.questionId}">打乱选项</button>`:''}<span class="attempt-result" role="status"></span><label class="wrong-reason">错因 <input maxlength="500" placeholder="例如：漏看适用条件"></label><button class="action" data-review-question="${unit.questionId}">加入复习</button>`;el.append(controls)
    controls.querySelector('[data-submit-question]').hidden=!practiceMode;controls.querySelector('[data-shuffle-question]')?.toggleAttribute('hidden',!practiceMode)
    if(unit.answerStatus==='missing')solution.innerHTML='<p>本题资料未提供答案，可记录自己的作答与错因；暂不自动判分。</p>'
    syncAnswerLetter(el,unit)
    el.insertAdjacentHTML('beforeend',favoriteButton(currentDoc,unit.questionId,unit.title,unit.stem,'question-favorite action'))
  }
}
function syncAnswerLetter(el,unit){
  if(!unit.correctOptionId || !el.structured)return
  const nodes=[...el.querySelectorAll('[data-option-id]')],correct=nodes.find(n=>n.dataset.optionId===unit.correctOptionId)
  if(!correct)return
  const letter=correct.querySelector('.exam-option-letter,.code-option-label').textContent
  const solution=el.querySelector('.question-solution'),badge=solution.querySelector('.exam-answer strong')
  if(badge)badge.textContent=letter
  for(const p of solution.querySelectorAll('p')){
    const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let node
    while((node=walker.nextNode())){if(!node.textContent.trim())continue;if(/^\s*答案\s*[:：]\s*[A-H](?=[。.,，\s]|$)/.test(node.textContent))node.textContent=node.textContent.replace(/^(\s*答案\s*[:：]\s*)[A-H]/,'$1'+letter);break}
  }
  if(el.dataset.shuffled){let note=solution.querySelector('.choice-order-note');if(!note){note=document.createElement('p');note.className='choice-order-note';solution.prepend(note)}note.textContent='选项顺序已打乱，当前正确选项为 '+letter+'。解析内的字母沿用原资料顺序，请按选项内容核对。'}
}
function changePractice(){practiceMode=!practiceMode;try{safeStorage.setItem('408-practice',String(practiceMode))}catch{notify('模式偏好无法保存，当前页面仍可使用。')}
  const button=app.querySelector('#toggle-practice');button.textContent=practiceMode?'练习模式':'阅读模式';button.setAttribute('aria-pressed',String(practiceMode))
  for(const el of app.querySelectorAll('.study-question')){el.querySelector('.question-solution').hidden=practiceMode&&!el.dataset.submitted;el.querySelector('[data-submit-question]').hidden=!practiceMode;el.querySelector('[data-shuffle-question]')?.toggleAttribute('hidden',!practiceMode);el.querySelectorAll('.practice-radio').forEach(r=>r.hidden=!practiceMode)}
}
function shuffleQuestion(id){const el=document.getElementById(id);if(el.dataset.submitted){notify('此题已提交，请切换页面后再重新练习。');return}const nodes=[...el.querySelectorAll('[data-option-id]')];for(let i=nodes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nodes[i],nodes[j]]=[nodes[j],nodes[i]]}nodes[0]?.parentElement.append(...nodes);nodes.forEach((n,i)=>{n.querySelector('.exam-option-letter,.code-option-label').textContent=String.fromCharCode(65+i);n.querySelector('input').checked=false;n.querySelector('input').setAttribute('aria-label',String.fromCharCode(65+i)+': '+n.textContent.slice(1))});el.dataset.shuffled='true';syncAnswerLetter(el,documentUnits.find(u=>u.questionId===id))}
function submitQuestion(id){const unit=documentUnits.find(x=>x.questionId===id),el=document.getElementById(id),selected=el.querySelector('input:checked');if(el.structured&&!selected){notify('请先选择一个选项。');return}el.dataset.submitted='true';const solution=el.querySelector('.question-solution');solution.hidden=false
  let result='请对照解析自行核对。'
  if(unit.correctOptionId && el.structured){const correct=[...el.querySelectorAll('[data-option-id]')].find(x=>x.dataset.optionId===unit.correctOptionId);result=`${selected.value===unit.correctOptionId?'与资料答案一致':'与资料答案不一致'} · 当前正确选项 ${correct.querySelector('.exam-option-letter,.code-option-label').textContent}${unit.answerStatus==='verified'?'（已核对）':'（待复核）'}`;correct.classList.add('correct-option')
    // Regenerate letters from stable option IDs; never repeat the source's now-stale letter.
    const originalAnswer=solution.querySelector('.exam-answer strong');if(originalAnswer)originalAnswer.textContent=correct.querySelector('.exam-option-letter,.code-option-label').textContent
    solution.querySelectorAll('p').forEach(p=>{if(/^答案\s*[:：]\s*[A-H][。.]?$/.test(p.textContent.trim()))p.textContent='答案：'+correct.querySelector('.exam-option-letter,.code-option-label').textContent+'（当前选项顺序）'})
  }else if(unit.answerStatus==='missing')result='暂无资料答案，请自行核对。'
  el.querySelector('.attempt-result').textContent=result
}
function recordQuestion(id){const unit=documentUnits.find(x=>x.questionId===id),el=document.getElementById(id),key=favoriteId(currentDoc,id),reason=el.querySelector('.wrong-reason input').value.trim(),list=favoriteList().slice(),i=list.findIndex(x=>x.id===key)
  const prior=i>=0?list[i]:{id:key,doc:currentDoc,anchor:id,title:unit.title,text:unit.stem.slice(0,240),addedAt:Date.now(),history:[]}
  const next=scheduleReview(prior,'due',reason);if(i>=0)list[i]=next;else list.unshift(next);storeFavorites(list);notify('已加入复习，1 天后再次复习。')
}
function route(){
  const hash=location.hash.slice(1)||'/',[path,query='']=hash.split('?'),p=new URLSearchParams(query)
  if((currentRoute==='/'||currentRoute==='/search')&&path.startsWith('/doc/')){searchScroll=window.scrollY;searchKey=searchUrl(liveQuery)}
  currentRoute=path;resultRequest++;relatedTopic=p.get('topic')||''
  if(path.startsWith('/doc/')){
    liveQuery=p.get('q')||liveQuery;currentScope=searchScopes.includes(p.get('type'))?p.get('type'):currentScope;currentSubject=['全部',...subjectOrder].includes(p.get('subject'))?p.get('subject'):currentSubject
    renderDoc(decodeURIComponent(path.slice(5)),p.get('section')||'',p.get('q')||'');return
  }
  navigation.next();currentDoc=null;readerReady=false;tocObserver?.disconnect()
  if(path==='/favorites')renderFavorites();else if(path==='/catalog')renderCatalog();else{currentScope=searchScopes.includes(p.get('type'))?p.get('type'):'全部';currentSubject=['全部',...subjectOrder].includes(p.get('subject'))?p.get('subject'):'全部';renderSearch(p.get('q')||'')}
  window.scrollTo(0,0)
}
app.addEventListener('submit',e=>{if(!['hero-search','header-search'].includes(e.target.id))return;e.preventDefault();const form=new FormData(e.target);liveQuery=String(form.get('q')||'').trim();currentScope=searchScopes.includes(form.get('type'))?form.get('type'):'全部';syncInputs();const hash=searchUrl(liveQuery);if(location.hash===hash){showCount=10;renderResults()}else location.hash=hash})
app.addEventListener('input',e=>{if(!['main-search','header-query'].includes(e.target.id))return;liveQuery=e.target.value;relatedTopic='';syncInputs();showCount=10;const back=app.querySelector('.reader-toolbar a');if(back)back.href=searchUrl(liveQuery);clearTimeout(searchTimer);if(currentRoute==='/'||currentRoute==='/search')searchTimer=setTimeout(()=>{syncSearchUrl();renderResults()},120)})
app.addEventListener('change',async e=>{
  if(e.target.name==='type'){currentScope=e.target.value;syncInputs();showCount=10;syncSearchUrl();renderResults()}
  if(e.target.id==='review-filter'){reviewFilter=e.target.value;renderFavorites()}
  if(e.target.id==='review-file'){
    const file=e.target.files[0];if(!file)return
    try{if(file.size>2*1024*1024)throw new Error('备份文件超过 2 MB');const imported=validateImport(JSON.parse(await file.text()),new Set(docMap.keys()));const targets=await resources.load(url('targets.json'));for(const x of imported){if(!targets[x.doc]?.includes(x.anchor))x.needsRelocation=true}const combined=new Map(favoriteList().map(x=>[x.id,x]));for(const x of imported)combined.set(x.id,x);storeFavorites([...combined.values()]);renderFavorites();notify(`已导入 ${imported.length} 条记录。`)}catch(err){notify('导入失败：'+err.message)}
  }
})
app.addEventListener('click',e=>{
  const closest=s=>e.target.closest(s);const filter=closest('[data-subject]')
  if(filter){currentSubject=filter.dataset.subject;app.querySelectorAll('[data-subject]').forEach(b=>{b.classList.toggle('active',b===filter);b.setAttribute('aria-pressed',String(b===filter))});showCount=10;syncSearchUrl();renderResults();return}
  const chip=closest('[data-remove-chip]');if(chip){const c=parseQuery(liveQuery).chips[Number(chip.dataset.removeChip)];if(c)liveQuery=liveQuery.replace(c.raw,'').trim();else relatedTopic='';syncInputs();syncSearchUrl();renderResults();return}
  if(closest('#show-more')){showCount+=10;renderResults();return}
  if(closest('[data-retry-search]')){renderResults();return}
  if(closest('[data-retry-doc]')){renderDoc(currentDoc,'',liveQuery,true);return}
  if(closest('[data-retry-boot]')){boot();return}
  const favorite=closest('[data-favorite-id]');if(favorite){toggleFavorite(favorite.dataset.doc,favorite.dataset.anchor,favorite.dataset.title,favorite.dataset.text);return}
  const remove=closest('[data-remove-favorite]');if(remove){storeFavorites(favoriteList().filter(x=>x.id!==remove.dataset.removeFavorite));renderFavorites();return}
  const status=closest('[data-review-id]');if(status){storeFavorites(favoriteList().map(x=>x.id===status.dataset.reviewId?scheduleReview(x,status.dataset.status,x.reason):x));renderFavorites();return}
  if(closest('[data-export]')){const blob=new Blob([JSON.stringify({schema:2,exportedAt:new Date().toISOString(),items:favoriteList()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='408-复习备份-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);return}
  if(closest('[data-import]')){app.querySelector('#review-file').click();return}
  if(closest('[data-open-toc]')){openDialog('toc-dialog',closest('[data-open-toc]'));return}
  if(closest('[data-close-dialog]')){closeDialog(closest('dialog'));return}
  const tocLink=closest('[data-toc-anchor]');if(tocLink){if(closest('dialog'))closeDialog(closest('dialog'));if(location.hash===tocLink.getAttribute('href')){e.preventDefault();locate(tocLink.dataset.tocAnchor,liveQuery)}}
  if(closest('#toggle-practice')){changePractice();return}
  const submit=closest('[data-submit-question]');if(submit){submitQuestion(submit.dataset.submitQuestion);return}
  const shuffle=closest('[data-shuffle-question]');if(shuffle){shuffleQuestion(shuffle.dataset.shuffleQuestion);return}
  const question=closest('[data-review-question]');if(question){recordQuestion(question.dataset.reviewQuestion);return}
})
async function boot(){
  app.innerHTML='<main class="empty"><h1>408 知识库</h1><p role="status">正在加载资料目录…</p></main>'
  try{const catalog=await resources.load(url('catalog.json'));docs=catalog.docs;docMap=new Map(docs.map(d=>[d.id,d]));const legacy=safeStorage.getItem('kaoyan-408-favorites-v1');if(!safeStorage.getItem('kaoyan-408-review-v2')&&legacy&&legacy!=='[]')anchorMap=await resources.load(url('anchor-map.json'));review.init(anchorMap);route()}catch(err){app.innerHTML=`<main class="empty"><h1>资料目录未能加载</h1><p>${escapeHtml(err.message)}</p><button class="action" data-retry-boot>重新加载</button></main>`}
}
window.addEventListener('hashchange',()=>{if(docs.length)route()})
boot()
