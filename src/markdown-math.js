// Keep TeX intact until KaTeX sees it: Markdown must not consume \\, _, or \{.
export function installMathTokens(marked) {
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
  marked.use({ extensions: [
    { name: 'displayMath', level: 'block', start: src => src.indexOf('$$'),
      tokenizer(src) { const m = /^ {0,3}\$\$([\s\S]*?)\$\$(?:[ \t]*\n|$)/.exec(src); if (m) return { type: 'displayMath', raw: m[0], text: m[1] } },
      renderer(token) { return '<div class="math-display-source">$$' + escape(token.text) + '$$</div>\n' } },
    { name: 'inlineMath', level: 'inline', start: src => src.indexOf('$'),
      tokenizer(src) { const m = /^\$(?!\$)((?:\\.|[^$\n])+?)\$(?!\$)/.exec(src); if (m) return { type: 'inlineMath', raw: m[0], text: m[1] } },
      renderer(token) { return '<span class="math-inline-source">$' + escape(token.text) + '$</span>' } }
  ] })
}
