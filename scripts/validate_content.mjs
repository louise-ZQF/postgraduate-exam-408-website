import fs from 'node:fs'
import path from 'node:path'
import {marked} from 'marked'
import katex from 'katex'
const root=path.resolve('public'), catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'))).docs
const index=JSON.parse(fs.readFileSync(path.join(root,'search-index.json')))
let questions=0,formulas=0,images=0,errors=[];const targets=new Map(),ids=new Set()
for(const doc of catalog){
  const md=fs.readFileSync(path.join(root,'docs',doc.id+'.md'),'utf8'), html=marked.parse(md), anchors=new Set([...html.matchAll(/\s+id="([^\"]+)"/g)].map(m=>m[1]));targets.set(doc.id,anchors)
  const allIds=[...html.matchAll(/\s+id="([^\"]+)"/g)].map(m=>m[1]);if(allIds.length!==anchors.size)errors.push(doc.id+': 重复锚点')
  for(const sec of doc.sections){if(ids.has(sec.anchor))errors.push('重复内容 ID '+sec.anchor);ids.add(sec.anchor);if(!anchors.has(sec.anchor))errors.push('章节锚点缺失 '+sec.anchor)}
  for(const m of html.matchAll(/<img\b[^>]*>/g)){images++;const tag=m[0];if(!/\balt=/.test(tag))errors.push(doc.id+': 图片无替代标签');const ref=tag.match(/\bsrc="\.\/([^\"]+)"/);if(ref&&!fs.existsSync(path.join(root,'assets',ref[1])))errors.push('图片缺失 '+ref[1])}
  const units=JSON.parse(fs.readFileSync(path.join(root,'units',doc.id+'.json')))
  for(const u of units){questions++;if(!anchors.has(u.questionId))errors.push('题目锚点缺失 '+u.questionId);if(ids.has(u.questionId))errors.push('重复题目 ID '+u.questionId);ids.add(u.questionId);if(new Set(u.options.map(o=>o.optionId)).size!==u.options.length)errors.push('重复选项 ID '+u.questionId);if(u.correctOptionId&&!u.options.some(o=>o.optionId===u.correctOptionId))errors.push('答案引用不存在的选项 '+u.questionId)}
  // Check the same math text displayed by auto-render; omit code/pre where $ is literal.
  const mathText=html.replace(/<(?:pre|code)\b[^>]*>[\s\S]*?<\/(?:pre|code)>/g,'').replace(/<[^>]*>/g,' ').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"')
  for(const m of mathText.matchAll(/\$\$([\s\S]*?)\$\$|(?<!\\)\$([^$\n]+?)(?<!\\)\$/g)){formulas++;try{katex.renderToString(m[1]||m[2],{throwOnError:true,strict:'ignore',displayMode:!!m[1]})}catch(e){errors.push(doc.id+': 公式 '+(m[1]||m[2]).slice(0,100)+' '+e.message)}}
}
for(const r of index){if(!targets.get(r.doc)?.has(r.anchor))errors.push('搜索定位不存在 '+r.doc+'#'+r.anchor);if(!targets.get(r.doc)?.has(r.sectionId))errors.push('知识节不存在 '+r.sectionId);if(!['知识点','小题','大题'].includes(r.type))errors.push('非法类型 '+r.anchor);if(r.kind==='choice'&&r.type!=='小题')errors.push('选择题归类错误 '+r.anchor)}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'targets.json')));for(const [doc,anchors] of Object.entries(manifest))for(const anchor of anchors)if(!targets.get(doc)?.has(anchor))throw Error('Manifest target missing '+doc+'#'+anchor)
console.log(`Validated ${catalog.length} documents, ${index.length} search targets, ${questions} questions, ${images} images, ${formulas} formulas`)
