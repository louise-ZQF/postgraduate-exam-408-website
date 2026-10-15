import {recorder,row,arrayView,binaryView,generalTree,flow,clone} from './trace-kit.js'
export const sortNames=['直接插入排序','折半插入排序','冒泡排序','简单选择排序','希尔排序','快速排序','堆排序','二路归并排序','基数排序']
const sortInfo={直接插入排序:['稳定；平均／最坏 O(n²)，最好 O(n)','依次取待插入记录 → 向右移动更大的记录 → 填入空位'],折半插入排序:['稳定；比较 O(n log n)，移动仍可能 O(n²)','在有序前缀中二分定位 → 相等记录之后插入 → 移动并填入'],冒泡排序:['稳定；平均／最坏 O(n²)，有序且带标志时 O(n)','比较相邻记录 → 左大右小才交换 → 每趟固定一个最大值'],简单选择排序:['不稳定；比较 O(n²)，交换 O(n)','扫描未排序区最小值 → 与未排序区首元素交换'],希尔排序:['不稳定；复杂度依增量序列而定','按 gap 分组 → 各组直接插入 → 缩小 gap，最后 gap=1'],快速排序:['不稳定；平均 O(n log n)，最坏 O(n²)','选择枢轴 → 分区 → 递归处理左右子区间'],堆排序:['不稳定；最好／平均／最坏 O(n log n)','自底向上建大根堆 → 堆顶换到末尾 → 缩小堆并向下调整'],二路归并排序:['稳定；时间 O(n log n)，辅助数组 O(n)','递归拆成两半 → 两个有序段取小者 → 合并回原位置'],基数排序:['稳定；d 趟、r 个桶时 O(d(n+r))','最低位到最高位 → 稳定分配入桶 → 按桶号依次收集']}
export function sorting(name=sortNames[0]){
 const a=(name==='基数排序'?[329,457,657,839,436,720,355]:[5,2,4,2,3]).map((key,i)=>({key,tag:key===2?(i===1?'2a':'2b'):String(key)})),s={数组:[],比较次数:0,写入次数:0,已固定:[]},m=sortInfo[name]
 const t=recorder({title:name+' · 逐步比较与移动',intro:'教学输入：'+a.map(x=>x.tag).join('，')+'。2a、2b 关键字相同，用来观察原有先后次序。',condition:m[0]+'；递增排序，所有下标从 0 开始。快速排序采用末元素为枢轴的 Lomuto 分区；希尔增量为 2、1。',flow:flow(m[1],'还有未处理区间／趟数？\n├─ 有 → 回到对应比较／分配步骤\n└─ 无 → 输出整个有序序列'),compare:[['稳定性',m[0]],['快排分区约定','本例不是挖坑法；遇到题目指定轴值、扫描方向或交换规则，按题设模拟。']]},s)
 function emit(title,why,active=[],extra={}){s.数组=a.map(x=>x.tag);t.add(title,why,{...arrayView('当前序列（下标从 0 开始）',s.数组,active,s.数组.map((_,i)=>s.已固定.includes(i)?'已固定':'')),...extra})}
 const cmp=(i,j)=>{s.比较次数++;emit(`比较 ${a[i].tag} 与 ${a[j].tag}`,`${a[i].key}>${a[j].key} 为 ${a[i].key>a[j].key}；先比较关键字，再决定是否移动。`,[i,j]);return a[i].key-a[j].key}
 const swap=(i,j)=>{if(i===j)return;[a[i],a[j]]=[a[j],a[i]];s.写入次数+=2;emit(`交换下标 ${i}、${j}`,`两条记录交换位置，数组变为 ${a.map(x=>x.tag).join(' → ')}。`,[i,j])}
 function down(i,n){while(2*i+1<n){let c=2*i+1;if(c+1<n&&cmp(c,c+1)<0)c++;if(cmp(i,c)>=0)break;swap(i,c);i=c}}
 emit('初始：尚未排序','每一步突出正在比较、写入或交换的位置；“完整过程表”可核对全部中间状态。')
 if(name==='直接插入排序'||name==='折半插入排序'||name==='希尔排序'){
  for(const gap of name==='希尔排序'?[2,1]:[1])for(let i=gap;i<a.length;i++){
   const x=a[i];s.暂存=x.tag;let pos=i
   if(name==='折半插入排序'){let low=0,high=i;while(low<high){const mid=(low+high)>>1;s.比较次数++;emit(`二分定位：low=${low}，mid=${mid}，high=${high}`,`${x.key}<${a[mid].key}？${x.key<a[mid].key?'保留左半段':'保留右半段，含相等记录之后的位置'}。`,[i,mid]);if(x.key<a[mid].key)high=mid;else low=mid+1}pos=low;for(let j=i;j>pos;j--){a[j]=a[j-1];s.写入次数++;emit(`下标 ${j-1} → ${j}`,`给暂存记录 ${x.tag} 腾出位置；二分减少比较，不消除移动。`,[j-1,j])}}
   else {while(pos>=gap){s.比较次数++;emit(`gap=${gap}，比较 ${a[pos-gap].tag} 与暂存 ${x.tag}`,`只在同一增量组内比较；前者更大才右移。`,[pos-gap,pos]);if(a[pos-gap].key<=x.key)break;a[pos]=a[pos-gap];s.写入次数++;emit(`记录向右移动 ${gap} 格`,`下标 ${pos-gap} → ${pos}，空位转到前一个同组位置。`,[pos-gap,pos]);pos-=gap}}
   a[pos]=x;s.写入次数++;emit(`插入 ${x.tag} 到下标 ${pos}`,`这一轮插入完成；gap=${gap}。`,[pos]);delete s.暂存
  }
 }else if(name==='冒泡排序'){for(let end=a.length-1;end>0;end--){let changed=false;for(let i=0;i<end;i++)if(cmp(i,i+1)>0){swap(i,i+1);changed=true}s.已固定.push(end);emit(`本趟固定下标 ${end}`,changed?'继续处理未排序前缀。':'本趟没有交换，整个序列已有序，可以提前结束。',[end]);if(!changed)break}}
 else if(name==='简单选择排序'){for(let i=0;i<a.length-1;i++){let min=i;for(let j=i+1;j<a.length;j++)if(cmp(j,min)<0)min=j;swap(i,min);s.已固定.push(i);emit(`固定第 ${i+1} 个最小记录`,`最小记录在下标 ${min}；远距离交换可能跨过同关键字记录。`,[i])}}
 else if(name==='快速排序'){
  function quick(l,r){if(l>=r)return;const pivot=a[r];s.枢轴=pivot.tag;s.子区间=`[${l},${r}]`;emit(`分区 [${l},${r}]，枢轴 ${pivot.tag}`,'边界 i 从左端开始；扫描 j，关键字小于等于枢轴才送到左区。',[r]);let i=l;for(let j=l;j<r;j++){s.比较次数++;emit(`扫描下标 ${j}`,`${a[j].key}≤${pivot.key} 为 ${a[j].key<=pivot.key}。`,[j,r]);if(a[j].key<=pivot.key){swap(i,j);i++}}swap(i,r);s.已固定.push(i);emit(`枢轴最终位于 ${i}`,'左区均不大于枢轴，右区均大于枢轴；枢轴不用再参与递归。',[i]);quick(l,i-1);quick(i+1,r)}quick(0,a.length-1)
 }else if(name==='堆排序'){for(let i=(a.length>>1)-1;i>=0;i--)down(i,a.length);emit('建堆完成','大根堆只保证父结点不小于孩子，不保证整个数组有序。');for(let n=a.length-1;n>0;n--){swap(0,n);s.已固定.push(n);emit(`最大值放到下标 ${n}`,`只对前 ${n} 个记录重新向下调整；已固定后缀不再入堆。`,[n]);down(0,n)}}
 else if(name==='二路归并排序'){
  function merge(l,r){if(r-l<2)return;const m=(l+r)>>1;merge(l,m);merge(m,r);const left=a.slice(l,m),right=a.slice(m,r),b=[];let i=0,j=0;while(i<left.length||j<right.length){let x;if(i===left.length)x=right[j++];else if(j===right.length)x=left[i++];else{s.比较次数++;x=left[i].key<=right[j].key?left[i++]:right[j++]}b.push(x);emit(`归并 [${l},${m}) 与 [${m},${r})`,'相等时先取左段记录，保留稳定性；辅助区先收集，再整体写回。',[],{rows:[row('原数组',a.map(x=>x.tag)),row('辅助区',b.map(x=>x.tag),[b.length-1])]})}a.splice(l,r-l,...b);s.写入次数+=b.length;emit('辅助区写回原区间',`区间 [${l},${r}) 现在有序。`,Array.from({length:r-l},(_,i)=>l+i))}merge(0,a.length)
 }else{
  for(let unit=1;unit<=100;unit*=10){const buckets=Array.from({length:10},()=>[]);for(let i=0;i<a.length;i++){const d=Math.floor(a[i].key/unit)%10;buckets[d].push(a[i]);emit(`按 ${unit} 位分配 ${a[i].key} 到桶 ${d}`,'从前向后入桶，同桶先后顺序不变。',[i],{rows:[row('本趟输入',a.map(x=>x.tag)),...buckets.map((b,d)=>row('桶 '+d,b.map(x=>x.tag))) ]})}a.splice(0,a.length,...buckets.flat());s.写入次数+=a.length;emit(`按桶 0→9 收集，完成 ${unit} 位排序`,'低位形成的次序在高位分配时得到保留。')}
 }
 s.已固定=a.map((_,i)=>i);emit('排序完成',`结果 ${a.map(x=>x.tag).join(' → ')}。比较次数只按本演示明确执行的关键字比较计数。`);return t.finish()
}

