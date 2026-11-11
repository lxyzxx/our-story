---
name: 'OUR STORY — The Film Archive'
description: '深夜的私人胶片工作台：以实体胶卷收藏共同经历。'
colors:
  desk: '#472b32'
  ink: '#141416'
  cream: '#e9e2d7'
  gold: '#c2ad91'
  muted: '#b8a79e'
  line: 'rgba(223, 199, 171, 0.22)'
  label-cream: '#e0cda8'
  label-olive: '#52583b'
  label-rust: '#b0613d'
  label-charcoal: '#292f2b'
  viewer-metal: '#272e25'
  film-amber: '#9a5130'
typography:
  display:
    fontFamily: 'var(--font-cinema), Georgia, serif'
    fontSize: 'clamp(60px, 9vw, 128px)'
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: '-0.035em'
  headline:
    fontFamily: 'var(--font-cinema), Georgia, serif'
    fontSize: 'clamp(42px, 4.2vw, 67px)'
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: '-0.035em'
  title:
    fontFamily: 'var(--font-cinema), Georgia, serif'
    fontSize: 'clamp(35px, 4vw, 60px)'
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: '-0.025em'
  body:
    fontFamily: "var(--font-interface), 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: '14px'
    fontWeight: 400
  label:
    fontFamily: "var(--font-interface), 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: '11px'
    letterSpacing: '0.08em'
  caption-title:
    fontFamily: 'var(--font-cinema), Georgia, serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.3
rounded:
  circle: '50%'
  viewer: '13px 13px 5px 5px'
  cylinder: '6% / 40%'
spacing:
  compact: '8px'
  small: '10px'
  control-gap: '12px'
  viewer-inset: '17px'
  panel-inset: '20px'
  scene-inset: '24px'
  large: '30px'
components:
  button-begin:
    textColor: '{colors.cream}'
    padding: '18px 8px'
  button-text:
    textColor: '{colors.cream}'
    typography: '{typography.label}'
    padding: '12px 0'
  button-circle:
    textColor: '{colors.cream}'
    rounded: '{rounded.circle}'
    width: '44px'
    height: '44px'
  navigation-wordmark:
    textColor: '{colors.cream}'
    padding: '0'
  film-roll:
    width: '240px'
  memory-viewer:
    rounded: '{rounded.viewer}'
    width: '300px'
    height: '355px'
    padding: '17px 20px 18px'
---

# Design System: OUR STORY — The Film Archive

## Overview

**Creative North Star: "深夜的私人胶片工作台"**

以「深夜的私人胶片工作台」为视觉北极星：暗酒红台面铺满视口，真实比例的 35 mm 胶卷是可操作的主角。炭黑金属、旧纸、暖金边缘与奶油文字在同一束柔光下形成温暖而克制的收藏感。

文字像电影片头与器材铭牌，照片在观片器中保持内容优先。颗粒、投影与机械动作服务于物件的可信度；不引入粉色爱心、卡通情侣或 SaaS 卡片作为视觉语言。

**Key Characteristics:**

- 满视口酒红台面与偏暗四角。
- 奶油、橄榄、铁锈、炭黑四类胶卷纸标。
- 细衬线电影标题与小字号器材标识并置。
- 分层圆柱、齿孔底片与黄铜观片器构成实体入口。
- 桌面、手机横屏与竖屏备用各自重排。

## Colors

前置 YAML 是规范 token；下文描述使用职责，实际材质渐变以源码及 sidecar 组件片段为准。

### Primary

- **酒红台面**（`colors.desk`）：场景的基础色，中心受光、四角压暗，形成整个工作台而非卡片底色。
- **旧黄铜**（`colors.gold`）：边框、焦点、编号与器材标记，亮度克制。

### Secondary

- **旧纸奶油 / 橄榄 / 铁锈 / 炭黑纸标**（`colors.label-*`）：区分当前胶卷，仍处于同一套旧器材世界。
- **底片琥珀**（`colors.film-amber`）：承载齿孔与负片预览，区别于未经负片滤色的主照片。

### Neutral

- **炭墨**（`colors.ink`）：片头、页面底层与暗部。
- **奶油白**（`colors.cream`）：主要可读文字。
- **褪色灰褐**（`colors.muted`）：辅助文案。
- **透光黄铜线**（`colors.line`）：细边与分隔。
- **观片器金属**（`colors.viewer-metal`）：深橄榄机壳中段，配合边缘高光。

**The Material Color Rule.** 色彩附着在台面、纸标、金属或底片等具体材料上；控件沿用暖中性色，不另建鲜艳按钮色。

## Typography

**Display Font:** 本地 Bodoni Moda，后备 Georgia、serif。常规与斜体（400），另有常规（500）。

**Body Font:** 本地 Manrope（400 / 500 / 600），中文后备 PingFang SC、Microsoft YaHei、sans-serif。

两套字体通过 `next/font/local` 注册；CSS 的 `--display`、`--sans` 分别连接相应字体变量。衬线负责片头、章节与纸标，几何无衬线负责短指令和器材参数。中文目前使用系统后备字体，不宣称已打包独立中文字体。

### Hierarchy

- **Display**：片头 OUR STORY；尺寸、字距及行高见 `typography.display`。
- **Headline**：工作台两行标题；第二行使用斜体，移动横屏合并一行。
- **Title**：展开胶卷后的章节标题。
- **Body**：页面继承基准，当前界面主要使用更小的短文案，没有建立长文阅读样式。
- **Label**：返回、跳过等文本控件；器材小字依各物件单独缩放，不冒充正文。
- **Caption title**：工作台胶卷旁的章节名称，搭配斜体序号。

具体响应式字号见 Layout 与 [项目设计说明](docs/design-system.md)。不把器材刻字的微小字号推广为正文规范。

