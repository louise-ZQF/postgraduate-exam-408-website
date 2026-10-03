import './style.css'

const BASE = import.meta.env.BASE_URL
const CONTENT_VERSION = encodeURIComponent(__CONTENT_VERSION__)
const app = document.querySelector('#app')
const catalog = await fetch(`${BASE}catalog.json?v=${CONTENT_VERSION}`).then(r => { if (!r.ok) throw new Error('资料目录加载失败'); return r.json() })
const docs = catalog.docs
let records = null
let loadedScope = null
const searchPromises = new Map()
const docMap = new Map(docs.map(d => [d.id, d]))
const subjectOrder = ['数据结构', '计算机组成原理', '操作系统', '计算机网络']
const groups = ['知识体系', '小题', '大题', '错题补充']
const searchScopes = ['全部', '知识点', '小题', '大题']
const FAVORITE_KEY = 'kaoyan-408-favorites-v1'
let currentScope = '全部'
let currentSubject = '全部'
let liveQuery = ''
let showCount = 10
let currentDoc = null
let currentRoute = ''
let searchTimer = null

const indexFiles = { '知识点': 'search-knowledge.json', '小题': 'search-small.json', '大题': 'search-big.json' }
function loadSearchPart(type) {
  if (!searchPromises.has(type)) {
    const promise = fetch(`${BASE}${indexFiles[type]}?v=${CONTENT_VERSION}`)
      .then(r => { if (!r.ok) throw new Error('搜索索引加载失败'); return r.json() })
      .then(data => data.map(([docIndex, sectionNo, anchorNo, text]) => {
        const doc = docs[docIndex]
        const section = doc.sections[sectionNo - 1]?.title || doc.subject
        return {
          doc: doc.id, group: doc.group, type: doc.type, subject: doc.subject,
          section, title: section, anchor: anchorNo < 0 ? `s-${-anchorNo}` : `p-${anchorNo}`,
          kind: anchorNo < 0 ? 'heading' : 'content', text, searchText: normalize(text),
        }
      }))
      .catch(err => { searchPromises.delete(type); throw err })
    searchPromises.set(type, promise)
  }
  return searchPromises.get(type)
}
function loadSearchIndex(scope) {
  const types = scope === '全部' ? ['知识点', '小题', '大题'] : [scope]
  return Promise.all(types.map(loadSearchPart)).then(parts => parts.flat())
}

