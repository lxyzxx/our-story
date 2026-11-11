# 阿里云部署操作

本轮用户已授权部署到现有阿里云服务器，并要求有功能改动就推送 GitHub。当前独立应用已安装并通过内部健康检查，公开代理候选配置已验证；公网切换和外网验收结果见 [progress.md](progress.md)。

现有 IP 首页属于其他应用，所以本项目使用 `/our-story`，不接管首页、语音路径或证书验证路径。初次使用 HTTP IP 地址，域名与 HTTPS 后续接入。

## 运行结构

| 项目 | 位置 / 配置 |
| --- | --- |
| 对外入口 | `http://114.55.234.248/our-story` |
| 应用服务 | `our-story.service`，开机启动、失败重启，以 `our-story` 系统用户运行 |
| Node | `/opt/node-v24.18.0/bin/node`，复用已安装的 Node 24，不修改全局运行时 |
| 版本目录 | `/opt/our-story/releases/<releaseId>`，root 管理，应用只读 |
| 当前 / 前版 | `/opt/our-story/current`、后续版本的 `/opt/our-story/previous` |
| 实际内容 | `/opt/our-story/shared/archive.json`，独立于发布目录 |
| 图片处理缓存 | `/opt/our-story/shared/cache`，应用唯一的持久可写目录 |
| 运行环境 | `/etc/our-story/our-story.env`，root 600；不存入 Git |
| 应用监听 | Docker 桥网关 `10.255.1.1:3010`，仅供现有 Caddy 访问；未开放公网应用端口 |
| 公开代理 | 现有 `maomao_makeup-caddy-1`，仅增加 `/our-story` 匹配 |
| 代理宿主文件 | `/opt/maomao_makeup/Caddyfile`，变更前备份到 `/opt/our-story/backups/proxy-*` |
| 发布记录 | `/opt/our-story/deployment.json` 与 `proxy-deployment.json` |

正式单元通过 `UnsetEnvironment=PREMIERE_PREVIEW` 移除预览变量。内存上限 512MiB，Node 堆上限 256MiB；当前只有演示照片和空生日信。部署不代表后台、私有照片授权或正式内容已经完成。

## 构建、打包与更新

构建采用 Next.js [standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) 与构建时 [basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath)。路径改变必须重新构建；只改服务器环境变量不能改变客户端路径。无前缀构建仍是本机默认行为。

```bash
# 停止共用本目录 .next 的本地开发/生产进程后执行
NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_ARCHIVE_BASE_PATH=/our-story npm run build
npm run lint
npm run typecheck
npm run package:release
```

打包命令输出 `/tmp/our-story-<时间>-<源码摘要>.tar.gz`、SHA256 与 release.json。只包含追踪运行时、public、构建静态文件及种子内容，不包含 SSH 配置、环境密钥、参考视频或本地测试文件。清单同时记录源码摘要、BUILD_ID、Git 提交与 dirty 状态；不能只用旧 Git HEAD 代表未提交构建。

将包、校验文件与单元模板上传服务器 `/tmp/`，再运行下面的安装器。将示例中的 `<发布包>` 和 `<SHA256>` 替换为打包输出：

```bash
scp /tmp/<发布包>.tar.gz /tmp/<发布包>.tar.gz.sha256 deploy/our-story.service our-story-server:/tmp/
ssh our-story-server python3 - /tmp/<发布包>.tar.gz <SHA256> --bind 10.255.1.1 < deploy/install-release.py
```

安装器先验证校验和、目标平台与归档路径，再安装到新版本目录；默认保留已存在的 shared/archive.json 和环境文件。版本切换通过 current 链接，启动失败会停止新进程并在有前版时恢复。第一次没有前版，只能停服务或切回已保留的安装包，不能声称已做过前版恢复。

单元模板里的 Node 路径是本次服务器实测值，换服务器前要先核对。后续更新应用不需要再编辑 Caddy 路由。

