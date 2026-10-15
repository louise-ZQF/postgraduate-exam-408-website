import {classicOptions, makeClassicExam, aluOptions, exam2024} from './exam-models.js'
import {prim,kruskal,topological,dijkstra,floyd,primOptions,topoOptions,dijkstraOptions,floydOptions} from './graph-models.js'
import {outlineLessons} from './outline-lessons.js'
// Deterministic traces shared by the diagram, explanations and tests.
const copy = v => JSON.parse(JSON.stringify(v))
const frame = (title, why, state, extra = {}) => ({ title, why, state: copy(state), ...copy(extra) })
export function dataPath() {
  const s={PC:100,R0:5,R1:200,MAR:'—',MDR:'—',IR:'—',Y:'—',Z:'—','M[200]':7}
  const out=[frame('初始状态','执行 ADD R0,(R1)：把 R0 加到 R1 所指的存储单元，结果写回该单元。',s)]
  const steps=[
    ['PC 给出取指地址','PC → MAR；本拍传的是地址 100，不是指令内容。',{MAR:100},['pc-mar']],
    ['读入指令，PC 顺序前进','M[100] → MDR；独立 PC 增量器令 PC 从 100 变为 101。',{MDR:'ADD R0,(R1)',PC:101},['mem-mdr','pc-inc']],
    ['指令送入 IR','MDR → IR；IR 中的操作码交给译码部件，后续按 ADD 执行。',{IR:'ADD R0,(R1)'},['mdr-ir']],
    ['取得操作数地址','R1 → MAR；现在 MAR=200，准备访问数据单元。',{MAR:200},['r1-mar']],
    ['读出原内存数据','M[200] → MDR，读到 7；读操作不会把该单元改为 12。',{MDR:7},['mem-mdr']],
    ['保存第一个加数','R0 → Y，暂存 5；单总线一次只让一个源驱动。',{Y:5},['r0-y']],
    ['ALU 做加法','MDR 经总线与 Y 相加，ALU 结果存 Z：7+5=12。',{Z:12},['mdr-alu','y-alu','alu-z']],
    ['准备写回数据','Z → MDR；MAR 仍为 200，地址和数据已经准备好。',{MDR:12},['z-mdr']],
    ['写入内存','发写控制，MDR → M[MAR]；M[200] 从 7 变成 12。',{'M[200]':12},['mdr-mem']],
    ['本条指令结束','下一条指令从 PC=101 取；R0、R1 的原值未被本条指令修改。',{},[]]
  ]
  steps.forEach(([title,why,patch,links],i)=>{Object.assign(s,patch);out.push(frame(title,why,s,{links,question:i===8?'本拍写完后，M[200] 应为多少？':`执行“${title}”时，哪一个部件接收数据？`}))})
  return {kind:'datapath',title:'单总线数据通路 · 逐拍执行',intro:'PC=100，R0=5，R1=200，M[200]=7。指令 ADD R0,(R1) 的含义为 M[R1]←M[R1]+R0。',condition:'采用带 Y、Z 暂存器和独立 PC 增量器的示意模型；按字编址、指令长 1 字，读写各用一个示意节拍。实际节拍与控制信号以题目结构为准。',flow:'PC → MAR → 读指令 → MDR → IR\nR1 → MAR → 读操作数 → MDR\nR0 → Y；Y + MDR → ALU → Z\nZ → MDR → 写 M[MAR] → 返回取指',frames:out,compare:[['部件名称','PC：程序计数器；MAR：存储器地址寄存器；MDR：存储器数据寄存器；IR：指令寄存器；ALU：算术逻辑单元；Y、Z：本图暂存器。'],['地址与内容','MAR 保存访问地址；MDR 保存读出或待写的数据。'],['机器指令与微操作','ADD 是机器指令；各拍的寄存器传送是实现它的微操作。']],formula:'单总线：同一时刻一个源输出，可以由多个目的端同时接收。'}
}
export function criticalPath() {
  const edges=[['A','B',2],['A','C',4],['B','D',3],['C','D',2]],order=['A','B','C','D']
  const s={ve:{A:0,B:'—',C:'—',D:'—'},vl:{A:'—',B:'—',C:'—',D:'—'},activities:[],T:'—'}
  const out=[frame('先检查拓扑顺序','示例顺序 A → B → C → D；每条边的起点都在终点之前。',s,{edges})]
  for(const v of order.slice(1)){const ins=edges.filter(e=>e[1]===v),options=ins.map(([u,,w])=>s.ve[u]+w);s.ve[v]=Math.max(...options);out.push(frame(`正推事件 ${v}`,`取所有前驱到达时间的最大值：${ins.map(([u,,w])=>`${s.ve[u]}+${w}`).join('、')} → ve(${v})=${s.ve[v]}。事件需等所有前置活动完成。`,s,{edges,active:ins.map(e=>e.slice(0,2).join('-')),question:`ve(${v}) 应取哪些候选值的最大值？`}))}
  s.T=s.ve.D;s.vl.D=s.T;out.push(frame('工期与逆推起点','汇点 D 最早在 6 发生 → 工期 T=6，并令 vl(D)=6。',s,{edges,activeNode:'D'}))
  for(const u of ['C','B','A']){const outs=edges.filter(e=>e[0]===u),options=outs.map(([,v,w])=>s.vl[v]-w);s.vl[u]=Math.min(...options);out.push(frame(`逆推事件 ${u}`,`为不耽误任何后续活动，取最小值：${outs.map(([,v,w])=>`${s.vl[v]}−${w}`).join('、')} → vl(${u})=${s.vl[u]}。`,s,{edges,active:outs.map(e=>e.slice(0,2).join('-')),question:`vl(${u}) 为什么取最小值？结果是多少？`}))}
  for(const [u,v,w] of edges){const e=s.ve[u],l=s.vl[v]-w;s.activities.push({edge:`${u}→${v}`,e,l,slack:l-e,critical:l===e});out.push(frame(`检查活动 ${u}→${v}`,`e=ve(${u})=${e}；l=vl(${v})−${w}=${l}；余量 l−e=${l-e} → ${l===e?'关键活动':'非关键活动'}。`,s,{edges,active:[`${u}-${v}`],question:`活动 ${u}→${v} 的时间余量是多少？是否关键？`}))}
  out.push(frame('连出关键路径','A→C 与 C→D 均无时间余量 → 关键路径 A→C→D，总长 4+2=6。',s,{edges,active:['A-C','C-D']}))
  return {kind:'critical',title:'关键路径 · 正推、逆推与判定',intro:'A→B 为 2，A→C 为 4，B→D 为 3，C→D 为 2。点是事件，边是有时长的活动。',condition:'w(u,v) 为活动时长；ve、vl 为事件最早／最迟发生时间，e、l 为活动最早／最迟开始时间。AOE 有向无环网；本例单源单汇。多个汇点可补虚拟汇点；有环时先停止，不能直接套拓扑递推。',flow:'先拓扑排序\n├─ 排不完所有点 → 有环，停止\n└─ 排完 → 正推 ve（取最大）\n   → 汇点 ve 得工期 T\n   → 逆拓扑求 vl（取最小）\n   → 每条边算 e、l\n      ├─ l−e=0 → 标关键活动\n      └─ l−e>0 → 有余量\n   → 连出源至汇关键路径，结束',frames:out,compare:[['事件与活动','ve、vl 是点的发生时间；e、l 是边的开始时间。'],['最长路径与最短工期','活动可并行推进，最长的依赖链约束工程最早结束。']],formula:'$$ve(v)=\\max_{u\\to v}\\{ve(u)+w(u,v)\\},\\quad vl(u)=\\min_{u\\to v}\\{vl(v)-w(u,v)\\}$$\n\n$$e(u,v)=ve(u),\\quad l(u,v)=vl(v)-w(u,v)$$'}
}
export function pageReplacement(policy='LRU') {
  const requests=[7,0,1,2,0,3,0,4],s={slots:[null,null,null],bits:[0,0,0],hand:0,faults:0,hits:0,index:-1,request:'—'},last=new Map(),loaded=new Map()
  const out=[frame('三个空页框','初始页框全空；首次装入也算缺页，只有页框已满才需要置换。',s)]
  requests.forEach((page,t)=>{
    s.index=t;s.request=page;let pos=s.slots.indexOf(page)
    if(pos>=0){s.hits++;s.bits[pos]=1;last.set(page,t);out.push(frame(`访问 ${page}：命中`,`页 ${page} 已在页框 ${pos+1}，不换出任何页。${policy==='LRU'?'更新最近使用次序。':policy==='Clock'?'访问位置为 1。':'FIFO 装入先后次序不变。'}`,s,{activeSlot:pos,result:'hit',question:`页 ${page} 在不在内存？命中会改变哪些记录？` }));return}
    s.faults++;pos=s.slots.indexOf(null);let why='有空页框，直接装入。',scanned=[]
    if(pos<0){
      if(policy==='Clock'){while(s.bits[s.hand]===1){const checked=s.hand;scanned.push(checked);s.bits[checked]=0;s.hand=(checked+1)%3;out.push(frame(`Clock 检查页框 ${checked+1}`,`访问位为 1 → 给第二次机会，清为 0；指针转到页框 ${s.hand+1}，继续查找，暂不换页。`,s,{activeSlot:checked,result:'scan',question:'访问位为 1 时，应换出还是继续扫描？'}))}pos=s.hand;why=`从时钟指针查找${scanned.length?`，清除页框 ${scanned.map(x=>x+1).join('、')} 的访问位，再回到访问位为 0 的位置`:''}；换出 ${s.slots[pos]}。`}
      else {const metric=policy==='FIFO'?loaded:last;pos=s.slots.reduce((best,p,i)=>metric.get(p)<metric.get(s.slots[best])?i:best,0);why=`${policy==='FIFO'?'最早装入':'最近最久未用'}的是 ${s.slots[pos]}，将它换出。`}
    }
    const victim=s.slots[pos];s.slots[pos]=page;s.bits[pos]=1;last.set(page,t);loaded.set(page,t);if(policy==='Clock')s.hand=(pos+1)%3
    out.push(frame(`访问 ${page}：缺页`,why+`装入 ${page}，累计缺页 ${s.faults} 次。`,s,{activeSlot:pos,result:'fault',victim,scanned,question:`访问 ${page} 是否缺页？若要换页，应选哪一页？`}))
  })
  out.push(frame('统计结果',`缺页 ${s.faults} 次 / 访问 ${requests.length} 次；命中 ${s.hits} 次。命中次数与缺页次数之和应等于访问次数。`,s))
  return {kind:'pages',title:'页面置换 · '+({LRU:'LRU 最近最久未使用',FIFO:'FIFO 先进先出',Clock:'Clock 时钟置换'}[policy]),intro:'3 个初始空页框，访问串：'+requests.join(' → '),condition:'本例只演示选择牺牲页，忽略脏页写回时延；Clock 命中置访问位 1，装入后指针前进到下一框。',requests,policy,flow:'取下一次页面访问\n├─ 页已驻留 → 命中，更新策略状态\n└─ 不驻留 → 缺页次数加 1\n   ├─ 有空框 → 直接装入\n   └─ 无空框 → 选牺牲页\n      ├─ 脏页 → 先写回\n      └─ 干净页 → 直接换出\n      → 调入新页，更新页表\n还有访问？ 是 → 回到开头\n           否 → 统计缺页率，结束',frames:out,compare:[['FIFO 与 LRU','FIFO 记装入时刻，命中不更新；LRU 记最后访问，命中也更新。'],['缺页与置换','有空框时也会缺页；缺页不一定伴随换出。']],formula:'$$\\text{缺页率}=\\frac{\\text{缺页次数}}{\\text{页面访问次数}}$$'}
}
export function banker(unsafe=false) {
  const s={work:unsafe?0:1,available:unsafe?0:1,finish:[false,false],allocation:[1,1],need:unsafe?[1,1]:[1,2],sequence:[],checking:'—'}
  const out=[frame('初始化 Work 与 Finish',`一种资源，P1 已有 1、还需 1；P2 已有 1、还需 ${s.need[1]}。Work 复制 Available，两个 Finish 都为 false。`,s)]
  let progress=true
  while(progress&&s.finish.some(x=>!x)) {progress=false;for(let i=0;i<2;i++){if(s.finish[i])continue;s.checking=`P${i+1}`
    const can=s.need[i]<=s.work;out.push(frame(`检查 P${i+1}`,`Need=${s.need[i]} ${can?'≤':'>'} Work=${s.work} → ${can?'可假设完成':'本轮不能完成，继续检查其他未完成进程'}。`,s,{result:can?'yes':'no',question:`P${i+1} 的剩余需求能否由 Work 满足？`}))
    if(can){s.work+=s.allocation[i];s.finish[i]=true;s.sequence.push(`P${i+1}`);progress=true;out.push(frame(`假设 P${i+1} 完成`,`Work 加上它原先持有的 Allocation=1，得到 ${s.work}；归还不是加 Need，也不是加 Max。`,s))}
  }}
  const safe=s.finish.every(Boolean);out.push(frame(safe?'找到安全序列':'找不到安全序列',safe?`安全序列 ${s.sequence.join('→')}；这是可完成性证明，不要求真实调度必须按此顺序。`:'完整一轮都找不到能完成者 → 状态不安全。安全性检查失败本身不等于已经发生死锁。',s,{result:safe?'safe':'unsafe'}))
  return {kind:'banker',title:'银行家算法 · '+(unsafe?'不安全分支':'安全序列'),intro:`Available=${unsafe?0:1}；P1、P2 的 Allocation 均为 1，Need 分别为 1、${s.need[1]}。这里只运行安全性检查。`,condition:'一种可重复使用的资源，进程最大需求已声明。本例为安全检查快照，不在检查中真实改变 Available 或实际分配资源。',flow:'Work ← Available，Finish 全置 false\n查找未完成且 Need≤Work 的进程\n├─ 找到 → 假设它完成\n│  → Work += Allocation，标记完成\n│  → 继续查找\n└─ 一轮找不到\n   ├─ 全部 Finish=true → 安全，结束\n   └─ 仍有未完成者 → 不安全，结束',frames:out,compare:[['Need 与 Allocation','Need 用于判断能否完成；完成后 Work 加 Allocation。'],['不安全与死锁','不安全指无法保证后续全部完成，不能直接画等号为已经死锁。']],formula:'$$Need_i=Max_i-Allocation_i,\\qquad Work\\leftarrow Work+Allocation_i$$'}
}
export function pipeline(stall=true) {
  const rows=stall?[['IF','ID','EX','MEM','WB','','',''],['','IF','ID','等候','EX','MEM','WB',''],['','','IF','冻结','ID','EX','MEM','WB']]:[['IF','ID','EX','MEM','WB','',''],['','IF','ID','EX','MEM','WB',''],['','','IF','ID','EX','MEM','WB']]
  const instructions=stall?['I1: Load R1,[R2]','I2: Add R3,R1,R4','I3: Sub R5,R6,R7']:['I1: Add R1,R2,R3','I2: Sub R4,R5,R6','I3: Add R7,R8,R9']
  const out=[frame('初始：尚未取指','观察每个周期中三条指令分别处于哪一段；空格表示尚未进入或已经完成。',{cycle:0},{rows,instructions})]
  for(let cycle=1;cycle<=rows[0].length;cycle++){
    const note=stall&&cycle===4?'Load 的结果要到 MEM 结束才产生，而紧邻 Add 的 EX 本周期就要用 → Add 等一拍，冻结前端，EX 留气泡；Load 继续前进。':stall&&cycle===5?'上一周期的 Load 数据已就绪 → 经旁路供给 Add 的 EX，前端恢复推进。':`本周期：${instructions.map((_,i)=>rows[i][cycle-1]?`I${i+1} 在 ${rows[i][cycle-1]}`:null).filter(Boolean).join('；')}。`
    out.push(frame(`第 ${cycle} 个周期`,note,{cycle},{rows,instructions,question:stall&&cycle===4?'Load 尚未结束访存，Add 能否马上进入 EX？':`预测本周期三条指令所处的流水段。`}))
  }
  return {kind:'pipeline',title:'五段流水线 · '+(stall?'Load-use 停顿':'独立指令'),intro:stall?'三条指令中，I2 使用 I1 刚加载的 R1；I3 与它们无数据依赖。':'三条指令无数据依赖，逐周期看流水线填充与排空。',condition:'IF→ID→EX→MEM→WB，各段 1 周期，指令／数据存储分离，有常规旁路；寄存器写回前半拍、读后半拍。本例不含分支与其他冲突。',flow:'检查当前周期的资源与数据\n├─ 资源冲突 → 增加资源或停顿\n├─ 数据已就绪 → 正常执行／旁路\n└─ 数据未就绪\n   ├─ 来得及旁路 → 继续\n   └─ 本周期来不及 → 消费者停顿\n      → 前端按规则冻结，插入气泡\n      → 生产者继续，下一拍重新检查\n全部指令完成 WB → 结束',frames:out,compare:[['流水段名称','IF：取指；ID：译码／读寄存器；EX：执行／算地址；MEM：访存；WB：写回。'],['停顿与全部冻结','等待者及前端可能停住，生产者必须继续，才能产生待用数据。'],['吞吐量与单条延迟','流水提高连续完成速率，一条指令仍需经过其必要阶段。']],formula:'$$T=(k+n-1+s)\\Delta t$$\n\nk 为段数，n 为指令数，s 为额外停顿周期数，Δt 为流水线时钟周期。仅用于各段一拍、连续发射的这一模型。本例 k=5，n=3；独立指令 s=0，共7拍；Load-use例 s=1，共8拍。'}
}
export function slidingWindow(sr=false) {
  const s={sent:[],received:[],buffered:[],base:0,receiverBase:0,lost:1,retransmitted:[]},out=[frame('窗口起点为 0','窗口大小为 4，发送帧 0～3，其中帧 1 丢失；其余报文与确认按演示顺序到达。',s)]
  for(let i=0;i<4;i++) {s.sent.push(i);out.push(frame(`发送帧 ${i}`,i===1?'帧 1 在链路中丢失，接收方看不到它。':`帧 ${i} 发出，尚不能仅凭“发出”就推进发送窗口。`,s,{packet:i,result:i===1?'lost':'sent',question:`帧 ${i} 发出后，窗口是否一定可以前移？`}))}
  s.received=[0];s.receiverBase=1;s.base=1;out.push(frame('帧 0 收到并确认','帧 0 正确到达，ACK 返回后发送基序号前移到 1；接收方下一期待也为 1。',s))
  for(let i of [2,3]){if(sr)s.buffered.push(i);out.push(frame(`帧 ${i} 失序到达`,sr?`窗口内的帧 ${i} 正确 → 缓存并单独确认；缺少帧 1，仍不能按序交付后续帧。`:`GBN 接收窗口为 1 → 丢弃失序帧 ${i}，重复确认最后按序收到的帧 0。`,s,{packet:i,result:sr?'buffered':'discarded',question:`缺帧 1 时，${sr?'SR':'GBN'} 如何处理帧 ${i}？`}))}
  s.retransmitted=sr?[1]:[1,2,3];out.push(frame('帧 1 超时',sr?'只补发帧 1；帧 2、3 已被正确接收并确认，无需重传。':'从帧 1 起补发 1、2、3；这些帧都还未获得新的累计确认。',s))
  if(sr){s.received=[0,1,2,3];s.buffered=[];s.receiverBase=4;s.base=4;out.push(frame('缺口补齐，连续交付','帧 1 收到后与缓存的 2、3 连成连续前缀 → 按序交付 1～3，确认返回后窗口前移至 4。',s))}
  else {for(let i of [1,2,3]){s.received.push(i);s.receiverBase=i+1;s.base=i+1;out.push(frame(`重传帧 ${i} 按序到达`,`接收并交付帧 ${i}，对应确认返回 → 发送方 base=${s.base}，接收方下一期待 ${s.receiverBase}。`,s))}}
  out.push(frame('本组发送结束',`${sr?'SR':'GBN'} 最终都按序交付 0～3；本次分别补发${sr?'1 帧':'3 帧'}，差别来自是否保留失序帧。`,s))
  return {kind:'window',title:'滑动窗口 · '+(sr?'SR 选择重传':'GBN 后退 N 帧'),intro:'0、1、2、3 四帧，帧 1 丢失；比较丢失之后的缓存、确认和补发。',condition:`帧序号使用3位（0～7），窗口大小4；${sr?'SR发送／接收窗口均为4，满足半序号空间约束':'GBN发送窗口4、接收窗口1'}。${sr?'ACK n 单独确认帧 n；收到失序帧的确认不代表窗口左端立即前进':'ACK n 累计确认最后按序收到的帧 n，与 TCP 确认号表示下一期待字节的约定不同'}；发送基序号在对应 ACK 返回后更新。`,flow:'接收一帧\n├─ 正是下一期待 → 接收并按序交付\n└─ 失序\n   ├─ GBN → 丢弃，重复累计确认\n   └─ SR → 窗口内则缓存、单独确认\n超时？\n├─ GBN → 从超时帧起补发未确认帧\n└─ SR → 只补发该超时帧\n缺口补齐 → 连续交付，推进窗口\n还有待发送数据 → 继续；否则结束',frames:out,compare:[['GBN 与 SR','GBN 丢失序帧，批量回退；SR 保留窗口内失序帧，逐帧补发。'],['已发送与已确认','发出不代表成功；发送窗口左端由确认推进。']],formula:sr?'$$W_s,W_r\\le 2^{k-1}$$\n\n等大发送／接收窗口的 SR 模型，k 为序号位数。':'$$W_s\\le 2^k-1,\\qquad W_r=1$$\n\nGBN 模型，k 为序号位数。'}
}
export function diskSchedule(policy='LOOK') {
  const requests=[40,10,70],initial=50,max=99;let pending=[...requests],pos=initial,path=[],services=[]
  if(policy==='FCFS')path=[...requests]
  else if(policy==='SSTF')while(pending.length){pending.sort((a,b)=>Math.abs(a-pos)-Math.abs(b-pos)||a-b);pos=pending.shift();path.push(pos)}
  else {const right=requests.filter(x=>x>=initial).sort((a,b)=>a-b),left=requests.filter(x=>x<initial).sort((a,b)=>b-a);path=[...right];if(left.length){if(policy==='C-SCAN')path.push(max,0,...left.reverse());else if(policy==='C-LOOK')path.push(...left.reverse());else{if(policy==='SCAN')path.push(max);path.push(...left)}}}
  const s={position:initial,distance:0,done:[],path:[initial]},out=[frame('初始磁头在 50','请求为 40、10、70；初始方向向磁道号增大的方向，磁道范围 0～99。',s)]
  for(const dest of path){const old=s.position,d=Math.abs(dest-old);s.position=dest;s.distance+=d;s.path.push(dest);const service=requests.includes(dest)&&!s.done.includes(dest);if(service){s.done.push(dest);services.push(dest)}out.push(frame(service?`服务请求 ${dest}`:`到物理端点 ${dest}`,`${old} → ${dest}，本段移动 |${dest}−${old}|=${d}，累计 ${s.distance}。${service?'完成一个请求。':'这里只折返，不新增请求数。'}`,s,{question:`下一站是 ${dest} 吗？这一段距离如何计入？`}))}
  out.push(frame('全部请求完成，停止',`完整路径 ${s.path.join('→')}，总移动 ${s.distance}，平均 ${s.distance}/3≈${(s.distance/3).toFixed(2)} 个磁道。`,s))
  return {kind:'disk',title:'磁盘调度 · '+policy,intro:'初始 50，请求按到达顺序为 40、10、70，初始向右，磁道号 0～99。',condition:'只计算机械磁盘寻道距离，忽略旋转和传输时间；所有请求开始时已到达；最后一个请求完成即停止。SSTF 等距时本例取较小磁道号。C-SCAN／C-LOOK 回程不服务，但回程距离计入；若题设不计，须另按题设扣除。',max,requests,flow:'选择未完成请求\n├─ FCFS → 最早到达者\n├─ SSTF → 当前距离最近者\n└─ 扫描类 → 沿指定方向依次服务\n   本方向没有请求\n   ├─ SCAN → 物理端点后折返服务\n   ├─ LOOK → 最后请求处折返服务\n   ├─ C-SCAN → 到物理端点，回另一端点，再同方向服务\n   └─ C-LOOK → 直接回另一侧最远请求，再同方向服务\n全部服务 → 停止，累计距离／请求数',frames:out,compare:[['SCAN／LOOK 与循环版本','循环版本只沿一个方向服务；回程不处理经过的请求，但仍移动。'],['请求数与路径段数','物理端点可能产生额外路段，但不能增加平均距离的分母。']],formula:'$$D=\\sum_{i=1}^{m}|x_i-x_{i-1}|,\\qquad\\overline D=\\frac{D}{n}$$\n\nx₀ 为初始位置，xᵢ 为第 i 段终点，D 为总移动磁道数。本例 n=3 个请求；m 为实际移动段数。'}
}
export const lessons=[
 ...outlineLessons,
 {id:'prim',doc:'01-数据结构',heading:'最小生成树',options:primOptions,make:prim},
 {id:'kruskal',doc:'01-数据结构',heading:'最小生成树',options:['2017 真题 · 按权选边','不连通图'],make:kruskal},
 {id:'topo',doc:'01-数据结构',heading:'拓扑排序',options:topoOptions,make:topological},
 {id:'dijkstra',doc:'01-数据结构',heading:'最短路径',options:dijkstraOptions,make:dijkstra},
 {id:'floyd',doc:'01-数据结构',heading:'最短路径',options:floydOptions,make:floyd},
 {id:'q2017-prim',doc:'09-数据结构强化题型',anchor:'q-09-9669cae8051a',heading:'2017年第42题',options:primOptions.slice(0,3),make:prim},
 {id:'q2024-topo',doc:'09-数据结构强化题型',anchor:'q-09-83d4b8b4f79a',heading:'2024年第41题',options:topoOptions,make:topological},
 {id:'q2009',doc:'10-计组强化题型',anchor:'q-10-0b4feed381cd',heading:'2009年第44题',make:()=>makeClassicExam(classicOptions[0])},
 {id:'q2015a',doc:'10-计组强化题型',anchor:'q-10-9e51170314fb',heading:'2015年第43题',options:classicOptions.slice(1,4),make:makeClassicExam},
 {id:'q2015b',doc:'10-计组强化题型',anchor:'q-10-d9b1e8dfa20a',heading:'2015年第44题',options:classicOptions.slice(1,4),make:makeClassicExam},
 {id:'q2022',doc:'10-计组强化题型',anchor:'q-10-5799e1c9d1ca',heading:'2022年第43题',options:classicOptions.slice(4),make:makeClassicExam},
 {id:'q2024',doc:'10-计组强化题型',anchor:'q-10-a253b8668c2d',heading:'2024年第43题',options:aluOptions,make:exam2024},
 {id:'datapath',doc:'02-计算机组成原理',heading:'单总线结构',options:[...classicOptions,'基础示意'],make:v=>v==='基础示意'?dataPath():makeClassicExam(v)},
 {id:'exam-alu',doc:'02-计算机组成原理',heading:'加法器与算术逻辑部件',options:aluOptions,make:exam2024},
 {id:'critical',doc:'01-数据结构',heading:'关键路径',make:()=>criticalPath()},
 {id:'pages',doc:'03-操作系统',heading:'页面置换',options:['LRU','FIFO','Clock'],make:pageReplacement},
 {id:'banker',doc:'03-操作系统',heading:'死锁的避免（银行家算法）',options:['安全状态','不安全状态'],make:v=>banker(v==='不安全状态')},
 {id:'pipeline',doc:'02-计算机组成原理',heading:'流水线冒险和处理',options:['Load-use 停顿','独立指令'],make:v=>pipeline(v!=='独立指令')},
 {id:'gbn',doc:'04-计算机网络',heading:'后退N帧协议 GBN',options:['GBN','SR'],make:v=>slidingWindow(v==='SR')},
 {id:'sr',doc:'04-计算机网络',heading:'选择重传协议 SR',options:['SR','GBN'],make:(v='SR')=>slidingWindow(v==='SR')},
 {id:'disk',doc:'03-操作系统',heading:'磁盘调度算法',options:['LOOK','SCAN','FCFS','SSTF','C-SCAN','C-LOOK'],make:diskSchedule}
]
