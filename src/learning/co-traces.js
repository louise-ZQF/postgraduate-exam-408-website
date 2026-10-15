import {recorder,row,flow} from './trace-kit.js'
const bits=(x,n)=>((x%(2**n)+2**n)%(2**n)).toString(2).padStart(n,'0')
const signed=(x,n)=>x>=2**(n-1)?x-2**n:x
export function numberConversion(name='整数除基取余'){
 const s={输入:name==='小数乘基取整'?0.625: name==='补码与真值'?-5:42,结果:[],当前值:0},t=recorder({title:'数制与机器数 · '+name,intro:'分别演示 42 的二进制转换、0.625 的二进制小数和 8 位 −5 的原／反／补码。',condition:'整数余数逆序读，小数整数部分顺序读。以下机器码总位数 8，含一位符号位；移码偏置若非 128，不能直接翻补码符号位。',flow:flow('确定进制、总位数与是否有符号','整数：反复除基取余，再倒序\n小数：反复乘基取整，按先后连接\n负整数：符号+绝对值 → 数值位取反 → 加 1','按位权或无符号值减 2⁸ 核对')},s)
 const emit=(a,b)=>t.add(a,b,{rows:[row('已记录',s.结果)],equation:s.算式})
 emit('初始','先确认本例的输入和表示约定。')
 if(name==='小数乘基取整'){let x=.625;for(let i=0;x&&i<8;i++){const y=x*2,b=Math.floor(y);s.算式=`${x} × 2 = ${y} → 取整数 ${b}`;s.结果.push(b);x=y-b;s.当前值=x;emit('乘 2 取整','保留小数部分进入下一轮，不把整数部分再乘。')}s.二进制='0.'+s.结果.join('')}
 else if(name==='补码与真值'){s.原码='10000101';s.结果=s.原码.split('');emit('负数原码','最高位为 1，其余七位表示绝对值 5。');s.反码='11111010';s.结果=s.反码.split('');emit('符号不变，数值位取反','原码转反码不能把符号位取反。');s.补码=bits(256-5,8);s.结果=s.补码.split('');emit('反码加 1','得到 11111011；把位串读成无符号数为 251。');s.真值=251-256;s.算式='251 − 256 = −5';emit('补码还原真值','负补码的无符号值减 2⁸。')}
 else {let x=42;while(x){const q=Math.floor(x/2),r=x%2;s.结果.push(r);s.算式=`${x} ÷ 2 = ${q} …… ${r}`;s.当前值=q;emit('除 2 取余','保存余数，商继续除以 2。');x=q}s.二进制=[...s.结果].reverse().join('')}
 emit('完成',s.二进制?`结果为 ${s.二进制}。`:'编码与真值核对完成。');return t.finish()
}
export function arithmetic(name='补码加法与标志'){
 const s={A:'',B:'',结果:'',CF:0,OF:0,SF:0,ZF:0},t=recorder({title:'定点运算 · '+name,intro:'4 位示例：7+3 溢出；3−5 出现无符号借位；−3 的算术右移与逻辑右移对比。',condition:'本例 CF 对减法采用 x86 的借位约定；不同体系可用非借位约定，须按题设。OF 判断有符号溢出，不能用 CF 代替。',flow:flow('确定 w 位输入与解释方式','减法 → 加上减数按位取反再加 1；加法 → 逐位累加','保留低 w 位 → 分别判断无符号进／借位与有符号溢出','移位先区分逻辑、算术、循环，溢出另判')},s)
 const emit=(a,b,active=[])=>t.add(a,b,{rows:[row('A',s.A.split(''),active),row('B',s.B.split(''),active),row('结果',s.结果.split(''),active)]})
 if(name.includes('移位')){s.A=bits(-3,4);emit('−3 的 4 位补码','1101，符号位为 1。');s.逻辑右移='0110';s.算术右移='1110';s.循环右移='1110';s.结果=s.算术右移;emit('分别右移一位','逻辑补 0；算术补符号；循环把最低位移到最高位。算术结果 −2，负数右移舍去 1 相当于向负无穷取整。');s.左移=bits(-3*2,4);emit('左移一位','算术左移与逻辑左移均低位补 0，但有符号数仍要检查溢出。')}
 else {const sub=name.includes('减法'),a=sub?3:7,b=sub?5:3,bb=sub?15-b:b;let c=sub?1:0,result=0;s.A=bits(a,4);s.B=bits(b,4);s.运算=sub?'A + NOT(B) + 1':'A + B';emit('准备操作数',sub?'减法用补码加法实现，初始进位为 1。':'初始进位为 0。');for(let i=0;i<4;i++){const ai=a>>i&1,bi=bb>>i&1,sum=ai+bi+c;s.算式=`第 ${i} 位：${ai}+${bi}+${c}=${sum}`;result|=(sum&1)<<i;c=sum>>1;s.结果=bits(result,4);s.当前进位=c;emit(`计算第 ${i} 位`,s.算式,[3-i])}const raw=sub?a-b:a+b;s.CF=sub?Number(a<b):c;s.OF=Number(raw< -8||raw>7);s.SF=result>>3;s.ZF=Number(result===0);s.有符号结果=signed(result,4);emit('分别给出四个标志',`低四位 ${s.结果}；有符号结果 ${s.有符号结果}。OF=${s.OF} 与 CF=${s.CF} 含义不同。`)}return t.finish()
}
export const multiplyNames=['无符号逐位乘法','原码乘法','Booth 补码乘法','恢复余数除法','不恢复余数除法']
export function multiplyDivide(name=multiplyNames[0]){
 const s={轮次:0,A:0,Q:0,M:0,结果:'待算'},t=recorder({title:'移位乘除 · '+name,intro:name.includes('除法')?'无符号整数 13÷3，商 4、余 1，逐轮追踪部分余数。':name==='Booth 补码乘法'?'4 位补码 −3×5，联合寄存器为 A｜Q｜Q₋₁。':'4 位数值部分 3×5；原码示例为 −3×5，先算绝对值再处理符号。',condition:'整数模型。乘法保留 2n 位；Booth 每轮先看 Q₀Q₋₁，01 加 M、10 减 M，再联合算术右移。除数非零，余数寄存器有足够位宽，不使用 JavaScript 的位移符号隐式替代算法。',flow:flow('初始化部分积／余数与计数器','乘法：检查乘数位 → 加／减 → 移位\n除法：部分余数与下一被除数位合并 → 加／减除数 → 形成商位','循环 n 轮 → 除法按需要校正负余数 → 核对商×除数+余数／乘积')},s)
 const emit=(a,b)=>t.add(a,b,{rows:[row('A',bits(s.A,name==='Booth 补码乘法'?4:name.includes('除法')?5:8).split('')),row('Q',bits(s.Q,4).split('')),row('M',bits(s.M,name==='Booth 补码乘法'?4:8).split(''))],equation:s.算式})
 if(name==='Booth 补码乘法'){s.A=0;s.Q=5;s.M=-3;s.Q前位=0;emit('初始化','A=0000，Q=0101，M=1101，附加位为 0。');for(let i=0;i<4;i++){s.轮次=i+1;const pair=(s.Q&1)*2+s.Q前位;if(pair===1)s.A=signed(parseInt(bits(s.A+s.M,4),2),4);if(pair===2)s.A=signed(parseInt(bits(s.A-s.M,4),2),4);emit(`检查 Q₀Q₋₁=${bits(pair,2)}`,pair===1?'01 → A←A+M':pair===2?'10 → A←A−M':'00／11 → A 保持');const oldA=s.A,oldQ=s.Q;s.Q前位=oldQ&1;s.Q=((oldA&1)<<3)|(oldQ>>1);s.A=Math.floor(oldA/2);emit('联合算术右移','A 的最低位进入 Q 最高位；Q 最低位进入附加位；A 最高位补符号。')}s.乘积=signed((parseInt(bits(s.A,4),2)<<4)|s.Q,8);s.结果=s.乘积}
 else if(name.includes('除法')){s.M=3;s.Q=13;s.A=0;emit('初始化','被除数 1101，从最高位开始进入部分余数。');const restoring=name==='恢复余数除法';for(let i=0;i<4;i++){s.轮次=i+1;const old=s.A,top=s.Q>>3;s.Q=s.Q*2%16;s.A=s.A*2+top;emit('左移并引入下一位',`原部分余数 ${old}，引入 ${top}，得到 ${s.A}。`);s.A+=restoring||old>=0?-s.M:s.M;emit(restoring||old>=0?'试减除数':'前轮为负，改加除数',`当前部分余数 ${s.A}。`);if(s.A>=0){s.Q++;emit('商末位写 1','本轮部分余数非负。')}else if(restoring){s.A+=s.M;emit('商末位写 0，恢复余数','试减为负，立即加回除数。')}else emit('商末位写 0，保留负余数','下一轮左移后加除数，不在本轮立即恢复。')}if(s.A<0){s.A+=s.M;emit('最终余数校正','最后仍为负，需要加回除数一次。')}s.商=s.Q;s.余数=s.A;s.结果=`${s.Q} 余 ${s.A}`;s.算式=`${s.Q} × 3 + ${s.A} = 13`}
 else {s.M=3;s.Q=5;s.A=0;emit('初始化','部分积为 0，检查乘数最低位。');let product=0;for(let i=0;i<4;i++){s.轮次=i+1;if(s.Q&1){product+=s.M;s.A=product;emit('乘数最低位为 1','把当前左移后的被乘数加入部分积。')}else emit('乘数最低位为 0','本轮不加。');s.A=product;s.M*=2;s.Q=Math.floor(s.Q/2);emit('被乘数左移，乘数右移',`部分积=${product}。`)}s.乘积=name==='原码乘法'?-product:product;s.符号=name==='原码乘法'?'1 XOR 0 = 1':'无符号';s.结果=s.乘积}
 emit('运算完成',`结果 ${s.结果}；必须把最后校正与符号处理计入。`);return t.finish()
}
export function floating(name='IEEE 754 编码'){
 const s={数值:name==='IEEE 754 编码'?13.25:'待算',符号:0,阶码:'待算',尾数:'待算'},t=recorder({title:'浮点运算 · '+name,intro:name==='IEEE 754 编码'?'把 13.25 编成 IEEE 754 binary32。':'用精确二进制例子计算 1.5+0.75，再单独观察保护位、舍入位和粘滞位。',condition:'binary32 为 1 位符号、8 位偏置阶码、23 位小数；正规数隐含首位 1。默认舍入为最近偶数，截断不能代替舍入。',flow:flow('表示：转二进制 → 规格化 → 加偏置 → 填小数位','加减：小阶对大阶 → 尾数加减 → 规格化 → 舍入 → 再查规格化和溢出','阶码全 0／全 1 时按非正规、零、无穷和 NaN 的规则另判')},s)
 const emit=(a,b)=>t.add(a,b,{rows:[row('符号｜阶码｜小数',[s.符号,s.阶码,s.尾数])],equation:s.算式})
 if(name==='IEEE 754 编码'){emit('先定符号','13.25 为正，S=0。');s.二进制='1101.01';emit('整数与小数分别转换','13=1101₂，0.25=0.01₂。');s.规格化='1.10101 × 2³';s.实际指数=3;emit('规格化','把小数点左移三位，指数为 3。');s.偏置阶码=3+127;s.阶码=bits(130,8);s.尾数='10101'.padEnd(23,'0');s.位串='0'+s.阶码+s.尾数;s.十六进制=Number.parseInt(s.位串,2).toString(16).toUpperCase();emit('填入三个字段',`E=3+127=130；隐含 1 不写入尾数字段。0x${s.十六进制}。`)}
 else if(name==='最近偶数舍入'){s.保留位='1.010';s.G=1;s.R=0;s.S=0;emit('恰好半个末位单位','GRS=100，保留末位为 0（偶数）→ 不进位。');s.偶数结果='1.010';s.保留位='1.011';emit('仍是恰好一半，但末位为 1','GRS=100，保留末位奇数 → 进 1，得到 1.100。');s.奇数结果='1.100';s.保留位='1.010';s.S=1;s.超过一半结果='1.011';emit('粘滞位为 1，超过一半','GRS=101 → 即使保留末位为 0，也要进位。')}
 else {s.X='1.1 × 2⁰';s.Y='1.1 × 2⁻¹';emit('先比较指数','指数差为 1，不直接相加两个不同权重的尾数。');s.Y='0.11 × 2⁰';emit('小阶向大阶对齐','Y 尾数右移一位，指数提高到 0。');s.算式='1.10 + 0.11 = 10.01';emit('尾数相加','产生 10.01，暂未规格化。');s.规格化='1.001 × 2¹';s.阶码=bits(128,8);s.尾数='001'.padEnd(23,'0');s.数值=2.25;emit('右规、舍入与检查','右移一位指数加 1；本例精确，无舍入误差，结果 2.25。')}return t.finish()
}
export function cache(name='二路组相联 LRU'){
 const sets=name==='直接映射'?4:name==='全相联 LRU'?1:2,ways=4/sets,write=name.includes('写'),fifo=name.includes('FIFO'),lfu=name.includes('LFU'),random=name.includes('RAND'),blocks=write?[0,0,2,4,6]:[0,2,0,4,2,6,0],lines=Array.from({length:sets},()=>[]),s={命中:0,缺失:0,写回:0,当前块:'—',映射组:'—'},t=recorder({title:'Cache · '+name,intro:'Cache 共 4 行，每块 4B；地址流以主存块号表示。二路组相联为 2 组，每组 2 行。写示例均为写访问。',condition:'空 Cache 起步。LFU 按本次驻留期访问次数，同频取更早装入者；RAND 使用固定种子 27 的伪随机抽样以便复核。组号=块号 mod 组数，标记=⌊块号/组数⌋。写回+写分配：写命中只置脏；缺失先装块，脏牺牲块先回写。全写+非写分配：缺失直接写主存，不装入。',flow:flow('块号拆成标记与组号 → 仅比较本组有效行','命中 → 更新 LRU；写命中按写策略处理','缺失 → 空行优先，否则 LRU／FIFO 选牺牲块\n├─ 写回且脏 → 先写主存\n└─ 装入并更新策略状态','下一次访问 → 累计命中与缺失')},s)
 let seed=27
 const emit=(a,b,group=-1)=>t.add(a,b,{table:{heads:['组','行','块号','标记','最近访问','装入','频次','脏位'],rows:lines.flatMap((set,i)=>Array.from({length:ways},(_,j)=>{const x=set[j];return [i,j,x?.block??'空',x?Math.floor(x.block/sets):'—',x?.last??'—',x?.loaded??'—',x?.freq??'—',x?+x.dirty:'—']}))},rows:[row('本次访问块',[s.当前块]),row('各组',lines.map((a,i)=>`${i}: ${a.map(x=>x.block).join(',')||'空'}`),[group])]})
 emit('初始','四行全部无效。')
 blocks.forEach((block,time)=>{const g=block%sets,set=lines[g];s.当前块=block;s.映射组=g;const hit=set.find(x=>x.block===block);if(hit){s.命中++;hit.last=time;hit.freq++;if(write&&name.includes('写回'))hit.dirty=true;if(write&&!name.includes('写回'))s.主存写次数=(s.主存写次数||0)+1;emit(`块 ${block} 命中`,'命中不换块；FIFO 装入时刻不改，LRU 最近访问时刻要改。',g);return}s.缺失++;if(name==='全写＋非写分配'){s.主存写次数=(s.主存写次数||0)+1;emit(`块 ${block} 写缺失，直接写主存`,'不装入 Cache；不能套用写分配。',g);return}if(set.length===ways){const key=fifo?'loaded':lfu?'freq':'last';let victim;if(random){seed=(1664525*seed+1013904223)>>>0;const j=Math.floor(seed/2**32*set.length);s.随机选择行=j;victim=set[j]}else victim=set.reduce((a,b)=>a[key]<b[key]||a[key]===b[key]&&a.loaded<b.loaded?a:b);if(victim.dirty){s.写回++;emit(`先写回脏块 ${victim.block}`,'只在脏块被替换时产生本次写回。',g)}set.splice(set.indexOf(victim),1)}set.push({block,last:time,loaded:time,freq:1,dirty:write});emit(`装入块 ${block}`,`本组为 ${g}，标记 ${Math.floor(block/sets)}。`,g)});s.缺失率=s.缺失/blocks.length;emit('访问结束',`命中 ${s.命中}，缺失 ${s.缺失}；写回 ${s.写回}。`);return t.finish()
}
export function addressTranslation(name='TLB 未命中、页表命中'){
 const segmented=name.includes('段'),s={逻辑地址:0x1234,页号:4,页内偏移:0x234,物理地址:'待定',访问路径:[]},t=recorder({title:'地址变换 · '+name,intro:segmented?'段号 1，段内偏移 0x1234，段界限 0x2000；段页式页长 1024B。':'逻辑地址 0x1234=4660，页长 1024B，页号 4，偏移 564；页表将页 4 映射到框 9。',condition:'按字节编址；权限合法才访问数据。TLB 未命中不等于缺页；缺页重启后仍要重新形成物理地址。二级页表本例虚页号分成高 2 位和低 2 位，页内偏移 10 位。',flow:flow('拆分逻辑地址 → 检查段／页表界限','查 TLB\n├─ 命中 → 查权限并取页框\n└─ 未命中 → 查页表\n   ├─ 驻留 → 回填 TLB\n   └─ 不驻留 → 缺页中断，调页，重启','页框×页长+页内偏移 → 访问物理内存')},s)
 const emit=(a,b)=>t.add(a,b,{route:s.访问路径,rows:[row('地址字段',[`页 ${s.页号}`,`偏移 ${s.页内偏移}`,`PA ${s.物理地址}`])],equation:s.算式})
 emit('输入逻辑地址','先拆字段，保持页内偏移不变。')
 if(name==='基本分段'||name==='分段越界'){s.段号=1;s.段内偏移=name==='分段越界'?0x2345:0x1234;s.段界限=0x2000;s.段基址=0x8000;s.访问路径=['段表'];emit('查段表并比界限','段内偏移必须严格小于段长度。');if(s.段内偏移>=s.段界限){s.结果='越界异常';emit('停止地址变换','偏移超过段界限，不能继续访问物理内存。');return t.finish()}s.物理地址=s.段基址+s.段内偏移;s.访问路径.push('段基址＋偏移','内存');emit('段内连续定位',`0x8000+0x1234=0x${s.物理地址.toString(16)}。`);return t.finish()}
 if(segmented){s.访问路径.push('段表','本段页表');emit('先查段表','段内偏移 0x1234 < 0x2000；段表给本段页表基址，再拆页号与页内偏移。')}
 if(name==='二级页表'){s.外层下标=Math.floor(s.页号/4);s.内层下标=s.页号%4;s.访问路径.push(`外层表[${s.外层下标}]`,`内层表[${s.内层下标}]`);emit('分两级查表','虚页号 0100₂ → 外层 01₂、内层 00₂；内层表项才是页框号。')}
 else {s.访问路径.push('TLB');emit('先查 TLB',name==='TLB 命中'?'找到页号 4 的有效映射，页框为 9。':'TLB 没找到映射，还不能据此认定缺页。');if(name!=='TLB 命中'){s.访问路径.push('页表');emit('访问页表',name==='缺页与重启'?'页表驻留位为 0 → 发生缺页。':'页表驻留位为 1，得到页框 9。');if(name==='缺页与重启'){s.访问路径.push('缺页中断','调入框 9','更新页表','重启原指令');emit('处理缺页并重启','保存现场，必要时换出，磁盘调入；返回后重启导致缺页的指令。')}s.访问路径.push('回填 TLB')}}s.页框=9;s.物理地址=9*1024+s.页内偏移;s.算式=`9 × 1024 + 564 = ${s.物理地址} = 0x${s.物理地址.toString(16).toUpperCase()}`;s.访问路径.push('访问数据');emit('形成物理地址',s.算式);return t.finish()
}
export function memoryOrganization(name='低位交叉编址'){
 const s={地址:0,模块:0,模块内地址:0},t=recorder({title:'存储组织 · '+name,intro:name==='芯片字位扩展'?'用 2K×4 位芯片构成 8K×8 位存储器。':'4 个模块，每模块 4 个字，连续访问字地址 0～7。',condition:'低位交叉：低两位选模块，相邻字可分散访问；高位交叉：高位选模块。交叉编址是否提高速度还受存取周期、总线周期和冲突约束。',flow:flow('先统一字／字节与位宽单位','字扩展看容量倍数、位扩展看位宽倍数 → 芯片总数相乘','按编址方式拆模块号与模块内地址 → 启动对应模块')},s)
 const emit=(a,b)=>t.add(a,b,{rows:[row('模块 0～3',[0,1,2,3].map(i=>i===s.模块?`选中 M${i}`:`M${i}`),[s.模块])],equation:s.算式})
 if(name==='芯片字位扩展'){s.位扩展=8/4;s.算式='8 ÷ 4 = 2 片并联成 2K×8';emit('先位扩展','两片共享地址和片选，分别接低四位和高四位数据线。');s.字扩展=8/2;s.算式='8K ÷ 2K = 4 组';emit('再字扩展','低 11 位送所有芯片地址端，高 2 位译码选择 4 组中的一组。');s.芯片数=s.位扩展*s.字扩展;s.地址线=13;s.数据线=8;emit('汇总连接','共 8 片，13 根地址线，8 根数据线；片选不能误算为每片内部地址线。')}
 else for(let a=0;a<8;a++){s.地址=a;s.模块=name==='低位交叉编址'?a%4:Math.floor(a/4);s.模块内地址=name==='低位交叉编址'?Math.floor(a/4):a%4;s.算式=`地址 ${a} → M${s.模块}，内部地址 ${s.模块内地址}`;emit(`访问字 ${a}`,s.算式)}return t.finish()
}
export function addressing(name='间接寻址'){
 const s={形式地址:20,PC:100,R1:200,有效地址:'待算',操作数:'待取'},mem={20:300,200:7,220:9,300:42,120:11},t=recorder({title:'寻址 · '+name,intro:'A=20，PC 已指向下一条=100，R1=200；M[20]=300，M[200]=7，M[220]=9，M[300]=42，M[120]=11。',condition:'本例 PC 相对地址使用“取指后”的 PC，位移 20 为有符号值。寄存器间接中的寄存器保存地址，寄存器直接则保存操作数。',flow:flow('按寻址方式解释地址字段','计算有效地址 EA；立即与寄存器直接无需计算主存 EA','需要访存则取 M[EA]，间接寻址还要先取间接地址')},s)
 const emit=(a,b)=>t.add(a,b,{route:s.路径||[],equation:s.算式})
 emit('初始','区分形式地址、有效地址和操作数。')
 if(name==='立即寻址'){s.操作数=20;s.有效地址='不适用';s.路径=['指令立即数字段','操作数 20']}
 else if(name==='寄存器寻址'){s.操作数=200;s.有效地址='不适用';s.路径=['R1','操作数 200']}
 else {if(name==='间接寻址'){s.有效地址=mem[20];s.路径=['A=20','M[20]=300'];emit('先取地址','第一次访存得到 EA，不是最终操作数。')}else if(name==='寄存器间接'){s.有效地址=200;s.路径=['R1=200']}else if(name==='基址／变址寻址'){s.有效地址=220;s.路径=['R1+A=220']}else if(name==='PC 相对寻址'){s.有效地址=120;s.路径=['下一条 PC+A=120']}else{s.有效地址=20;s.路径=['EA=A=20']}s.操作数=mem[s.有效地址];s.路径.push(`M[${s.有效地址}]=${s.操作数}`)}emit('得到操作数',`操作数为 ${s.操作数}。`);return t.finish()
}
