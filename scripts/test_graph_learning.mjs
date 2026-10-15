import assert from 'node:assert/strict'
import {prim,kruskal,topological,dijkstra,floyd,examMstGraph,primOptions,topoOptions,dijkstraOptions,floydOptions} from '../src/learning/graph-models.js'
import {graphDiagram,graphStateRows} from '../src/learning/graph-diagrams.js'
const last=l=>l.frames.at(-1).state
const value=x=>x==='∞'?Infinity:x
// Independent enumeration of all spanning trees, rather than another greedy implementation.
function spanningTrees(g){
 const vs=g.nodes.map(n=>n.id),trees=[]
 for(let mask=0;mask<2**g.edges.length;mask++){
  const edges=g.edges.filter((_,i)=>mask&(1<<i));if(edges.length!==vs.length-1)continue
  const seen=new Set([vs[0]]);let changed=true
  while(changed){changed=false;for(const e of edges)if(seen.has(e.u)!==seen.has(e.v)){seen.add(e.u);seen.add(e.v);changed=true}}
  if(seen.size===vs.length)trees.push({weight:edges.reduce((a,e)=>a+e.w,0),edges:edges.map(e=>e.id).sort()})
 }
 return trees.sort((a,b)=>a.weight-b.weight)
}
const original=examMstGraph()
// Visually transcribed from the local 2017-42 original, including all seven weights.
assert.deepEqual(original.edges.map(e=>[e.u,e.v,e.w]),[['A','B',6],['A','E',5],['A','D',4],['B','C',4],['C','E',5],['C','D',6],['D','E',4]])
const all=spanningTrees(original);assert.equal(all[0].weight,17);assert.equal(all.filter(t=>t.weight===17).length,1)
assert.deepEqual(last(prim()).order,['A','D','E','C','B']);assert.equal(last(prim()).total,17)
assert.deepEqual(last(kruskal()).rejected,['A-E'])
for(const option of primOptions){
 const l=prim(option),g=l.graph,s=last(l)
 if(option!=='不连通图'){const t=spanningTrees(g)[0];assert.equal(s.total,t.weight);assert.deepEqual([...s.selected].sort(),t.edges)}else{assert.equal(l.frames.at(-1).result,'disconnected');assert.ok(!s.done.includes('B'))}
 if(l.algorithm!=='prim')continue
 for(let i=1;i<l.frames.length;i++){const f=l.frames[i],p=l.frames[i-1].state
  if(f.action==='choose'){
   const outside=g.nodes.map(n=>n.id).filter(v=>!p.done.includes(v));assert.equal(value(p.values[f.picked]),Math.min(...outside.map(v=>value(p.values[v]))))
   if(p.done.length){const cut=g.edges.filter(e=>p.done.includes(e.u)!==p.done.includes(e.v));assert.equal(f.cost,Math.min(...cut.map(e=>e.w)))}
  }
  assert.equal(f.state.selected.length,Math.max(0,f.state.done.length-1))
 }
}
for(const option of ['2017 真题 · 按权选边','不连通图']){
 const l=kruskal(option)
 for(let i=1;i<l.frames.length-1;i++){
  const f=l.frames[i],e=l.graph.edges.find(e=>e.id===f.pickedEdge),prev=l.frames[i-1].state
  const connected=new Set([e.u]);let changed=true
  while(changed){changed=false;for(const id of prev.selected){const a=l.graph.edges.find(e=>e.id===id);if(connected.has(a.u)!==connected.has(a.v)){connected.add(a.u);connected.add(a.v);changed=true}}}
  assert.equal(f.action==='reject',connected.has(e.v))
 }
}
// Count legal permutations independently; test existence and uniqueness, not just a chosen order.
const permutations=a=>a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>j!==i)).map(p=>[v,...p])):[[]]
for(const option of topoOptions){
 const l=topological(option),g=l.graph,vs=g.nodes.map(n=>n.id),valid=permutations(vs).filter(p=>g.edges.every(e=>p.indexOf(e.u)<p.indexOf(e.v))),s=last(l)
 assert.equal(s.unique,valid.length===0?null:valid.length===1)
 assert.equal(l.frames.at(-1).result,valid.length?'complete':'cycle')
 if(valid.length)assert.ok(valid.some(p=>p.join()===s.order.join()))
 for(let i=0;i<l.frames.length;i++){
  const f=l.frames[i]
  for(const v of vs)assert.equal(f.state.values[v],g.edges.filter(e=>e.v===v&&!f.state.removed.includes(e.id)).length)
  for(const v of f.state.ready){assert.equal(f.state.values[v],0);assert.ok(!f.state.done.includes(v))}
  assert.equal(new Set(f.state.ready).size,f.state.ready.length)
  if(f.action==='output'){assert.equal(l.frames[i-1].state.values[f.picked],0);assert.equal(l.frames[i-1].state.ready[0],f.picked)}
 }
}
assert.notDeepEqual(last(topological(topoOptions[0])).order,last(topological(topoOptions[1])).order)
// Exhaustively enumerate simple paths as an independent shortest-distance oracle.
function distances(g,source){
 const best=Object.fromEntries(g.nodes.map(n=>[n.id,Infinity]));best[source]=0
 function visit(u,cost,seen){for(const e of g.edges.filter(e=>e.u===u)){if(seen.includes(e.v))continue;const d=cost+e.w;best[e.v]=Math.min(best[e.v],d);visit(e.v,d,[...seen,e.v])}}
 visit(source,0,[source]);return best
}
for(const option of dijkstraOptions){
 const l=dijkstra(option),s=last(l)
 if(option.startsWith('负权')){assert.equal(l.frames.at(-1).result,'invalid');assert.equal(s.done.length,0);continue}
 const oracle=distances(l.graph,'A');for(const [v,d] of Object.entries(oracle))assert.equal(value(s.values[v]),d)
 for(let i=1;i<l.frames.length;i++){const f=l.frames[i],p=l.frames[i-1].state
  for(const v of p.done)assert.equal(f.state.values[v],p.values[v])
  if(f.action==='settle'){assert.equal(f.state.values[f.picked],oracle[f.picked]);assert.equal(value(p.values[f.picked]),Math.min(...Object.keys(p.values).filter(v=>!p.done.includes(v)).map(v=>value(p.values[v]))))}
 }
}
assert.deepEqual(last(dijkstra()).values,{A:0,B:2,C:5,D:6})
for(const option of floydOptions){
 const l=floyd(option),vs=l.graph.nodes.map(n=>n.id),s=last(l);let previous
 for(const f of l.frames){
  if(f.action==='round')previous=f.state.matrix
  if(f.action==='update'){
   assert.equal(f.a,previous[f.i][f.k]);assert.equal(f.b,previous[f.k][f.j]);assert.equal(f.old,previous[f.i][f.j]);assert.equal(f.proposal,f.a+f.b);assert.ok(f.proposal<value(f.old));assert.equal(f.state.matrix[f.i][f.j],f.proposal)
   assert.equal(f.path.slice(1).reduce((sum,v,i)=>sum+l.graph.edges.find(e=>e.u===f.path[i]&&e.v===v).w,0),f.proposal)
  }
  if(f.action==='round-end')assert.equal(f.updates+f.unchanged+f.unreachable,vs.length**2)
 }
 if(option.startsWith('负权环')){assert.equal(l.frames.at(-1).result,'negative-cycle');assert.ok(s.matrix.some((row,i)=>value(row[i])<0))}
 else for(let i=0;i<vs.length;i++){const expected=distances(l.graph,vs[i]);vs.forEach((v,j)=>assert.equal(value(s.matrix[i][j]),expected[v],option))}
}
// Snapshot independence and rendering must hold for every preset, including failure branches.
let count=0
for(const [make,options] of [[prim,primOptions],[kruskal,['2017 真题 · 按权选边','不连通图']],[topological,topoOptions],[dijkstra,dijkstraOptions],[floyd,floydOptions]])for(const option of options){
 const l=make(option),first=structuredClone(l.frames[0]);count+=l.frames.length
 for(const f of l.frames){assert.ok(graphStateRows(l,f).length);const html=graphDiagram(l,f);assert.ok(html.includes('aria-label='));assert.ok(!/NaN|undefined/.test(html));if(!l.graph.directed)assert.ok(!html.includes('graph-directed'))}
 l.frames.at(-1).state.done.push('TEST');assert.deepEqual(l.frames[0],first)
}
console.log(`Graph learning: ${count} snapshots checked against exhaustive spanning trees, legal topological permutations and simple-path distances; negative cycles and immutable rendering passed`)