## Layout

桌面是一张完整工作台：轻量页眉、居中的电影标题、四个错位散落的胶卷，以及纸条、照片、放大镜、铅笔和底片。页眉左右留白为（4.2%），默认高度（113px）；胶卷默认尺寸由 `--roll-size` 控制（240px）。没有通用等距卡片网格。

宽屏（min-width: 1600px）胶卷增至（270px）；中等宽度（max-width: 1100px）降至（210px）。桌面展开舞台最大宽度（1300px）；底片延伸到视口边缘，观片器位于前景。

移动横屏是专门编排：条件为（max-height: 550px）且（orientation: landscape），页眉（61px）、单行标题、胶卷（165px），四卷重新分布；隐藏放大镜，保留纸条和部分照片。展开舞台最大宽度（750px），观片器（214 × 225px）。

手机竖屏备用浏览：条件为（max-width: 700px）且（orientation: portrait）。片头邀请旋转，也提供继续竖屏入口；胶卷（190px）沿纵向交错，页面正常滚动。展开观片器（250 × 322px），底片越出视口，返回与翻页保留可用。安全区通过 `env(safe-area-inset-*)` 在相关边距处处理。

Phase 2 当前散落布局仅实现四卷演示；数据结构不固定四条，超过四卷的分页与排布留待章节编辑阶段，见 [architecture.md](docs/architecture.md)。不将当前四个位置定义为永久数据上限。

## Elevation & Depth

这是结构性的物件层叠：金属筒体内部高光、端盖遮挡、纸标暗边、胶尾和右下落影共同建立圆柱体。照片和纸条低于胶卷，底片低于观片器，观片器保留独立底座与黄铜内框。深度不依靠统一卡片阴影。

### Shadow Vocabulary

- **胶卷落影**：`drop-shadow(12px 25px 10px rgba(16, 7, 10, 0.6))`，沿右下方向落在台面。
- **照片纸影**：`5px 10px 12px #190e105c`，比胶卷轻。
- **观片器结构影**：`inset 2px 3px 3px #a3a07975, inset -4px -3px 4px #070e09, 15px 28px 20px #160b108f`，同时呈现机壳厚度与离台高度。

**The Shared Light Rule.** 装饰物与可操作物共用受光方向；不要将投影当成无差别悬浮装饰。

## Shapes

胶卷使用椭圆端盖与百分比圆柱曲面，纸标包裹在筒身内；底片用上下齿孔、暖褐透明基底和连续画幅。观片器上沿柔圆、下沿较直，圆形按钮延续机械旋钮语言。照片与纸条是略微倾斜的纸张，避免通用大圆角面板。

## Components

### Buttons

开始放映是底部黄铜细线与箭头组成的轻操作；悬停增加文字与箭头间距。返回、跳过使用文本按钮。左右翻页使用细线圆形按钮，悬停轻抬（2px）；键盘焦点统一使用黄铜外描边（2px），偏移（8px）。默认圆按钮（44px），移动横屏为（38px），不声称所有控件均满足同一触摸尺寸。

### Navigation

页眉字标可重看片头；中央收藏说明在竖屏隐藏；右侧声音状态在无配乐时显示 SOUND OFF，并给出「尚未添加配乐」提示。此阶段没有虚构可播放音乐。

### Film Roll

胶尾 → 中轴 → 圆柱筒身与弯曲纸标 → 两侧金属圈 → 端盖，分别绘制并参与遮挡。鼠标悬停轻抬、轻转并略提亮；键盘焦点显示展开提示。粗指针首次点击选中、再次点击展开。

### Negative Strip & Memory Viewer

点击胶卷后，以所点物件的实际边界为起点抬升，胶卷转为直立、底片从左向右展开，观片器最后落定。底片采用复古负片滤色；主照片采用 `object-fit: contain`，保留全幅。支持缩略画幅、前后按钮、左右方向键与水平滑动（阈值 45px）。

展开层是有焦点约束的模态对话框；底层进入 inert，Escape 关闭，关闭后焦点回到入口并恢复先前滚动位置。卸载时回收 GSAP context、监听器和锁滚动样式。

运动常量以 `src/lib/motion.ts` 为基准：hover（0.22s）、lift（0.55s）、unroll（1.2s）、settle（0.65s）、ease（power3.out）。当前实际展开引用 lift / unroll，缓动明确覆写为 `power3.inOut`；hover / settle / ease 其余常量尚未被组件使用。CSS 的 `--ease` 独立用于淡入和位移。完整实际值与响应式条件放在 `.impeccable/design.json`。

减少动态效果时跳过 JS 入场与展开时间线、禁用鼠标视差，CSS 动画和过渡压至（0.01ms）；操作与内容保持可用。当前全局颗粒最终透明度是（0.035），尾部覆盖规则也作用于该模式。

## Do's and Don'ts

### Do:

- Do 保留统一光源、右下投影与真实圆柱遮挡关系。
- Do 让胶卷本身承担章节入口，照片在观片器中完整显示。
- Do 使用本地字体、已记录来源的本地图片与克制颗粒。
- Do 同时检查桌面、移动横屏和竖屏的片头、工作台、展开状态。
- Do 尊重减少动态效果与键盘焦点，让触摸先选中再展开。

### Don't:

- Don't 使用粉色爱心、卡通情侣或 SaaS 卡片入口。
- Don't 将临时风景照片、通用文案当作两人的真实记忆。
- Don't 把胶卷简化成平面矩形标签，或用互相冲突的阴影制造层次。
- Don't 把横屏界面缩成桌面截图，或在竖屏强制阻止继续浏览。
- Don't 将视觉原型、自动化测试通过写成真实设备或正式内容验收。