export const searchNames=['顺序查找：成功','顺序查找：失败','折半查找：成功','折半查找：失败','分块查找']
export function searching(name=searchNames[0]){
 const a=name==='分块查找'?[3,1,5,9,7,12,18,15,20]:[1,3,5,7,9,12,15],key=name.includes('失败')?8:name==='分块查找'?7:9,s={目标:key,比较次数:0,结果:'待查找'},t=recorder({title:name,intro:`查找 ${key}，数组 ${a.join('，')}，下标从 0 开始。`,condition:'折半查找要求有序、可随机访问；分块查找只要求块间有序，块内可无序。比较次数含真正比较到的元素或索引。',flow:flow('初始化有效范围／扫描位置','比较当前记录\n├─ 相等 → 查找成功，结束\n└─ 不等 → 顺序前进／折半缩小／定位块后块内扫描','候选用尽？\n├─ 是 → 失败\n└─ 否 → 继续比较')},s)
 const emit=(title,why,active=[])=>t.add(title,why,arrayView('查找序列',a,active))
 emit('初始','先确认有序性、下标约定及目标。')
 if(name.startsWith('折半')){let l=0,r=a.length-1;while(l<=r){const m=Math.floor((l+r)/2);Object.assign(s,{low:l,mid:m,high:r});s.比较次数++;emit(`比较 a[${m}]=${a[m]}`,`${key} ${key===a[m]?'=':key<a[m]?'<':'>'} ${a[m]}；相等则成功，否则丢弃不可能的一半。`,[m]);if(key===a[m]){s.结果=m;break}if(key<a[m])r=m-1;else l=m+1}s.low=l;s.high=r}
 else {let l=0,r=a.length;if(name==='分块查找'){const blocks=[[0,3,5],[3,6,12],[6,9,20]];for(const [start,end,max] of blocks){s.比较次数++;s.索引最大值=max;emit(`比较块最大值 ${max}`,key<=max?'目标只能在本块，转入块内顺序查找。':'目标大于本块全部元素，检查下一个块。');if(key<=max){l=start;r=end;break}}}for(let i=l;i<r;i++){s.比较次数++;emit(`检查下标 ${i}`,`${a[i]} ${a[i]===key?'等于':'不等于'} ${key}。`,[i]);if(a[i]===key){s.结果=i;break}}}
 if(s.结果==='待查找')s.结果='不存在';emit(s.结果==='不存在'?'候选范围为空，失败':'查找成功',`结果：${s.结果}；共 ${s.比较次数} 次比较。`);return t.finish()
}

