# Phase 3 独立完成审查

## 1. Disposition — fix

视觉方向和三种视口的布局通过；保留已确认的暗酒红胶片工作台、安静银幕和纸面阅读层。无需 rebuild，也没有必须重拍的现有截图。交付前修复以下三处音乐与键盘交互问题，并补齐最终生产构建 E2E、50 帧和原生音频 fixture 结果。

本次是基于当前源码与浏览器截图包的独立审查；没有修改实现，也没有自行运行浏览器或测试。修复后需复核受影响路径，不能把本结论直接改为 ship。

## 2. Scope / evidence

- 依据 `.impeccable/screening-contract.md`、`PRODUCT.md`、`DESIGN.md` 和 impeccable `reference/craft-floor.md`；Phase 2 世界已经获得用户认可，不重新提出风格方向。
- 阅读 `MemoryPlayer.tsx`、`MemoryStory.tsx`、`ChapterTransition.tsx`、`FilmArchive.tsx`、`MusicPlayer.tsx`、`FilmUnroll.tsx`，以及 `src/hooks/`、帧类型和 `globals.css` 的 Phase 3 与响应式规则。
- 使用 `view_image` 逐一检查 `docs/screenshots/phase3/` 中 desktop / landscape / mobile 的 player、story、portrait-photo、chapter-end 共 12 张截图，以及三种尺寸的 unroll 与 workbench 共 6 张截图。对应目标视口为桌面 1440×1000、横屏 844×390、竖屏 390×844；竖屏工作台为完整滚动页面截图。
- `browser-errors.json` 与 `archive-browser-errors.json` 均为 `[]`。这是截图采集过程的错误记录，不等同于所有交互验收。
- 开发者提供：lint / typecheck 通过；首轮 E2E 26/33，通过修复 CTA 触摸遮挡及真实 CDP swipe 后，原失败的 7 个移动案例通过。最终全量生产环境测试与 fixture 测试尚待提供。

## 3. Prioritized findings

### P2 — 展开层的音乐控件在模态焦点范围之外

`FilmArchive.tsx:155–169` 将 `.unroll-music` 放在 `FilmUnroll` 的 dialog 外，`FilmUnroll.tsx:121–134` 却只在自身根元素内的按钮间循环 Tab。键盘使用者无法从展开层抵达新加入的静音和音乐设置；音乐设置即使经鼠标打开，也不属于模态对话框的辅助技术范围。`FilmUnroll.tsx:117–120` 还无条件接管左右方向键：聚焦音乐音量 range 时也会切换预览照片。

这属于 Phase 3 新增控件接入后的范围错误，而不是要求重做已认可的 Phase 2 布局。

### P2 — 首次激活前静音，真正开始播放时会漏放声音

在有配置配乐的片头，先点击静音再点击进入：`useMusicPlayer.ts:100–107` 将 `muted` 状态改为 true，但此时 `audio.current` 尚未创建，无法同步元素。随后 `useMusicPlayer.ts:48–56` 新建 `Audio` 并设置 source、loop、volume，却没有把现有静音偏好写入 `next.muted`。因此声音仍可淡入播放，界面同时显示 SOUND OFF。

同一未激活状态下，`MusicPlayer.tsx:27–37` 会把未开始播放的配置源显示为 SOUND ON，动作标为静音。首次用户点击前需要区分“已配置”和“正在播放”；至少不能让界面状态与实际出声相矛盾。

### P2 — 字幕卡仍在播放配乐，却没有控制入口

`FilmArchive.tsx:39–42` 的音乐源取决于 selection，不依赖 `screen`；进入 transition 后章节配乐持续。`FilmArchive.tsx:188–195` 和 `ChapterTransition.tsx:21–57` 没有渲染音乐控制。用户被邀请在字幕卡停留，但不能在原地静音、调节音量或处理音乐错误；只能离开这一场景。

## 4. Concrete fixes / verification

1. 将展开层的音乐控制接入同一个 dialog 根节点及焦点管理范围，Tab 列表包含可见的 button、range 等原生控件。左右键处理在 input / select 等原生控件上退出。验证完整 Tab / Shift+Tab 循环、range 左右键不会切片、Escape 和关闭后焦点归还。
2. 在音频创建和每次开始播放前将当前静音偏好同步到元素，避免旧闭包；根据真实 status 表达未激活 / 加载 / 播放 / 阻止 / 失败。用原生音频 fixture 验证“片头先静音 → 进入 → 切章 → 返回片头”全程 `audio.muted` 与 UI 一致，并检查未激活时的控件文案。
3. 在字幕卡提供同一音乐控制器的入口并纳入当前焦点约束，保留主动下一幕的节奏。验证配乐继续时能在原地静音和调音，不重置章节音乐进度。
4. 提供修复后的生产构建全套 E2E、50 帧原生 select 导航、正常 / 无源 / 错误音频 fixture 结果。对改动的展开层、片头声音状态、字幕卡声音入口补充必要截图；原有照片与阅读构图无须全部重拍。

