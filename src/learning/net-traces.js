import {recorder,row,flow} from './trace-kit.js'
export function framing(name='零比特填充'){
 const bit=name==='零比特填充',input=bit?'01111110111110':['A','FLAG','B','ESC','C'],s={原数据:input,发送:[],接收还原:[]},t=recorder({title:'透明传输 · '+name,intro:bit?'数据部分每连续五个 1 后插入一个 0；接收方按同一规则去掉。':'特殊字节 FLAG 与 ESC 前插入 ESC，帧首尾另加 FLAG。',condition:'只处理帧的数据部分，不对帧定界符本身填充。接收时先识别定界和异常，再去填充，不能把所有 0／ESC 都删掉。',flow:flow('逐位／字节扫描数据','出现特殊模式 → 插入转义信息；其余照抄','接收端按规则跳过填充信息 → 还原原始数据')},s)
 const emit=(a,b)=>t.add(a,b,{rows:[row('发送数据部分',s.发送),row('接收还原',s.接收还原)]})
 emit('原始数据','定界符不包含在这段原始数据内。');let ones=0
 for(const x of input){s.发送.push(x);if(bit){ones=x==='1'?ones+1:0;if(ones===5){s.发送.push('0');ones=0;emit('连续五个 1，插入 0','数据中的 01111110 不会被误认为帧定界符。')}}else if(x==='FLAG'||x==='ESC'){s.发送.splice(s.发送.length-1,0,'ESC');emit('插入 ESC','转义其后紧邻的特殊字节。')}else emit('复制普通数据','不需要转义。')}
 ones=0;for(let i=0;i<s.发送.length;i++){const x=s.发送[i];if(!bit&&x==='ESC'){s.接收还原.push(s.发送[++i]);emit('识别转义，取下一个字节','ESC 仅改变下一字节解释。');continue}s.接收还原.push(x);if(bit){ones=x==='1'?ones+1:0;if(ones===5){i++;ones=0;emit('五个 1 后跳过填充 0','只删除规则指定的这个 0。')}}}emit('还原完成','去填充后与原始数据完全一致。');return t.finish()
}
export function crc(){
 const data='1101011011',g='10011',work=(data+'0000').split('').map(Number),s={原数据:data,生成多项式:g,工作串:work,余数:'待算'},t=recorder({title:'CRC 循环冗余校验 · 模 2 除法',intro:'数据 1101011011，生成多项式 10011（四次），先补四个 0。',condition:'模 2 减法就是异或，无借位。余数必须补足 r 位；接收端余数非零说明检错，余数为零也不能保证绝对无错。',flow:flow('数据末尾补 r 个 0','从最高位扫描\n├─ 当前位为 1 → 与生成式对齐异或\n└─ 为 0 → 向右移动','取最后 r 位作 FCS → 数据拼接 FCS → 接收端再除以生成式')},s)
 const emit=(a,b,i=-1)=>t.add(a,b,{rows:[row('模 2 除法工作串',work,Array.from({length:g.length},(_,k)=>i+k).filter(x=>x>=0))]})
 emit('先补零','生成式最高次数为 4，不是按 1 的个数补零。');for(let i=0;i<data.length;i++){if(work[i]){for(let k=0;k<g.length;k++)work[i+k]^=+g[k];emit(`从下标 ${i} 异或生成式`,'最高位消成 0，继续向右。',i)}}s.余数=work.slice(-4).join('');s.发送码字=data+s.余数;emit('拼接校验字段',`FCS=${s.余数}。`);const check=s.发送码字.split('').map(Number);for(let i=0;i<data.length;i++)if(check[i])for(let k=0;k<g.length;k++)check[i+k]^=+g[k];s.接收余数=check.slice(-4).join('');emit('无差错码字验证',`接收端余数 ${s.接收余数}。`);return t.finish()
}
export function errorCode(name='海明码单比特纠错'){
 const s={数据:[1,0,1,1],码字:[],校验结果:[]},t=recorder({title:'差错控制 · '+name,intro:'海明 (7,4) 偶校验：校验位在 1、2、4，数据 1011 放在 3、5、6、7；注入第 6 位单比特错误。',condition:'位号从左起标为 1～7，综合征以 s4s2s1 读成二进制定位；普通海明码的此纠错示例假定只有一位错，不把双错误称为可纠。',flow:flow('确定校验位位置／奇偶约定','计算各校验组 → 生成码字','接收重新校验 → 综合征为 0 则本规则未检出错；非 0 且单错假设成立则定位翻转')},s)
 const emit=(a,b,active=[])=>t.add(a,b,{rows:[row('位号 1～7 的码字',s.码字,active)],equation:s.算式})
 if(name==='奇偶校验'){s.码字=[...s.数据];const p=s.数据.reduce((a,b)=>a^b,0);s.码字.push(p);emit('补偶校验位',`原数据有 3 个 1，补 ${p} 后 1 总数为偶数。`);s.码字[1]^=1;s.校验结果=[s.码字.reduce((a,b)=>a^b,0)];emit('注入一位错后校验','异或结果为 1，检出奇数个位翻转；只能检错，不能定位。');return t.finish()}
 s.码字=[0,0,1,0,0,1,1];emit('先填数据位','P1、P2、P4 暂为 0。');for(const p of [1,2,4]){let parity=0;for(let i=1;i<=7;i++)if(i&p)parity^=s.码字[i-1];s.码字[p-1]=parity;emit(`计算 P${p}=${parity}`,`覆盖位号二进制第 ${Math.log2(p)} 位为 1 的位置。`,[p-1])}s.正确码字=[...s.码字];s.码字[5]^=1;emit('传输中第 6 位翻转','接收方事先并不知道错位是 6。',[5]);let syndrome=0;for(const p of [1,2,4]){let check=0;for(let i=1;i<=7;i++)if(i&p)check^=s.码字[i-1];s.校验结果.push(check);if(check)syndrome+=p;emit(`重新计算 s${p}=${check}`,'组内所有位包括对应校验位。')}s.综合征=syndrome;s.码字[syndrome-1]^=1;emit(`综合征 110₂=${syndrome}，纠正该位`,'翻转第 6 位，恢复原码字。',[syndrome-1]);return t.finish()
}
export function checksum(){
 const words=[0x1234,0x5678,0x9ABC],s={数据字:words.map(x=>x.toString(16)),累加:0,校验和:'待算'},t=recorder({title:'因特网校验和 · 反码求和',intro:'三个 16 位字 0x1234、0x5678、0x9ABC；奇数字节时仅为计算补零，补零不作为实际数据发送。',condition:'UDP/TCP 还要把伪首部、协议首部纳入计算；本例只演示反码求和内核，不是完整报文。最高进位回卷到最低位后再取反，不能直接丢掉。',flow:flow('分成 16 位字 → 逐字相加','高位有进位 → 低 16 位加上进位，必要时重复','结果逐位取反 → 得校验和','接收端包括校验和一起反码求和 → 全 1 为通过')},s)
 const emit=(a,b)=>t.add(a,b,{equation:s.算式,rows:[row('16 位字',s.数据字)]})
 for(const w of words){s.累加+=w;s.算式='当前总和 0x'+s.累加.toString(16).toUpperCase();emit('加一个 16 位字',s.算式);while(s.累加>0xFFFF){s.累加=(s.累加&0xFFFF)+(s.累加>>>16);s.算式='回卷后 0x'+s.累加.toString(16).toUpperCase();emit('最高位进位回卷','进位加回低 16 位。')}}s.校验和值=(~s.累加)&0xFFFF;s.校验和='0x'+s.校验和值.toString(16).padStart(4,'0').toUpperCase();s.算式='~0x'+s.累加.toString(16).toUpperCase()+' = '+s.校验和;emit('对和取反',s.校验和);s.接收反码和=s.累加+s.校验和值;emit('接收端核对','包括校验和相加得到 0xFFFF。');return t.finish()
}
export function cdma(){
 const A=[1,1,1,1],B=[1,-1,1,-1],s={A码片:A,B码片:B,发送比特:{A:1,B:0},叠加:[],内积:0},t=recorder({title:'CDMA 码分多址 · 叠加与相关解码',intro:'使用两组正交的 4 码片教学序列，A 发 1（+A），B 发 0（−B）。',condition:'同步、等功率、理想无噪声；标准化内积 +1 表示 1，−1 表示 0，0 表示该站未发送。在此模型中码片序列需正交。',flow:flow('每个发送者按比特选择 +码片或 −码片','信道逐位置相加','接收叠加向量与目标站码片作内积 → 除码片数 → 判比特')},s)
 const emit=(a,b,active=[])=>t.add(a,b,{rows:[row('A',A,active),row('B',B,active),row('信道叠加',s.叠加,active)]})
 emit('先验证正交','A·B=1−1+1−1=0。');s.叠加=A.map((x,i)=>x-B[i]);emit('叠加 +A 与 −B','信道向量为 [0,2,0,2]。');for(let i=0;i<4;i++){s.内积+=s.叠加[i]*A[i];emit(`累加第 ${i+1} 个乘积`,`${s.叠加[i]}×${A[i]}，累计 ${s.内积}。`,[i])}s.A解码=s.内积/4;s.B解码=s.叠加.reduce((v,x,i)=>v+x*B[i],0)/4;emit('除以码片长度判决',`A 得 ${s.A解码} → 比特 1，B 得 ${s.B解码} → 比特 0。`);return t.finish()
}
export function mediumAccess(name='CSMA/CD 二进制指数退避'){
 const s={碰撞次数:0,退避阶段:0,计数器:0,轨迹:[]},t=recorder({title:'共享介质访问 · '+name,intro:'退避随机数采用固定教学样本，便于复核；它们表示一次可能的抽样结果，不是协议每次必选的常量。',condition:'CSMA/CD 用于共享半双工以太网，时隙 2τ；第 n 次碰撞从 0…2ᵏ−1 选数，k=min(n,10)，16 次失败后放弃。CSMA/CA 退避只在信道空闲满足间隔后递减，忙时冻结。',flow:flow('监听信道','忙 → 等待；空闲 → 按协议发送／退避','CD 检测碰撞 → 干扰信号 → 指数退避\nCA 冻结／恢复倒计时 → 发送 → 等 ACK','成功结束；碰撞／超时则按规则扩大窗口并重试')},s)
 const emit=(a,b)=>{s.轨迹.push(a);t.add(a,b,{route:s.轨迹.slice(-5),rows:[row('碰撞／阶段／退避计数',[s.碰撞次数,s.退避阶段,s.计数器])]})}
 if(name.startsWith('CSMA/CA')){emit('信道空闲 DIFS 后选退避值 3','本次随机抽样为 3 个时隙。');s.计数器=3;for(let i=0;i<2;i++){s.计数器--;emit('空闲一个时隙，计数减一','仅空闲时递减。')}emit('检测到别人发送，冻结在 1','等待别人完成，不能在忙时继续减到 0。');emit('信道重新空闲并经过 DIFS','恢复原计数 1，不重新随机选数。');s.计数器=0;emit('再空闲一时隙，计数归零','获得发送机会。');emit('发送 DATA → SIFS → 收 ACK','ACK 确认接收，SIFS 比 DIFS 短。')}
 else if(name.includes('ALOHA')){s.A区间=[0,1];s.B区间=name==='时隙 ALOHA'?[0,1]:[.7,1.7];emit('A、B 的帧在信道重叠','两帧碰撞，接收失败。');emit('随机等待后重传','纯 ALOHA 可任意时刻发送，易受 2T 内其他起发干扰；时隙 ALOHA 仅槽边界发送，易损期 T。')}
 else {emit('监听空闲后发送','边发边检测，不代表永远不会碰撞。');for(let n=1;n<=3;n++){s.碰撞次数=n;s.退避阶段=Math.min(n,10);s.随机范围=`0…${2**s.退避阶段-1}`;s.计数器=[1,2,5][n-1];emit(`第 ${n} 次碰撞，发干扰信号`,`取 r=${s.计数器}，等待 r×2τ=${s.计数器} 个时隙。`);emit('等待退避并重新监听','退避完成后仍需遵守载波监听规则。')}emit('重传成功','停止本帧的重试；新帧重新计碰撞。')}return t.finish()
}
export function switchLearning(){
 const s={转发表:{},帧:'—',转发端口:[]},t=recorder({title:'交换机自学习 · 学源查目的',intro:'交换机端口 1、2、3 分别接 A、B、C；开始转发表为空。依次 A→B、B→A、C→B。',condition:'学习源 MAC 与入端口；未知单播向除入端口外的端口泛洪，同 VLAN 范围内。目的端口等于入端口时过滤。',flow:flow('帧到达 → 用源 MAC 更新入端口','查目的 MAC\n├─ 未知／广播 → 除入端口外泛洪\n├─ 已知且同入端口 → 过滤\n└─ 已知且另一端口 → 单播转发')},s)
 const emit=(a,b)=>t.add(a,b,{table:{heads:['MAC','端口'],rows:Object.entries(s.转发表)},route:[s.帧,...s.转发端口.map(x=>'端口 '+x)]})
 emit('空表','交换机此时不知道 A、B、C 在哪个端口。');for(const [src,dst,port] of [['A','B',1],['B','A',2],['C','B',3],['A','C',1]]){s.帧=src+'→'+dst;s.转发端口=[];s.转发表[src]=port;emit(`从端口 ${port} 学习源 ${src}`,'先学源，再查目的，不能反过来把目的学到入端口。');s.转发端口=s.转发表[dst]?[s.转发表[dst]].filter(x=>x!==port):[1,2,3].filter(x=>x!==port);emit(`查目的 ${dst} 并转发`,s.转发表[dst]?'已知目的，定向转发。':'未知目的，除入端口外泛洪。')}return t.finish()
}
const ip=x=>x.split('.').reduce((a,b)=>a*256+Number(b),0)
const dotted=x=>[24,16,8,0].map(k=>Math.floor(x/2**k)%256).join('.')
export function subnet(name='最长前缀匹配'){
 const s={地址:'192.168.1.130',结果:[],当前前缀:'—'},t=recorder({title:'IPv4 地址计算 · '+name,intro:'使用 192.168.1.0/24 教学网络；常规子网按网络地址与广播地址不可分配的规则计主机，/31、/32 特例不在本例。',condition:'网络地址=IP 与掩码按位与；最长前缀匹配先比匹配与否，再取前缀最长者；聚合必须前缀相同且边界对齐，不能只看地址连续。',flow:flow('确定地址和前缀长度','子网 → 算主机位与块大小并检查对齐\nVLSM → 需求从大到小，逐个对齐分配\n转发 → 所有匹配前缀中选最长','核对网络／广播／可用区间；无匹配才用默认路由')},s)
 const emit=(a,b)=>t.add(a,b,{rows:[row('结果',s.结果)],equation:s.算式})
 emit('初始地址与前缀','先确认采用按位网络前缀的规则，不依赖早期 A／B／C 类分类。')
 if(name==='最长前缀匹配'){let best=null;for(const [network,prefix,port] of [['0.0.0.0',0,'默认'],['192.168.1.0',24,'A'],['192.168.1.128',25,'B'],['192.168.1.128',26,'C']]){const size=2**(32-prefix),match=Math.floor(ip(s.地址)/size)===Math.floor(ip(network)/size);s.当前前缀=network+'/'+prefix;if(match&&(!best||prefix>best.prefix))best={prefix,port};s.结果.push(`${s.当前前缀} ${match?'匹配':'不匹配'}`);emit('逐项比较前缀',`当前最佳出口 ${best?.port||'无'}。`)}s.出口=best.port;emit('取最长匹配 /26','不是取表中第一项，也不是按下一跳 IP 大小。')}
 else if(name==='VLSM 变长子网'){let start=ip('192.168.1.0');for(const hosts of [60,30,12]){const hostBits=Math.ceil(Math.log2(hosts+2)),size=2**hostBits;start=Math.ceil(start/size)*size;s.结果.push(`${hosts} 台：${dotted(start)}/${32-hostBits}，可用 ${dotted(start+1)}～${dotted(start+size-2)}`);s.算式=`${hosts}+2 → ${hostBits} 主机位 → ${size} 地址`;emit('分配一个子网','先大后小，起始地址必须对齐块大小。');start+=size}}
 else if(name==='CIDR 路由聚合'){s.结果=['192.168.0.0/24','192.168.1.0/24'];emit('比较两个前缀','第三字节 00000000 与 00000001，仅最低位不同。');s.聚合='192.168.0.0/23';s.结果.push(s.聚合);emit('去掉一位前缀','两 /24 大小相同、连续且按 /23 对齐，可聚合。')}
 else {const prefix=26,size=64,start=Math.floor(ip(s.地址)/size)*size;s.掩码='255.255.255.192';s.网络=dotted(start);s.广播=dotted(start+size-1);s.可用=`${dotted(start+1)}～${dotted(start+size-2)}`;s.结果=[s.网络,s.广播,s.可用];emit('主机位清零／置一','130 落在 128～191 块中，网络 .128，广播 .191，可用 .129～.190。')}return t.finish()
}
export function fragmentation(){
 const s={原总长:4000,首部:20,MTU:1500,剩余数据:3980,已分数据:0,分片:[]},t=recorder({title:'IPv4 分片 · 长度、偏移与 MF',intro:'IPv4 总长 4000B，首部 20B（无选项），MTU=1500B，允许分片，原片偏移 0、MF=0。',condition:'偏移单位 8B；除最后一个分片外的数据长度必须为 8 的倍数。总长包含首部，每片都要加首部；所有分片沿用同一标识。',flow:flow('最大数据量=⌊(MTU−首部)/8⌋×8','取一片数据 → 总长=首部+数据 → 偏移=前面数据总量/8','仍有后片 → MF=1；最后片 → 继承原片 MF','继续切分，核对所有数据长度之和')},s)
 const emit=(a,b)=>t.add(a,b,{table:{heads:['片','数据长度','总长','偏移(8B)','MF'],rows:s.分片.map((x,i)=>[i+1,x.data,x.total,x.offset,x.mf])},equation:s.算式})
 s.每片最大数据=Math.floor((s.MTU-s.首部)/8)*8;s.算式='⌊(1500−20)/8⌋ × 8 = 1480';emit('先算分片数据上限','1480 正好是 8 的倍数。');while(s.剩余数据){const data=Math.min(s.每片最大数据,s.剩余数据);s.分片.push({data,total:data+20,offset:s.已分数据/8,mf:+(s.剩余数据>data)});s.已分数据+=data;s.剩余数据-=data;emit('生成一个分片',`已分 ${s.已分数据}B，还剩 ${s.剩余数据}B 数据。`)}return t.finish()
}