export const stringNames=['朴素模式匹配 BF','KMP 匹配','构造 next 数组','构造 nextval 数组']
export function stringMatch(name=stringNames[0]){
 const p='ababaa',text='ababababaa',next=[-1,0,0,1,2,3],s={模式:p,主串:text,i:0,j:0,比较次数:0,next:[],结果:'进行中'},t=recorder({title:name,intro:'统一采用 0 起始下标、next[0]=−1 的约定；模式串 ababaa，主串 ababababaa。',condition:'不要把这里的 next 数组与 1 起始、0 哨兵的答案混写。KMP 主串 i 不回退；j=−1 是哨兵状态，不读取 p[−1]。',flow:flow('准备主串、模式与 next 约定','比较字符\n├─ 相同 → i、j 前移\n└─ 失配 → BF 回退起点；KMP 仅 j=next[j]','模式用尽 → 成功；主串用尽仍未匹配完整 → 失败'),compare:[['本例 next','0 起始：−1,0,0,1,2,3；对应 1 起始表为 0,1,1,2,3,4。'],['nextval','当 p[j]=p[next[j]]，继续比较必败，跳到 nextval[next[j]]。']]},s)
 const emit=(title,why)=>t.add(title,why,{rows:[row('主串 T',Array.from(text),[s.i]),row('模式 P',Array.from(p),[s.j]),row('next / nextval',s.next)]})
 emit('初始','先统一指针和 next 数组的下标约定。')
 if(name.startsWith('构造')){let j=0,k=-1;s.next=[-1];while(j<p.length-1){if(k===-1||p[j]===p[k]){j++;k++;s.i=j;s.j=k;s.next[j]=name.includes('nextval')&&p[j]===p[k]?s.next[k]:k;emit(`求表项 [${j}]=${s.next[j]}`,name.includes('nextval')&&p[j]===p[k]?'相等字符会重复失败 → 复用更早的跳转。':`已有长度 ${k} 的可复用前后缀。`)}else{const old=k;k=s.next[k];s.j=k;emit(`候选前缀长度 ${old} → ${k}`,'字符不等，沿已经求出的表回退，不重扫主串。')}}s.结果=s.next.join(',')}
 else {s.next=name==='KMP 匹配'?next:[];let i=0,j=0;while(i<text.length&&j<p.length){s.i=i;s.j=j;if(j===-1){emit('j=−1：越过哨兵','i、j 同时加 1，不进行字符比较。');i++;j++;continue}s.比较次数++;emit(`比较 T[${i}] 与 P[${j}]`,text[i]===p[j]?'字符相等，两个指针都前移。':name==='KMP 匹配'?`失配，i=${i} 保持；j 从 ${j} 跳到 next[${j}]=${next[j]}。`:'失配，候选起点后移一位，模式从头开始。');if(text[i]===p[j]){i++;j++}else if(name==='KMP 匹配')j=next[j];else{i=i-j+1;j=0}}s.i=i;s.j=j;s.结果=j===p.length?i-j:'未匹配'}
 emit('结束',`最终结果：${s.结果}。`);return t.finish()
}

