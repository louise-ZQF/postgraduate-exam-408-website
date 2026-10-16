import assert from 'node:assert/strict'
import {positions,stackPositions,linkPositions} from '../src/learning/position-traces.js'
import {traceDiagram} from '../src/learning/trace-diagrams.js'
const shared=positions(stackPositions[0]);
for(const f of shared.frames){const {top1:l,top2:r}=f.state.指针;assert.equal(f.state.空位数,r-l-1);assert.equal(f.state.存储.filter(x=>x==='空').length,r-l-1);assert.ok(l<r)}
assert.equal(shared.frames.at(-2).state.空位数,0)
const queue=positions(stackPositions[3]);assert.ok(queue.frames.some(f=>f.state.指针.rear===0&&f.state.元素数===3));assert.equal(queue.frames.at(-1).state.元素数,0)
for(const f of queue.frames)assert.equal(f.state.存储.filter(x=>x!=='空').length,f.state.元素数)
const single=positions(linkPositions[1]).frames.at(-1);assert.deepEqual(single.state.指针,{h:'H',tail:'H'});assert.deepEqual(single.state.链接,['H.next → H'])
assert.deepEqual(positions(linkPositions[2]).frames.at(-1).state.链接,['B.next → C','C.next → B'])
assert.deepEqual(positions(linkPositions[3]).frames.at(-1).state.链接,['A.next → S','S.next → B','B.prior → S','S.prior → A'])
for(const n of [...stackPositions,...linkPositions]){const l=positions(n);for(const f of l.frames){assert.ok(traceDiagram(l,f));if(f.view.positions){const {nodes,edges,pointers}=f.view.positions;for(const [a,b] of edges)assert.ok(nodes.includes(a)&&nodes.includes(b));for(const v of Object.values(pointers))assert.ok(nodes.includes(v))}}}
console.log('Position traces: stack gaps, queue wrap/full/empty, last-node deletion, circular repair and bidirectional insertion passed')
