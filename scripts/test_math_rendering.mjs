import assert from 'node:assert/strict'
import { marked } from 'marked'
import katex from 'katex'
import fs from 'node:fs'
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
// Run the actual rewritten lectures through the same Markdown math tokenizer.
const rewrite=JSON.parse(fs.readFileSync('CONTENT_REWRITE_REVIEW.json','utf8'))
let formulas=0
for(const doc of Object.keys(rewrite.documents)){
 const source='source/'+(doc.startsWith('0')?'408':'supplements')+'/'+doc+'.md'
 const html=marked.parse(fs.readFileSync(source,'utf8'))
 for(const m of html.matchAll(/<(span|div) class="math-(inline|display)-source">([^]*?)<\/\1>/g)){
  const delimiter=m[2]==='display'?'$$':'$'
  const tex=m[3].slice(delimiter.length,-delimiter.length).replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&amp;','&')
  assert.ok(!/\^-\d/.test(tex),source+': negative exponents need braces around the whole exponent')
  assert.doesNotThrow(()=>katex.renderToString(tex,{throwOnError:true,strict:'ignore'}),source+': '+tex)
  formulas++
 }
 assert.ok(!html.includes('**'),doc+': broken bold delimiters')
}
assert.ok(formulas>400,'actual lecture math coverage')
console.log(`All ${formulas} rendered formulas in the seven rewritten lectures parse in KaTeX`)