export function linearOps(name='单链表逆置'){
 const s={序列:[2,4,6],pre:'空',cur:2,next:'待保存'},t=recorder({title:name,intro:'教学链表 2→4→6；合并时第二张有序表为 1→3→5。顺序表下标从 0 开始。',condition:'单链表修改 next 前必须保留原后继；顺序表插入从后往前移动，删除从前往后补位。',flow:flow('检查空表／下标／目标结点','保存需要保留的数据或后继','移动记录／改变指针','更新头指针、长度或尾指针 → 结束')},s)
 const emit=(title,why,active=[])=>t.add(title,why,{...arrayView('当前线性结构',s.序列,active),route:name.includes('链表')?s.序列.map(String):undefined})
 emit('初始','尚未移动记录或改动链接。')
 if(name==='单链表逆置'){let old=[2,4,6],pre=[];while(old.length){s.cur=old[0];s.next=old[1]??'空';emit('先保存当前结点的原后继',`next=${s.next}，否则改 next 后会丢失后半段。`);pre.unshift(old.shift());s.pre=pre[0];s.cur=old[0]??'空';s.序列=[...pre,'｜',...old];emit('cur.next 指向 pre，再推进两指针',`已逆置部分 ${pre.join('→')}；剩余 ${old.join('→')||'空'}。`)}s.序列=pre;emit('头指针指向 pre','cur 为空，逆置结束，结果为 6→4→2。')}
 else if(name==='有序表合并'){const a=[2,4,6],b=[1,3,5],out=[];let i=0,j=0;while(i<a.length||j<b.length){const take=i===a.length?b[j++]:j===b.length?a[i++]:a[i]<=b[j]?a[i++]:b[j++];out.push(take);s.序列=out;s.i=i;s.j=j;emit(`取出较小记录 ${take}`,'只推进取出记录所在表的指针；一张表用尽后接上另一张表剩余部分。',[out.length-1])}}
 else if(name==='顺序表插入'){s.序列.push('空');for(let i=2;i>=1;i--){s.序列[i+1]=s.序列[i];emit(`下标 ${i} → ${i+1}`,'从后往前搬移，避免覆盖未保存的记录。',[i,i+1])}s.序列[1]=3;emit('在下标 1 写入 3','长度由 3 变为 4。',[1])}
 else if(name==='顺序表删除'){for(let i=1;i<2;i++){s.序列[i]=s.序列[i+1];emit(`下标 ${i+1} → ${i}`,'从删除位置起向前补位。',[i])}s.序列.pop();emit('长度减 1','结果为 2、6。')}
 else {s.新结点=3;s.原后继=4;emit('s.next ← p.next','p 指向 2，先让新结点 3 指向原后继 4。');s.序列=[2,3,4,6];emit('p.next ← s','再让 2 指向 3，插入完成；若顺序反过来，可能丢失指向 4 的链接。',[1])}
 return t.finish()
}
export function stackQueue(name='括号匹配'){
 const tokens=name==='后缀表达式求值'?['3','4','+','2','*']:name==='中缀转后缀'?Array.from('a+b*c'):Array.from('([])'),s={输入:tokens,栈:[],输出:[],结果:'进行中'},t=recorder({title:name,intro:name==='循环队列'?'容量 M=4，牺牲一格；演示入队、出队和回绕。':'依次读取 '+tokens.join(' '),condition:'后缀运算先弹右操作数、再弹左操作数；左结合运算符遇同优先级先弹出。循环队列最多存 M−1 个元素。',flow:flow('取下一符号／请求','按规则入栈、出栈或改变队头队尾','检查匹配／运算／满空边界','输入用尽 → 汇总结果')},s)
 const emit=(title,why)=>t.add(title,why,{rows:[row('待处理输入',tokens,[s.位置]),row(name==='循环队列'?'存储单元':'栈底 → 栈顶',s.栈),row('输出',s.输出)]})
 emit('初始','栈与输出为空。')
 if(name==='循环队列'){s.栈=['空','空','空','空'];s.front=0;s.rear=0;for(const [op,x] of [['入',1],['入',2],['出'],['入',3],['入',4],['入',5],['出'],['入',5]]){if(op==='入'){if((s.rear+1)%4===s.front){emit('队满，拒绝入队','(rear+1) mod 4 = front；不能覆盖队头。');continue}const at=s.rear;s.栈[at]=x;s.rear=(s.rear+1)%4;emit(`入队 ${x}`,`写单元 ${at}，rear 回绕后为 ${s.rear}。`)}else{const x=s.栈[s.front];s.栈[s.front]='空';s.front=(s.front+1)%4;s.输出.push(x);emit(`出队 ${x}`,`front 前进到 ${s.front}；只有 front=rear 时才为空。`)}}s.结果='完成'}
 else {for(let i=0;i<tokens.length;i++){s.位置=i;const x=tokens[i];if(name==='括号匹配'){if('(['.includes(x)){s.栈.push(x);emit(`左括号 ${x} 入栈`,'等待后续同类型右括号。')}else{const old=s.栈.pop();s.结果=old===({')':'(',']':'['}[x])?'匹配中':'不匹配';emit(`处理右括号 ${x}`,`弹出的 ${old??'空'} 与它${s.结果==='不匹配'?'不':'相'}匹配。`)}}
 else if(name==='后缀表达式求值'){if(/\d/.test(x)){s.栈.push(+x);emit(`操作数 ${x} 入栈`,'遇到运算符才弹出操作数。')}else{const right=s.栈.pop(),left=s.栈.pop(),result=x==='+'?left+right:left*right;s.栈.push(result);emit(`计算 ${left} ${x} ${right} = ${result}`,'先弹右，再弹左，把计算结果压回栈。')}}
 else {if(/[a-z]/.test(x)){s.输出.push(x);emit(`输出操作数 ${x}`,'操作数直接进入后缀表达式。')}else{while(s.栈.length&&({'+':1,'*':2}[s.栈.at(-1)]>=({'+':1,'*':2}[x]))){s.输出.push(s.栈.pop());emit('弹出高或同优先级运算符','左结合运算符遇同级应先弹出。')}s.栈.push(x);emit(`运算符 ${x} 入栈`,'等待更低优先级运算符或输入结束。')}}}
 if(name==='中缀转后缀'){while(s.栈.length)s.输出.push(s.栈.pop());s.结果=s.输出.join('')}else s.结果=name==='括号匹配'?(s.栈.length?'不匹配':'全部匹配'):s.栈[0]}
 emit('结束',`结果：${s.结果}。`);return t.finish()
}

