import {recorder,row,arrayView,flow,clone} from './trace-kit.js'
export const scheduleNames=['FCFS 先来先服务','SJF 短作业优先','SRTF 最短剩余时间','HRRN 高响应比优先','非抢占优先级','抢占式优先级','RR 时间片轮转','多级反馈队列','多级队列']
export function scheduling(name=scheduleNames[0]){
 const feedback=name==='多级反馈队列',fixed=name==='多级队列',multi=feedback||fixed,p=(feedback?[[0,7,3],[2,2,1],[3,1,2]]:[[0,5,3],[1,3,1],[2,1,2]]).map(([arrival,burst,priority],i)=>({id:'P'+(i+1),arrival,burst,priority,left:burst,start:null,end:null,level:fixed&&i===0?1:0,used:0})),s={时刻:0,运行:'空闲',已完成:[],就绪队列:[],周转时间:{},带权周转时间:{}},timeline=[],q=[],queues=[[],[],[]],t=recorder({title:'CPU 调度 · '+name,intro:p.map(x=>`${x.id}：到达 ${x.arrival}，服务 ${x.burst}，优先级 ${x.priority}`).join('；'),condition:'单 CPU，无 I/O 阻塞与切换开销；优先级数越小越高，同规则相等按到达时间、进程编号。RR 时间片=2，同一边界先入新到达者再重排到期者。反馈队列时间片 1/2/4，新进程入最高级，低级被高级抢占时保留剩余配额。固定多级队列情形中 P1 固定在 Q2(FCFS)，P2／P3 固定在 Q1(RR，片=1)，Q1 严格优先，不降级。',flow:flow('把本时刻到达者加入就绪队列','按策略选进程；非抢占算法运行到完成，抢占算法在每个到达／时间片边界重评','执行一单位 → 剩余时间减 1\n├─ 为 0 → 记录完成时刻\n├─ 配额用完 → 重新排队／降级\n└─ 否则 → 按策略继续','全部完成 → 完成时刻−到达时刻求周转，再除服务时间'),formula:String.raw`$$T_i=C_i-A_i,\qquad W_i=\frac{T_i}{S_i}$$`},s)
 const emit=(title,why)=>{s.就绪队列=multi?queues.map((q,i)=>`Q${i+1}: ${q.map(x=>x.id).join(',')||'空'}`):q.map(x=>x.id);t.add(title,why,{timeline,table:{heads:['进程','到达','服务','剩余','首次运行','完成'],rows:p.map(x=>[x.id,x.arrival,x.burst,x.left,x.start??'—',x.end??'—'])},rows:[row('就绪队列',s.就绪队列)]})}
 emit('初始','还没有进程执行，时间线从 0 开始。');let running=null,expired=null,clock=0
 while(p.some(x=>x.left>0)&&clock<80){s.时刻=clock
  for(const x of p.filter(x=>x.arrival===clock)){(multi?queues[x.level]:q).push(x);emit(`${x.id} 到达`,'新到达不等于立即获得 CPU，需要按当前调度方式判断。')}
  if(expired){(multi?queues[expired.level]:q).push(expired);expired=null}
  if(multi){const high=queues.findIndex(a=>a.length);if(running&&high>=0&&high<running.level){queues[running.level].unshift(running);running=null}if(!running){const i=queues.findIndex(a=>a.length);if(i>=0)running=queues[i].shift()}}
  else {
   const preempt=name.startsWith('SRTF')||name==='抢占式优先级';if(preempt&&running){q.push(running);running=null}
   if(!running&&q.length){q.sort((a,b)=>{let d=0;if(name.startsWith('SJF'))d=a.burst-b.burst;else if(name.startsWith('SRTF'))d=a.left-b.left;else if(name.startsWith('HRRN'))d=(clock-b.arrival+b.burst)/b.burst-(clock-a.arrival+a.burst)/a.burst;else if(name.includes('优先级'))d=a.priority-b.priority;return name.startsWith('RR')?0:d||a.arrival-b.arrival||a.id.localeCompare(b.id)});running=q.shift();if(name.startsWith('HRRN'))s.本轮响应比=(clock-running.arrival+running.burst)/running.burst}
  }
  if(!running){timeline.push({name:'空闲',start:clock,end:clock+1});clock++;s.时刻=clock;emit('CPU 空闲一单位','没有就绪进程，等待下一到达事件。');continue}
  if(running.start===null)running.start=clock;s.运行=running.id
  const last=timeline.at(-1);if(last?.name===running.id&&last.end===clock)last.end++;else timeline.push({name:running.id,start:clock,end:clock+1})
  running.left--;running.used++;clock++;s.时刻=clock;emit(`${running.id} 执行 [${clock-1},${clock})`,multi?fixed?`固定 Q${running.level+1}：Q1 时间片 1，Q2 为 FCFS；被抢占不会降级。`:`当前 Q${running.level+1}，已经使用 ${running.used}/${2**running.level} 单位配额。`:`剩余 ${running.left}；这里的时间段右端点是执行结束时刻。`)
  if(!running.left){running.end=clock;s.已完成.push(running.id);s.周转时间[running.id]=clock-running.arrival;s.带权周转时间[running.id]=(clock-running.arrival)/running.burst;emit(`${running.id} 完成`,`周转 ${clock}−${running.arrival}=${s.周转时间[running.id]}。`);running=null}
  else if(feedback&&running.used===2**running.level){running.level=Math.min(2,running.level+1);running.used=0;expired=running;running=null}
  else if(fixed&&running.level===0&&running.used===1){running.used=0;expired=running;running=null}
  else if(name.startsWith('RR')&&running.used===2){running.used=0;expired=running;running=null}
 }
 s.运行='全部完成';s.平均周转时间=Object.values(s.周转时间).reduce((a,b)=>a+b,0)/p.length;emit('调度结束','等待时间=周转时间−服务时间；响应时间=首次运行−到达时间，不能与周转混用。');return t.finish()
}

