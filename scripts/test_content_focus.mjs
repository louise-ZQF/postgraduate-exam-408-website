import assert from 'node:assert/strict'
import fs from 'node:fs'
import {execFileSync} from 'node:child_process'
import {marked} from 'marked'
const read=p=>fs.readFileSync(p,'utf8')
const docs=JSON.parse(read('CONTENT_FOCUS_REVIEW.json'))
const strip=s=>s.replace(/<!--[^]*?-->/g,'').replace(/\*\*(?:重点|易错|公式与条件)｜\*\* /g,'').replace(/\s/g,'')
for(const {document:doc} of docs){
 const path='source/'+(doc.startsWith('0')?'408':'supplements')+'/'+doc+'.md',md=read(path)
 const tokens=marked.lexer(md)
 let heading='',hasText=false,hasFocus=false,sections=0
 const check=()=>{if(heading&&hasText){assert.ok(hasFocus,doc+': unmarked section '+heading);sections++}}
 for(const t of tokens){if(t.type==='heading'&&t.depth>=2){check();heading=t.text;hasText=false;hasFocus=false}
 else if(t.type==='paragraph'){hasText=true;if(/\*\*[^*]+｜\*\*/.test(t.raw))hasFocus=true}
 else if(t.type==='table'){hasFocus=true}}
 check();assert.ok(sections>10)
 if(['02','03','04','15','16'].includes(doc.slice(0,2))){const old=execFileSync('git',['show','7d10a1d^:'+path],{encoding:'utf8'});assert.equal(strip(md),strip(old),doc+': emphasis must preserve original text and formulas')}
}
const ds=read('source/supplements/14-数据结构错题补充.md')
for(const text of ['top == -1','top == n-1','top == 0','top == n','top1 == -1','top2 == n','top2-top1 == 1','front == rear','(rear+1)%M == front','size == 0','size == M','h->next == h','h == NULL'])assert.ok(ds.includes('`'+text+'`'),text)
assert.ok(!read('src/learning/outline-lessons.js').includes('position-traces'))
console.log('Focus review: all seven knowledge documents have explicit emphasis or comparison tables; original non-boundary text/formulas preserved; separate empty/full conditions present.')
