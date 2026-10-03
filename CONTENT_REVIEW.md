# 408 知识内容审查记录

审查日期：2026-10-03。基线为本站 a080ca0；对照用户提供的 [408 简纲](https://liangbohan.github.io/postgraduate-exam-website/#/knowledge/operating-systems/os-section-deadlock)，读取其仓库源文件，参考版本固定为 f22f7e431b3afc876e6d198d94cf7f8ce3ec26de。

## 本次范围与处理

审查四科知识讲解与三份错题补充的文字、公式、算法步骤和适用条件；以简洁复习为目标，重写重复表述、填补空白主题，保留全部 189 个“【例…”题目标记及已有答案。旧的长图汇总没有继续混入精简正文，题目内的图片仍保留。本次没有对每道图题和整个小题、大题题库重新判分。

四科原有 361 个一级至四级标题的位置保持一致，仅修正红黑树的表格式标题，因此知识章节的 s-N 定位入口保持一致；正文段落及搜索索引同步重新生成。去除题目、HTML 标签与空白后，讲解正文从约 9.8 万字符压缩到约 3.6 万字符，减少约 63%；这个口径包含公式和 Markdown 标记，不是自然语言字数。

## 代表性纠错

| 科目 | 原问题 | 修改后的结论 |
| --- | --- | --- |
| 数据结构 | 倍增循环从 0 开始；三角循环次数算错 | 倍增从 1 开始；按实际上下界求和 |
| 数据结构 | 两道复杂度解析把增长阶写成精确次数 | 分别为等比和、整数平方根的等差和，均为线性阶 |
| 数据结构 | 2012 中缀表达式丢失括号 | 按试卷恢复 a+b−a*((c+d)/e−f)+g，最大栈容量 5 |
| 数据结构 | 顺序表查找、循环链表头尾复杂度混写 | 分清按序号/按值、头尾指针与寻找前驱成本 |
| 数据结构 | 中缀转后缀忽略同优先级和括号 | 补左结合的弹栈规则及左右操作数次序 |
| 数据结构 | KMP 下标、next 与 nextval 混用 | 固定 1 起始约定，说明其他版本不能混套 |
| 数据结构 | 叶子顺序、Huffman 结点数等条件缺失 | 限定深度优先遍历；n 个叶子对应 2n−1 个结点 |
| 数据结构 | Prim 从全图最小边开始；Floyd 只罗列路径 | Prim 选跨集合最小边；Floyd 写出 k 外层递推 |
| 数据结构 | AVL 的 LL/RR 旋转方向相反 | LL 右旋、RR 左旋，补双旋与删除向上调整 |
| 数据结构 | B 树根、B+ 树范围访问结论绝对化 | 单独处理叶根；强调 B+ 叶链优势及阶数约定 |
| 数据结构 | 固定希尔复杂度、遗漏快排最坏空间 | 希尔依增量；快排栈最坏线性 |
| 计组 | 机器字长等于总线宽度；字节编址等于 8 位存储字 | 区分机器字、指令字、存储字和地址单位 |
| 计组 | 补码全 1、移码与溢出判断脱离格式 | 区分整数/小数、偏置、CF 与 OF |
| 计组 | 浮点下溢一律归零、溢出必然进 OS | 补非正规数、渐进下溢、舍入和异常配置 |
| 计组 | Cache 替换位及写策略只允许固定组合 | 状态位依编码，命中写策略与缺失分配独立 |
| 计组 | 每次地址转换由 OS 执行；TLB 未命中等于缺页 | 成功转换主要由 MMU 完成，缺页由 OS 处理 |
| 计组 | RISC 恒定长、超标量 CPI 大于 1 | 区分典型取向与压缩指令；多发射可 CPI<1 |
| 计组 | NEG 当作按位取反，MUL/IMUL 混写 | NEG 算术取负，NOT 按位取反，乘法格式分开 |
| 计组 | 多周期等于流水线；停顿数固定 | 区分实现，load-use 限定典型五级与转发时序 |
| 计组 | 总线频率乘传输周期数 | 一次占 c 个时钟则传输率 f/c；另分多次/周期 |
| 操作系统 | 用户线程一概不能并行 | 多对一、一对一、多对多分别讨论 |
| 操作系统 | 等待时间把 I/O 阻塞算入 | 累计就绪队列等待，纯 CPU 模型才可用简式 |
| 操作系统 | Peterson 检查自身标志；筷子下标括号错 | 检查 flag[j]，使用 (i+1)%5 |
| 操作系统 | 信号量只记资源数，忽略持锁等待 | 补经典负值约定、先同步再互斥、条件变量差异 |
| 操作系统 | 不安全等于死锁，算法比较和释放量混写 | 安全性检查用 Need≤Work，完成加 Allocation |
| 操作系统 | 非连续等于部分装入；缺页固定产生磁盘访问 | 分配/装入分开；补零填充和驻留页表情况 |
| 操作系统 | 删最后硬链接立即回收；读写每次查路径 | 打开引用可继续使用；fd 指向已打开对象 |
| 操作系统 | mmap 只在关闭时回写；SCAN 与 LOOK 混用 | 区分共享/私有映射及回写；按端点/最后请求区分 |
| 计网 | CRC 余数 0 保证没错，窗口利用率可超过 1 | 只表示未检错；利用率加上限 1 |
| 计网 | CSMA/CD 泛用于全双工；ACK 丢失原因确定 | 限传统共享半双工；无线数据/ACK 丢失不可仅靠超时区分 |
| 计网 | 私网地址写错；CIDR/VLSM、最长前缀混淆 | 修正 192.168.0.0/16，区分分配和路由匹配 |
| 计网 | DHCP 四步全广播、IPv6 路由器分片 | Offer/ACK 可单播；IPv6 由源端分片 |
| 计网 | RIP 只接受更小度量 | 同下一跳的变差报告也更新，防止保留旧坏路由 |
| 计网 | MSS 包含首部、FIN 不带数据、关闭耗时固定 | MSS 只计数据，FIN 可随数据，关闭依时间线 |
| 计网 | 拥塞增长按每次发送翻倍、超时和快恢复混同 | 分 ACK/RTT 口径及经典 Reno/题目简化版本 |
| 计网 | HTTP 无状态等于无连接、FTP 数据端口恒为 20 | 区分 HTTP 版本；被动 FTP 端口非固定 20 |
| 计网 | HTTP 题解析夹入其他题的窗口与 FIN 说明 | 改回 8 个对象串行非持久，共 16 RTT |

## 新网站的取舍与补充

采用新站较清楚的主题分解和“条件—步骤—易错点”组织，将链表边界、AVL 调整、字长辨析、Cache 策略、流水线冒险和死锁处理压缩重写；避免把新站长篇总结整体复制到本站。新增或集中说明外排序归并/I/O、红黑树约束、银行家例子、多实例死锁检测、VFS 对象关系、页表地址计算等。错题补充中的调度等待时间也同步更正。

新站也存在错误：其[死锁源文件](https://github.com/liangbohan/postgraduate-exam-website/blob/f22f7e431b3afc876e6d198d94cf7f8ce3ec26de/client/src/content/knowledge-articles/operating-systems/deadlock.ts)用 Allocation≤Work 判断可推进进程，检测应使用当前请求 Request≤Work；Allocation 只在模拟完成后归还。该处依据 Cornell 讲义纠正。排序中固定希尔增长阶、单链表仅给结点即可删除、无线 CTS/ACK 的“广播”说法也未照搬；分别补充条件或改写。

## 关键核对依据

AVL 方向参考 [Cornell AVL 讲义](https://www.cs.cornell.edu/courses/cs312/2008sp/lectures/lec_avl.html)；排序实现与复杂度、非负权最短路参考 [Princeton Algorithms 表](https://algs4.cs.princeton.edu/cheatsheet/)及[最短路章节](https://algs4.cs.princeton.edu/44sp/)。中缀题对照[新余学院网站提供的 2012 试卷，第 1 页](https://www.xit.edu.cn/_upload/article/files/c1/ce/26986f79493495bbaacba9738587/aa16fad1-1b4a-443d-8371-f1ca40cfaf76.pdf)。

浮点下溢参考 [Oracle 数值计算文档](https://docs.oracle.com/cd/E37069_01/html/E39019/z4000ac019677.html)；RISC 指令长度参考 [RISC-V ISA 规范](https://docs.riscv.org/reference/isa/v20240411/unpriv/intro.html)；NEG 语义核对 [Intel 指令手册 Volume 2，NEG 条目](https://cdrdv2-public.intel.com/774492/325383-sdm-vol-2abcd.pdf)。硬件相关结论仍按本页明确写出的考试模型使用。

银行家及多实例检测参考 [Cornell CS4410 讲义，安全性与检测算法](https://www.cs.cornell.edu/courses/cs4410/2011su/slides/lecture10.pdf)，并与 [UIC 死锁讲义](https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/7_Deadlocks.html)对照；软件互斥参考 [UIC 同步讲义](https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/5_Synchronization.html)。删除文件语义核对 [Linux unlink 手册](https://man7.org/linux/man-pages/man2/unlink.2.html)。

TCP/MSS/关闭依据 [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html)，经典拥塞依据 [RFC 5681](https://www.rfc-editor.org/rfc/rfc5681.html)，DHCP 依据 [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131.html)，PPP 填充依据 [RFC 1662](https://www.rfc-editor.org/rfc/rfc1662.html)，IPv6 分片依据 [RFC 8200](https://www.rfc-editor.org/rfc/rfc8200.html)，DNS 依据 [RFC 1035](https://www.rfc-editor.org/info/rfc1035/)及 [EDNS RFC 6891](https://www.rfc-editor.org/rfc/inline-errata/rfc6891.html)。无线 NAV/确认依据 [Cisco 802.11 教学文档](https://www.cisco.com/E-Learning/bulk/guest/celc/fwl/ch2/2_2_3/content.html)。这些标准与课程资料用于核对具体结论，非本次逐条复制来源。

## 来源署名

原始资料来自 [yyx-dev/yyx-dev.github.io](https://github.com/yyx-dev/yyx-dev.github.io/tree/325bdaa/docs/408)，另包含用户自有错题整理。本次参考的《408 简纲》来自 [liangbohan/postgraduate-exam-website 及其贡献者](https://github.com/liangbohan/postgraduate-exam-website/tree/f22f7e431b3afc876e6d198d94cf7f8ce3ec26de)，其知识内容使用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，许可声明见[原仓库 README](https://github.com/liangbohan/postgraduate-exam-website/blob/f22f7e431b3afc876e6d198d94cf7f8ce3ec26de/README.md)。本站对参考内容作了删减、改写和纠错，页面保留署名与审查依据入口。
