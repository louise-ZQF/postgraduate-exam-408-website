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
  container.querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer' })
  const topTitle = container.querySelector('h1')
  if (topTitle) topTitle.style.display = 'none'
}

export function revealSearchTarget(anchor, query, searchTerms = []) {
  const marker = document.getElementById(anchor)
  if (!marker) return
  if (!anchor.startsWith('p-')) {
    const wrapper = marker.parentElement?.tagName === 'P' && marker.parentElement.textContent.trim() === '' ? marker.parentElement : marker
    const heading = wrapper.nextElementSibling
    if (heading && /^H[1-4]$/.test(heading.tagName)) { heading.classList.add('search-target'); heading.scrollIntoView({ block: 'center', behavior: 'instant' }) }
    else marker.scrollIntoView({ block: 'center', behavior: 'instant' })
    return
  }
  const block = marker.closest('tr,li,p,pre,blockquote') || marker.nextElementSibling || marker.parentElement
  const candidates = [block]
  let sibling = block.nextElementSibling
  while (sibling && candidates.length < 8 && !sibling.matches('h1,h2,h3,h4') && !sibling.querySelector('.content-anchor,a[id^="s-"]')) {
    candidates.push(sibling)
    sibling = sibling.nextElementSibling
  }
  const needles = [query.trim(), ...searchTerms].filter(Boolean)
  let hit = null, hitBlock = block
  for (const candidate of candidates) {
    const walker = document.createTreeWalker(candidate, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode()) && !hit) {
      if (node.parentElement?.closest('.katex,.content-anchor')) continue
      for (const needle of needles) {
        const at = node.textContent.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase())
        if (at < 0) continue
        const match = node.splitText(at)
        match.splitText(needle.length)
        hit = document.createElement('mark')
        hit.className = 'search-hit'
        hit.textContent = match.textContent
        match.replaceWith(hit)
        hitBlock = candidate
        break
      }
    }
    if (hit) break
  }
  hitBlock.classList.add('search-target')
  const scrollTarget = hit || block
  scrollTarget.scrollIntoView({ block: 'center', behavior: 'instant' })
}
