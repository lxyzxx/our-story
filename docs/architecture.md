# 技术架构与实施计划

## 当前范围

Phase 1–3：Next.js App Router + React + TypeScript + GSAP，原生 CSS 表达材质。暂不引入 Tailwind、Motion、Three.js，避免重复样式/动画依赖。没有后台、数据库或公开部署。生产构建可在 Linux/WSL 的 Node.js 20.9+ 上运行，开发验证使用 Node 24。

```text
app/page.tsx（服务端）
  ContentRepository → 本地 archive.json
  FilmArchive（opening / workbench / unroll）
    OpeningScene
    FilmWorkbench → FilmRoll
    FilmUnroll → FilmRoll + 前景观片器 + 底片
    MemoryPlayer → MemoryStory / ChapterTransition
    useMusicPlayer → 各场景 MusicPlayer 控件（同一原生音频对象）
    useArchiveProgress（仅浏览偏好）
```

- `src/lib/types.ts`：ArchiveContent、Chapter、Memory、ArchivePhoto 与 Repository 契约。
- `src/lib/content.ts`：当前本地适配器。Phase 5 换成 server-only Supabase 查询；展示组件不直接访问数据库。
- 章节是数组，数量不写死。四个胶卷位置是当前视觉原型的默认构图；多于四卷的布局分页在章节编辑阶段实现，当前不支持任意数量的视觉排布。
- `src/lib/motion.ts`：主体动画参数；GSAP context 管理进入/退出资源；状态阻止叠加场景。
- 照片走 Next Image；观片器 object-fit:contain，不强裁竖图。边缘装饰印样允许裁切。只有进入该卷时加载该卷底片，当前演示图共四张。

## 状态与交互

`opening → workbench → unrolling → screening → chapter-transition`。字幕卡主动进入下一卷；全部有内容章节完成后开放重访。空卷可预览并提示等待照片，顺序放映跳过空卷，避免阻塞后续。

粗指针先选择再打开；播放支持方向键、原生照片选择框、触摸滑动、控件显隐。阅读先暂停，关闭后仍等待继续；图片加载、页面后台、音乐设置都暂停计时，手动暂停保留剩余时间。`useScreeningDialog` 管理滚动锁、焦点和 Escape；音量输入保留原生方向键行为。

重要内容来自服务端；默认使用本地 JSON，可通过仅服务器的 `ARCHIVE_CONTENT_FILE` 指定同结构文件。首页动态渲染以读取该数据源。`useArchiveProgress` 的 localStorage 只存完成章节 ID 和当前帧，存储拒绝时回退内存，不能代替数据库备份。

播放器一次渲染当前主图；底片限制六张不同缩略图组成重复轨道，避免将全部原图加载入场。`useMusicPlayer` 由主场景常驻持有一个原生 Audio，用户点击时同步请求播放，跨场景淡出/换源/淡入。各场景的控件只是视图，静音与音量由同一控制器维护。

## 后续阶段

| 阶段 | 交付 | 验收 |
| --- | --- | --- |
| Phase 3 | 已实现：正式播放器、章节过渡、暂停/阅读、进度与音轨控制 | 50 帧演示数据与原生音频隔离验证；真实私人素材仍待提供 |
| Phase 4 | 收卷、生日终幕、手写信排版、片尾、重访 | 生日信与署名真实可配 |
| Phase 5 | `/admin`、认证、批量上传、CRUD、排序、Supabase | RLS/存储策略、匿名写入拒绝、权限与重部署持久化 |
| Phase 6 | 继续磨合移动、刘海区、低端性能与真机浏览器 | iPhone Safari / Android Chrome 真机验收 |
| Phase 7 | 全链路 E2E、生产构建、部署/恢复演练 | 先本地验证，正式部署需用户单独授权 |

## Phase 5 安全方案（未实现）

使用 Supabase Auth 的邀请管理员，不开放注册。章节、记忆与媒体元数据分别存表；管理员由服务端 allowlist/角色表约束，RLS 对写入逐项校验。公开读仅返回已发布内容。原图私有桶、展示图是否公开需结合私人影像访问范围由用户决定；未决定前不得直接发布。

上传校验 MIME 与解码结果、尺寸/大小限制；去 EXIF 隐私信息并校正方向，生成多尺寸衍生图，保留原图。service_role 仅服务器使用。照片删除采用引用检查与可恢复清理，先解除内容引用，备份保留期后清理对象。授权、存储、写入、备份是后续独立验收，不由原型暗示已经完成。

## 技术资料

安装/服务端边界依据项目内 `node_modules/next/dist/docs/`，以及 [Next.js 官方安装指南](https://nextjs.org/docs/app/getting-started/installation)。动画清理遵循 [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context/)。多尺寸模拟使用 [Playwright emulation](https://playwright.dev/docs/emulation)；模拟浏览器不等于真机。
