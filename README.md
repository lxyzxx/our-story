# OUR STORY — The Film Archive

一间私人的胶片档案室，一部由我们共同主演的电影。

**当前：Phase 4 生日终幕与首映倒计时。** 已接入工作台、正式播放器、暂停阅读、章节引导、生日信与片尾。受保护后台与媒体持久化将在 Phase 5 实现。

## 启动

Linux / WSL，Node.js 20.9+（推荐 24）：

```bash
npm ci
npm run dev -- --port 3001
```

打开 http://localhost:3001 查看倒计时。已设置北京时间 **2027-02-07 00:00** 开放；此前不能开始观看。配置位置为 `src/content/archive.json` 的 `premiere`，详见 [首映配置](docs/premiere-guide.md)。

仅本机预览影片时，先停止上述开发服务，再运行（不要在公网服务启用）：

```bash
PREMIERE_PREVIEW=1 npx next dev --hostname 127.0.0.1 --port 3002
```

同一目录只能运行一个开发服务；也不能与生产服务共用 `.next`。要同时查看倒计时与影片，请使用[双生产实例步骤](docs/premiere-guide.md)。预览 http://localhost:3002 ，点击 `BEGIN OUR STORY`，或跳过片头进入桌面。鼠标点击一卷即可展开；触屏先选中，再点一次打开。可先预览照片，再按“开始放映”观看。播放时支持自动换片、暂停/继续、完整故事、照片跳转与方向键/触摸滑动；故事收起后仍暂停，章节结束后等待主动继续。Escape/返回按钮退回工作台。手机竖屏可以直接浏览，横屏有独立布局。

没有音频文件时默认静音；没有外部账号或密钥也可运行。字体与临时风景图均已本地托管。当前没有使用用户真实照片，也没有编造私人故事。

## 检查

先保持作者预览服务在 3002 运行，在第二个终端执行：

```bash
npm run lint
npm run typecheck
npx playwright install chromium
npm run test:e2e -- --project=desktop-chromium --project=mobile-landscape --project=mobile-portrait
node scripts/capture-premiere.mjs
node scripts/capture-finale.mjs
```

`npx playwright install --with-deps webkit` 可准备 WebKit（系统依赖安装可能需要管理员权限），然后 `npm run test:e2e -- --project=webkit`。WebKit 模拟不代替 iPhone Safari 真机验收。最新倒计时与终幕截图在 `docs/screenshots/phase4/`。原生音频及50帧隔离测试见 [放映指南](docs/player-guide.md)。

受限环境可以设置 `CHROMIUM_EXECUTABLE` 或 `WEBKIT_EXECUTABLE` 使用已安装的可兼容浏览器。`PLAYWRIGHT_BASE_URL` 指向已运行的测试服务；本项目开发验证统一使用 localhost；next.config.ts 另允许 127.0.0.1 的本地开发资源访问。手机通过局域网 IP 联调时，将实际 IP 加入 allowedDevOrigins 并重启，不使用全来源通配符。

生产构建：

```bash
# 先停止本目录开发服务
npm run build
npm run start -- --port 3001
```

## 内容与结构

- `src/content/archive.json`：可编辑的片头、标签、章节、记忆和照片。
- `src/lib/types.ts`、`content.ts`：内容契约与本地数据适配器，后续可换 Supabase。
- `src/components/`：OpeningScene、FilmWorkbench、FilmRoll、FilmUnroll、MemoryPlayer、MemoryStory、ChapterTransition、MusicPlayer、BirthdayFinale、PremiereGate。
- `src/hooks/`：放映进度、模态键盘与共享原生音频控制。
- `src/app/globals.css`：材质、桌面、横屏/竖屏布局与 reduced-motion。
- `tests/`：场景切换、动画中断、旋转、键盘与降级路径。

本轮没有 `/admin`、上传或数据库。首次观影偏好与重访状态保存在浏览器，照片/故事仍由服务端 JSON 提供；不能把浏览器进度当作重要内容存储。不要把 JSON 原型当作已经具备长期媒体存储的正式站点。本轮已获用户授权部署到现有阿里云服务器，公开状态见[开发进度](docs/progress.md)，操作见[阿里云部署](docs/aliyun-deployment.md)。

## 文档

[参考分析](docs/reference-analysis.md) · [视觉规范](docs/design-system.md) · [架构与后续计划](docs/architecture.md) · [内容准备](docs/content-guide.md) · [放映指南](docs/player-guide.md) · [倒计时与终幕配置](docs/premiere-guide.md) · [部署与备份](docs/deployment.md) · [素材许可](docs/assets.md) · [开发进度](docs/progress.md)

子路径发布：`NEXT_PUBLIC_ARCHIVE_BASE_PATH=/our-story npm run build`，再 `npm run package:release` 生成 standalone 包。默认不设置前缀时仍从根路径运行。详细操作与版本校验见[阿里云部署](docs/aliyun-deployment.md)。
