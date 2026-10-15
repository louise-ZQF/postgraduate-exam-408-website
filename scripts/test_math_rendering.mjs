import assert from 'node:assert/strict'
import { marked } from 'marked'
import katex from 'katex'
import { installMathTokens } from '../src/markdown-math.js'
installMathTokens(marked)
const samples = [String.raw`\begin{cases}U,&\text{最高位为 0}\\U-2^w,&\text{最高位为 1}\end{cases}`,String.raw`ve(v)=\max_{u\to v}\{ve(u)+w(u,v)\}`,String.raw`\frac{\text{周转时间}}{\text{服务时间}}`,String.raw`\mathrm{Need}_i\le \mathrm{Work}`]
for (const tex of samples) {
  const html=marked.parse('$$'+tex+'$$\n')
  const recovered=html.match(/\$\$([\s\S]*?)\$\$/)[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&amp;','&')
  assert.equal(recovered,tex,'Markdown altered TeX')
  assert.doesNotThrow(()=>katex.renderToString(recovered,{throwOnError:true}))
}
const prose=marked.parse('**先看条件**：$x<0$ → 使用负数规则。\n\n~~~c\nchar *s = "$literal$";\n~~~')
assert.match(prose,/<strong>先看条件<\/strong>/)
assert.match(prose,/x&lt;0/)
assert.match(prose,/<code class="language-c">/)
assert.match(prose,/\$literal\$/)
console.log('Math source survives Markdown: cases, line breaks, subscripts, braces, fractions and code literals')