export function partitionAllocation(name='首次适应 FF'){
 const holes=[{start:0,size:20},{start:40,size:12},{start:70,size:30}],s={空闲区:holes,已分配:[],循环起点:0},t=recorder({title:'动态分区 · '+name,intro:'空闲区（起址,大小）：(0,20)、(40,12)、(70,30)，单位 KB；依次申请 12、8、16 KB。',condition:'FF 按地址，NF 从上次位置循环，BF 按可容纳的最小孔，WF 按最大孔。分配拆分空闲区，回收必须按物理相邻判断合并。',flow:flow('检查请求大小','按策略扫描可容纳空闲区\n├─ 无 → 分配失败\n└─ 有 → 切出所需大小，更新剩余孔与搜索起点','回收 → 判断前、后空闲区是否相邻 → 合并／单独插入')},s)
 const emit=(title,why,active=[])=>t.add(title,why,{rows:[row('空闲区（起址:大小）',holes.map(h=>`${h.start}:${h.size}`),active),row('已分配',s.已分配.map(h=>`${h.start}:${h.size}`))]})
 emit('初始','空闲区之间可能已有其他占用区，不能跨越占用区拼凑请求。')
 if(name==='回收与相邻合并'){holes.splice(0,holes.length,{start:0,size:10},{start:20,size:10});s.回收={start:10,size:10};emit('回收 [10,20)','前孔 [0,10)、后孔 [20,30) 均物理相邻。');holes.push(s.回收);holes.sort((a,b)=>a.start-b.start);for(let i=0;i<holes.length-1;){if(holes[i].start+holes[i].size===holes[i+1].start){holes[i].size+=holes[i+1].size;holes.splice(i+1,1);emit('合并一对相邻孔','只能端点相接时合并；继续检查新的相邻关系。',[i])}else i++}}
 else for(const size of [12,8,16]){let candidates=holes.map((h,i)=>({h,i})).filter(x=>x.h.size>=size);if(name.startsWith('最佳'))candidates.sort((a,b)=>a.h.size-b.h.size||a.h.start-b.h.start);else if(name.startsWith('最坏'))candidates.sort((a,b)=>b.h.size-a.h.size||a.h.start-b.h.start);else if(name.startsWith('循环'))candidates.sort((a,b)=>(a.h.start-s.循环起点+100)%100-(b.h.start-s.循环起点+100)%100);if(!candidates.length){emit(`申请 ${size} 失败`,'总空闲量够也可能没有单个足够大的连续区。');continue}const {h,i}=candidates[0],start=h.start;s.已分配.push({start,size});h.start+=size;h.size-=size;s.循环起点=start+size;if(!h.size)holes.splice(i,1);emit(`分配 ${size} KB，起址 ${start}`,'更新剩余空闲区，不把分配量当成孔的原大小。')}
 emit('结束','空闲区与已分配区保持互不重叠；只比较本例，不能断言某策略在所有输入上最优。');return t.finish()
}
export function buddy(){
 const free=[{start:0,size:32}],allocated=[],s={空闲:free,分配:allocated},t=recorder({title:'伙伴分配 · 分裂与合并',intro:'初始一块 32 KB，依次申请 9、5、3 KB，再按 5、3、9 的请求顺序释放。',condition:'按 2 的幂分配，9 KB 实占 16 KB；只有大小相同且互为伙伴的两块可合并，伙伴起址=start XOR size。',flow:flow('请求上取整到 2 的幂','找可用块 → 过大则对半分裂','释放 → 找同级空闲伙伴\n├─ 找到 → 合并并上升一级继续\n└─ 未找到 → 保留当前空闲块')},s)
 const emit=(title,why)=>t.add(title,why,{rows:[row('空闲块 起址:大小',free.map(x=>`${x.start}:${x.size}`)),row('占用块 起址:大小',allocated.map(x=>`${x.start}:${x.size}`))]})
 emit('初始','整个 32 KB 块空闲。')
 for(const req of [9,5,3]){s.工作块=null;const size=2**Math.ceil(Math.log2(req));free.sort((a,b)=>a.size-b.size||a.start-b.start);const i=free.findIndex(x=>x.size>=size),block=free.splice(i,1)[0];while(block.size>size){block.size/=2;s.工作块={...block};free.push({start:block.start+block.size,size:block.size});free.push({...block});emit(`分裂为两块 ${block.size} KB`,'继续分裂较低地址的一块，另一块保留空闲。');free.splice(free.findIndex(x=>x.start===block.start&&x.size===block.size),1)}allocated.push({...block,req});s.工作块=null;emit(`申请 ${req}，分配 ${size} KB`,`内部碎片 ${size-req} KB。`)}
 for(const req of [5,3,9]){const i=allocated.findIndex(x=>x.req===req);let b=allocated.splice(i,1)[0];free.push({start:b.start,size:b.size});emit(`释放请求 ${req} 对应块`,'先归还实际分配大小，再检查伙伴。');while(true){const buddyStart=b.start^b.size,j=free.findIndex(x=>x.start===buddyStart&&x.size===b.size);if(j<0)break;free.splice(j,1);free.splice(free.findIndex(x=>x.start===b.start&&x.size===b.size),1);b={start:Math.min(b.start,buddyStart),size:b.size*2};free.push({...b});emit(`伙伴合并成 ${b.size} KB`,'同大小、正确伙伴，才能合并；继续向上检查。')}}return t.finish()
}