function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]) }
function favoriteList() { try { return JSON.parse(localStorage.getItem(FAVORITE_KEY) || '[]').filter(x => docMap.has(x.doc)) } catch { return [] } }
function favoriteId(doc, anchor) { return `${doc}#${anchor}` }
function favoriteSet() { return new Set(favoriteList().map(x => x.id)) }
function storeFavorites(list) { localStorage.setItem(FAVORITE_KEY, JSON.stringify(list)); document.querySelectorAll('[data-favorite-count]').forEach(e => e.textContent = list.length ? String(list.length) : '') }
function toggleFavorite(doc, anchor, title, text = '') {
  const id = favoriteId(doc, anchor); const list = favoriteList(); const i = list.findIndex(x => x.id === id)
  if (i >= 0) list.splice(i, 1); else list.unshift({ id, doc, anchor, title, text: text.slice(0, 240), addedAt: Date.now() })
  storeFavorites(list)
  document.querySelectorAll('[data-favorite-id]').forEach(btn => { if (btn.dataset.favoriteId === id) { const active = i < 0; btn.textContent = active ? '★ 已收藏' : '☆ 收藏'; btn.setAttribute('aria-pressed', String(active)); btn.setAttribute('aria-label', `${active ? '取消收藏' : '收藏'}：${title}`) } })
}
function docUrl(id, anchor = '', q = '') {
  const params = new URLSearchParams()
  if (anchor) params.set('section', anchor)
  if (q) { params.set('q', q); params.set('type', currentScope); params.set('subject', currentSubject) }
  return `#/doc/${encodeURIComponent(id)}${params.size ? `?${params}` : ''}`
}
function searchUrl(q = '', scope = currentScope, subject = currentSubject) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (scope !== '全部') params.set('type', scope)
  if (subject !== '全部') params.set('subject', subject)
  return `#/search${params.size ? `?${params}` : ''}`
}
function syncSearchUrl() {
  if (currentRoute==='/' || currentRoute==='/search') history.replaceState(null,'',searchUrl(liveQuery))
}
function sourceUrl(doc) { return doc.source.replace(/([^/]+)\.md$/, (_, filename) => `${encodeURIComponent(filename)}.md`) }
function header(active, q = '') {
  const n = favoriteList().length
  return `<header class="site-header"><div class="header-inner"><a class="brand" href="#/" aria-label="408 知识库首页"><span class="brand-rule" aria-hidden="true"></span><span><b>408 知识库</b><small>知识 · 小题 · 大题</small></span></a><form class="header-search" role="search" id="header-search"><label class="visually-hidden" for="header-query">搜索 408 内容</label><select name="type" aria-label="搜索范围">${searchScopes.map(scope=>`<option value="${scope}" ${currentScope===scope?'selected':''}>${scope}</option>`).join('')}</select><input id="header-query" name="q" value="${escapeHtml(q)}" aria-label="搜索 408 正文内容" placeholder="搜索知识点、小题或大题" maxlength="60" autocomplete="off"><button type="submit">搜索</button></form><nav aria-label="主导航"><a href="#/" class="${active==='search'?'active':''}">搜索</a><a href="#/catalog" class="${active==='catalog'?'active':''}">资料目录</a><a href="#/favorites" class="${active==='favorites'?'active':''}">待背收藏 <span class="favorite-count" data-favorite-count>${n || ''}</span></a></nav></div></header>`
}
function footer() { return `<footer class="site-footer">资料基于 <a href="https://github.com/yyx-dev/yyx-dev.github.io/tree/325bdaa/docs/408" target="_blank" rel="noopener noreferrer">yyx-dev</a> 与自有错题笔记整理，参考 <a href="https://github.com/liangbohan/postgraduate-exam-website" target="_blank" rel="noopener noreferrer">408 简纲 · liangbohan 及贡献者</a>（<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>），已精简、改写与纠错。<a href="https://github.com/louise-ZQF/postgraduate-exam-408-website/blob/main/CONTENT_REVIEW.md" target="_blank" rel="noopener noreferrer">审查记录 ↗</a></footer>` }
function docGrid() {
  return `<section class="browse" aria-labelledby="browse-title"><div class="section-head"><h2 id="browse-title">按资料浏览</h2><span>${docs.length} 篇 · 四科知识、题型与错题补充</span></div><div class="browse-grid">${groups.map(group => `<div class="browse-column"><h3>${group}</h3>${docs.filter(d=>d.group===group).map(d => `<a href="${docUrl(d.id)}"><span>${escapeHtml(d.subject)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>`).join('')}</div></section>`
}
function normalize(value) { return String(value).toLocaleLowerCase().replace(/\s+/g,'') }
const aliases = { '计组':'计算机组成原理', '计网':'计算机网络', 'os':'操作系统', 'ds':'数据结构', '数据链路':'数据链路层', 'cpu':'cpu', 'tcp':'tcp', 'kmp':'kmp' }
function terms(q) { return q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).map(t => aliases[t] || t) }
function search(q, scope, subject) {
  const ts=terms(q).map(normalize)
  if (!ts.length) return []
  const found=[]
  for (const r of records) {
    if (scope !== '全部' && r.type !== scope) continue
    if (subject !== '全部' && r.subject !== subject) continue
    const text=r.searchText
    if (!ts.every(t => text.includes(t))) continue
    let score=0
    for (const t of ts) {
      if (r.kind==='heading') score+=6
      score+=4
      let at=0
      for (let n=0;n<3;n++) { at=text.indexOf(t,at); if(at<0) break; score++; at+=t.length }
    }
    found.push({ ...r, score })
  }
  return found.sort((a,b)=>b.score-a.score || (a.kind===b.kind?0:a.kind==='content'?-1:1))
}
function snippet(text, q) {
  const t=terms(q)[0] || q; let i=text.toLocaleLowerCase().indexOf(t.toLocaleLowerCase()); if (i<0) i=0
  const start=Math.max(0,i-75), end=Math.min(text.length,i+175)
  return `${start?'…':''}${text.slice(start,end)}${end<text.length?'…':''}`
}
function highlight(value,q) {
  const needles=[...terms(q)].filter(Boolean).sort((a,b)=>b.length-a.length)
  if (!needles.length) return escapeHtml(value)
  const pattern=new RegExp(needles.map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gi')
  let out='',last=0,match
  while ((match=pattern.exec(value))) {
    out+=escapeHtml(value.slice(last,match.index))+`<mark>${escapeHtml(match[0])}</mark>`
    last=pattern.lastIndex
  }
  return out+escapeHtml(value.slice(last))
}
function resultHtml(r,q,fav) {
  const id=favoriteId(r.doc,r.anchor)
  const doc=docMap.get(r.doc)
  return `<article class="result-card"><a class="result-link" href="${docUrl(r.doc,r.anchor,q)}"><div class="result-path">${escapeHtml(r.group)} <span>/</span> ${escapeHtml(r.subject)} <span>/</span> ${escapeHtml(r.section)}</div><h3>${highlight(r.title,q)}</h3><p>${highlight(snippet(r.text,q),q)}</p><span class="open-link">定位到此处 <span aria-hidden="true">↗</span></span></a><button type="button" class="favorite-button" data-favorite-id="${escapeHtml(id)}" data-doc="${escapeHtml(r.doc)}" data-anchor="${escapeHtml(r.anchor)}" data-title="${escapeHtml(r.title)}" data-text="${escapeHtml(r.text.slice(0,240))}" aria-pressed="${fav.has(id)}">${fav.has(id)?'★ 已收藏':'☆ 收藏'}</button></article>`
}
function renderResults() {
  const box=document.querySelector('#result-body'); if (!box) return
  if (loadedScope !== currentScope) {
    const scope = currentScope
    loadedScope = scope
    records = null
    loadSearchIndex(scope).then(data => {
      if (currentScope === scope) { records = data; renderResults() }
    }).catch(err => {
      if (currentScope !== scope) return
      box.innerHTML=`<div class="empty"><h3>搜索暂时不可用</h3><p>${escapeHtml(err.message)}</p></div>`
    })
  }
  const q=liveQuery.trim()
  const count=document.querySelector('#result-count')
  if (!records) {
    count.textContent='正在准备搜索…'
    box.innerHTML='<div class="empty quiet"><h3>正在准备搜索</h3><p>马上就可以搜索到文章中的具体段落和题目。</p></div>'
    return
  }
  const results=search(q,currentScope,currentSubject)
  count.textContent=q ? `${results.length} 条相关内容${results.length>showCount?` · 当前显示 ${Math.min(results.length,showCount)} 条`:''}` : '输入关键词后，从这里直达原文'
  if (!q) { box.innerHTML='<div class="empty quiet"><h3>从一个线索开始</h3><p>例如“时间复杂度”“Cache 命中率”“进程同步”或“TCP 拥塞控制”。</p></div>';return }
  if (!results.length) {box.innerHTML='<div class="empty"><h3>暂时没有找到匹配内容</h3><p>试试缩短关键词，或换用另一种术语。</p></div>';return}
  const fav=favoriteSet()
  box.innerHTML=`<div class="results">${results.slice(0,showCount).map(r=>resultHtml(r,q,fav)).join('')}</div>${results.length>showCount?'<button class="show-more" id="show-more" type="button">查看更多结果</button>':''}`
}
function renderSearch(q='') {
  liveQuery=q; showCount=10
  app.innerHTML=`${header('search',q)}<main class="search-page"><section class="intro"><p class="eyebrow">计算机学科专业基础 · 408</p><h1>408 知识库</h1><p>搜索正文中的知识点、题干或解题步骤，点击结果即可定位到具体位置。</p><form class="hero-search" id="hero-search" role="search"><label for="main-search">搜索具体内容</label><div class="search-control"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg><input id="main-search" name="q" value="${escapeHtml(q)}" autocomplete="off" maxlength="60" placeholder="例如：二叉树、流水线、死锁、子网划分"><button type="submit">搜索</button></div><fieldset class="search-scope"><legend>搜索范围</legend>${searchScopes.map(scope=>`<label><input type="radio" name="type" value="${scope}" ${currentScope===scope?'checked':''}><span>${scope}</span></label>`).join('')}</fieldset></form></section><section class="result-section" aria-labelledby="result-title"><div class="section-head"><h2 id="result-title">搜索结果</h2><span id="result-count" role="status"></span></div><div class="filters" role="group" aria-label="按科目筛选"><span>科目</span>${['全部',...subjectOrder].map(subject=>`<button type="button" class="filter ${currentSubject===subject?'active':''}" data-subject="${subject}" aria-pressed="${currentSubject===subject}">${subject}</button>`).join('')}</div><div id="result-body"></div></section>${docGrid()}</main>${footer()}`
  renderResults()
}
function renderCatalog() { app.innerHTML=`${header('catalog')}<main class="catalog-page"><p class="eyebrow">资料目录</p><h1>按科目和阶段浏览</h1>${docGrid()}</main>${footer()}` }
function renderFavorites() {
  const list=favoriteList()
  app.innerHTML=`${header('favorites')}<main class="favorites-page"><div class="section-head favorites-head"><div><p class="eyebrow">复习清单</p><h1>待背收藏</h1></div><span>${list.length} 条收藏</span></div>${list.length?`<div class="results">${list.map(x=>{const d=docMap.get(x.doc);return `<article class="favorite-card"><div class="result-path">${escapeHtml(d?.group||'')} <span>/</span> ${escapeHtml(d?.subject||'')}</div><h2>${escapeHtml(x.title)}</h2><p>${escapeHtml(x.text)}</p><div class="favorite-actions"><a href="${docUrl(x.doc,x.anchor)}">查看原文 ↗</a><button type="button" data-remove-favorite="${escapeHtml(x.id)}">已背会，移出待背</button></div></article>`}).join('')}</div>`:'<div class="empty"><h2>还没有待背内容</h2><p>搜索知识点，在需要复习的结果旁点击“收藏”。</p><a class="primary-link" href="#/">去搜索</a></div>'}</main>${footer()}`
}
async function renderDoc(id,anchor='',query='') {
  const doc=docMap.get(id)
  if (!doc) { location.hash='#/';return }
  currentDoc=id
  app.innerHTML=`${header('doc')}<main class="reader"><aside class="reader-side" aria-label="资料目录"><a class="back-link" href="#/catalog">← 资料目录</a><div class="side-group">${groups.map(g=>`<h3>${g}</h3>${docs.filter(d=>d.group===g).map(d=>`<a class="${id===d.id?'current':''}" href="${docUrl(d.id)}">${escapeHtml(d.subject)}</a>`).join('')}`).join('')}</div></aside><article class="reader-article"><div class="reader-toolbar"><a href="${searchUrl(liveQuery)}">← 返回搜索</a><a href="${sourceUrl(doc)}" target="_blank" rel="noopener noreferrer">查看原始资料 ↗</a></div><header class="reader-title"><span>${escapeHtml(doc.group)} · ${escapeHtml(doc.subject)}</span><h1>${escapeHtml(doc.title)}</h1><p>点击标题旁的星标，可加入待背收藏。</p></header><div class="markdown" id="article-body"><p>正在加载内容…</p></div></article><aside class="reader-toc" aria-label="本文目录"><h3>本文目录</h3><div>${doc.sections.filter(s=>s.level<=3).map(s=>`<a class="level-${s.level}" href="${docUrl(id,s.anchor)}">${escapeHtml(s.title)}</a>`).join('')}</div></aside></main>${footer()}`
  try {
    const [md, article]=await Promise.all([
      fetch(`${BASE}docs/${encodeURIComponent(id)}.md?v=${CONTENT_VERSION}`).then(r=>{if(!r.ok)throw new Error('正文加载失败');return r.text()}),
      import('./article.js'),
    ])
    if (currentDoc!==id) return
    const container=document.querySelector('#article-body')
    article.renderMarkdown(md,BASE,container)
    const fav=favoriteSet()
    for(const section of doc.sections) {
      const a=container.querySelector(`#${section.anchor}`)
      const marker=a?.parentElement?.tagName==='P' && a.parentElement.textContent.trim()==='' ? a.parentElement : a
      const heading=marker?.nextElementSibling
      if (!heading || !/^H[1-4]$/.test(heading.tagName) || section.level===1) continue
      const bid=favoriteId(id,section.anchor)
      const button=document.createElement('button');button.type='button';button.className='heading-favorite';button.dataset.favoriteId=bid;button.dataset.doc=id;button.dataset.anchor=section.anchor;button.dataset.title=section.title;button.dataset.text='';button.setAttribute('aria-label',`${fav.has(bid)?'取消收藏':'收藏'}：${section.title}`);button.setAttribute('aria-pressed',String(fav.has(bid)));button.textContent=fav.has(bid)?'★ 已收藏':'☆ 收藏';heading.append(button)
    }
    if(anchor) requestAnimationFrame(()=>article.revealSearchTarget(anchor,query,terms(query)))
    else window.scrollTo(0,0)
  } catch(err) { document.querySelector('#article-body').innerHTML=`<div class="empty"><h2>资料加载失败</h2><p>${escapeHtml(err.message)}</p></div>` }
}
function route() {
  const hash=location.hash.slice(1)||'/'
  const [path,query='']=hash.split('?'); const params=new URLSearchParams(query)
  currentRoute=path
  if(path.startsWith('/doc/')) {
    liveQuery=params.get('q')||liveQuery
    currentScope=searchScopes.includes(params.get('type')) ? params.get('type') : currentScope
    currentSubject=['全部',...subjectOrder].includes(params.get('subject')) ? params.get('subject') : currentSubject
    renderDoc(decodeURIComponent(path.slice(5)),params.get('section')||'',params.get('q')||'')
    return
  }
  currentDoc=null
  if(path==='/favorites') renderFavorites()
  else if(path==='/catalog') renderCatalog()
  else {
    currentScope=searchScopes.includes(params.get('type')) ? params.get('type') : '全部'
    currentSubject=['全部',...subjectOrder].includes(params.get('subject')) ? params.get('subject') : '全部'
    renderSearch(params.get('q')||'')
  }
  window.scrollTo(0,0)
}
app.addEventListener('submit', e=>{if(e.target.id==='hero-search'||e.target.id==='header-search'){e.preventDefault();const form=new FormData(e.target);const q=form.get('q')?.toString().trim()||'';currentScope=searchScopes.includes(form.get('type'))?form.get('type'):'全部';const next=searchUrl(q);if(location.hash===next){liveQuery=q;showCount=10;renderResults()}else location.hash=next}})
app.addEventListener('input',e=>{if(e.target.id==='main-search'){liveQuery=e.target.value;showCount=10;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{syncSearchUrl();renderResults()},120)}})
app.addEventListener('change',e=>{
  if(e.target.name==='type'&&e.target.closest('#hero-search')){currentScope=e.target.value;showCount=10;syncSearchUrl();renderResults();document.querySelector('#header-search select').value=currentScope}
  if(e.target.name==='type'&&e.target.closest('#header-search')&&document.querySelector('#hero-search')){currentScope=e.target.value;document.querySelector(`#hero-search input[name="type"][value="${currentScope}"]`).checked=true;showCount=10;syncSearchUrl();renderResults()}
})
app.addEventListener('click',e=>{
  const filter=e.target.closest('[data-subject]');if(filter){currentSubject=filter.dataset.subject;document.querySelectorAll('[data-subject]').forEach(b=>{const active=b===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});showCount=10;syncSearchUrl();renderResults();return}
  if(e.target.closest('#show-more')){showCount+=10;renderResults();return}
  const favorite=e.target.closest('[data-favorite-id]');if(favorite){toggleFavorite(favorite.dataset.doc,favorite.dataset.anchor,favorite.dataset.title,favorite.dataset.text);return}
  const remove=e.target.closest('[data-remove-favorite]');if(remove){storeFavorites(favoriteList().filter(x=>x.id!==remove.dataset.removeFavorite));renderFavorites()}
})
window.addEventListener('hashchange',route)
route()
