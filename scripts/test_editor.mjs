import assert from 'node:assert/strict'
import fs from 'node:fs'
import {readBlock,mergeEdits,encodeUTF8,decodeUTF8,validateEdit} from '../src/edit-model.js'
let blocks=0
for(const name of fs.readdirSync('public/editable')){
  const doc=JSON.parse(fs.readFileSync('public/editable/'+name)),source=fs.readFileSync(doc.path,'utf8')
  for(const [id,block] of Object.entries(doc.blocks)){assert.equal(readBlock(source,id).raw,block.raw);blocks++}
}
const source='<!-- unit-id:u-one -->\n原文 $2^n$\n\n<!-- unit-id:u-two -->\n其他段落\n'
assert.equal(decodeUTF8(encodeUTF8('中文 🙂 $\\frac{1}{2}$')), '中文 🙂 $\\frac{1}{2}$')
const edit={'u-one':{base:'原文 $2^n$',value:'修改 $2^{n+1}$'}}
assert.equal(readBlock(mergeEdits(source,edit),'u-one').raw,'修改 $2^{n+1}$')
assert.equal(readBlock(mergeEdits(source.replace('其他段落','另一处更新'),edit),'u-two').raw,'另一处更新')
assert.throws(()=>mergeEdits(source.replace('原文 $2^n$','别人的修改'),edit),/已有更新/)
assert.equal(mergeEdits(mergeEdits(source,edit),edit),mergeEdits(source,edit))
assert.throws(()=>validateEdit('','文本'))
assert.throws(()=>validateEdit('正文','<question>\n题目\n</question>'))
assert.throws(()=>validateEdit('<!-- unit-id:injected -->\n注入','文本'))
console.log('Editor checked '+blocks+' source blocks, Unicode round trip, concurrent updates, conflict protection and question wrappers')