## 5. Accepted limits / positive findings

- 截图中的银幕让照片承担主要视觉内容；横竖照片均完整保留。`object-fit: contain` 与周围留白，为轻微 Ken Burns 保留空间，不需以裁图换取铺满。
- 阅读入口先设置 paused，计时器在 reading、页面隐藏、音乐设置交互和照片未加载时停止；关闭故事后保持暂停，符合正文说明。阅读层下方保留同一张照片，底层 inert，Escape 优先收起故事，焦点返回阅读入口。
- 播放器对 input / select 的快捷键退出、可见焦点循环、手动选片后暂停、图片失败提示及前往下一张均有源码路径。尚未声称完成真实设备或屏幕阅读器实测。
- 首次按章节解锁、章节结束后主动下一幕、全部完成后重访，以及本地观看位置 / 完成标记均存在明确状态路径。手动翻片仍由用户掌握，不强制计时观看每一帧。
- 纸面、银幕和黄铜控件的新材料色及响应式小字号是现有世界的延伸；不因有限全局 token 未枚举每一材质而要求重新设计。既有实体放大镜的圆边不作为 Phase 3 阻断。
- 移动横屏正文需要在纸面内部滚动，属于阅读布局；当前截图没有证明正文丢失。减弱动态效果有针对播放器、阅读层、字幕卡和字幕的明确覆盖。
- 真实照片、私人故事、正式音乐尚未提供；演示故事明确说明用途，竖图来源需继续保留在素材记录。Phase 4 生日结尾、Phase 5 管理与正式持久化、既有超过四卷的工作台排布限制均不属于本次验收范围。
- `PRODUCT.md` / `DESIGN.md` 仍有“当前只完成 Phase 1–2”“没有建立长文阅读样式”等旧描述；最终交付时应由实施者同步为已核验的 Phase 3 状态，保留真实内容、音频及设备测试的证据边界。

---

## 修复复核 — scoped verdict: ship

本节覆盖上一轮三项 P2 的当前状态，原始发现保留作为审查记录。已重新阅读相关实现与专项测试，并通过 `view_image` 重新查看同路径的 12 张 player / story / portrait-photo / chapter-end 截图；新增音乐入口没有破坏三种视口的照片、阅读与字幕卡构图。没有修改实现，没有扩大到其他阶段或重新进行无关审计。

| 原 P2 | 评分 | 当前证据 |
| --- | --- | --- |
| 展开层音乐控件与原生 range 键盘行为 | resolved | `FilmUnroll.tsx:51` 复用 `useScreeningDialog`，音乐在其 dialog 内（`:129`）；共享焦点查询包含可用 input / select 并排除 inert / 隐藏元素。展开层方向键在原生 input / select 上退出（`:100–114`）。专项测试检查 Tab 从设置到关闭、range，再到首张负片，并检查 range 方向键不改变 01 / 50。 |
| 首次激活前静音导致漏放 | resolved | `useMusicPlayer.ts:12` 保存独立静音偏好 ref，切换时立即更新（`:107–110`），每次创建或复用音频后、调用 play 前同步 `next.muted`（`:49–51`）。这消除了静音 UI 与实际出声相矛盾的路径。专项测试先在片头静音，再进入并读取原生 `HTMLAudioElement.muted === true`。 |
| 字幕卡持续播放却无控制 | resolved | `FilmArchive.tsx:193` 传入原音乐控制器；`ChapterTransition.tsx:31` 在当前 dialog 内提供控制，不更换音频实例。专项测试抵达字幕卡后点击静音，并读取原生 `muted === true`。三种字幕卡截图均出现独立、可发现的入口。 |

同时核对必要的关联行为：`MemoryPlayer.tsx:168` 在阅读时不再把可见音乐控件留在 inert 底层，`MemoryStory.tsx:24–25` 把控制放入纸面页眉；三种阅读截图的正文与关闭按钮仍可读。`MusicPlayer.tsx:13–16,63–70` 的关闭 / Escape 会收起设置并将焦点归还设置按钮；Escape 在面板内部停止传播，不连带退出当前场景。

验收证据边界：实施者报告当前 build / lint / typecheck 通过、桌面生产 E2E 11/11 通过；本次另外直接读取 `test-results/phase3-desktop/.last-run.json` 和 `test-results/phase3-fixture/.last-run.json`，两者均为 `status: passed`、`failedTests: []`。已读的第四项 fixture 明确覆盖上述三个问题及阅读音乐控制。刷新截图的 `browser-errors.json` 仍为 `[]`。本审查未自行执行测试，不能据此声称真实手机、真实用户音乐或物理听感验收。

**最终限定结论：三项 P2 全部关闭，当前修复范围可 ship，无需 rebuild / recapture。** 横屏与竖屏各 11 项最终回归在收到本轮请求时仍在运行；实施者需要记录最终结果后再宣告整个 Phase 3 验收完成。前节已经接受的真实素材、设备验收和 Phase 4 / 5 范围限制继续有效。