export function bankerMulti(name='允许请求'){
 const allocation=[[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]],max=[[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]],original={available:[3,3,2],allocation:clone(allocation)},available=[3,3,2],need=max.map((r,i)=>r.map((x,j)=>x-allocation[i][j])),request=name==='允许请求'?[1,0,2]:[3,3,0],process=name==='允许请求'?1:4,s={Available:available,Allocation:allocation,Need:need,Work:[],Finish:Array(5).fill(false),安全序列:[],请求:`P${process}: ${request}`},t=recorder({title:'银行家算法 · 三资源试分配与回滚',intro:'五进程、A/B/C 三资源，Available=(3,3,2)，选择“允许请求”或“不安全请求”对比试分配。',condition:'先检查 Request≤Need，再检查 Request≤Available，逐分量都满足才试分配。安全检查中 Work 加 Allocation；不安全必须恢复试分配前状态。',flow:flow('检查请求是否超过声明需求／现有可用量','试分配：Available 减请求，Allocation 加请求，Need 减请求','Work←Available，反复找 Need≤Work 的未完成进程 → 假设完成，Work+=Allocation','全部可完成 → 允许；一轮无进展 → 不安全，回滚')},s)
 const emit=(title,why)=>t.add(title,why,{rows:[row('Available',available),row('Work',s.Work)],table:{heads:['进程','Allocation','Need','Finish'],rows:need.map((n,i)=>['P'+i,allocation[i].join(','),n.join(','),s.Finish[i]])}})
 emit('初始资源表','Need=Max−Allocation；三个分量必须分别比较。')
 for(let j=0;j<3;j++){available[j]-=request[j];allocation[process][j]+=request[j];need[process][j]-=request[j]}emit('请求满足前两道检查，先试分配','此时尚未承诺安全；接着运行安全性检查。');s.Work=[...available]
 let progress=true;while(progress){progress=false;for(let i=0;i<5;i++){if(s.Finish[i])continue;const can=need[i].every((x,j)=>x<=s.Work[j]);emit(`检查 P${i}：${can?'可完成':'暂不能完成'}`,`Need=(${need[i]})，Work=(${s.Work})；按分量比较。`);if(can){s.Work=s.Work.map((x,j)=>x+allocation[i][j]);s.Finish[i]=true;s.安全序列.push('P'+i);progress=true;emit(`假设 P${i} 完成，释放已分配资源`,'Work 加 Allocation，不是加 Need 或 Max。')}}}
 s.允许=s.Finish.every(Boolean);if(!s.允许){available.splice(0,3,...original.available);allocation.forEach((r,i)=>r.splice(0,3,...original.allocation[i]));need[process]=max[process].map((x,j)=>x-allocation[process][j]);emit('检查失败，回滚试分配','不安全不等于已死锁，但不能批准本次请求。')}else emit('找到安全序列，允许请求',s.安全序列.join(' → '));return t.finish()
}
export function deadlock(name='有死锁'){
 const alloc=name==='有死锁'?[[1,0],[0,1]]:[[1,0],[0,0]],req=[[0,1],[1,0]],s={Work:name==='有死锁'?[0,0]:[0,1],Finish:[false,false],化简序列:[]},t=recorder({title:'死锁检测 · 资源分配图化简',intro:'两类可重用资源，P0 持有 A 并申请 B；P1 申请 A。有死锁情形中 P1 同时持有 B。',condition:'检测使用当前未满足 Request，不使用最大需求 Need。多实例资源中“图有环”不是充分判据，必须检查可化简性。',flow:flow('Work←Available','找 Request≤Work 的未完成进程\n├─ 找到 → 假设完成，Work+=Allocation，删除相关边\n└─ 一轮找不到 → 停止','仍有占有资源且无法完成的进程 → 死锁；全部化简 → 无死锁')},s)
 const emit=(title,why)=>t.add(title,why,{table:{heads:['进程','已占 A,B','当前请求 A,B','可化简完成'],rows:alloc.map((a,i)=>['P'+i,a.join(','),req[i].join(','),s.Finish[i]])},rows:[row('Work',s.Work),row('化简顺序',s.化简序列)]})
 emit('初始','不能只看资源图上有没有圈。');let progress=true;while(progress){progress=false;for(let i=0;i<2;i++)if(!s.Finish[i]&&req[i].every((x,j)=>x<=s.Work[j])){s.Work=s.Work.map((x,j)=>x+alloc[i][j]);s.Finish[i]=true;s.化简序列.push('P'+i);progress=true;emit(`化简 P${i}`,'请求可以被满足，完成后释放原占用的资源。')}}s.结果=s.Finish.every(Boolean)?'无死锁':'P0、P1 死锁';emit('检测结束',s.结果);return t.finish()
}

