import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {marked} from 'marked'
import {examFocusCard} from '../src/exam-focus.js'
const read=p=>fs.readFileSync(p,'utf8')
const docs=JSON.parse(read('CONTENT_FOCUS_REVIEW.json'))
const catalog=JSON.parse(read('public/catalog.json')).docs
const strip=s=>s.replace(/<!--[^]*?-->/g,'').replace(/\*\*(?:重点|易错|公式与条件)｜\*\* /g,'').replace(/\s/g,'')
let total=0
for(const {document:doc,preservedTextSha256} of docs){
 const path='source/'+(doc.startsWith('0')?'408':'supplements')+'/'+doc+'.md',md=read(path)
 if(preservedTextSha256) assert.equal(createHash('sha256').update(strip(md)).digest('hex'),preservedTextSha256,doc+': keep original text/formulas')
 const sections=catalog.find(d=>d.id===doc).sections.filter(s=>s.level>1)
 const data=JSON.parse(read('public/exam-focus/'+doc+'.json'))
 assert.deepEqual(data.entries.map(e=>e.anchor),sections.map(s=>s.anchor),doc+': every individual directory section needs a summary')
 assert.equal(new Set(data.entries.map(e=>e.anchor)).size,sections.length)
 for(const e of data.entries){
  for(const field of ['key','exam','condition'])assert.ok(e[field].length>=12,doc+e.title+field)
  assert.notEqual(e.key,e.exam);assert.notEqual(e.exam,e.condition)
  const html=examFocusCard(e);assert.equal((html.match(/<dt>/g)||[]).length,3)
  assert.ok(html.includes('核心规则')&&html.includes('典型考法')&&html.includes('前提与易错'))
 }
 total+=data.entries.length
}
assert.equal(total,456)
const os=JSON.parse(read('public/exam-focus/03-操作系统.json')).entries.filter(e=>e.title==='地址变换机构')
assert.equal(os.length,4);assert.equal(new Set(os.map(e=>e.key)).size,4,'paging, segmentation, segmented paging and demand paging must be distinguished')
for(const [parent,expected] of [['基本分页','页框'],['基本分段','段长'],['基本段页式','段表'],['请求分页','缺页']])assert.ok(os.find(e=>e.path.at(-2)===parent).key.includes(expected))
const ds=JSON.parse(read('public/exam-focus/01-数据结构.json')).entries
assert.ok(ds.find(e=>e.title==='顺序栈：top 指向当前栈顶').key.includes('top==-1'))
assert.ok(ds.find(e=>e.title==='顺序栈：top 指向下一空位').key.includes('top==0'))
assert.ok(ds.find(e=>e.title==='共享栈：两端向中间生长').key.includes('top2-top1==1'))
const html=examFocusCard({anchor:'test',title:'<unsafe>',level:3,key:'`x<0`',exam:'<script>alert(1)</script>',condition:'a & b'})
assert.ok(!html.includes('<script>'));assert.ok(html.includes('x&lt;0'));assert.ok(html.includes('a &amp; b'))
assert.ok(!read('src/learning/outline-lessons.js').includes('position-traces'))
console.log(`Exam focus: ${total} authored three-part summaries match every section; duplicate titles mapped by context; full original non-boundary prose/formulas preserved.`)