const sampleTree=()=>({key:'A',left:{key:'B',left:{key:'D'},right:{key:'E'}},right:{key:'C',right:{key:'F'}}})
export function traversal(name='先序遍历'){
 const root=sampleTree(),threads=[],s={输出:[],栈或队列:[],当前:'—'},t=recorder({title:name,intro:'二叉树：A 的孩子 B、C；B 的孩子 D、E；C 的右孩子 F。',condition:'先序 根左右，中序 左根右，后序 左右根，层序用先进先出队列。线索化仅修改空孩子指针，不覆盖真实孩子。',flow:flow('从根 A 开始','按对应顺序访问／递归／入队','无孩子可走 → 返回上一层；层序则取下一个队首','所有结点处理完 → 结束')},s)
 const emit=(title,why,active=[])=>{const v=binaryView(root,active);v.tree.threads=threads;t.add(title,why,{...v,rows:[row('输出序列',s.输出),row('调用栈／队列',s.栈或队列)]})}
 emit('初始','先明确根、左孩子和右孩子的关系。')
 const visit=n=>{s.输出.push(n.key);s.当前=n.key;emit(`访问 ${n.key}`,`加入输出，得到 ${s.输出.join(' → ')}。`,[n.key])}
 if(name==='层序遍历'){const q=[root];s.栈或队列=['A'];while(q.length){const n=q.shift();s.栈或队列=q.map(x=>x.key);visit(n);for(const child of [n.left,n.right].filter(Boolean)){q.push(child);s.栈或队列=q.map(x=>x.key);emit(`${child.key} 入队`,'按从左到右的顺序进入队尾。',[child.key])}}}
 else {let previous=null;function dfs(n){if(!n)return;s.栈或队列.push(n.key);emit(`进入 ${n.key}`,name==='后序遍历'?'先遍历两个孩子，最后访问当前结点。':name==='先序遍历'?'先访问当前结点，再递归孩子。':'先进入左子树，再访问当前结点。',[n.key]);if(name==='先序遍历')visit(n);dfs(n.left);if(name==='中序遍历'||name==='中序线索化'){if(name==='中序线索化'){if(!n.left){n.note='前驱 '+(previous?.key||'空');if(previous)threads.push({from:n.key,to:previous.key,label:'前驱'})}if(previous&&!previous.right){previous.note=(previous.note?previous.note+'；':'')+'后继 '+n.key;threads.push({from:previous.key,to:n.key,label:'后继'})}previous=n}visit(n)}dfs(n.right);if(name==='后序遍历')visit(n);s.栈或队列.pop();emit(`从 ${n.key} 返回`,'这一递归层已经完成，返回双亲继续。',[n.key])}dfs(root);if(name==='中序线索化'&&previous&&!previous.right){previous.note=(previous.note?previous.note+'；':'')+'后继 空';s.线索=threads.map(x=>`${x.from}→${x.to} (${x.label})`);emit('处理最后结点的空右指针','最后结点没有后继，无头结点时右线索指向空。',[previous.key])}}
 emit('遍历结束',`完整序列 ${s.输出.join(' → ')}。`);return t.finish()
}

