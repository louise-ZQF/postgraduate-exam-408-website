// Teaching traces: every decision and update is a separate, immutable snapshot.
const snap=(title,why,state,extra={})=>structuredClone({title,why,state,...extra})
const ids=g=>g.nodes.map(n=>n.id)
const edge=(u,v,w=1)=>({id:u+'-'+v,u,v,w})
const label=(e,directed=false)=>e.u+(directed?'→':'—')+e.v
const num=v=>v==='∞'?Infinity:v
const empty=g=>({done:[],selected:[],rejected:[],removed:[],order:[],ready:[],values:Object.fromEntries(ids(g).map(v=>[v,'∞'])),parent:Object.fromEntries(ids(g).map(v=>[v,'—'])),total:0,outcome:'进行中'})
export const primOptions=['2017 真题 · 从 A 开始','同图 · 从 C 开始','同图 · Kruskal 选边','不连通图','含负权的无向图']
export const topoOptions=['多个候选 · 队列顺序','同图 · 另一合法顺序','唯一拓扑序列','有环 · 中途无法继续']
export const dijkstraOptions=['累计距离与单条边权','存在不可达顶点','零权边与等长路径','负权边 · 检查适用条件']
export const floydOptions=['非负权图','负权边 · 无负权环','存在不可达点对','负权环 · 停止判读']
export function examMstGraph(){
 return {directed:false,weighted:true,nodes:[{id:'A',x:340,y:55},{id:'B',x:95,y:170},{id:'C',x:205,y:320},{id:'D',x:475,y:320},{id:'E',x:585,y:170}],edges:[edge('A','B',6),edge('A','E',5),edge('A','D',4),edge('B','C',4),edge('C','E',5),edge('C','D',6),edge('D','E',4)]}
}
const mstSource={year:2017,number:42,doc:'09-数据结构强化题型',anchor:'q-09-9669cae8051a'}
const mstCompare=[['Prim（普里姆）与 Kruskal（克鲁斯卡尔）','Prim 扩展一棵树，比较跨越当前集合的边；Kruskal 在全图边序列中选边，用并查集拒绝成环边。'],['Prim 与 Dijkstra（迪杰斯特拉）','Prim 的 key 是接入当前树的一条边的权值；Dijkstra 的 dist 是从固定源点出发的累计路径长度。'],['相同边权与唯一性','相同边权仅表示可能不唯一。本题虽有重复权值，MST 仍唯一；不能仅凭有同权边断定不唯一。'],['适用与复杂度','最小生成树允许零权、负权边；朴素 Prim 为 O(n²)，Kruskal 的边排序为 O(e log e)。不连通时只能得到生成森林。']]
function mstGraph(option){const g=examMstGraph();if(option==='不连通图')g.edges=g.edges.filter(e=>e.u!=='B'&&e.v!=='B');if(option==='含负权的无向图')g.edges.find(e=>e.id==='A-D').w=-2;return g}
export function prim(option=primOptions[0]){
 if(option==='同图 · Kruskal 选边')return kruskal()
 const g=mstGraph(option),start=option==='同图 · 从 C 开始'?'C':'A',s=empty(g),out=[]
 s.values[start]=0
 out.push(snap('初始化：只把起点的 key 设为 0',`起点 ${start} 的 0 只用于先选中它，不是一条树边。其余 key=∞，parent 尚未确定。`,s,{stage:0}))
 while(s.done.length<g.nodes.length){
  const todo=ids(g).filter(v=>!s.done.includes(v)).sort((a,b)=>num(s.values[a])-num(s.values[b])||a.localeCompare(b)),u=todo[0]
  if(s.values[u]==='∞'){s.outcome='不连通';out.push(snap('没有可接入的顶点，停止',`剩余 ${todo.join('、')} 的 key 全为 ∞ → 与起点所在分量之间没有边，无法得到覆盖全图的 MST。已选边只是该分量的最小生成树。`,s,{stage:3,result:'disconnected'}));break}
  const p=s.parent[u],chosen=g.edges.find(e=>(e.u===p&&e.v===u)||(e.v===p&&e.u===u)),cost=s.values[u]
  s.done.push(u);s.order.push(u);if(chosen){s.selected.push(chosen.id);s.total+=chosen.w}
  const candidates=g.edges.filter(e=>s.done.includes(e.u)!==s.done.includes(e.v)).map(e=>e.id)
  out.push(snap(chosen?`选 ${label(chosen)}，把 ${u} 加入树`:`起点 ${u} 加入树`,chosen?`未入树顶点中 key[${u}]=${cost} 最小 → 接受 ${label(chosen)}。此时总权=${s.total}；还要用 ${u} 更新外部顶点。`:`树的顶点集合 S={${u}}，总权仍为 0；下一步逐条检查它的邻边。`,s,{stage:1,action:'choose',picked:u,cost,activeNode:u,activeEdges:chosen?[chosen.id]:[],candidateEdges:candidates,question:'应该从树内到树外的哪些边中选？最小 key 对应哪个点？'}))
  for(const e of g.edges.filter(e=>e.u===u||e.v===u).sort((a,b)=>label(a).localeCompare(label(b)))){
   const v=e.u===u?e.v:e.u;if(s.done.includes(v))continue
   const old=s.values[v],improved=e.w<num(old)
   if(improved){s.values[v]=e.w;s.parent[v]=u}
   out.push(snap(`检查 ${label(e)}：${improved?'更新':'保持'} key[${v}]`,`比较单条边权 ${e.w} 与原 key[${v}]=${old} → ${improved?`更小，key 改为 ${e.w}，parent 改为 ${u}`:'不更小，保留原候选边'}。这里只比较接入树的边权，不加 key[${u}]。`,s,{stage:2,action:'update',activeNode:v,activeEdges:[e.id],updated:improved?[v]:[],candidateEdges:g.edges.filter(e=>s.done.includes(e.u)!==s.done.includes(e.v)).map(e=>e.id),calculation:`key[${v}]：min(${old}, ${e.w}) = ${s.values[v]}`}))
  }
 }
 if(s.done.length===g.nodes.length){s.outcome='完成';out.push(snap('选齐 n−1 条边，完成 MST',`入树顺序 ${s.order.join(' → ')}；${s.selected.map(id=>label(g.edges.find(e=>e.id===id))).join('，')}，总权 ${s.total}。`,s,{stage:3,result:'complete'}))}
 return {kind:'graph',algorithm:'prim',title:'Prim（普里姆）· 逐轮扩展最小生成树',graph:g,source:option===primOptions[0]||option===primOptions[1]?mstSource:null,intro:`${option.startsWith('2017')||option.startsWith('同图')?'2017 年第 42 题原图重绘；':'教学变式；'}从 ${start} 开始。点下方 key 表示接入当前树的最小边权，parent 表示这条边来自谁。`,condition:'无向带权图。权值相同时按顶点字母序选点；候选边同权时保留先记录者。只有连通图才能得到覆盖全部顶点的 MST。本例使用朴素选点与更新方式。',phases:['初始化','选点入树','更新 key','判断结束'],frames:out,compare:mstCompare,formula:String.raw`$$\mathrm{key}[v]=\min_{u\in S}w(u,v)$$`+'\n\nS 为已经入树的顶点集合；v 在 S 之外。key 不是从起点到 v 的路径总长度。',flow:'起点 key=0，其余 key=∞\n↓\n从未入树顶点中选 key 最小者 u\n├─ key[u]=∞ → 图不连通，停止\n└─ key[u] 有限 → 把 u 加入 S\n   ├─ u 是起点 → 不增加树边\n   └─ 否则 → 选择 parent[u]—u，累计边权\n   ↓\n   检查 u 与树外 v 的边\n   ├─ w(u,v)<key[v] → 更新 key[v] 和 parent[v]\n   └─ 否则 → 保持\n   ↓\n   全部点入树？\n   ├─ 否 → 回到选点\n   └─ 是 → n−1 条边，输出 MST'}
}
export function kruskal(option='2017 真题 · 按权选边'){
 const g=mstGraph(option),s=empty(g),parent=Object.fromEntries(ids(g).map(v=>[v,v])),find=v=>{while(parent[v]!==v)v=parent[v];return v},components=()=>Object.fromEntries(ids(g).map(v=>[v,find(v)])),sorted=[...g.edges].sort((a,b)=>a.w-b.w||a.id.localeCompare(b.id)),out=[]
 s.components=components();s.remaining=sorted.map(e=>e.id)
 out.push(snap('边按权递增排序，每个点各为一个集合',sorted.map(e=>`${label(e)}(${e.w})`).join(' → ')+'。同权边按端点字母序排列，仅用于固定演示顺序。',s,{stage:0}))
 for(const e of sorted){
  const a=find(e.u),b=find(e.v),accept=a!==b;s.remaining.shift()
  if(accept){parent[b]=a;s.selected.push(e.id);s.total+=e.w}else s.rejected.push(e.id)
  s.components=components();s.done=ids(g).filter(v=>s.selected.some(id=>{const e=g.edges.find(e=>e.id===id);return e.u===v||e.v===v}))
  out.push(snap(`${accept?'接受':'丢弃'} ${label(e)}（权 ${e.w}）`,accept?`两端分属集合 ${a}、${b} → 不会成环，合并两集合。已选 ${s.selected.length} 条边，总权 ${s.total}。`:`两端已经同属集合 ${a} → 已有路径连通它们，再加入会成环，因此丢弃。`,s,{stage:accept?2:1,action:accept?'accept':'reject',activeEdges:[e.id],pickedEdge:e.id,roots:[a,b],question:'这条边的两个端点是否已在同一连通分量中？'}))
  if(s.selected.length===g.nodes.length-1)break
 }
 const complete=s.selected.length===g.nodes.length-1;s.outcome=complete?'完成':'最小生成森林'
 out.push(snap(complete?'已选 n−1 条边，停止':'边已检查完，得到最小生成森林',complete?`已选边连接全部 ${g.nodes.length} 个点且无环，总权 ${s.total}；剩余边无需继续选。`:'全图不连通，不能凑出 n−1 条边；各分量分别形成最小生成树，合起来是最小生成森林。',s,{stage:3,result:complete?'complete':'disconnected'}))
 return {kind:'graph',algorithm:'kruskal',title:'Kruskal（克鲁斯卡尔）· 选边与判环',graph:g,source:option==='2017 真题 · 按权选边'?mstSource:null,intro:'与 Prim 使用同一张图，改为按全图边权排序。逐条观察接受、成环丢弃，以及集合的合并。',condition:'无向带权图；同权边按端点字母序固定演示顺序。并查集用来判断两端是否已连通；本图重复权值不导致多棵 MST。',phases:['排序与建集合','判断成环','接受并合并','判断结束'],frames:out,compare:mstCompare,formula:String.raw`$$\mathrm{find}(u)\ne\mathrm{find}(v)\ \Longrightarrow\ \text{接受边并合并集合}$$`,flow:'边按权递增排序；每个顶点单独成集合\n↓\n取下一条边 u—v\n├─ find(u)=find(v) → 加入会成环，丢弃\n└─ find(u)≠find(v) → 接受，合并集合，累计边权\n↓\n已选 n−1 条边？\n├─ 是 → MST 完成，停止\n└─ 否 → 还有边？\n   ├─ 是 → 继续取下一条\n   └─ 否 → 图不连通，输出最小生成森林'}
}
export function topological(option=topoOptions[0]){
 const nodes=[['A',65,75],['B',65,240],['C',245,75],['D',245,240],['E',435,155],['F',615,155]].map(([id,x,y])=>({id,x,y})),unique=option==='唯一拓扑序列',reverse=option==='同图 · 另一合法顺序',cyclic=option.startsWith('有环')
 const g={nodes,directed:true,weighted:false,edges:(unique?[['A','B'],['B','C'],['C','D'],['D','E'],['E','F']]:[['A','C'],['B','C'],['B','D'],['C','E'],['D','E'],['E','F'],...(cyclic?[['E','C']]:[])]).map(ab=>edge(...ab))},s=empty(g),out=[]
 s.values=Object.fromEntries(ids(g).map(v=>[v,g.edges.filter(e=>e.v===v).length]));s.ready=ids(g).filter(v=>s.values[v]===0);if(reverse)s.ready.reverse();s.ambiguous=false
 out.push(snap('统计入度，零入度顶点入队',`队头 → 队尾：${s.ready.join(' → ')||'空'}。入度是当前还没删除的入边数量。只在顶点入度第一次变为 0 时入队。`,s,{stage:0}))
 while(s.ready.length){
  if(s.ready.length>1){s.ambiguous=true;out.push(snap('出现多个零入度候选',`候选 ${s.ready.join('、')} 此刻都可以输出。本例按队头取点；同图改用另一合法顺序可得到不同序列。仍需检查是否能输出全部点，才能认定存在拓扑序。`,s,{stage:1,action:'choice',question:'能选哪些点？这是否已经足以说明图无环？'}))}
  const u=s.ready.shift();s.done.push(u);s.order.push(u)
  out.push(snap(`输出 ${u}`,`${u} 的入度为 0 → 从队头取出，加入输出序列 ${s.order.join(' → ')}。接下来逐条删除它的出边。`,s,{stage:1,action:'output',picked:u,activeNode:u,question:'队头顶点能否输出？删去它后哪些入度需要减少？'}))
  const outgoing=g.edges.filter(e=>e.u===u).sort((a,b)=>a.v.localeCompare(b.v)*(reverse?-1:1))
  for(const e of outgoing){const old=s.values[e.v];s.removed.push(e.id);s.values[e.v]--;const add=s.values[e.v]===0;if(add)s.ready.push(e.v)
   out.push(snap(`删除 ${label(e,true)}，入度 ${old} → ${s.values[e.v]}`,`${e.v} 失去一条未处理入边。${add?`入度变为 0 → ${e.v} 加入队尾`:'入度仍大于 0 → 暂时不能入队'}；已有输出序列不变。`,s,{stage:2,action:'remove',activeNode:e.v,activeEdges:[e.id],updated:[e.v],calculation:`indegree[${e.v}]：${old} − 1 = ${s.values[e.v]}`}))
  }
 }
 const complete=s.order.length===nodes.length;s.unique=complete?!s.ambiguous:null;s.outcome=complete?(s.unique?'唯一拓扑序列':'拓扑序列不唯一'):'有环，无拓扑序列'
 out.push(snap(complete?'输出全部顶点，结束':'队列为空但顶点未输出完，停止',complete?`得到 ${s.order.join(' → ')}。${s.unique?'每次只有一个零入度候选，因此拓扑序唯一。':'曾出现多个零入度候选，因此拓扑序不唯一。'}`:`只输出 ${s.order.length}/${nodes.length} 个点，剩余 ${ids(g).filter(v=>!s.done.includes(v)).join('、')} → 有环，无拓扑序。剩余点也可能只是被环阻塞，不一定每个点本身都在环上。`,s,{stage:3,result:complete?'complete':'cycle'}))
 return {kind:'graph',algorithm:'topo',title:'拓扑排序 · 看入度、候选队列和输出序列',graph:g,intro:'Kahn（卡恩）算法：每次输出一个零入度顶点，再删除它的出边。图为教学示例；“唯一序列”对应 2024 年第 41 题的判定思想。',condition:'有向图；采用先进先出队列。默认初始顶点及邻接点按字母递增入队；“另一合法顺序”改为递减入队。邻接表实现 O(n+e)，2024 年原题给邻接矩阵，对应 O(n²)。',phases:['统计入度','取零入度点','删边并入队','判断结束'],frames:out,compare:[['零入度不等于无出边','零入度表示没有尚未完成的前驱；输出后还要检查它的所有出边。'],['存在与唯一','先判断能否输出 n 点；能输出且每轮恰有一个候选才唯一。多个候选并不等于有环。'],['图与序列','箭头表示先后依赖；图中保留淡虚线作为原始结构，表示该边已在本次排序中删除。']],formula:String.raw`$$\mathrm{indegree}[v]\leftarrow\mathrm{indegree}[v]-1$$`+'\n\n只在删除一条 u→v 时，对终点 v 的入度减 1；不能一次把 v 的所有入度清零。',flow:'统计入度 → 所有零入度顶点入队\n↓\n队列为空？\n├─ 否 → 队头出队，输出 u\n│  → 逐条删除 u→v，indegree[v] 减 1\n│    ├─ 变为 0 → v 入队\n│    └─ 仍大于 0 → 暂不入队\n│  → 回到队列检查\n└─ 是 → 已输出 n 点？\n   ├─ 否 → 有环，无拓扑序列，结束\n   └─ 是 → 每轮候选恰好一个？\n      ├─ 是 → 唯一拓扑序列\n      └─ 否 → 有多个合法拓扑序列'}
}
export function shortestGraph(option=dijkstraOptions[0]){
 const g={directed:true,weighted:true,nodes:[{id:'A',x:90,y:185},{id:'B',x:285,y:65},{id:'C',x:285,y:300},{id:'D',x:565,y:185}],edges:[edge('A','B',2),edge('A','C',5),edge('B','C',4),edge('B','D',8),edge('C','D',1)]}
 if(option==='存在不可达顶点'){g.edges=g.edges.filter(e=>e.v!=='D')}
 if(option==='零权边与等长路径'){g.edges.find(e=>e.id==='B-C').w=0;g.edges.find(e=>e.id==='A-C').w=2}
 if(option.startsWith('负权边'))g.edges.find(e=>e.id==='B-C').w=-4
 return g
}
export function dijkstra(option=dijkstraOptions[0]){
 const g=shortestGraph(option),s=empty(g),out=[];s.values.A=0
 out.push(snap('初始化 dist[A]=0，其余为 ∞','dist 是从固定源点 A 出发的累计距离；尚未确定任何顶点，前驱均未记录。',s,{stage:0}))
 if(g.edges.some(e=>e.w<0)){s.outcome='不满足非负权条件';out.push(snap('发现负权边，本演示拒绝继续','B→C 的权为 −4，违反此处“一次确定后不回退”的 Dijkstra 前提。应改用适用负权边的算法，不能照常把演示结果当作最短路。',s,{stage:3,result:'invalid',activeEdges:['B-C']}))}
 else {
  while(s.done.length<g.nodes.length){
   const todo=ids(g).filter(v=>!s.done.includes(v)).sort((a,b)=>num(s.values[a])-num(s.values[b])||a.localeCompare(b)),u=todo[0]
   if(s.values[u]==='∞'){s.outcome='其余顶点不可达';out.push(snap('最小候选距离仍为 ∞，停止',`剩余 ${todo.join('、')} 从源点 A 不可达。保留 dist=∞、前驱=—，不再选出它们进行松弛。`,s,{stage:3,result:'unreachable'}));break}
   s.done.push(u);s.order.push(u)
   s.selected=g.edges.filter(e=>s.done.includes(e.v)&&s.parent[e.v]===e.u).map(e=>e.id)
   out.push(snap(`确定 ${u}：dist=${s.values[u]}`,`在全部未确定顶点中，${u} 的累计距离最小。非负边权保证它不会再经未确定点变得更短；然后逐条松弛 ${u} 的出边。`,s,{stage:1,action:'settle',picked:u,activeNode:u,activeEdges:s.parent[u]==='—'?[]:[s.parent[u]+'-'+u],question:'比较的是从 A 出发的 dist，还是当前点的一条出边权？'}))
   for(const e of g.edges.filter(e=>e.u===u)){
    if(s.done.includes(e.v))continue
    const old=s.values[e.v],proposal=s.values[u]+e.w,improved=proposal<num(old)
    if(improved){s.values[e.v]=proposal;s.parent[e.v]=u}
    out.push(snap(`松弛 ${label(e,true)}：${improved?'改小距离':'保持原值'}`,`经 ${u} 到 ${e.v} 的累计距离=${s.values[u]}+${e.w}=${proposal}，原 dist[${e.v}]=${old} → ${improved?`更短，距离改为 ${proposal}，前驱改为 ${u}`:'不更短，距离和前驱不变'}。`,s,{stage:2,action:'relax',activeNode:e.v,activeEdges:[e.id],updated:improved?[e.v]:[],calculation:`dist[${e.v}]：min(${old}, ${s.values[u]} + ${e.w}) = ${s.values[e.v]}`}))
   }
  }
  if(s.done.length===g.nodes.length){s.outcome='完成';const paths=ids(g).map(v=>{const path=[v];let p=s.parent[v];while(p!=='—'){path.unshift(p);p=s.parent[p]}return `${path.join(' → ')}：${s.values[v]}`});out.push(snap('全部可达顶点的最短距离已确定',paths.join('；')+'。路径通过前驱逆向回溯，再反转得到；距离相等时可能还有其他路径。',s,{stage:3,result:'complete'}))}
 }
 return {kind:'graph',algorithm:'dijkstra',title:'Dijkstra（迪杰斯特拉）· 累计距离与松弛',graph:g,intro:'教学有向图，源点固定为 A。先确定 dist 最小的点，再逐条比较“旧距离”和“经当前点的距离”。',condition:'本演示使用边权非负的标准确定式 Dijkstra；同距离按字母序确定顶点，相等时保留原前驱。朴素 O(n²)，前驱记录一条最短路径，等长时可能还有其他最短路径。',phases:['初始化距离','确定最近点','松弛出边','判断结束'],frames:out,compare:[['dist 与 key','dist[v] 比较源点到 v 的累计长度；Prim 的 key[v] 只比较一条接入树的边权。'],['暂定与确定','表中“暂定”表示还可能被改小；确定后才锁定为最短距离。'],['松弛与选边','发现更短路径才更新；有邻边不代表一定改变距离，也不代表立即确定其终点。']],formula:String.raw`$$\mathrm{dist}[v]=\min\{\mathrm{dist}[v],\ \mathrm{dist}[u]+w(u,v)\}$$`,flow:'先检查非负权条件\n├─ 有负权边 → 本算法不适用，停止\n└─ 满足 → 源点 dist=0，其余 dist=∞\n   ↓\n   从未确定点中选 dist 最小的 u\n   ├─ dist[u]=∞ → 剩余点不可达，停止\n   └─ 有限 → 确定 u\n      → 逐条检查 u→v（v 尚未确定）\n        ├─ dist[u]+w(u,v)<dist[v] → 更新距离、前驱\n        └─ 否则 → 保持\n      → 全部点确定？\n        ├─ 否 → 回到选点\n        └─ 是 → 完成'}
}
export function floyd(option=floydOptions[0]){
 const g={directed:true,weighted:true,nodes:[{id:'A',x:100,y:80},{id:'B',x:575,y:80},{id:'C',x:100,y:290},{id:'D',x:575,y:290}],edges:[edge('A','B',4),edge('A','C',9),edge('B','C',2),edge('B','D',7),edge('C','D',1),edge('D','A',5)]}
 if(option==='负权边 · 无负权环')g.edges.find(e=>e.id==='B-C').w=-2
 if(option==='存在不可达点对')g.edges=g.edges.filter(e=>e.id!=='D-A')
 if(option==='负权环 · 停止判读'){g.edges.find(e=>e.id==='B-C').w=-5;g.edges.push(edge('C','B',1))}
 const vs=ids(g),s=empty(g),out=[];s.k='—';s.matrix=vs.map(u=>vs.map(v=>u===v?0:'∞'));s.paths=vs.map(u=>vs.map(v=>u===v?[u]:[]))
 for(const e of g.edges){const i=vs.indexOf(e.u),j=vs.indexOf(e.v);s.matrix[i][j]=e.w;s.paths[i][j]=[e.u,e.v]}
 out.push(snap('初始化距离矩阵','对角线为 0，有直接边填边权，无边填 ∞。此时尚不允许任何中间顶点；行是起点，列是终点。',s,{stage:0}))
 for(let k=0;k<vs.length;k++){
  s.k=vs[k];const previous=structuredClone(s.matrix),paths=structuredClone(s.paths)
  out.push(snap(`本轮允许 ${s.k} 作为中间点`,`以前各轮允许的中间点继续可用；本轮对所有起点 i、终点 j 检查 i→${s.k}→j。右侧计算中的两段都取上一轮的值，避免把更新先后误当算法条件。`,s,{stage:1,action:'round',activeNode:s.k}))
  let updates=0,unchanged=0,unreachable=0
  for(let i=0;i<vs.length;i++)for(let j=0;j<vs.length;j++){
   const a=previous[i][k],b=previous[k][j],old=previous[i][j]
   if(a==='∞'||b==='∞'){unreachable++;continue}
   const proposal=a+b
   if(proposal>=num(old)){unchanged++;continue}
   const path=[...paths[i][k],...paths[k][j].slice(1)],activeEdges=path.slice(1).map((v,t)=>path[t]+'-'+v)
   s.matrix[i][j]=proposal;s.paths[i][j]=path;updates++
   out.push(snap(`经 ${s.k} 改小 ${vs[i]}→${vs[j]}`,`上一轮 d[${vs[i]}][${s.k}]=${a}，d[${s.k}][${vs[j]}]=${b}；${a}+${b}=${proposal}<${old} → 距离改为 ${proposal}。图中强调的实际路径为 ${path.join(' → ')}。`,s,{stage:2,action:'update',i,j,k,old,a,b,proposal,path,activeNode:s.k,activeEdges,calculation:`d[${vs[i]}][${vs[j]}]：min(${old}, ${a} + ${b}) = ${proposal}`,question:`允许 ${s.k} 中转后，哪一项距离会缩短？比较的是哪两段之和？`}))
  }
  out.push(snap(`${s.k} 轮结束：更新 ${updates} 项`,`本轮检查 ${vs.length**2} 个点对：${updates} 项变短，${unchanged} 项候选不更短，${unreachable} 项因至少一段为 ∞ 无法经 ${s.k} 连通。未列为更新的格子保持原值。`,s,{stage:2,action:'round-end',k,updates,unchanged,unreachable}))
  if(s.matrix.some((row,i)=>num(row[i])<0)){s.outcome='检测到负权环';out.push(snap('出现负的对角线，停止判读有限最短路','存在 d[v][v]<0 → 图中有负权环。能够到达该环、且可从环到达终点的点对没有有限最短距离；不要把当前矩阵当作全部点对的最短路答案。',s,{stage:3,result:'negative-cycle'}));break}
 }
 if(s.outcome==='进行中'){s.outcome='完成';out.push(snap('所有顶点都已轮流作为中间点','最终矩阵给出任意起点到终点的最短距离；∞ 表示不可达。路径另存于每个点对的记录中。',s,{stage:3,result:'complete'}))}
 return {kind:'graph',algorithm:'floyd',title:'Floyd（弗洛伊德）· 矩阵与中转路径同步',graph:g,intro:'教学有向图。固定一个中间点 k，逐项比较距离；每次真正变短都单独展示，未变项在每轮末汇总。',condition:'可有负权边；受负权环影响的点对没有有限最短距离。k 必须在最外层，时间 O(n³)、距离矩阵空间 O(n²)。为清楚展示逐轮含义，本演示保留上一轮矩阵作比较；无负权环时等价于标准原地更新。',phases:['初始化矩阵','固定中转 k','比较并更新','判断结束'],frames:out,compare:[['k 是允许的中间点','不是只计算从 k 出发的最短路；每轮要枚举全部起点 i 和终点 j。'],['∞ 不能当普通数乱加','只要 i→k 或 k→j 不可达，这条候选路线就不可用。'],['负权边与负权环','负权边可以存在；负对角线说明有负权环，相关点对不能用有限数值作答案。']],formula:String.raw`$$D^{(k)}[i,j]=\min\{D^{(k-1)}[i,j],\ D^{(k-1)}[i,k]+D^{(k-1)}[k,j]\}$$`+'\n\n这里 k 表示本轮新允许的顶点，初始矩阵只含直接边；两个相加的距离都来自上一轮。',flow:'建立初始矩阵：自身 0，直接边为权值，无边 ∞\n↓\n固定下一个中间点 k\n↓\n逐对枚举起点 i、终点 j\n├─ i→k 或 k→j 为 ∞ → 不能经 k，保持\n└─ 两段均有限 → 比较旧距离与两段之和\n   ├─ 经 k 更短 → 更新距离和路径\n   └─ 否则 → 保持\n↓\n本轮全部点对检查完 → 检查对角线\n├─ 存在负值 → 有负权环，停止判读有限最短路\n└─ 无负值 → 还有中间点？\n   ├─ 有 → 回到固定 k\n   └─ 无 → 输出最终距离矩阵'}
}
