import assert from 'node:assert/strict'
import fs from 'node:fs'
import {outlineLessons} from '../src/learning/outline-lessons.js'
import * as ds from '../src/learning/ds-traces.js'
import * as tree from '../src/learning/tree-traces.js'
import * as extra from '../src/learning/ds-extra-traces.js'
import * as os from '../src/learning/os-traces.js'
import * as sync from '../src/learning/os-sync-traces.js'
import * as co from '../src/learning/co-traces.js'
import * as net from '../src/learning/net-traces.js'
import * as tcp from '../src/learning/net-protocol-traces.js'
import * as support from '../src/learning/support-traces.js'
import {diskSchedule} from '../src/learning/models.js'
import {traceDiagram} from '../src/learning/trace-diagrams.js'
const last=l=>l.frames.at(-1).state
const finalTree=l=>l.frames.at(-1).view.tree
let presets=0,snapshots=0
for(const spec of outlineLessons){
 const source=fs.readFileSync(new URL('../source/'+(spec.doc.startsWith('14-')?'supplements':'408')+'/'+spec.doc+'.md',import.meta.url),'utf8')
 const headings=[...source.matchAll(/^#{2,4} (.+)$/gm)].map(m=>m[1].trim())
 assert.ok(headings.includes(spec.heading),'exact heading missing: '+spec.id)
 assert.ok(spec.outline&&spec.scope&&spec.pages.every(p=>p>=1&&p<=20))
 for(const option of spec.options||[undefined]){const lesson=spec.make(option);presets++;snapshots+=lesson.frames.length
  assert.ok(lesson.frames.length>=2,'needs an initial and resulting state: '+spec.id)
  assert.ok(lesson.flow.includes('→')||lesson.flow.includes('↓'))
  for(const frame of lesson.frames){assert.ok(frame.title&&frame.why);if(lesson.kind==='trace'){const html=traceDiagram(lesson,frame);assert.ok(!/NaN|undefined|\[object Object\]/.test(html),'bad rendered value: '+spec.id);assert.ok(html.length>20)}}
  const first=structuredClone(lesson.frames[0]);if(lesson.frames.length>1){const tail=lesson.frames.at(-1);const old=structuredClone(tail.state);tail.state.__mutationProbe=true;assert.deepEqual(lesson.frames[0],first,'snapshots share state: '+spec.id);tail.state=old}
 }
}
// Every syllabus-named internal sorting method, with a duplicate-key stability witness.
assert.equal(ds.sortNames.length,9)
for(const name of ds.sortNames){const l=ds.sorting(name),a=last(l).数组.map(x=>Number.parseInt(x));assert.deepEqual(a,name==='基数排序'?[329,355,436,457,657,720,839]:[2,2,3,4,5],name)
 if(['直接插入排序','折半插入排序','冒泡排序','二路归并排序'].includes(name))assert.deepEqual(last(l).数组.slice(0,2),['2a','2b'],name+' stable')
 assert.ok(last(l).比较次数>=0&&last(l).写入次数>0)
}
for(const name of ['先序遍历','中序遍历','后序遍历','层序遍历'])assert.equal(last(ds.traversal(name)).输出.join(''),({'先序遍历':'ABDECF','中序遍历':'DBEACF','后序遍历':'DEBFCA','层序遍历':'ABCDEF'})[name])
assert.equal(last(ds.huffman()).WPL,30)
const codes=Object.values(last(ds.huffman()).编码);assert.ok(codes.every((c,i)=>codes.every((d,j)=>i===j||!d.startsWith(c))))
const parents=last(ds.unionFind()).双亲数组;for(let i=0;i<6;i++){let v=i,seen=new Set();while(parents[v]>=0){assert.ok(!seen.has(v));seen.add(v);v=parents[v]}assert.equal(parents[v],-6)}
assert.equal(last(extra.graphWalk('BFS 广度优先')).输出.join(''),'ABCDEF');assert.equal(last(extra.graphWalk('DFS 深度优先')).输出.join(''),'ABDEFC')
for(const name of ds.stringNames){const s=last(ds.stringMatch(name));if(name.includes('匹配'))assert.equal(s.结果,4);else assert.deepEqual(s.next,name.includes('nextval')?[-1,0,-1,0,-1,3]:[-1,0,0,1,2,3])}
assert.deepEqual(last(extra.externalSort('置换选择生成初始段')).初始段,[[2,5,7,8],[1,3,4,6]])
assert.deepEqual(last(extra.externalSort()).输出,[1,2,3,4,5,6,7,8]);assert.equal(last(extra.externalSort('最佳归并树')).归并代价,30)
function binaryCheck(g,{avl=false,rb=false}={}){if(!g.root)return;const m=new Map(g.nodes.map(n=>[n.id,n]));if(rb)assert.equal(m.get(g.root).color,'B')
 function visit(id,lo=-Infinity,hi=Infinity){if(!id)return {height:0,black:1};const n=m.get(id),key=+n.label;assert.ok(key>lo&&key<hi,'BST order');const [a,b]=n.children||[],l=visit(a,lo,key),r=visit(b,key,hi);if(avl)assert.ok(Math.abs(l.height-r.height)<=1,'AVL height');if(rb){if(n.color==='R')for(const child of [a,b].filter(Boolean))assert.equal(m.get(child).color,'B');assert.equal(l.black,r.black,'equal black heights')}return {height:1+Math.max(l.height,r.height),black:l.black+ +(n.color==='B')}}visit(g.root)
}
for(const name of tree.avlNames)binaryCheck(finalTree(tree.avl(name)),{avl:true})
for(const name of ['插入：变色与旋转','删除：黑结点修复','删除：红叶']){const l=tree.redBlack(name);binaryCheck(finalTree(l),{rb:true});for(const f of l.frames.filter(f=>/本次插入修复完成|删除修复完成/.test(f.title)))binaryCheck(f.view.tree,{rb:true})}
for(const name of ['插入与分裂','删除：借位与合并']){const l=tree.bTree(name);for(const f of l.frames.filter(f=>/在叶结点插入|删除 \d+ 完成|结束/.test(f.title))){const g=f.view.tree,m=new Map(g.nodes.map(n=>[n.id,n])),depths=[];function check(id,depth,lo,hi){const n=m.get(id),keys=n.label?n.label.split(' · ').map(Number):[];assert.ok(keys.length<=3);if(depth)assert.ok(keys.length>=1);assert.ok(keys.every((x,i)=>x>lo&&x<hi&&(!i||x>keys[i-1])));if(n.children.length){assert.equal(n.children.length,keys.length+1);n.children.forEach((c,i)=>check(c,depth+1,i?keys[i-1]:lo,i<keys.length?keys[i]:hi))}else depths.push(depth)}check(g.root,0,-Infinity,Infinity);assert.equal(new Set(depths).size,1)}}
assert.deepEqual(last(tree.bTree('删除：借位与合并')).中序键,[])
assert.deepEqual(last(tree.bPlus()).结果,[30,40,50])
for(const name of ['自底向上建堆','插入并上浮','删除堆顶']){const a=last(ds.heapOperation(name)).数组;for(let i=1;i<a.length;i++)assert.ok(a[(i-1)>>1]>=a[i])}
const expectedTurnarounds=[[5,7,7],[5,8,4],[9,4,1],[5,8,4],[5,7,7],[9,3,3],[9,7,3],[10,4,1],[9,4,1]]
os.scheduleNames.forEach((name,i)=>{const l=os.scheduling(name),s=last(l);assert.deepEqual(['P1','P2','P3'].map(p=>s.周转时间[p]),expectedTurnarounds[i],name);const lines=l.frames.at(-1).view.timeline;assert.equal(lines.reduce((n,x)=>n+x.end-x.start,0),i===7?10:9);for(let j=1;j<lines.length;j++)assert.equal(lines[j].start,lines[j-1].end)})
assert.equal(last(os.bankerMulti()).允许,true);assert.deepEqual(last(os.bankerMulti()).安全序列,['P1','P3','P4','P0','P2']);const rejected=last(os.bankerMulti('不安全请求'));assert.equal(rejected.允许,false);assert.deepEqual(rejected.Available,[3,3,2]);assert.deepEqual(rejected.Allocation,[[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]])
assert.deepEqual(last(os.buddy()).空闲,[{start:0,size:32}]);assert.deepEqual(last(os.buddy()).分配,[])
for(const name of ['首次适应 FF','循环首次适应 NF','最佳适应 BF','最坏适应 WF']){const s=last(os.partitionAllocation(name)),segments=[...s.空闲区,...s.已分配].sort((a,b)=>a.start-b.start);assert.equal(segments.reduce((v,x)=>v+x.size,0),62);segments.forEach((x,i)=>{if(i)assert.ok(x.start>=segments[i-1].start+segments[i-1].size)})}
for(const name of ['OPT 最佳置换','增强 Clock']){const s=last(sync.advancedPages(name));assert.equal(s.缺页+s.命中,8);assert.equal(s.缺页,6);assert.equal(new Set(s.页框).size,3)}
for(const name of sync.mutexNames.filter(n=>n.startsWith('Peterson')||n.includes('原子'))){for(const f of sync.mutex(name).frames)assert.ok(f.state.临界区.length<=1)}
for(const name of ['P／V 阻塞与唤醒','生产者消费者','读者优先：读者写者','前驱关系：两个前驱'])assert.deepEqual(last(sync.synchronization(name)).等待队列,[])
assert.equal(last(support.bufferManagement()).总时间,11)
for(const [name,d]of [['C-SCAN',188],['C-LOOK',110]])assert.equal(last(diskSchedule(name)).distance,d)
assert.equal(last(co.numberConversion()).二进制,'101010');assert.equal(last(co.numberConversion('小数乘基取整')).二进制,'0.101');assert.equal(last(co.numberConversion('补码与真值')).真值,-5)
assert.deepEqual([last(co.arithmetic()).结果,last(co.arithmetic()).OF,last(co.arithmetic()).CF],['1010',1,0]);assert.deepEqual([last(co.arithmetic('补码减法与借位')).结果,last(co.arithmetic('补码减法与借位')).OF,last(co.arithmetic('补码减法与借位')).CF],['1110',0,1])
assert.equal(last(co.multiplyDivide()).乘积,15);assert.equal(last(co.multiplyDivide('原码乘法')).乘积,-15);assert.equal(last(co.multiplyDivide('Booth 补码乘法')).乘积,-15)
for(const name of ['恢复余数除法','不恢复余数除法'])assert.deepEqual([last(co.multiplyDivide(name)).商,last(co.multiplyDivide(name)).余数],[4,1])
const bytes=new ArrayBuffer(4),dv=new DataView(bytes);dv.setFloat32(0,13.25);assert.equal(last(co.floating()).十六进制,dv.getUint32(0).toString(16).toUpperCase());assert.equal(last(co.floating('浮点数加法')).数值,2.25)
for(const [name,hit,miss]of [['直接映射',2,5],['二路组相联 LRU',1,6],['二路组相联 FIFO',2,5],['全相联 LRU',3,4]])assert.deepEqual([last(co.cache(name)).命中,last(co.cache(name)).缺失],[hit,miss],name)
assert.equal(last(co.cache('写回＋写分配')).写回,2);assert.equal(last(co.cache('全写＋非写分配')).主存写次数,5)
assert.equal(last(co.addressTranslation()).物理地址,0x2634);assert.equal(last(co.addressTranslation('基本分段')).物理地址,0x9234);assert.equal(last(co.addressTranslation('分段越界')).物理地址,'待定')
assert.deepEqual(last(co.addressTranslation('二级页表')).访问路径,['外层表[1]','内层表[0]','访问数据'])
for(const name of ['零比特填充','字节填充']){const s=last(net.framing(name));assert.deepEqual(s.接收还原,Array.from(s.原数据))}
assert.equal(last(net.crc()).余数,'1110');assert.equal(last(net.crc()).接收余数,'0000')
const h=last(net.errorCode());assert.equal(h.综合征,6);assert.deepEqual(h.码字,h.正确码字)
assert.equal(last(net.checksum()).校验和,'0xFC96');assert.equal(last(net.checksum()).接收反码和,65535)
assert.deepEqual([last(net.cdma()).A解码,last(net.cdma()).B解码],[1,-1])
assert.deepEqual(last(net.fragmentation()).分片,[{data:1480,total:1500,offset:0,mf:1},{data:1480,total:1500,offset:185,mf:1},{data:1020,total:1040,offset:370,mf:0}])
assert.equal(last(net.subnet()).出口,'C');assert.equal(last(net.subnet('定长子网划分')).网络,'192.168.1.128')
assert.equal(last(tcp.distanceVector()).路由.N.distance,7);assert.equal(last(tcp.distanceVector('坏消息慢传播')).路由.N.distance,16)
assert.equal(last(tcp.bgp()).拒绝.length,1);assert.deepEqual(last(tcp.stopWait()).已交付,[0]);assert.equal(last(tcp.tcpWindow()).SND_UNA,6001);assert.equal(last(tcp.tcpWindow('零窗口与探测')).可发,0)
assert.equal(last(tcp.tcpCongestion('重复 ACK：快恢复')).cwnd,5);assert.equal(last(tcp.rto()).SRTT,105);assert.equal(last(tcp.rto()).RTO,410)
console.log(`Outline algorithms: ${outlineLessons.length} new groups, ${presets} presets, ${snapshots} immutable snapshots; independently checked sorting, tree invariants, scheduling, rollback, arithmetic, addresses, checksums and protocol states`)
