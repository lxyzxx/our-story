# 本地运行、部署、备份与恢复

## 当前状态

用户本轮已明确授权部署到现有阿里云服务器，并选择先用 IP。当前独立服务已安装并完成公开切换，桌面/横屏/竖屏外网门禁验证通过；具体版本与验收状态以 [progress.md](progress.md) 为准。没有创建 Supabase 或付费资源，尚无真实私人内容。实际路径、构建、备份与回滚步骤见 [aliyun-deployment.md](aliyun-deployment.md)。

## 开发与生产构建

Node.js 20.9+、npm；推荐 Node 24。Linux/WSL：

```bash
npm ci
npm run dev -- --port 3001
npm run lint
npm run typecheck
npm run build
npm run start -- --port 3001
```

生产模式与开发模式不要同时占用同一目录的 `.next`，生产校验时先停开发服务。默认绑定 0.0.0.0 以便同一局域网手机测试；若只需本机，可将命令改为 `npx next dev --hostname 127.0.0.1 --port 3001`。未配置任何穿透服务。

## 目标部署结构（待 Phase 5–7）

Node 服务 + HTTPS 反向代理或适配 Next.js 的托管平台；Supabase PostgreSQL/Auth/Storage 独立于部署版本。站点访问范围（公开链接、口令或登录）需在真实私人照片上线前决定。管理员登录和公开访问是两层权限，noindex 不是访问保护。

密钥通过部署环境注入，不进入 JSON、前端 bundle 或仓库；`service_role` 只用于服务器管理。先在独立测试环境验证 RLS、媒体访问与发布状态，再验证正式环境。

## 当前备份

目前全部原型内容在 `src/content/archive.json`，素材在 `public/`。备份项目源码、lockfile、`docs/` 和用户原始照片；`references/` 可单独保存，非网站运行必需。不要以 `node_modules`、`.next` 作为唯一备份。

恢复到新目录后 `npm ci && npm run build`，检查三种布局、照片和原有 JSON。尚未提供真实数据库恢复脚本，因为没有已落实的数据架构与目标存储。

## 正式数据备份与恢复计划（未实施）

数据库备份与 Storage 对象必须同时覆盖；数据库快照不会自动备份照片对象。按媒体 manifest 校验文件数量、大小与哈希；原图和衍生图均要有独立、加密、异地备份。音乐文件和环境配置清单独立保存，密钥走密码管理器。

恢复演练顺序：隔离环境 → 恢复数据库 → 恢复对象与路径 → 恢复 Auth/角色配置 → 验证 RLS 与匿名拒写 → 验证照片、故事、顺序、生日信、音频 → 对比数量/哈希。未演练前不能宣称“长期不丢失”。推荐频率与保留期在确定存储成本与内容频率后制定。

## 首映运行配置

默认开启北京时间 2027-02-07 00:00 的服务端门禁。服务器时钟须正常同步，代理/CDN 不得缓存动态首页或 `/api/premiere`；接口和首页已设置动态无缓存行为。更新 JSON 后重建/重新启动默认内容服务；使用 `ARCHIVE_CONTENT_FILE` 时按请求读取外部文件，原子替换避免半写入。备份也要包括这个外部文件。

`PREMIERE_PREVIEW=1` 完全跳过有效日期门禁，仅用于绑定 127.0.0.1 的作者预览服务；**正式公开服务不得启用**，也不要通过反向代理转发该预览端口。它不是管理员身份认证。具体操作见 [premiere-guide.md](premiere-guide.md)。
