import 'katex/dist/katex.min.css'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import renderMathInElement from 'katex/contrib/auto-render'

marked.setOptions({ gfm: true, breaks: false })

function preprocessMarkdown(md, base) {
  return md.replace(/(?:src=["']|\]\()\.\/([^"')]+)/g, (all,path) => all.replace(`./${path}`,`${base}assets/${path.split('/').map(segment => encodeURIComponent(segment).replace(/%2B/gi, '+')).join('/')}`))
}

function styleAnswerChoices(container) {
  for (const list of container.querySelectorAll('ul')) {
    const items = [...list.children]
    if (items.length < 2 || items.some(item => item.tagName !== 'LI')) continue
    const labeled = items.map(item => {
      const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim()) continue
        const match = node.textContent.match(/^\s*([A-H])[.．、]\s*/)
        return match ? { node, match } : null
      }
      return null
    })
    const letters = labeled.map(entry => entry?.match[1])
    if (letters.some(letter => !letter) || new Set(letters).size !== items.length ||
        !letters.every(letter => letter.charCodeAt(0) - 65 < items.length)) continue
    list.classList.add('exam-options')
    list.setAttribute('aria-label', '选择题选项')
    items.forEach((item, index) => {
      const { node, match } = labeled[index]
      node.textContent = node.textContent.slice(match[0].length)
      item.classList.add('exam-option')
      const badge = document.createElement('span')
      badge.className = 'exam-option-letter'
      badge.setAttribute('aria-hidden', 'true')
      badge.textContent = match[1]
      const content = document.createElement('div')
      content.className = 'exam-option-content'
      while (item.firstChild) content.append(item.firstChild)
      item.prepend(badge)
      item.append(content)
    })
    items.sort((a, b) => a.querySelector('.exam-option-letter').textContent.localeCompare(b.querySelector('.exam-option-letter').textContent))
    list.append(...items)
  }
}

export function renderMarkdown(md, base, container) {
  const html = marked.parse(preprocessMarkdown(md, base))
  container.innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel', 'style'] })
  renderMathInElement(container, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    ignoredClasses: ['katex'],
    throwOnError: false,
    strict: 'ignore',
  })
  styleAnswerChoices(container)
  container.querySelectorAll('a[href^="/docs/"]').forEach(a=>{const [path,hash]=a.getAttribute('href').split('#');a.href='https://yyx-dev.github.io'+path+(path.endsWith('.html')?'':'.html')+(hash?'#'+hash:'')})
  container.querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer' })
  const topTitle = container.querySelector('h1')
  if (topTitle) topTitle.style.display = 'none'
}

export function revealSearchTarget(anchor, query, searchTerms = []) {
  document.querySelectorAll('.search-target').forEach(el=>el.classList.remove('search-target'))
  document.querySelectorAll('mark.search-hit').forEach(el=>el.replaceWith(document.createTextNode(el.textContent)))
  let marker=document.getElementById(anchor)
  if (!marker) return
  if(marker.dataset.target)marker=document.getElementById(marker.dataset.target)||marker
  let block=marker
  if(marker.tagName==='A') {
    const wrapper=marker.parentElement?.tagName==='P'?marker.parentElement:marker
    block=wrapper.nextElementSibling||marker
  }
  const needles=[...searchTerms,query.trim()].filter(Boolean)
  const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT)
  let node,hit
  while((node=walker.nextNode())&&!hit) {
    if(node.parentElement?.closest('.katex,[hidden],button,input,.question-meta'))continue
    for(const needle of needles) {
      const at=node.textContent.toLowerCase().indexOf(needle.toLowerCase());if(at<0)continue
      const match=node.splitText(at);match.splitText(needle.length)
      hit=document.createElement('mark');hit.className='search-hit';hit.textContent=match.textContent;match.replaceWith(hit);break
    }
  }
  block.classList.add('search-target')
  ;(hit||block).scrollIntoView({block:'center',behavior:'instant'})
}
