# 素材来源与许可

## 临时风景照片

全部为视觉原型演示；不是用户真实照片，没有作为私人故事使用。2026-11-11 下载后同源托管，运行时不依赖第三方 CDN。

| 本地文件 | 原始来源 |
| --- | --- |
| public/images/lake.jpg | https://images.unsplash.com/photo-1470770841072-f978cf4d019e |
| public/images/mountains.jpg | https://images.unsplash.com/photo-1464822759023-fed622ff2c3b |
| public/images/forest.jpg | https://images.unsplash.com/photo-1441974231531-c6227db76b6e |
| public/images/coast.jpg | https://images.unsplash.com/photo-1473116763249-2faaef81ccda |

使用 [Unsplash License](https://unsplash.com/license) 的免费图库照片。源请求参数 `auto=format&fit=crop&w=1200&q=85`。摄影者署名未可靠确认，因此不臆造姓名；正式生日档案应替换为用户自己的照片。文件内的原始摄影版权归摄影者。

## 字体

Bodoni Moda 与 Manrope 来自 Google Fonts，使用 SIL Open Font License；本地字体与完整许可证分别存于 `public/fonts/`。下载样式源：

`https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;500;600&display=swap`

许可原文来源：Google Fonts 仓库 `ofl/bodonimoda/OFL.txt`、`ofl/manrope/OFL.txt`。

## 自制视觉

胶卷、底片、观片器、放大镜、铅笔与纸条用项目 CSS 分层绘制；几何图标为本站手写 SVG。`grain.png` 是固定随机种子生成的静态灰度噪点，不使用视频截帧或第三方纹理。没有嵌入商业音乐。

## 视频

用户提供的 `references/电子负片.mp4` 仅作设计研究。其许可未提供，视频和抽帧不打包进公开站点。

## Phase 3 竖屏测试素材

`public/images/forest-portrait.jpg` 与森林演示图同源，通过 Unsplash 图片端点获取 800×1200 衍生图：

`https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&h=1200&q=85`

用途是检查真实竖向文件在 `contain` 布局中的显示，沿用 Unsplash License。原始横向示例仍单独保留；播放器不会把用户照片变成此类裁切衍生图。文件已嵌入来源说明。自动化音频为测试临时合成正弦波，不包含商业音乐，也没有放入 `public/`。
