const esc=s=>String(s??'—').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const text=(x,y,s,cls='')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="middle">${esc(s)}</text>`
const join=a=>a?.join(' → ')||'空'
const edgeName=(l,id)=>{const e=l.graph.edges.find(e=>e.id===id);return e?e.u+(l.graph.directed?'→':'—')+e.v+` (${e.w})`:id}
const set=a=>a.length?'{'+a.join('，')+'}':'∅'
export function graphStateRows(l,f){
 const s=f.state,vs=l.graph.nodes.map(n=>n.id)
 if(l.algorithm==='topo')return [['输出序列',join(s.order)],['候选队列（队头 → 队尾）',join(s.ready)],...vs.map(v=>[v,s.done.includes(v)?'已输出':`剩余入度 ${s.values[v]}`]),['判定',s.outcome]]
 if(l.algorithm==='prim')return [['已入树集合 S',set(s.done)],...vs.map(v=>[v,`${s.done.includes(v)?'已入树':'待入树'}；key=${s.values[v]}；parent=${s.parent[v]}`]),['已选边',s.selected.map(id=>edgeName(l,id)).join('，')||'无'],['总权',s.total],['判定',s.outcome]]
 if(l.algorithm==='kruskal')return [['已选边',s.selected.map(id=>edgeName(l,id)).join('，')||'无'],['成环丢弃',s.rejected.map(id=>edgeName(l,id)).join('，')||'无'],...vs.map(v=>[v,`所在集合 ${s.components[v]}`]),['总权',s.total],['判定',s.outcome]]
 if(l.algorithm==='dijkstra')return [['已确定顺序',join(s.order)],...vs.map(v=>[v,`${s.done.includes(v)?'已确定':'暂定'} dist=${s.values[v]}；前驱=${s.parent[v]}`]),['判定',s.outcome]]
 return [['本轮中间点 k',s.k],...vs.map((v,i)=>[`${v} 行（终点 ${vs.join(' / ')}）`,s.matrix[i].join(' / ')]),['判定',s.outcome]]
}
function status(l,f,v){
 const s=f.state
 if(l.algorithm==='topo')return s.done.includes(v)?'已输出':`入度 ${s.values[v]}`
 if(l.algorithm==='prim')return s.done.includes(v)?'已入树':`key ${s.values[v]}`
 if(l.algorithm==='kruskal')return `集合 ${s.components[v]}`
 if(l.algorithm==='dijkstra')return `${s.done.includes(v)?'确定':'暂定'} ${s.values[v]}`
 return s.k===v?'本轮中转 k':''
}
function groups(l,f){
 const s=f.state
 if(l.algorithm==='topo')return `<div class="graph-summary"><p><span>候选队列 · 队头 → 队尾</span><strong>${esc(join(s.ready))}</strong></p><p><span>已经输出</span><strong>${esc(join(s.order))}</strong></p></div>`
 if(l.algorithm==='prim'||l.algorithm==='kruskal')return `<div class="graph-summary"><p><span>${l.algorithm==='prim'?'已入树集合 S':'当前连通分量'}</span><strong>${esc(l.algorithm==='prim'?set(s.done):Object.values(s.components).filter((x,i,a)=>a.indexOf(x)===i).map(c=>set(Object.keys(s.components).filter(v=>s.components[v]===c))).join(' '))}</strong></p><p><span>已选边 / 总权</span><strong>${s.selected.length} / ${s.total}</strong></p></div>`
 if(l.algorithm==='dijkstra')return `<div class="graph-summary"><p><span>已确定的顶点</span><strong>${esc(join(s.order))}</strong></p><p><span>固定源点</span><strong>A · 比累计距离</strong></p></div>`
 return `<div class="graph-summary"><p><span>本轮允许的中间点 k</span><strong>${esc(s.k)}</strong></p><p><span>矩阵含义</span><strong>行：起点 → 列：终点</strong></p></div>`
}
export function graphDiagram(l,f){
 const g=l.graph,s=f.state,points=Object.fromEntries(g.nodes.map(n=>[n.id,n])),active=f.activeEdges||[],selected=s.selected||[],candidate=f.candidateEdges||[]
 let body=''
 const edges=[...g.edges].sort((a,b)=>Number(active.includes(a.id))-Number(active.includes(b.id)))
 for(const e of edges){
  const a=points[e.u],b=points[e.v],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,r=30
  const reciprocal=g.edges.some(other=>other.u===e.v&&other.v===e.u),bend=reciprocal?46:0,cx=(a.x+b.x)/2-uy*bend,cy=(a.y+b.y)/2+ux*bend
  const start={x:a.x+ux*r,y:a.y+uy*r},end={x:b.x-ux*(g.directed?35:r),y:b.y-uy*(g.directed?35:r)}
  const d=bend?`M${start.x} ${start.y} Q${cx} ${cy} ${end.x} ${end.y}`:`M${start.x} ${start.y} L${end.x} ${end.y}`
  const state=active.includes(e.id)?'current':s.removed.includes(e.id)?'removed':s.rejected.includes(e.id)?'rejected':selected.includes(e.id)?'selected':candidate.includes(e.id)?'candidate':''
  const cls=`graph-edge ${state} ${g.directed?'graph-directed':''}`
  body+=`<path d="${d}" class="${cls}"/><title>${esc(edgeName(l,e.id))}：${esc({current:'本步检查',removed:'已删除',rejected:'因成环丢弃',selected:'已选',candidate:'跨越当前集合的候选边'}[state]||'未处理')}</title>`
  if(state==='current'&&!s.rejected.includes(e.id))body+=`<path d="${d}" class="graph-pulse" aria-hidden="true"/>`
  if(g.weighted){const ratio=(e.id==='B-C'&&l.algorithm==='floyd')||e.id==='D-A' ? .34 : .5;let x=a.x+dx*ratio-uy*(bend/2+14),y=a.y+dy*ratio+ux*(bend/2+14);if(e.id==='C-E'&&g.nodes.length===5){x-=18;y+=9}body+=`<g class="graph-weight ${state}"><rect x="${x-17}" y="${y-15}" width="34" height="28" rx="6"/>${text(x,y+5,e.w)}</g>`}
  if(s.rejected.includes(e.id))body+=text((a.x+b.x)/2,(a.y+b.y)/2-15,'×','graph-reject-mark')
 }
 for(const n of g.nodes){const done=s.done.includes(n.id),current=f.activeNode===n.id,ready=s.ready.includes(n.id),changed=f.updated?.includes(n.id),order=s.order.indexOf(n.id),cls=`graph-node ${done?'done':''} ${ready?'ready':''} ${current?'current':''} ${changed?'changed':''}`;body+=`<g class="${cls}"><circle cx="${n.x}" cy="${n.y}" r="28"/>${text(n.x,n.y+7,n.id)}${text(n.x,n.y+51,status(l,f,n.id),'graph-node-value')}${order>=0?`<circle class="graph-order" cx="${n.x+22}" cy="${n.y-25}" r="12"/>${text(n.x+22,n.y-21,order+1,'graph-order-value')}`:''}</g>`}
 const summary=graphStateRows(l,f).map(([a,b])=>`${a}：${b}`).join('；')
 let html=groups(l,f)+`<svg class="graph-svg" viewBox="0 0 680 ${l.algorithm==='topo'?330:395}" role="img" aria-label="${esc(l.title+'。'+f.title+'。'+summary)}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>${body}</svg>`
 html+=`<div class="graph-legend"><span><i class="current"></i>${l.algorithm==='floyd'?'本步路径':'本步检查'}</span>${l.algorithm==='floyd'?'<span>k：本轮允许的中间点</span>':`<span><i class="selected"></i>${l.algorithm==='topo'?'已输出':l.algorithm==='dijkstra'?'已确定':'已选'}</span>`}${l.algorithm==='topo'?'<span><i class="removed"></i>虚线：已删边</span>':l.algorithm==='kruskal'?'<span>× 成环丢弃</span>':l.algorithm==='prim'?'<span><i class="candidate"></i>虚线：跨集合候选</span>':''}</div>`
 if(f.calculation)html+=`<p class="graph-calculation">${esc(f.calculation)}</p>`
 if(l.algorithm==='kruskal')html+=`<div class="graph-edge-list" aria-label="按权排序的边">${[...g.edges].sort((a,b)=>a.w-b.w||a.id.localeCompare(b.id)).map(e=>`<span class="${active.includes(e.id)?'current':''} ${s.selected.includes(e.id)?'selected':s.rejected.includes(e.id)?'rejected':''}">${esc(edgeName(l,e.id))}<small>${s.selected.includes(e.id)?'✓ 已选':s.rejected.includes(e.id)?'× 成环':'待检查'}</small></span>`).join('')}</div>`
 if(l.algorithm==='floyd')html+=`<div class="lab-table graph-matrix"><table aria-label="当前距离矩阵"><thead><tr><th scope="col">起点 ↓ / 终点 →</th>${g.nodes.map(n=>`<th scope="col" class="${s.k===n.id?'matrix-k':''}">${esc(n.id)}</th>`).join('')}</tr></thead><tbody>${s.matrix.map((row,i)=>`<tr><th scope="row" class="${s.k===g.nodes[i].id?'matrix-k':''}">${esc(g.nodes[i].id)}</th>${row.map((v,j)=>`<td class="${i===f.i&&j===f.j?'matrix-updated':(i===f.i&&j===f.k)||(i===f.k&&j===f.j)?'matrix-source':''}">${esc(v)}${i===f.i&&j===f.j?`<small>← ${esc(f.old)}</small>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table><p>橙色格为本步更新；有色边框格用于取两段距离，计算式取上一轮值。点“完整过程表”可逐轮核对。</p></div>`
 return html
}
