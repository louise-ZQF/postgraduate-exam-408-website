const esc=s=>String(s??'—').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const readable=v=>Array.isArray(v)?v.map(x=>typeof x==='object'?JSON.stringify(x):x).join(' → ')||'空':v&&typeof v==='object'?Object.entries(v).map(([k,x])=>`${k}=${readable(x)}`).join('；'):String(v??'—')
export const traceStateRows=(_l,f)=>{const rows=Object.entries(f.state).map(([k,v])=>[k,readable(v)]),g=f.view?.tree;if(g){const names=new Map(g.nodes.map(n=>[n.id,n.label]));rows.push(['树的链接',g.nodes.map(n=>g.binary?`${n.label}：左=${names.get(n.children?.[0])||'空'}，右=${names.get(n.children?.[1])||'空'}`:`[${n.label}] → ${n.children?.map(id=>names.get(id)).join('／')||'叶'}`).join('；')||'空树'])}return rows}
function treeDiagram(tree){
 if(!tree.root)return '<p class="trace-empty">空树</p>'
 const byId=new Map(tree.nodes.map(n=>[n.id,n])),positions=new Map();let leaf=0,maxDepth=0
 function layout(id,depth){const n=byId.get(id);maxDepth=Math.max(maxDepth,depth);const children=n.children||[];const xx=children.length?children.map(c=>c?layout(c,depth+1):leaf++).reduce((a,b)=>a+b,0)/children.length:leaf++;positions.set(id,{xx,depth});return xx}
 for(const root of tree.roots||[tree.root]){layout(root,0);if(tree.roots?.length>1)leaf++}const width=Math.max(600,leaf*140),height=Math.max(180,(maxDepth+1)*110+40),scale=(width-120)/Math.max(1,leaf-1),p=id=>({x:60+positions.get(id).xx*scale,y:42+positions.get(id).depth*110})
 if(leaf===1)for(const v of positions.values())v.xx=.5
 let body=''
 for(const n of tree.nodes){const a=p(n.id);for(const child of (n.children||[]).filter(Boolean)){const b=p(child);body+=`<path d="M${a.x} ${a.y+20}L${b.x} ${b.y-20}" class="trace-tree-edge"/>`}}
 for(const edge of tree.threads||[]){const a=p(edge.from),b=p(edge.to),bend=edge.label==='前驱'?-45:45;body+=`<path d="M${a.x+bend/3} ${a.y+5} Q${(a.x+b.x)/2+bend} ${(a.y+b.y)/2-35} ${b.x+bend/3} ${b.y+5}" class="trace-thread trace-directed"/>`}
 for(const n of tree.nodes){const {x,y}=p(n.id),w=Math.max(44,n.label.length*15+24);body+=`<g class="trace-tree-node ${tree.active?.includes(n.id)?'current':''} ${n.color==='R'?'rb-red':n.color==='B'?'rb-black':''}"><rect x="${x-w/2}" y="${y-22}" width="${w}" height="44" rx="12"/><text x="${x}" y="${y+7}" text-anchor="middle">${esc(n.label)}</text>${n.color?`<text x="${x+w/2+9}" y="${y-20}" class="trace-tree-note">${n.color==='R'?'红':'黑'}</text>`:''}${n.note?`<text x="${x}" y="${y+44}" text-anchor="middle" class="trace-tree-note">${esc(n.note)}</text>`:''}</g>`}
 return `<svg class="trace-tree" viewBox="0 0 ${width} ${height}" role="img" aria-label="当前树结构；实线连接父结点与孩子，紫色虚箭头表示前驱或后继线索，橙色框为本步操作对象，完整结构与数值见下方表。">${tree.threads?.length?'<defs><marker id="thread-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>':''}${body}</svg>`
}
function networkDiagram(g){
 const nodes=new Map(g.nodes.map(n=>[n.id,n])),has=(list,u,v)=>list?.some(e=>e[0]===u&&e[1]===v||!g.directed&&e[0]===v&&e[1]===u)
 let body=''
 for(const [u,v]of g.edges){const a=nodes.get(u),b=nodes.get(v),dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),current=has(g.activeEdges,u,v),chosen=has(g.selectedEdges,u,v);body+=`<path d="M${a.x+dx/d*29} ${a.y+dy/d*29}L${b.x-dx/d*29} ${b.y-dy/d*29}" class="graph-edge ${current?'current':chosen?'selected':''} ${g.directed?'trace-directed':''}"/>`}
 for(const n of g.nodes)body+=`<g class="graph-node ${g.active?.includes(n.id)?'current':''}"><circle cx="${n.x}" cy="${n.y}" r="28"/><text x="${n.x}" y="${n.y+8}" text-anchor="middle">${esc(n.id)}</text></g>`
 return `<svg class="trace-network" viewBox="0 0 690 330" role="img" aria-label="图的遍历；橙色为当前检查对象，绿线是已经选择的生成树边。"><defs><marker id="trace-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>${body}</svg>`
}
export function traceDiagram(l,f){
 const v=f.view||{};let html=''
 if(v.positions)html+=positionDiagram(v.positions)
 if(v.tree)html+=`<div class="trace-tree-scroll">${treeDiagram(v.tree)}</div>`
 if(v.network)html+=networkDiagram(v.network)
 for(const r of v.rows||[])html+=`<div class="trace-row"><p>${esc(r.label)}</p><div class="trace-cells">${r.items.map((item,i)=>`<span class="trace-cell ${item.current?'current':''} ${item.done?'done':''}"><small>${esc(item.index??i)}</small><strong>${esc(item.text)}</strong>${item.note?`<small>${esc(item.note)}</small>`:''}</span>`).join('')}</div></div>`
 if(v.timeline?.length){const end=Math.max(...v.timeline.map(x=>x.end)),lanes=v.timeline.some(x=>x.name.startsWith('I/O'))?['I/O','CPU']:['全部'];html+=`<div class="trace-time-scroll" aria-label="执行时间线">${lanes.map(lane=>`<div class="trace-timeline" style="grid-template-columns:repeat(${end},minmax(32px,1fr))">${v.timeline.filter(x=>lane==='全部'||x.name.startsWith(lane)).map(x=>`<span style="grid-column:${x.start+1} / ${x.end+1}"><small>${x.start} → ${x.end}</small><strong>${esc(x.name)}</strong></span>`).join('')}</div>`).join('')}</div>`}
 if(v.table)html+=`<div class="lab-table"><table><thead><tr>${v.table.heads.map(s=>`<th scope="col">${esc(s)}</th>`).join('')}</tr></thead><tbody>${v.table.rows.map(r=>`<tr>${r.map(s=>`<td>${esc(s)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
 if(v.equation)html+=`<p class="graph-calculation">${esc(v.equation)}</p>`
 if(v.route)html+=`<div class="trace-route" aria-label="本步传递过程">${v.route.map((s,i)=>`${i?'<b aria-hidden="true">→</b>':''}<span>${esc(s)}</span>`).join('')}</div>`
 return html||`<div class="trace-route">${traceStateRows(l,f).map(([k,x])=>`<span>${esc(k)}<strong>${esc(x)}</strong></span>`).join('')}</div>`
}

function positionDiagram({nodes,edges,pointers}){
 const order=nodes.includes('S')?['A','S','B']:nodes.includes('H')?['H','A','B','C']:['A','B','C'];
 const xy=Object.fromEntries(nodes.map(n=>[n,[85+order.indexOf(n)*155,115]]));
 let b='';
 for(const [a,z,k] of edges){const [x,y]=xy[a],[xx]=xy[z],back=k==='prior',bend=back?205:55;const d=a===z?`M${x-15} 90 C${x-90} 0 ${x+90} 0 ${x+15} 90`:Math.abs(xx-x)===155&&!back?`M${x+Math.sign(xx-x)*35} ${y}H${xx-Math.sign(xx-x)*35}`:`M${x} ${back?140:90}V${bend}H${xx}V${back?140:90}`;b+=`<path d="${d}" fill="none" stroke="${back?'#7952a0':'#247569'}" stroke-width="2" marker-end="url(#position-arrow)"/><text x="${(x+xx)/2}" y="${back?225:a===z?22:Math.abs(xx-x)===155?106:45}" text-anchor="middle" font-size="14" fill="currentColor">${k||'next'}</text>`}
 for(const n of nodes){const [x,y]=xy[n],labels=Object.entries(pointers).filter(([,v])=>v===n).map(([k])=>k).join(' / ');b+=`<rect x="${x-35}" y="${y-25}" width="70" height="50" rx="8" fill="var(--paper, #fffaf4)" stroke="#a6472b" stroke-width="2"/><text x="${x}" y="${y+7}" text-anchor="middle" fill="currentColor">${n}</text><text x="${x}" y="175" text-anchor="middle" font-size="16" fill="currentColor">${labels}</text>`}
 return `<svg viewBox="0 0 650 245" role="img" aria-label="链表当前链接；下方标注指针，next 箭头指向后继，prior 箭头指向前驱，完整链接见状态表。"><defs><marker id="position-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#247569"/></marker></defs>${b}</svg>`
}
