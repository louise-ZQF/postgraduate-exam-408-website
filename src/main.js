import './style.css'
import 'katex/dist/katex.min.css'
import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import DOMPurify from 'dompurify'

marked.use(markedKatex({ throwOnError: false, output: 'html' }))
marked.setOptions({ gfm: true, breaks: false })

const BASE = import.meta.env.BASE_URL
const app = document.querySelector('#app')
const catalog = await fetch(`${BASE}catalog.json`).then(r => { if (!r.ok) throw new Error('资料目录加载失败'); return r.json() })
const docs = catalog.docs
const records = catalog.records
const docMap = new Map(docs.map(d => [d.id, d]))
const subjectOrder = ['数据结构', '计算机组成原理', '操作系统', '计算机网络']
const groups = ['知识体系', '基础题型', '强化题型']
const FAVORITE_KEY = 'kaoyan-408-favorites-v1'
let currentFilter = '全部'
let liveQuery = ''
let showCount = 10
let currentDoc = null
let currentRoute = ''

function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]) }
function favoriteList() { try { return JSON.parse(localStorage.getItem(FAVORITE_KEY) || '[]') } catch { return [] } }
function favoriteId(doc, anchor) { return `${doc}#${anchor}` }
function favoriteSet() { return new Set(favoriteList().map(x => x.id)) }
function storeFavorites(list) { localStorage.setItem(FAVORITE_KEY, JSON.stringify(list)); document.querySelectorAll('[data-favorite-count]').forEach(e => e.textContent = list.length ? String(list.length) : '') }
function toggleFavorite(doc, anchor, title, text = '') {
  const id = favoriteId(doc, anchor); const list = favoriteList(); const i = list.findIndex(x => x.id === id)
  if (i >= 0) list.splice(i, 1); else list.unshift({ id, doc, anchor, title, text: text.slice(0, 240), addedAt: Date.now() })
  storeFavorites(list)
  document.querySelectorAll('[data-favorite-id]').forEach(btn => { if (btn.dataset.favoriteId === id) { const active = i < 0; btn.textContent = active ? '★ 已收藏' : '☆ 收藏'; btn.setAttribute('aria-pressed', String(active)); btn.setAttribute('aria-label', `${active ? '取消收藏' : '收藏'}：${title}`) } })
}
function docUrl(id, anchor = '') { return `#/doc/${encodeURIComponent(id)}${anchor ? `?section=${encodeURIComponent(anchor)}` : ''}` }
function searchUrl(q = '') { return `#/search${q ? `?q=${encodeURIComponent(q)}` : ''}` }
function sourceUrl(doc) { return doc.source.replace(/([^/]+)\.md$/, (_, filename) => `${encodeURIComponent(filename)}.md`) }
function header(active, q = '') {
  const n = favoriteList().length
  return `<header class="site-header"><div class="header-inner"><a class="brand" href="#/" aria-label="408 知识库首页"><span class="brand-rule" aria-hidden="true"></span><span><b>408 知识库</b><small>知识 · 题型 · 真题</small></span></a><form class="header-search" role="search" id="header-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg><input name="q" value="${escapeHtml(q)}" aria-label="搜索 408 知识点与题目" placeholder="搜索知识点或题目关键词" maxlength="60"></form><nav aria-label="主导航"><a href="#/" class="${active==='search'?'active':''}">搜索</a><a href="#/catalog" class="${active==='catalog'?'active':''}">资料目录</a><a href="#/favorites" class="${active==='favorites'?'active':''}">待背收藏 <span class="favorite-count" data-favorite-count>${n || ''}</span></a></nav></div></header>`
}
function footer() { return `<footer class="site-footer">408 资料来自 <a href="https://github.com/yyx-dev/yyx-dev.github.io/tree/325bdaa/docs/408" target="_blank" rel="noopener noreferrer">yyx-dev 的原始仓库 ↗</a>。本站保留原文入口。</footer>` }
function docGrid() {
  return `<section class="browse" aria-labelledby="browse-title"><div class="section-head"><h2 id="browse-title">按资料浏览</h2><span>13 篇 · 四科知识、题型与真题</span></div><div class="browse-grid">${groups.map(group => `<div class="browse-column"><h3>${group}</h3>${subjectOrder.map(subject => { const doc=docs.find(x=>x.group===group && x.subject===subject); return `<a href="${docUrl(doc.id)}"><span>${subject}</span><span aria-hidden="true">↗</span></a>` }).join('')}${group==='强化题型'?`<a href="${docUrl('13-历年真题')}"><span>历年真题</span><span aria-hidden="true">↗</span></a>`:''}</div>`).join('')}</div></section>`
}
function normalize(value) { return String(value).toLocaleLowerCase().replace(/\s+/g,'') }
const aliases = { '计组':'计算机组成原理', '计网':'计算机网络', 'os':'操作系统', 'ds':'数据结构', '数据链路':'数据链路层', 'cpu':'cpu', 'tcp':'tcp', 'kmp':'kmp' }
function terms(q) { return q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).map(t => aliases[t] || t) }
function search(q, filter) {
  const ts=terms(q)
  if (!ts.length) return []
  const found=[]
  for (const r of records) {
    if (filter !== '全部' && r.group !== filter && r.subject !== filter) continue
    const title=normalize(r.title), text=normalize(r.text), path=normalize(`${r.group}${r.subject}`)
    if (!ts.every(t => title.includes(normalize(t)) || text.includes(normalize(t)) || path.includes(normalize(t)))) continue
    let score=0
    for (const t0 of ts) { const t=normalize(t0); if (title.includes(t)) score+=12; if (path.includes(t)) score+=5; if (text.includes(t)) score+=2; score+=Math.min(3,text.split(t).length-1) }
    found.push({ ...r, score })
  }
  return found.sort((a,b)=>b.score-a.score)
}
function snippet(text, q) {
  const t=terms(q)[0] || q; let i=text.toLocaleLowerCase().indexOf(t.toLocaleLowerCase()); if (i<0) i=0
  const start=Math.max(0,i-75), end=Math.min(text.length,i+175)
  return `${start?'…':''}${text.slice(start,end)}${end<text.length?'…':''}`
}
function highlight(value,q) {
  let s=escapeHtml(value)
  for (const term of [...terms(q)].sort((a,b)=>b.length-a.length)) { if (!term) continue; const pattern=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); s=s.replace(new RegExp(pattern,'gi'), x=>`<mark>${x}</mark>`) }
  return s
}
function resultHtml(r,q,fav) {
  const id=favoriteId(r.doc,r.anchor)
  const doc=docMap.get(r.doc)
  return `<article class="result-card"><a class="result-link" href="${docUrl(r.doc,r.anchor)}"><div class="result-path">${escapeHtml(r.group)} <span>/</span> ${escapeHtml(r.subject)} <span>/</span> ${escapeHtml(doc.title)}</div><h3>${highlight(r.title,q)}</h3><p>${highlight(snippet(r.text,q),q)}</p><span class="open-link">查看原文 <span aria-hidden="true">↗</span></span></a><button type="button" class="favorite-button" data-favorite-id="${escapeHtml(id)}" data-doc="${escapeHtml(r.doc)}" data-anchor="${escapeHtml(r.anchor)}" data-title="${escapeHtml(r.title)}" data-text="${escapeHtml(r.text.slice(0,240))}" aria-pressed="${fav.has(id)}">${fav.has(id)?'★ 已收藏':'☆ 收藏'}</button></article>`
}
function renderResults() {
  const box=document.querySelector('#result-body'); if (!box) return
  const q=liveQuery.trim(), results=search(q,currentFilter)
  const count=document.querySelector('#result-count')
  count.textContent=q ? `${results.length} 条相关内容${results.length>showCount?` · 当前显示 ${Math.min(results.length,showCount)} 条`:''}` : '输入关键词后，从这里直达原文'
  if (!q) { box.innerHTML='<div class="empty quiet"><h3>从一个线索开始</h3><p>例如“时间复杂度”“Cache 命中率”“进程同步”或“TCP 拥塞控制”。</p></div>';return }
  if (!results.length) {box.innerHTML='<div class="empty"><h3>暂时没有找到匹配内容</h3><p>试试缩短关键词，或换用另一种术语。</p></div>';return}
  const fav=favoriteSet()
  box.innerHTML=`<div class="results">${results.slice(0,showCount).map(r=>resultHtml(r,q,fav)).join('')}</div>${results.length>showCount?'<button class="show-more" id="show-more" type="button">查看更多结果</button>':''}`
}
function renderSearch(q='') {
  liveQuery=q; showCount=10
  app.innerHTML=`${header('search',q)}<main class="search-page"><section class="intro"><p class="eyebrow">计算机学科专业基础 · 408</p><h1>408 知识库</h1><p>输入知识点、题目中的关键词或年份，直接找到对应讲解与原文位置。</p><form class="hero-search" id="hero-search" role="search"><label for="main-search">搜索知识点与题型</label><div class="search-control"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg><input id="main-search" name="q" value="${escapeHtml(q)}" autocomplete="off" maxlength="60" placeholder="例如：二叉树、流水线、死锁、子网划分"><button type="submit">搜索</button></div></form></section><section class="result-section" aria-labelledby="result-title"><div class="section-head"><h2 id="result-title">搜索结果</h2><span id="result-count" role="status"></span></div><div class="filters" role="group" aria-label="筛选资料">${['全部',...groups,...subjectOrder].map(f=>`<button type="button" class="filter ${currentFilter===f?'active':''}" data-filter="${f}" aria-pressed="${currentFilter===f}">${f}</button>`).join('')}</div><div id="result-body"></div></section>${docGrid()}</main>${footer()}`
  renderResults()
}
function renderCatalog() { app.innerHTML=`${header('catalog')}<main class="catalog-page"><p class="eyebrow">资料目录</p><h1>按科目和阶段浏览</h1>${docGrid()}</main>${footer()}` }
function renderFavorites() {
  const list=favoriteList()
  app.innerHTML=`${header('favorites')}<main class="favorites-page"><div class="section-head favorites-head"><div><p class="eyebrow">复习清单</p><h1>待背收藏</h1></div><span>${list.length} 条收藏</span></div>${list.length?`<div class="results">${list.map(x=>{const d=docMap.get(x.doc);return `<article class="favorite-card"><div class="result-path">${escapeHtml(d?.group||'')} <span>/</span> ${escapeHtml(d?.subject||'')}</div><h2>${escapeHtml(x.title)}</h2><p>${escapeHtml(x.text)}</p><div class="favorite-actions"><a href="${docUrl(x.doc,x.anchor)}">查看原文 ↗</a><button type="button" data-remove-favorite="${escapeHtml(x.id)}">已背会，移出待背</button></div></article>`}).join('')}</div>`:'<div class="empty"><h2>还没有待背内容</h2><p>搜索知识点，在需要复习的结果旁点击“收藏”。</p><a class="primary-link" href="#/">去搜索</a></div>'}</main>${footer()}`
}
function preprocessMarkdown(md) {
  return md.replace(/(?:src=["']|\]\()\.\/([^"')]+)/g, (all,path) => all.replace(`./${path}`,`${BASE}assets/${path.split('/').map(encodeURIComponent).join('/')}`))
}
async function renderDoc(id,anchor='') {
  const doc=docMap.get(id)
  if (!doc) { location.hash='#/';return }
  currentDoc=id
  app.innerHTML=`${header('doc')}<main class="reader"><aside class="reader-side" aria-label="资料目录"><a class="back-link" href="#/catalog">← 资料目录</a><div class="side-group">${groups.map(g=>`<h3>${g}</h3>${subjectOrder.map(s=>{const x=docs.find(d=>d.group===g && d.subject===s);return `<a class="${id===x.id?'current':''}" href="${docUrl(x.id)}">${s}</a>`}).join('')}${g==='强化题型'?`<a class="${id==='13-历年真题'?'current':''}" href="${docUrl('13-历年真题')}">历年真题</a>`:''}`).join('')}</div></aside><article class="reader-article"><div class="reader-toolbar"><a href="${searchUrl(liveQuery)}">← 返回搜索</a><a href="${sourceUrl(doc)}" target="_blank" rel="noopener noreferrer">查看原始资料 ↗</a></div><header class="reader-title"><span>${escapeHtml(doc.group)} · ${escapeHtml(doc.subject)}</span><h1>${escapeHtml(doc.title)}</h1><p>点击标题旁的星标，可加入待背收藏。</p></header><div class="markdown" id="article-body"><p>正在加载内容…</p></div></article><aside class="reader-toc" aria-label="本文目录"><h3>本文目录</h3><div>${doc.sections.filter(s=>s.level<=3).map(s=>`<a class="level-${s.level}" href="${docUrl(id,s.anchor)}">${escapeHtml(s.title)}</a>`).join('')}</div></aside></main>${footer()}`
  try {
    const md=await fetch(`${BASE}docs/${encodeURIComponent(id)}.md`).then(r=>{if(!r.ok)throw new Error('正文加载失败');return r.text()})
    if (currentDoc!==id) return
    const html=marked.parse(preprocessMarkdown(md))
    const container=document.querySelector('#article-body')
    container.innerHTML=DOMPurify.sanitize(html,{ADD_ATTR:['target','rel','style']})
    container.querySelectorAll('a[href^="http"]').forEach(a=>{a.target='_blank';a.rel='noopener noreferrer'})
    const topTitle=container.querySelector('h1'); if(topTitle) topTitle.style.display='none'
    const fav=favoriteSet()
    for(const section of doc.sections) {
      const a=container.querySelector(`#${section.anchor}`)
      const marker=a?.parentElement?.tagName==='P' && a.parentElement.textContent.trim()==='' ? a.parentElement : a
      const heading=marker?.nextElementSibling
      if (!heading || !/^H[1-4]$/.test(heading.tagName) || section.level===1) continue
      const bid=favoriteId(id,section.anchor)
      const button=document.createElement('button');button.type='button';button.className='heading-favorite';button.dataset.favoriteId=bid;button.dataset.doc=id;button.dataset.anchor=section.anchor;button.dataset.title=section.title;button.dataset.text='';button.setAttribute('aria-label',`${fav.has(bid)?'取消收藏':'收藏'}：${section.title}`);button.setAttribute('aria-pressed',String(fav.has(bid)));button.textContent=fav.has(bid)?'★ 已收藏':'☆ 收藏';heading.append(button)
    }
    if(anchor) requestAnimationFrame(()=>{const target=document.getElementById(anchor); if(target){target.scrollIntoView({block:'start'});const marker=target.parentElement?.tagName==='P' && target.parentElement.textContent.trim()==='' ? target.parentElement : target;marker.nextElementSibling?.classList.add('search-target')}})
    else window.scrollTo(0,0)
  } catch(err) { document.querySelector('#article-body').innerHTML=`<div class="empty"><h2>资料加载失败</h2><p>${escapeHtml(err.message)}</p></div>` }
}
function route() {
  const hash=location.hash.slice(1)||'/'
  const [path,query='']=hash.split('?'); const params=new URLSearchParams(query)
  currentRoute=path
  if(path.startsWith('/doc/')) { renderDoc(decodeURIComponent(path.slice(5)),params.get('section')||''); return }
  currentDoc=null
  if(path==='/favorites') renderFavorites()
  else if(path==='/catalog') renderCatalog()
  else { currentFilter='全部';renderSearch(params.get('q')||'') }
  window.scrollTo(0,0)
}
app.addEventListener('submit', e=>{if(e.target.id==='hero-search'||e.target.id==='header-search'){e.preventDefault();const q=new FormData(e.target).get('q')?.toString().trim()||'';if(location.hash===searchUrl(q)){liveQuery=q;renderResults()}else location.hash=searchUrl(q)}})
app.addEventListener('input',e=>{if(e.target.id==='main-search'){liveQuery=e.target.value;showCount=10;renderResults()}})
app.addEventListener('click',e=>{
  const filter=e.target.closest('[data-filter]');if(filter){currentFilter=filter.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});showCount=10;renderResults();return}
  if(e.target.closest('#show-more')){showCount+=10;renderResults();return}
  const favorite=e.target.closest('[data-favorite-id]');if(favorite){toggleFavorite(favorite.dataset.doc,favorite.dataset.anchor,favorite.dataset.title,favorite.dataset.text);return}
  const remove=e.target.closest('[data-remove-favorite]');if(remove){storeFavorites(favoriteList().filter(x=>x.id!==remove.dataset.removeFavorite));renderFavorites()}
})
window.addEventListener('hashchange',route)
route()
