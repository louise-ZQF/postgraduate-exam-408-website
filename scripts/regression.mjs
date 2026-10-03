import assert from 'node:assert/strict'
import fs from 'node:fs'
import {searchRecords,parseQuery,decodeIndex} from '../src/search.js'
import {Resources,Navigation} from '../src/resources.js'
import {migrateLegacy,scheduleReview,validateImport,createReviewStore} from '../src/review.js'
const docs=JSON.parse(fs.readFileSync('public/catalog.json')).docs;const records=[['知识点','knowledge'],['小题','small'],['大题','big']].flatMap(([type,name])=>decodeIndex(JSON.parse(fs.readFileSync('public/search-v2-'+name+'.json')),docs,type)),cases=JSON.parse(fs.readFileSync('scripts/search_cases.json'))
assert.equal(parseQuery('计组Cache').subject,'计算机组成原理')
assert.equal(parseQuery('OS 缺页').subject,'操作系统')
assert.deepEqual(parseQuery('2018 最小正整数').years,[2018])
assert(searchRecords(records,'计组 Cache','知识点').length)
assert(searchRecords(records,'2018 未出现的最小正整数','大题').some(r=>r.doc.startsWith('09-')))
assert(searchRecords(records,'2022 程序段 时间复杂度','小题').some(r=>r.doc.startsWith('01-')))
let calls=0
const resources=new Resources(async()=>{if(++calls===1)throw Error('offline');return {ok:true,json:async()=>['loaded']}})
await assert.rejects(resources.load('index'));assert.equal(resources.state('index'),'error');assert.deepEqual(await resources.load('index'),['loaded']);await resources.load('index');assert.equal(calls,2)
const nav=new Navigation(),a=nav.next(),b=nav.next(),a2=nav.next();assert(a.signal.aborted&&b.signal.aborted&&!a.current()&&a2.current())
const migrated=migrateLegacy([{doc:'co',anchor:'s-8',title:'定点数的机器数转换',text:''}],{co:{'s-8':{target:'co-number-representation',title:'定点数的机器数转换',text:''}}});assert.equal(migrated[0].anchor,'co-number-representation')
assert(migrateLegacy([{doc:'co',anchor:'p-1',title:'旧题',text:'旧内容'}],{co:{'p-1':{target:'wrong',title:'新题',text:'新内容'}}})[0].needsRelocation)
const reviewed=scheduleReview({history:[]},'familiar','漏看条件',0);assert.equal(reviewed.nextReviewAt,3*86400000);assert.equal(reviewed.reviewCount,1)
assert.throws(()=>validateImport([{doc:'x'}],new Set(['co'])))
let writes=0;const notices=[];const store=createReviewStore({getItem:()=>'{corrupt',setItem:()=>writes++},m=>notices.push(m));store.init({});store.save([]);assert.equal(writes,0);assert(notices.length)
let hits=0,rr=0;const misses=[]
for(const [q,scope,doc,section] of cases){const results=searchRecords(records,q,scope);const rank=results.findIndex(r=>r.doc.startsWith(doc)&&r.section===section);if(rank>=0&&rank<10){hits++;rr+=1/(rank+1)}else misses.push({q,expected:section,actual:results.slice(0,3).map(r=>r.section)})}
const report={queries:cases.length,hitAt10:hits/cases.length,mrrAt10:rr/cases.length,misses,note:'50 条人工设定入口查询，每条一个期望章节；Hit@10 不是对所有相关结果的完整 Recall。离线排序指标不代表真实用户性能。'}
fs.writeFileSync('SEARCH_EVALUATION.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2));assert.equal(misses.length,0,'期望入口未进入前 10 名')
console.log('Behavior regressions passed')
