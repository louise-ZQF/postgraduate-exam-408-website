# 408 知识库

网站：[https://louise-zqf.github.io/postgraduate-exam-408-website/](https://louise-zqf.github.io/postgraduate-exam-408-website/)

这是参照[数学二公式知识库](https://louise-zqf.github.io/postgraduate-exam-website/)的搜索与阅读体验制作的 408 专题网站。原始资料来自 [yyx-dev/yyx-dev.github.io 的 408 栏目](https://github.com/yyx-dev/yyx-dev.github.io/tree/325bdaa/docs/408)，当前展示其中 12 篇知识与题型内容，另有 3 篇根据自有复习笔记整理的错题补充；独立的“历年真题”汇总页已从网站移除。知识体系中的 170 道带年份真题补充了答案，并链接至 [csgraduates.com 的对应年份原题](https://www.csgraduates.com/study_methods/408quiz/2025/)供核对，答案字母以本站显示的选项为准。页面保留各篇来源入口；本项目不声明原始资料的版权或许可。

本地运行：`npm ci` 后执行 `npm run dev`。构建执行 `npm run build`。原始资料保存在 `source/408/`，错题补充保存在 `source/supplements/`，展示内容与搜索索引保存在 `public/`；更新 Markdown 后运行 `npm run prepare:content`。推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。
