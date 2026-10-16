import assert from 'node:assert/strict'
import fs from 'node:fs'
import katex from 'katex'
import {dataPath,criticalPath,pageReplacement,banker,pipeline,slidingWindow,diskSchedule,lessons} from '../src/learning/models.js'
const last=l=>l.frames.at(-1).state
// The memory write must happen at C9, never on the earlier read or ALU cycle.
const cpu=dataPath();assert.equal(cpu.frames[7].state.Z,12);assert.equal(cpu.frames[8].state['M[200]'],7);assert.equal(cpu.frames[9].state['M[200]'],12)
assert.deepEqual([last(cpu).PC,last(cpu).R0,last(cpu).R1,last(cpu)['M[200]']],[101,5,200,12]);assert.equal(cpu.frames[0].state.Z,'—')
const cp=last(criticalPath());assert.deepEqual(cp.ve,{A:0,B:2,C:4,D:6});assert.deepEqual(cp.vl,{A:0,B:3,C:4,D:6});assert.equal(cp.T,6)
assert.deepEqual(cp.activities.filter(x=>x.critical).map(x=>x.edge),['A→C','C→D']);assert.deepEqual(cp.activities.map(x=>x.slack),[1,0,1,0])
// Independent expected traces make FIFO hit handling and Clock second chances observable.
const expected={LRU:{faults:6,slots:[4,0,3]},FIFO:{faults:7,slots:[4,3,0]},Clock:{faults:6,slots:[4,0,3]}}
for(const policy of ['LRU','FIFO','Clock']){
 const l=pageReplacement(policy),s=last(l);assert.equal(s.faults,expected[policy].faults,policy+' faults');assert.deepEqual(s.slots,expected[policy].slots,policy+' slots')
 for(const f of l.frames){assert.equal(f.state.faults+f.state.hits,f.state.index+1);const occupied=f.state.slots.filter(x=>x!==null);assert.equal(new Set(occupied).size,occupied.length)}
 assert.deepEqual(l.frames[0].state.slots,[null,null,null]);assert.deepEqual(l.frames.filter(f=>f.result==='hit').map(f=>f.state.request),policy==='FIFO'?[0]:[0,0])
 if(policy==='Clock'){assert.ok(l.frames.some(f=>f.result==='scan'));assert.ok(l.frames.filter(f=>f.result==='hit').every(f=>f.state.bits[f.activeSlot]===1))}
}
const safe=banker(),unsafe=banker(true);assert.deepEqual(last(safe).sequence,['P1','P2']);assert.equal(last(safe).work,3);assert.equal(last(safe).available,1)
assert.equal(unsafe.frames.at(-1).result,'unsafe');assert.deepEqual(last(unsafe).finish,[false,false]);assert.equal(last(unsafe).work,0)
for(const l of [safe,unsafe]){const init=l.frames[0].state,total=init.available+init.allocation.reduce((a,b)=>a+b,0);init.need.forEach((n,i)=>assert.ok(n+init.allocation[i]<=total));for(const f of l.frames)assert.equal(f.state.available,init.available)}
const ideal=pipeline(false),stalled=pipeline();assert.equal(last(ideal).cycle,7);assert.equal(last(stalled).cycle,8)
assert.deepEqual(stalled.frames[4].rows.map(r=>r[3]),['MEM','等候','冻结']);assert.equal(stalled.frames[5].rows[1][4],'EX')
for(const sr of [false,true]){const l=slidingWindow(sr);assert.deepEqual(last(l).received,[0,1,2,3]);assert.deepEqual(last(l).retransmitted,sr?[1]:[1,2,3]);assert.equal(last(l).base,4);assert.equal(l.frames[4].state.base,0);assert.deepEqual(l.frames[7].state.buffered,sr?[2,3]:[])}
for(const [p,path,d] of [['LOOK',[50,70,40,10],80],['SCAN',[50,70,99,40,10],138],['FCFS',[50,40,10,70],100],['SSTF',[50,40,10,70],100]]){const l=diskSchedule(p);assert.deepEqual(last(l).path,path);assert.equal(last(l).distance,d);assert.equal(last(l).done.length,3);assert.equal(l.frames[0].state.distance,0)}
let presets=0,frames=0
for(const spec of lessons){
 const folder=spec.doc.startsWith('14-')?'supplements':'408';const md=fs.readFileSync(new URL('../source/'+folder+'/'+spec.doc+'.md',import.meta.url),'utf8');assert.ok(md.includes(spec.anchor||spec.heading),'missing mount heading '+spec.id)
 for(const option of spec.options||[undefined]){const l=spec.make(option);presets++;frames+=l.frames.length;assert.ok(l.condition&&l.flow&&l.compare.length);assert.ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(l.formula),'JS consumed TeX escapes');for(const match of l.formula.matchAll(/\$\$([\s\S]+?)\$\$/g))assert.doesNotThrow(()=>katex.renderToString(match[1],{throwOnError:true}));for(const f of l.frames)assert.ok(f.title&&f.why&&f.state)}
}
console.log(`Learning traces: ${presets} mounted presets, ${frames} snapshots; CPU writes, critical timing, hits/evictions, safe/unsafe, stall, selective retry and disk endpoints passed`)