export function huffman(){
 let id=0,forest=[2,3,4,7].map(w=>({id:String(id++),keys:[w],weight:w,children:[],label:String(w)}));const s={候选根权:forest.map(n=>n.weight),合并代价:0,编码:{}},t=recorder({title:'哈夫曼树与编码',intro:'叶权 2、3、4、7；每次合并当前最小的两棵树，左边记 0、右边记 1。',condition:'同权可任选，树形或编码可能不同；加权路径长度 WPL 相同。这里只计算二叉哈夫曼树。',flow:flow('每个叶各为一棵树','选两个最小权根 → 合并，父权为和 → 放回候选集合','还剩多棵树？ 是 → 继续；否 → 沿路径编码，计算 WPL'),formula:String.raw`$$WPL=\sum_i w_i l_i$$`},s)
 const emit=(title,why,root)=>{const parts=forest.map(n=>generalTree(n).tree);t.add(title,why,{tree:{root:parts[0].root,roots:parts.map(g=>g.root),nodes:parts.flatMap(g=>g.nodes)},rows:[row('当前候选根权',s.候选根权)]})}
 emit('初始森林','四个叶尚未合并。')
 while(forest.length>1){forest.sort((a,b)=>a.weight-b.weight);const a=forest.shift(),b=forest.shift(),n={id:String(id++),keys:[a.weight+b.weight],label:String(a.weight+b.weight),weight:a.weight+b.weight,children:[a,b]};forest.push(n);s.合并代价+=n.weight;s.候选根权=forest.map(x=>x.weight);emit(`合并 ${a.weight} + ${b.weight} = ${n.weight}`,'新根重新参与最小值选择；不能只按最初叶权排序合并。',n)}
 function code(n,bits){if(!n.children.length)s.编码[n.weight]=bits;else n.children.forEach((c,i)=>code(c,bits+i))}code(forest[0],'');s.WPL=Object.entries(s.编码).reduce((sum,[w,c])=>sum+Number(w)*c.length,0);emit('得到编码与 WPL',`编码 ${Object.entries(s.编码).map(([w,c])=>w+':'+c).join('；')}；WPL=${s.WPL}，也等于各次合并权之和。`,forest[0]);return t.finish()
}
export function unionFind(){
 const p=[-1,-1,-1,-1,-1,-1],s={双亲数组:p,查找路径:[],结果:'未操作'},t=recorder({title:'并查集 · 按大小合并与路径压缩',intro:'元素 0～5，根用负数记录集合大小；先合并，再查找并压缩路径。',condition:'Union 先查根，根相同不合并；将较小集合接到较大集合根。Find 的路径压缩不改变集合成员。',flow:flow('Find：沿双亲找到根','Union：同根 → 不动；异根 → 小集合接大集合，更新负大小','Find 再访问 → 沿途点直接指向根')},s)
 const emit=(title,why,active=[])=>t.add(title,why,arrayView('双亲／根的负大小',p,active))
 function find(x,compress=true){const path=[];let r=x;while(p[r]>=0){path.push(r);r=p[r]}s.查找路径=[...path,r];emit(`Find(${x}) 得根 ${r}`,'负数是根，不能继续把它当作双亲下标。',[...path,r]);if(compress)for(const v of path)if(p[v]!==r){p[v]=r;emit(`${v} 直接挂到根 ${r}`,'压缩路径，只改双亲，不改根记录的大小。',[v,r])}return r}
 emit('初始','每个元素各自成集合，大小为 1。')
 for(const [a,b] of [[0,1],[2,3],[4,5],[2,4],[0,2]]){let r=find(a),q=find(b);if(r===q)continue;if(p[r]>p[q])[r,q]=[q,r];p[r]+=p[q];p[q]=r;emit(`Union(${a},${b})`,'把较小集合的根接到较大集合根，并相加集合大小。',[r,q])}find(5);s.结果='全部同属一个大小为 6 的集合';emit('结束',s.结果);return t.finish()
}
export function heapOperation(name='自底向上建堆'){
 const a=name==='自底向上建堆'?[3,7,2,9,5]:[9,7,6,3,2],s={数组:a,堆大小:a.length},t=recorder({title:name,intro:'大根堆，数组下标从 0 开始；孩子为 2i+1、2i+2。',condition:'建堆从最后一个非叶结点向前；插入从末尾向上调整；删除堆顶用末元素补根并向下调整。建堆 O(n)，单次插删 O(log n)。',flow:flow('确定起始位置与有效堆大小','比较父子／两个孩子 → 必要时交换','继续上浮／下沉；堆序满足则停止')},s)
 function view(active=[]){const tree=i=>i>=a.length?null:{id:i,key:a[i],left:tree(2*i+1),right:tree(2*i+2)};return {...binaryView(tree(0),active),...arrayView('堆的数组表示',a,active)}}
 const emit=(title,why,active=[])=>{s.堆大小=a.length;t.add(title,why,view(active))}
 function down(i){while(2*i+1<a.length){let c=2*i+1;if(c+1<a.length&&a[c+1]>a[c])c++;emit(`比较父 ${a[i]} 与较大孩子 ${a[c]}`,'大根堆选择较大孩子；父不小于孩子则停止。',[i,c]);if(a[i]>=a[c])break;[a[i],a[c]]=[a[c],a[i]];emit('交换并继续下沉','只沿发生变化的这条路径调整。',[i,c]);i=c}}
 emit('初始','观察数组与树形表示的一一对应。')
 if(name==='自底向上建堆'){for(let i=Math.floor(a.length/2)-1;i>=0;i--)down(i)}
 else if(name==='插入并上浮'){a.push(8);let i=a.length-1;emit('新记录 8 放在末尾','先保持完全二叉树形状，再恢复堆序。',[i]);while(i>0){const p=(i-1)>>1;if(a[p]>=a[i])break;[a[p],a[i]]=[a[i],a[p]];emit('与双亲交换','孩子更大，向上浮动。',[p,i]);i=p}}
 else {s.删除值=a[0];a[0]=a.pop();emit('末元素补到根','不能直接删除根留下空洞。',[0]);down(0)}emit('堆序恢复','每个父结点均不小于自己的孩子；数组仍不一定整体有序。');return t.finish()
}
