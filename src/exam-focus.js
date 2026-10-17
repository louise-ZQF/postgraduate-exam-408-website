const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const inline = s => String(s).split(/(`[^`]+`)/g).map(part=>part.startsWith('`')&&part.endsWith('`')?`<code>${esc(part.slice(1,-1))}</code>`:esc(part)).join('')
export function examFocusCard(entry) {
  return `<p class="exam-focus-card" data-focus-anchor="${esc(entry.anchor)}" aria-label="${esc(entry.title)}核心特点"><strong>核心特点：</strong>${inline(entry.key)}</p>`
}
export function mountExamFocus(container, data, {signal,editorButton}={}) {
  if (!data?.entries?.length) return
  const headings = new Map([...container.querySelectorAll('h2[data-section],h3[data-section],h4[data-section]')].map(h=>[h.dataset.section,h]))
  for (const entry of data.entries) {
    const heading=headings.get(entry.anchor)
    if (!heading) throw Error('考点缺少对应知识标题：'+entry.title)
    heading.insertAdjacentHTML('afterend',examFocusCard(entry))
  }
  const bar=document.createElement('section');bar.className='exam-focus-toolbar';bar.setAttribute('aria-label','核心特点阅读视图')
  bar.innerHTML=`<div><b>一句话核心</b><p>每个知识点只留一句核心特点。</p></div><button type="button" class="action" aria-pressed="false">只看核心</button><span class="visually-hidden" aria-live="polite" data-focus-view-status></span>`
  const first=container.querySelector('h2');if(first)container.insertBefore(bar,first.previousElementSibling?.querySelector('a[id]')?first.previousElementSibling:first);else container.prepend(bar)
  const button=bar.querySelector('button'),status=bar.querySelector('[data-focus-view-status]')
  const setView=only=>{container.classList.toggle('exam-focus-only',only);button.setAttribute('aria-pressed',String(only));button.textContent=only?'显示完整正文':'只看核心';status.textContent=only?'已切换为本篇核心特点，完整正文暂时收起':'已显示核心特点与完整正文'}
  button.addEventListener('click',()=>setView(button.getAttribute('aria-pressed')!=='true'),{signal})
  container.addEventListener('exam-focus:reveal',()=>setView(false),{signal})
  editorButton?.addEventListener('click',()=>setView(false),{signal})
}
