# 子路径部署：既有视觉世界的扩展

## Overview

落实 [deployment-contract.md](deployment-contract.md)，沿用「深夜的私人胶片工作台」与 [finale-design.md](finale-design.md)。本次只适配可选 URL 前缀并修复播放器音乐面板的点击遮挡；[DESIGN.md](../DESIGN.md) 与 [design.json](design.json) 原样保留，不重开视觉方向或生成新 token。

## Colors

继续使用既有酒红台面、炭墨银幕、奶油文字、黄铜细线与旧纸信页。颗粒来源仍是原有 `public/images/grain.png`：根布局将带前缀的 URL 注入 `--archive-grain`，全局颗粒、胶卷纸标与纸条复用该变量。改变的是寻址，颗粒透明度（0.035）、材质与光影保持原实现。

## Typography

本地 Bodoni Moda / Manrope、系统中文后备与现有字号层级不变。字体继续通过 `next/font/local` 加载；没有新增字体、图片或交付栅格素材。新增 PNG 仅为浏览器验证截图。

## Layout

桌面、低矮横屏与竖屏备用构图沿用已确认布局。已逐张查看 [deployment-local](../docs/screenshots/deployment-local/) 的三尺寸首映、工作台、音乐面板、播放器与信件，共 15 张当前截图：桌面（1440×1000）、横屏（844×390）、竖屏（390×844）。竖屏工作台与信件保留纵向滚动，单张视口截图不代表已展示整页。

## Elevation & Depth

修复前的 `desktop-music-panel-before.png` 可见银幕控件覆盖音乐面板关闭区域。当前 `.screening-header` 的层级（7）高于 `.controls-toggle`（6），使页眉内部 `.music-panel`（90）整体处于切换按钮之上。面板自身的高层级不能越过祖先层叠上下文；本次提升页眉解决点击遮挡，面板颜色、投影和尺寸保持原样。

## Components

`NEXT_PUBLIC_ARCHIVE_BASE_PATH` 同时提供给 Next.js `basePath` 与 `archiveUrl`，在构建时确定；更换前缀需要重新构建。空值保持根路径，当前本地发布包验证前缀为 `/our-story`。`archiveUrl` 为站内绝对路径添加前缀，保留已带前缀、外部 URL 与协议相对 URL。

`contentRepository` 统一处理章节照片、全局及章节音乐；工作台两张装饰照片也通过同一方法寻址。`PremiereGate` 请求带前缀的 `/api/premiere`，继续由服务端判定北京时间（2027-02-07 00:00）开放。部署路径不改变倒计时、重试、开放判定或首映前不发送章节的行为。

`scripts/verify-deployment.mjs` 分别访问本机锁定实例（3020）与独立预览实例（3021），均带 `/our-story`。当前 [verification.json](../docs/screenshots/deployment-local/verification.json) 为 `passed: true`、`errors: []`；覆盖锁定 HTML、状态 API、禁止缓存、请求不逃逸前缀、图片加载及三种布局，并在三尺寸真实点击「关闭音乐设置」后拍摄播放器。此处读取既有验证记录，没有另跑测试。

预览中的 WAV 是脚本拦截返回的合成测试音频，生日信是外部 JSON 的排版 fixture，明确写有「不是真实私人信件」。二者仅用于独立本机预览，不属于正式配乐、私人内容或公开发布数据；截图中的 SOUND ON 只说明该测试配置。测试没有验收真实音乐听感。

## Do's and Don'ts

- Do 同时核对有前缀的资源、API 与三尺寸实际关闭操作；不能只检查面板可见。
- Do 保持公开入口的服务端首映锁定与本机预览实例隔离；门禁仍不构成 public 图片授权。
- Don't 将本机发布包与截图通过写成公网部署、真机或正式私人内容验收。

原 [Phase 4 独立评审](review/phase4-finish-review.md) 的本地 ship 结论保持原范围；本次部署扩展的[独立收尾评审](review/deployment-finish-review.md) 已给出限定 ship，P0–P2 无待修项，P3 为公开切换后同步部署状态。本文形成时，协调方交接状态为服务器已私下安装、代理候选已验证，公网入口尚未切换；该状态未由本文独立验证，不授予公开完成结论。源码依据为 `layout.tsx`、`globals.css`、`urls.ts`、`content.ts`、`FilmWorkbench`、`PremiereGate`、`next.config.ts` 与验证脚本。真实照片、私人故事、正式信件/姓名/配乐、后台、认证及私有媒体权限仍保留原验收边界。