export function fileAccess(name='二级索引'){
 const logical=name==='连续分配'||name==='链接分配'?3:name==='直接索引'?3:name==='一级索引'?12:300,offset=12,s={逻辑块:logical,块内偏移:offset,路径:[],物理块:'待查'},t=recorder({title:'文件寻址 · '+name,intro:`块大小 1024 B，目标为文件逻辑块 ${logical}、块内偏移 12。inode 有 10 个直接指针，每索引块 256 个 4B 指针。`,condition:'逻辑块号从 0 开始。索引块本身不计为文件数据块；本例直接／间接索引指针值为教学数据，缓存命中与访盘次数另按题设。',flow:flow('文件偏移除块大小 → 逻辑块号与块内偏移','按连续／链接／索引方式定位数据块','物理字节地址=数据块号×块大小+块内偏移')},s)
 const emit=(title,why)=>t.add(title,why,{route:s.路径,rows:[row('逻辑块与偏移',[logical,offset])]})
 emit('拆分逻辑地址',`${logical}×1024+12=${logical*1024+12} B。`)
 if(name==='连续分配'){s.路径=['目录起始块 50','加逻辑块 3','数据块 53'];s.物理块=53;emit('连续分配直接加偏移','连续分配可直接定位，但增长时可能需要搬迁。')}
 else if(name==='链接分配'){const chain=[50,12,80,25];for(let i=0;i<=logical;i++){s.路径.push('块 '+chain[i]);emit(`沿链到逻辑块 ${i}`,'普通显式／隐式链接没有额外索引时，随机访问需要沿前驱查找。')}s.物理块=chain[logical]}
 else if(logical<10){s.路径=['inode','直接指针 ['+logical+']','数据块 '+(100+logical)];s.物理块=100+logical;emit('命中直接索引范围','不需要读取间接索引块。')}
 else if(logical<266){const at=logical-10;s.路径=['inode','一级索引块','表项 ['+at+']','数据块 '+(500+at)];s.物理块=500+at;emit(`一级索引项下标 ${at}`,'先扣掉 10 个直接数据块。')}
 else {const remain=logical-266,i=Math.floor(remain/256),j=remain%256;s.一级下标=i;s.二级下标=j;s.路径=['inode','二级索引块','表项 ['+i+']'];emit('先扣除直接和一级覆盖范围',`${logical}−10−256=${remain}，商=${i}、余=${j}。`);s.物理块=1000+i*256+j;s.路径.push('一级索引块','表项 ['+j+']','数据块 '+s.物理块);emit('沿两层索引取数据块号','第一次取的是下一索引块的地址，第二次才得到数据块地址。')}
 s.物理字节地址=s.物理块*1024+offset;emit('定位完成',`数据块 ${s.物理块}，字节地址 ${s.物理字节地址}。`);return t.finish()
}
export function freeSpace(name='位示图'){
 const s={分配结果:[],位图:[1,1,0,1,0,0,1,0,1,1,0,0,0,1,0,1],空闲链:[2,4,5,7],成组栈:[20,21,22]},t=recorder({title:'外存空闲管理 · '+name,intro:'位示图约定 0=空闲，1=已分配，每字 8 位，块号从 0 起。成组链接用栈底块保存下一组信息。',condition:'位值、块号起点和字内位序必须按题设；这里从左到右是递增块号，不等同于所有机器的位序。',flow:flow('找到空闲块／取空闲链首／弹成组栈顶','更新位图或空闲结构；成组栈只剩组信息块时先装入下一组','归还块时恢复对应空闲记录')},s)
 const emit=(title,why)=>t.add(title,why,{rows:[row('位图：0 空闲 / 1 占用',s.位图),row('空闲链',s.空闲链),row('成组栈底 → 栈顶',s.成组栈),row('已分配',s.分配结果)]})
 emit('初始','三种方法切换查看，不混合使用它们的元数据。')
 for(let k=0;k<3;k++){let b;if(name==='位示图'){b=s.位图.indexOf(0);s.位图[b]=1;s.字号=Math.floor(b/8);s.位号=b%8;s.分配结果.push(b);emit(`分配块 ${b}`,`字序号 ${s.字号}，字内位号 ${s.位号}，对应位从 0 置 1。`)}else if(name==='空闲链表'){b=s.空闲链.shift();s.分配结果.push(b);emit(`分配链首块 ${b}`,'链首改为下一个空闲块。')}else{b=s.成组栈.pop();if(!s.成组栈.length){s.成组栈=[30,31];emit(`先读取块 ${b} 保存的下一组信息`,'下一组装入管理栈之后，块 20 本身才可以分配出去。')}s.分配结果.push(b);emit(`分配块 ${b}`,'弹栈完成。')}}return t.finish()
}
