# 408 知识库

网站：[https://louise-zqf.github.io/postgraduate-exam-408-website/](https://louise-zqf.github.io/postgraduate-exam-408-website/)

这是参照[数学二公式知识库](https://louise-zqf.github.io/postgraduate-exam-website/)的搜索与阅读体验制作的 408 专题网站。原始资料来自 [yyx-dev/yyx-dev.github.io 的 408 栏目](https://github.com/yyx-dev/yyx-dev.github.io/tree/325bdaa/docs/408)，当前提供 4 篇知识体系、10 篇基础／强化／知识配套题目资料，以及 3 篇根据自有复习笔记整理的错题补充；独立的“历年真题”汇总页已从网站移除。知识配套题目中的 169 道带年份真题补充了答案，并链接至 [csgraduates.com 的对应年份原题](https://www.csgraduates.com/study_methods/408quiz/2025/)供核对，答案字母以本站显示的选项为准。页面保留各篇来源入口；本项目不声明原始资料的版权或许可。

本地运行：`npm ci` 后执行 `npm run dev`。构建执行 `npm run build`。原始资料保存在 `source/408/`，错题补充保存在 `source/supplements/`，展示内容与搜索索引保存在 `public/`；更新 Markdown 后运行 `npm run prepare:content`。推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

四科知识正文按“含义、执行过程、条件和常考区别”组织，对比用表格，图示按需展开。复杂条目保留必要的变量解释、中间步骤和短算例，让读者能顺着理解与复算；简单定义保持简洁。当前知识范围依据用户提供的 2027 大纲，增删与覆盖记录见 [OUTLINE_ALIGNMENT.md](./OUTLINE_ALIGNMENT.md)。当前知识范围依据用户提供的 2027 大纲，增删与覆盖记录见 [OUTLINE_ALIGNMENT.md](./OUTLINE_ALIGNMENT.md)。当前知识范围依据用户提供的 2027 大纲，增删与覆盖记录见 [OUTLINE_ALIGNMENT.md](./OUTLINE_ALIGNMENT.md)。2026-10-13 的精简与核对范围见 [CONTENT_SIMPLIFICATION.md](./CONTENT_SIMPLIFICATION.md)。

## 网页编辑

阅读页顶部的“编辑模式”开启后，每段正文、表格与题目旁出现编辑按钮，弹窗支持 Markdown 与公式预览；输入自动保存到当前浏览器的草稿，刷新后可继续编辑。关闭编辑模式后已应用的草稿仍显示在本机。草稿可以导出备份，清除浏览器数据会删除本机草稿。

“保存到网站”通过 GitHub Contents API 写回对应 `source/408` 或 `source/supplements` 文件，保留其他段落和定位标记，之后 Actions 重新生成正文、题目与搜索索引并部署。首次发布需创建仅授权本仓库、拥有 Contents 读写权限的 fine-grained personal access token；凭据只放在当前页面内存，不写入浏览器存储、导出的草稿或仓库。发布前比较修改段落的原文，其他段落的并发更新可合并，同一段发生冲突则保留草稿并停止覆盖。保存记录和发布进度可在弹窗查看，历史版本保存在 GitHub 提交记录中。

官方接口说明：https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents
