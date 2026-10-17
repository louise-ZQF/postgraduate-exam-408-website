import assert from 'node:assert/strict'
import fs from 'node:fs'
import {marked} from 'marked'
import {examFocusCard} from '../src/exam-focus.js'
const read=p=>fs.readFileSync(p,'utf8')
const docs=JSON.parse(read('CONTENT_FOCUS_REVIEW.json'))
const catalog=JSON.parse(read('public/catalog.json')).docs
let total=0
for(const {document:doc} of docs){
 const sections=catalog.find(d=>d.id===doc).sections.filter(s=>s.level>1)
 const data=JSON.parse(read('public/exam-focus/'+doc+'.json'))
 assert.deepEqual(data.entries.map(e=>e.anchor),sections.map(s=>s.anchor),doc+': every individual directory section needs a summary')
 assert.equal(new Set(data.entries.map(e=>e.anchor)).size,sections.length)
 for(const e of data.entries){
  assert.ok(e.key.length>=12,doc+e.title)
  assert.ok(!('exam' in e)&&!('condition' in e))
  assert.ok(e.key.length<=110&&e.key.split('。').filter(Boolean).length===1,doc+e.title+': one concise sentence')
  const html=examFocusCard(e);assert.equal((html.match(/<p /g)||[]).length,1)
  assert.ok(html.includes('核心特点：')&&!html.includes('<dl>')&&!html.includes('典型考法')&&!html.includes('前提与易错'))
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
const html=examFocusCard({anchor:'test',title:'<unsafe>',level:3,key:'`x<0` <script>alert(1)</script> a & b'})
assert.ok(!html.includes('<script>'));assert.ok(html.includes('x&lt;0'));assert.ok(html.includes('a &amp; b'))
assert.ok(!read('src/learning/outline-lessons.js').includes('position-traces'))
console.log(`Exam focus: ${total} single-sentence core summaries match every section; duplicate titles mapped by context.`)