## 首次代理接入

`deploy/configure-proxy.py` 只适用于本次已检查的 Caddy 结构：原站点包含唯一 `reverse_proxy app:8787`，前面插入专有匹配，不改它的其他路由。先校验候选文件，确认后在已有部署授权内加 `--apply` 执行：

```bash
ssh our-story-server python3 - \
  --config /opt/maomao_makeup/Caddyfile \
  --container maomao_makeup-caddy-1 \
  --upstream 10.255.1.1:3010 \
  --public-host 114.55.234.248 \
  --expected-sha256 <检查时原配置的SHA256> \
  --baseline /tmp/our-story-existing-site-baseline.json \
  < deploy/configure-proxy.py
```

正式应用时在最后重定向之前加 `--apply`。脚本要求原配置摘要未变，先备份/验证，再保留原文件 inode 写入并平滑 reload，因为原文件单独 bind mount 到容器，直接原子替换宿主文件会让容器继续看到旧 inode。失败时恢复原文件；若检测到并发改动则保留它并报告备份位置。首映接口需为 locked / preview=false，且原有路径的状态、内容摘要、长度与重定向必须和基线一致，否则回滚代理。

脚本用于首次接入；已有 OUR STORY 标记时会拒绝重复插入。原代理格式警告是既有格式，不因此整体格式化其他站点配置。

## 实际倒计时配置

线上以 `/opt/our-story/shared/archive.json` 为准，不是每次发布包的种子文件。默认仍为北京时间 **2027-02-07 00:00**，前台不能通过 query 参数或设备时间绕过。修改前先备份，编辑 JSON 临时文件并校验，之后在同目录 rename 替换，保持 root:our-story / 640。请求会动态读取，不要求重启应用。

本地默认值在 `src/content/archive.json`。要同步新内容到线上须明确更新 shared 文件；重新发布代码不会覆盖已编辑的照片、故事与生日信。

## 验证与运维

```bash
ssh our-story-server systemctl status our-story.service --no-pager
ssh our-story-server journalctl -u our-story.service -n 40 --no-pager
curl --noproxy '*' -fsS http://114.55.234.248/our-story/api/premiere
```

`VERIFY_BASE_URL` 指向待检的公开门禁；`VERIFY_PREVIEW_URL` 只允许指向本机作者预览。`scripts/verify-deployment.mjs` 检查三尺寸的 HTTP/API/无缓存/资源路径/布局，可选同包本机预览检查照片完成加载、原生 Audio 的路径与播放推进、实际关闭音乐面板和外部 JSON 信件。测试音轨是合成静音 WAV、信件明确为排版测试，不上传到正式内容。

```bash
VERIFY_BASE_URL=http://114.55.234.248/our-story \
VERIFY_CAPTURE_DIR=docs/screenshots/deployment-public \
node scripts/verify-deployment.mjs
```

截图和浏览器仿真不能替代真实 iPhone Safari、Android、正式照片和音乐听感验收。

## 备份与恢复

本次代理变更有服务器侧原文件备份，原站点响应有操作前基线；当前发布包、release.json、源码摘要与 shared/archive.json 应一起备份。`/tmp` 中的上传包不是长期备份。

人工备份至少包括 shared 内容、用户原图/音频、当前版本清单、服务环境与代理配置；密钥走安全的独立备份，不入代码仓库。发布目录含当前演示 public 素材，未来上传原图需在 Phase 5 实现独立媒体存储。此时尚无数据库或媒体备份恢复演练，也没有异地自动备份。

应用回滚：先检查 previous 指向的版本清单，停止服务，将 current 原子切回该版本，再启动并验证首映接口和资源；shared 内容不自动回滚。代理回滚：在未发生其他站点配置变更时将本次 Caddyfile.before 写回原 inode，`caddy validate` 后 reload，并验证已有站点。若已有后续变更，只移除 OUR STORY 标记中的路由，不用旧完整配置覆盖其他修改。
