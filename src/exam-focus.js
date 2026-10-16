const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const inline = s => String(s).split(/(`[^`]+`)/g).map(part=>part.startsWith('`')&&part.endsWith('`')?`<code>${esc(part.slice(1,-1))}</code>`:esc(part)).join('')
export function examFocusCard(entry) {
  return `<section class="exam-focus-card" data-focus-anchor="${esc(entry.anchor)}" aria-label="${esc(entry.title)}考点"><div class="exam-focus-heading">${entry.level===2?'本章考点':'本节考点'}</div><dl>${[['核心规则',entry.key],['典型考法',entry.exam],['前提与易错',entry.condition]].map(([label,text])=>`<div><dt>${label}</dt><dd>${inline(text)}</dd></div>`).join('')}</dl></section>`
}
export function mountExamFocus(container, data, {signal,editorButton}={}) {
  if (!data?.entries?.length) return
  const headings = new Map([...container.querySelectorAll('h2[data-section],h3[data-section],h4[data-section]')].map(h=>[h.dataset.section,h]))
  for (const entry of data.entries) {
    const heading=headings.get(entry.anchor)
    if (!heading) throw Error('考点缺少对应知识标题：'+entry.title)
    heading.insertAdjacentHTML('afterend',examFocusCard(entry))
  }
  for(const unit of container.querySelectorAll('.study-unit')){
    if(unit.querySelector('table')&&!unit.closest('.learning-lab'))unit.classList.add('exam-focus-source-reference')
    else if(unit.querySelector('.katex-display')&&!unit.querySelector('details'))unit.classList.add('exam-focus-source-reference','exam-focus-source-formula')
  }
  const bar=document.createElement('section');bar.className='exam-focus-toolbar';bar.setAttribute('aria-label','考点阅读视图')
  bar.innerHTML=`<div><b>逐项考点速查</b><p>${data.entries.length} 项，按完整目录整理；每项分别列出规则、考法和条件，并保留公式与算法对照表。</p></div><button type="button" class="action" aria-pressed="false">只看考点</button><span class="visually-hidden" aria-live="polite" data-focus-view-status></span>`
  const first=container.querySelector('h2');if(first)container.insertBefore(bar,first.previousElementSibling?.querySelector('a[id]')?first.previousElementSibling:first);else container.prepend(bar)
  const button=bar.querySelector('button'),status=bar.querySelector('[data-focus-view-status]')
  const setView=only=>{container.classList.toggle('exam-focus-only',only);button.setAttribute('aria-pressed',String(only));button.textContent=only?'显示完整正文':'只看考点';status.textContent=only?'已切换为本篇全部考点，完整正文暂时收起':'已显示全部考点与完整正文'}
  button.addEventListener('click',()=>setView(button.getAttribute('aria-pressed')!=='true'),{signal})
  container.addEventListener('exam-focus:reveal',()=>setView(false),{signal})
  editorButton?.addEventListener('click',()=>setView(false),{signal})
}
