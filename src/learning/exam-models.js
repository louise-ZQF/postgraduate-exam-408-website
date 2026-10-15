// Each diagram follows the cited exam topology. Extra numerical examples are labelled.
const snap=(title,why,s,data=[],signals=[],hot=[],micro='')=>({title,why,state:structuredClone(s),data,signals,hot,micro})
const source=(year,number,anchor)=>({year,number,doc:'10-计组强化题型',anchor})
const names={
 '2009':'PC：程序计数器；MAR：存储器地址寄存器；MDR：存储器数据寄存器；IR：指令寄存器；A：输入暂存器；AC：本图结果暂存器；CB/DB/AB：控制／数据／地址总线。',
 '2015':'T：输入暂存器；SR：移位寄存器；MUX：数据选择器；ALU：算术逻辑单元；PC/MAR/MDR/IR：程序计数／地址／数据／指令寄存器。',
 '2022':'GPRs：通用寄存器组；FR：标志寄存器；SF：符号标志；OF：溢出标志；CU：控制部件；Y/Z：本图输入／输出暂存器。',
 '2024':'Ext：扩展方式控制；ALUBsrc：ALU第二输入来源选择；ALUctr：运算选择；F：ALU结果；OF/SF/ZF/CF：溢出／符号／零／进位标志。'
}
const base=(figure,title,intro,condition,frames,src,flow,compare,clocked=false)=>({kind:'exam',figure,title,intro,condition,frames,source:src,flow,compare:[['名称与信号',names[figure]],...compare],clocked,formula:''})
export function exam2009(){
 const s={PC:100,R0:5,R1:200,MAR:'—',MDR:'—',IR:'—',A:'—',AC:'—','M[200]':7}
 const frames=[snap('初始状态','数值为演示补设；指令的功能与数据通路按2009年第44题。',s)]
 const add=(t,why,patch,data,signals,hot,micro)=>{Object.assign(s,patch);frames.push(snap(t,why,s,data,signals,hot,micro))}
 add('C1 · 给出指令地址','PC输出地址，经内部总线装入MAR。',{MAR:100},['pc-mar'],['PCout','MARin'],['PC','MAR'],'MAR ← PC')
 add('C2 · 读指令并推进PC','内存数据由外部数据总线进入MDR，使用MDRinE；PC+1按原题取指表。',{MDR:'指令字',PC:101},['address','mem-read','pc-inc'],['MemR','MDRinE','PC+1'],['M','MDR','PC'],'MDR ← M[MAR]；PC ← PC+1')
 add('C3 · 指令进入IR','此时是MDR向内部总线输出，不是MDR向外部DB输出。',{IR:'ADD (R1),R0'},['mdr-ir'],['MDRout','IRin'],['MDR','IR'],'IR ← MDR')
 add('C4 · 译码','原题C4用于指令译码，没有新增内部总线传送。',{},[],[],['IR'],'译码，确定后续控制序列')
 add('C5 · 间接寻址','R1里存地址200；先将地址装入MAR，不能直接把R1当作被加数。',{MAR:200},['r1-mar'],['R1out','MARin'],['R1','MAR'],'MAR ← R1')
 add('C6 · 取内存操作数','读出的7先到MDR，M[200]仍是7。',{MDR:7},['address','mem-read'],['MemR','MDRinE'],['M','MDR'],'MDR ← M[MAR]')
 add('C7 · 暂存一个加数','把内存操作数7暂存在A；下一拍内部总线才能改为传R0。',{A:7},['mdr-a'],['MDRout','Ain'],['MDR','A'],'A ← MDR')
 add('C8 · 两路加数送ALU','A提供7，内部总线提供R0=5；ALU的12先存入AC。',{AC:12},['r0-alu','a-alu','alu-ac'],['R0out','ADD','ACin'],['R0','A','ALU','AC'],'AC ← A + R0')
 add('C9 · 准备外部写数据','AC经内部总线送MDR，使用MDRin；这一步还没写主存。',{MDR:12},['ac-mdr'],['ACout','MDRin'],['AC','MDR'],'MDR ← AC')
 add('C10 · 写回并结束','MDR经MDRoutE向外部DB输出；MAR仍为200，MemW使M[200]写成12。',{'M[200]':12},['address','mem-write'],['MDRoutE','MemW'],['MDR','M'],'M[MAR] ← MDR；本指令结束')
 return base('2009','2009真题 · ADD访存与写回','原题44：ADD (R1),R0，功能为 M[R1]←R0+M[R1]。补设PC=100、R0=5、R1=200、M[200]=7。','16位字长；本题取指表明确PC+1、C4译码。图中的A、AC与内外总线接口均按原图保留，不能套用上一版Y/Z示意图的节拍。',frames,source(2009,44,'q-10-0b4feed381cd'),'C1～C4：取指 → 译码\nR1 → MAR → 读 M[MAR] → MDR\nMDR → A；R0 → 总线 → ALU另一输入\nA+R0 → AC → 内部总线 → MDR\nMDR → 外部DB → M[MAR] → 结束',[
 ['MDRin / MDRinE','前者接CPU内部总线，后者接外部数据总线DB。'],['MDRout / MDRoutE','前者输出到CPU内部总线，后者输出到外部DB。'],['A / AC','A暂存ALU输入；AC暂存本题ALU结果，不以其他模型的Y/Z替换。']
 ],true)
}
export const classicOptions=['2009 · ADD访存写回','2015 · PC加2','2015 · shl移位','2015 · sub间接寻址','2022 · 取指等待5拍','2022 · Y/Z与溢出']
export function exam2015(mode='PC加2'){
 const s={PC:100,R0:0,R1:mode==='shl移位'?'4001H':200,R2:9,R3:0,T:'—',MUX:'—',ALU:'—',SR:'—',MAR:'—',MDR:'—','M[200]':4}
 const frames=[snap('初始状态','按原题43图补全⑥→⑨、⑦→④；以下数值为演示补设。',s)]
 const add=(t,why,patch,data,signals,hot,micro)=>{Object.assign(s,patch);frames.push(snap(t,why,s,data,signals,hot,micro))}
 if(mode==='PC加2'){
  add('PC经总线暂存到T','顺序指令地址计算先保留旧PC=100。',{T:100},['pc-t'],['PCout','Tin'],['PC','T'],'T ← PC')
  add('MUX选择常数2','按字节编址、16位指令占2B，因此MUXop=0选择常数2。',{MUX:2},['two-mux','mux-b'],['MUXop=0'],['MUX'],'ALU的B输入 ← 2')
  add('ALU相加，SR直送','T提供100，MUX提供2；ALUop=add，SRop=mov，SR保存102。',{ALU:102,SR:102},['t-a','two-mux','mux-b','alu-sr'],['MUXop=0','ALUop=add','SRop=mov'],['T','MUX','ALU','SR'],'SR ← T+2')
  add('SR经总线写PC','使能SRout与PCin，PC变成102；这才完成本次地址更新。',{PC:102,ALU:'—',MUX:'—'},['sr-pc'],['SRout','PCin'],['SR','PC'],'PC ← SR；地址计算结束')
 } else if(mode==='shl移位'){
  add('R1经总线送T','R1原值4001H，即0100 0000 0000 0001B。',{T:'4001H'},['r1-t'],['R1out','Tin'],['R1','T'],'T ← R1')
  add('ALU直送A','ALUop=mova，使用T接入的A端；这是直送，不是加法。',{ALU:'4001H'},['t-a'],['ALUop=mova'],['T','ALU'],'ALU输出 ← T')
  add('SR左移一位','SRop=left：低位补0，只保留16位，4001H变成8002H。',{SR:'8002H'},['t-a','alu-sr'],['ALUop=mova','SRop=left'],['T','ALU','SR'],'SR ← (4001H << 1) mod 2¹⁶')
  add('SR写回R2','SRout打开三态门，R2in使R2接收移位结果；R1保持4001H。',{R2:'8002H',ALU:'—',MUX:'—'},['sr-r2'],['SRout','R2in'],['SR','R2'],'R2 ← SR；指令执行结束')
 } else {
  add('R1给出内存地址','按原题控制流程sub R0,R2,(R1)，R1存地址，R2是被减数。',{MAR:200},['r1-mar'],['R1out','MARin'],['R1','MAR'],'MAR ← R1')
  add('主存读到MDR','读M[200]=4，尚未做减法。',{MDR:4},['address','mem-read'],['MEMop=read'],['M','MDR'],'MDR ← M[MAR]')
  add('R2暂存到T','T接ALU的A端，所以被减数9必须先放T。',{T:9},['r2-t'],['R2out','Tin'],['R2','T'],'T ← R2')
  add('MUX选择总线上的MDR','MUXop=1通过补全的⑥→⑨、⑦→④连接，让4进入ALU的B端。',{MUX:4},['mdr-mux','mux-b'],['MDRout','MUXop=1'],['MDR','MUX'],'ALU的B输入 ← MDR')
  add('A减B，SR直送','ALU计算9−4，不是4−9；SRop=mov不移位。',{ALU:5,SR:5},['t-a','mdr-mux','mux-b','alu-sr'],['MDRout','MUXop=1','ALUop=sub','SRop=mov'],['T','MDR','MUX','ALU','SR'],'SR ← T−MUX')
  add('SR写回R0','结果写入R0；本指令没有把结果写回主存。',{R0:5,ALU:'—',MUX:'—'},['sr-r0'],['SRout','R0in'],['SR','R0'],'R0 ← SR；指令执行结束')
 }
 return base('2015','2015真题 · '+mode,'原题43/44：保留T、ALU、SR、MUX、常数2和单总线；原图待补连线在演示中用“补全”标注。','这里为看清数据传播拆成逻辑步骤，不把每个按钮当作一个时钟周期。原题给定控制分组：shl／inc执行至少2拍，所问sub执行至少4拍；具体并行与锁存时序依原题。补设数值不属于原题已知条件。',frames,source(2015,'43/44',mode==='PC加2'?'q-10-9e51170314fb':'q-10-d9b1e8dfa20a'),'先看目标：更新PC／移位／间接寻址减法\n一个操作数 → 内部总线 → T → ALU的A端\nMUXop=0 → 常数2；MUXop=1 → 总线数据\nMUX输出 → ALU的B端\nALU结果 → SR（直送／左移／右移）\nSRout → 内部总线 → 目标寄存器 → 结束',[
 ['MUX两路','0端为常数2，1端为总线；此取值仅对应这张题图。'],['SRout / SRop','SRout控制是否驱动总线；SRop控制直送或移位。'],['T / SR','T保留ALU输入，SR保存处理后的结果；它们不能视为同一个寄存器。']
 ])
}
export function exam2022(arithmetic=false){
 const s=arithmetic?{R1:'7FFFH',R2:'0001H',R3:'0000H',Y:'—',Z:'—',SF:'—',OF:'—',rs:'—',rd:'—'}:{PC:100,MAR:'—',MDR:'—',IR:'—','读访问进度':'未开始'}
 const frames=[snap('初始状态',arithmetic?'补设R1=7FFFH、R2=0001H，演示R3←R1+R2；原题未指定这组数值。':'补设PC=100、主存该处为“指令字”；PC增量按原题要求不考虑。',s)]
 const add=(t,why,patch,data,signals,hot,micro)=>{Object.assign(s,patch);frames.push(snap(t,why,s,data,signals,hot,micro))}
 if(arithmetic){
  add('先把R1保存到Y','rs选R1，GPRout驱动总线，Yin保存第一个操作数。',{Y:'7FFFH',rs:1},['gpr-y'],['rs=1','GPRout','Yin'],['GPR','Y'],'Y ← R1')
  add('R2与Y相加，结果进Z和FR','rs选R2，ALU得8000H；两个正数相加变负，SF=1、OF=1。结果尚未写回R3。',{Z:'8000H',SF:1,OF:1,rs:2},['gpr-b','y-a','alu-z','alu-fr'],['rs=2','GPRout','ALUop=加'],['GPR','Y','ALU','Z','FR'],'Z ← Y+R2；FR记录标志')
  add('Z经总线写回R3','Zout驱动总线，rd=3选择目的寄存器，GPRin写入R3。',{R3:'8000H',rd:3},['z-gpr'],['Zout','rd=3','GPRin'],['Z','GPR'],'R3 ← Z；本次数值示例结束')
 } else {
  add('C1 · PC送MAR','内部总线传地址，消耗1个周期。',{MAR:100},['pc-mar'],['PCout','MARin'],['PC','MAR'],'MAR ← PC')
  for(let i=1;i<=5;i++)add(`C${i+1} · 主存读 ${i}/5`,i===5?'从发读命令起已过5个周期，数据现在才到MDR；外部读入信号未在原图单独命名，不能误用内部MDRin。':i===1?'发Read启动主存读；原题已给这次读入共5个周期，不能马上把指令送IR。':'仍在等待这一笔访存，没有新的内部总线传送；Read的保持电平依具体接口，不额外杜撰。',{'读访问进度':`${i}/5`,...(i===5?{MDR:'指令字'}:{})},i===1?['address']:i===5?['mem-read']:[],i===1?['Read']:[],i===5?['MDR']:['M'],'等待主存读完成'+(i===5?' → MDR接收指令':''))
  add('C7 · MDR送IR，结束取指','MDRout与IRin有效，再用1个周期；总计1+5+1=7拍。',{IR:'指令字'},['mdr-ir'],['MDRout','IRin'],['MDR','IR'],'IR ← MDR；取指阶段结束')
 }
 return base('2022','2022真题 · '+(arithmetic?'Y/Z暂存与溢出':'取指与5拍访存等待'),arithmetic?'原题43图的寄存器组、Y/Z与FR；数值加法是基于原图补设的教学例子。':'原题43：发主存读命令到数据进入MDR共需5拍；不考虑PC增量。',arithmetic?'16位数据通路。图中未给Z或FR锁存使能的名称，演示仅标注已有名称，不虚构Zin/FRin控制线；这里按数据依赖拆步骤，不据此断定整条指令最少节拍。':'仅演示原题要求的取指阶段。图中MDRin连内部总线；主存读入MDR不是同一条输入路径。',frames,source(2022,43,'q-10-5799e1c9d1ca'),arithmetic?'rs选源寄存器 → GPRout → 总线 → Y\nrs切换到另一源 → GPRout → ALU的B端\nY → ALU的A端 → 结果存Z、标志存FR\nZout → 总线 → rd选目的、GPRin → 结束':'C1：PCout、MARin → MAR保存地址\nC2：发Read → 开始第1个访存周期\nC3～C5：继续等待，不能提前取MDR的旧值\nC6末：满5个访存周期 → MDR得到指令\nC7：MDRout、IRin → IR得到指令 → 结束取指',[
 ['Y / Z','单总线一次只有一个源，Y保留一个输入；Z保留计算结果，等待取得总线再写回。'],['rs / rd','rs供寄存器组读选择，rd供写地址译码；原图各4位，最多16个寄存器。'],['等待 / 数据已到','等待期间没有新数据进入MDR；主存读结束后才能把新指令送IR。']
 ],!arithmetic)
}
export function makeClassicExam(option=classicOptions[0]){
 if(option.startsWith('2009'))return exam2009()
 if(option.startsWith('2015'))return exam2015(option.split(' · ')[1])
 return exam2022(option.includes('Y/Z'))
}
export const aluOptions=['2024 · add原题数值','2024 · lw原题地址','2024 · slli零扩展','2024 · slli符号扩展']
export function exam2024(option=aluOptions[0]){
 const load=option.includes('lw'),shift=option.includes('slli'),ext=option.includes('符号')?1:0
 const s={A:'—',B:'—','IR[31:20]':'—',Ext:'—',扩展结果:'—',ALUBsrc:'—',ALUctr:'—',ALU的B端:'—',F:'—',OF:'—',SF:'—',ZF:'—',CF:'—'}
 const frames=[snap('初始状态',shift?'数值补设：A=3，合法移位量shamt=2；Ext两种取值都试一下。':load?'原题机器码A040 A103H，R[01H]=FFFF A2D0H。':'原题两源数8765 4321H、9876 5432H。',s)]
 const add=(t,why,patch,data,signals,hot,micro)=>{Object.assign(s,patch);frames.push(snap(t,why,s,data,signals,hot,micro))}
 if(!load&&!shift){
  add('读出A和B','A、B分别是两个源寄存器的32位内容；add不使用立即数。',{A:'87654321H',B:'98765432H'},['a-alu','b-mux'],[],['A','B'],'A ← R[rs1]；B ← R[rs2]')
  add('MUX选B','ALUBsrc=0，选0端的B；Ext无关，不必强填一个固定值。',{ALUBsrc:0,ALU的B端:'98765432H'},['b-mux','mux-alu'],['ALUBsrc=0'],['MUX'],'ALU第二操作数 ← B')
  add('ALU相加并检查标志','保留低32位得1FDB9753H；无符号有进位CF=1，有符号同负相加变正OF=1。',{ALUctr:'000',F:'1FDB9753H',OF:1,SF:0,ZF:0,CF:1},['a-alu','b-mux','mux-alu','alu-f','alu-flags'],['ALUBsrc=0','ALUctr=000'],['A','B','MUX','ALU','F','FLAGS'],'F ← (A+B) mod 2³²；局部通路演示结束')
 } else {
  add('确定输入字段',load?'IR[6:0]=0000011、IR[14:12]=010，对应lw；rs1=1，imm=IR[31:20]=A04H。':'slli使用A和立即移位量，ALU只用第二输入的低5位作为shamt。',{A:load?'FFFFA2D0H':'00000003H','IR[31:20]':load?'A04H':'002H'},['a-alu','ir-ext'],[],['A','IMM'],'读取A与12位立即数字段')
  add('扩展器处理立即数',load?'12位A04H的符号位为1 → 符号扩展FFFFFA04H，数值为−1532。':`Ext=${ext}，本例合法立即数002H扩展为00000002H，低5位仍为2。`,{Ext:load?1:ext,扩展结果:load?'FFFFFA04H':'00000002H'},['ir-ext','ext-mux'],[`Ext=${load?1:ext}`],['EXT'],'12位立即数 → 32位扩展值')
  add('MUX选扩展器','ALUBsrc=1，必须选1端的扩展值，不能选寄存器B。',{ALUBsrc:1,ALU的B端:load?'FFFFFA04H':'00000002H'},['ext-mux','mux-alu'],['ALUBsrc=1'],['MUX'],'ALU第二操作数 ← 扩展值')
  add(load?'计算有效地址':'执行逻辑左移',load?'FFFFA2D0H+FFFFFA04H=FFFF9CD4H。F是有效地址，还不是读出的内存数据；此局部图不含主存、写回与标志寄存器。':'3左移2位得到12，即0000000CH。切换Ext=0/1后结果相同；图外的写回与架构标志更新不在本演示中补造。',{ALUctr:load?'000':'010',F:load?'FFFF9CD4H':'0000000CH'},['a-alu','ir-ext','ext-mux','mux-alu','alu-f'],[`Ext=${load?1:ext}`,'ALUBsrc=1',`ALUctr=${load?'000':'010'}`],['A','IMM','EXT','MUX','ALU','F'],load?'F ← A+符号扩展imm；局部通路结束':'F ← A << (第二输入低5位)；局部通路结束')
 }
 return base('2024','2024真题 · '+(load?'lw地址计算':shift?'slli与扩展选择':'add与溢出标志'),shift?'原题43图重绘；slli的A=3、shamt=2是教学补设，其余控制含义遵从题设。':'原题43图重绘，使用原题给定的数值／机器码；仅展示题图包含的组合逻辑通路。','每一步是组合逻辑的数据传播或选择，不是一个时钟周期。A直接入ALU，B或扩展值经MUX入ALU；输出F与标志线按原图保留。',frames,source(2024,43,'q-10-a253b8668c2d'),'先识别指令和操作数\n├─ add → ALUBsrc=0 → MUX选B\n├─ lw → Ext=1 → 符号扩展imm → ALUBsrc=1\n└─ slli → 取shamt → ALUBsrc=1，Ext可0或1\nA与所选第二输入 → ALU\n├─ ALUctr=000 → 加法\n└─ ALUctr=010 → 逻辑左移\n读出F；仅在题目要求时判相应标志 → 局部演示结束',[
 ['有符号 / 无符号溢出','add的相同位串：有符号看OF，无符号看CF。'],['lw地址 / 数据','F是计算出的有效地址，真正读内存还要后续访存。'],['MUX取值','本图0端接B，1端接扩展器；换一张图必须重新读端口标号。']
 ])
}
