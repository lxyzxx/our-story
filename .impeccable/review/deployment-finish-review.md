# 1. Disposition — ship

本次子路径接入和播放器音乐面板修复可 **ship**。保持已确认的电影胶片工作台方向，无需重新设计。当前证据未发现需要阻止本次部署或 GitHub 交付的 P0–P2 问题。公开路由应用后仍须完成既有网站保持验证，并同步文档中的部署状态；这两项不能由本地截图替代。

本评审是提交、推送前的独立限定评审，不执行提交、推送或服务器变更。当前会话已明确授权既有阿里云服务器的 IP 入口部署和功能推送；PRODUCT.md 中早期禁止公开部署的描述不覆盖本轮明确授权。

# 2. Scope / evidence

- 独立读取 deployment-contract.md、PRODUCT.md、DESIGN.md、craft-floor，以及既有 phase4-finish-review.md；未读取代理定义文件。本轮仅审查 standalone、构建时 basePath、公共媒体/API 前缀、颗粒 CSS 变量、播放器头部层级和部署交付脚本，不重开已批准设计。
- 检查 next.config.ts、urls.ts、content.ts、layout.tsx、FilmWorkbench.tsx、PremiereGate.tsx 的相关路径，以及 globals.css 中 `.screening-header` 从 z-index 5 到 7 的调整。媒体前缀助手保留外部 URL，且不会重复添加已有前缀；内容适配器同时覆盖照片、章节音乐与全局音乐。
- 使用 view_image 实际逐张检查 docs/screenshots/deployment-local 下当前 desktop（1440×1000）、landscape（844×390）、mobile（390×844）的 premiere、workbench、player、letter、music-panel，共 15 张。desktop-music-panel-before.png 未作为当前状态评判依据。
- 读取 verify-deployment.mjs 与 verification.json：记录 passed=true、errors=[]，三尺寸均覆盖锁定首页/API、无缓存、资源前缀、完整加载的主照片、音乐面板实际关闭点击、播放器和外部 JSON 信件样本。锁定服务为 localhost:3020，预览为独立 localhost:3021；未以预览服务代替公开门禁。
- 构建、typecheck、lint 当前通过和同一 standalone 发布包冒烟结果由实施方提供；本评审未重新运行。Phase 4 原 58 项及限定修复后 12 项通过沿用其既有评审记录，不声称本轮重跑。
- 读取既有 deployment-detector.json：347 条中 346 条 advisory，另 1 条为 globals.css:808 已接受的实体放大镜结构边框；没有再次运行 detector。
- 检查 install-release.py、configure-proxy.py、our-story.service、our-story.env.example、package-release.mjs。私网服务已运行、PREMIERE_PREVIEW=false 且 Caddy 候选仅验证尚未应用，属于实施方报告状态，本评审未独立访问服务器。

# 3. Prioritized P0–P3 findings

- **P0：无。** 未发现本轮引入的公开预览绕过或现有根网站替换行为。
- **P1：无。** 发布包具备校验和、唯一版本目录和来源指纹；应用服务不以 root 运行，公开服务显式清除 PREMIERE_PREVIEW。既有内容仅在不存在时播种。
- **P2：无待修项。** 三尺寸当前音乐面板的关闭按钮完整可辨，脚本直接点击该按钮通过。提高播放器头部层级后，面板处于 controls-toggle 之上，未见新增遮挡。首映与工作台延续同一套字体、暖金文字、暗酒红光源与纸张材质；主照片保持完整画幅，信件仍为清晰深色纸面正文。
- **P3：部署文档状态待收尾同步。** 审查时 docs/deployment.md 仍写“本轮没有公网部署”“需用户后续授权”，PRODUCT.md 仍保留早期“不得公开部署”。实际公开路由完成后，应据实更新为本轮已授权的 IP/子路径、运行与回退方式、已完成验证和剩余范围，避免下一位维护者误判。无需因此修改已批准视觉。

# 4. Concrete checks / fixes

- UI 修复已在源码和当前三尺寸截图中对应，verify-deployment.mjs 使用真实 Playwright 点击关闭，无 force click。当前无额外 UI 修复要求。
- 交付包只复制 standalone 跟踪运行时、public、static 和 seed；manifest 记录 basePath、平台、buildId、Git 状态、源码指纹与 seed 指纹，产物另有 SHA-256。服务器拒绝覆盖已存在的版本目录，并校验压缩包路径与链接范围。
- 服务使用专用非 root 用户、root 拥有的发布文件、512M 内存上限和仅缓存目录可写配置。外部 archive.json 不随重复发布覆盖；PREMIERE_PREVIEW 通过 systemd UnsetEnvironment 排除。没有发现脚本调用外部流水线或包含账号密钥。
- 代理变更先比对原配置 SHA、检查唯一插入位置、保存前后备份并验证 Caddy 候选。对单文件 bind mount 保持 inode 原位写入，应用失败时恢复原配置。应用后要求公开 premiere 为 locked、preview=false，并对既有路由逐项比较状态、正文指纹、长度和 Location；这些检查应实际通过后再报告上线完成。
- 完成上述公开验证后修正文档 P3 状态，并保留准确的版本、备份位置与回退说明。该项属于交付文档收尾，不需要扩展产品功能。

# 5. Accepted limits

- 当前发布仍是演示内容；受保护后台、认证、持久化和私人媒体 ACL 尚未实现。真实照片、姓名、正式生日信与配乐没有被本次部署替代。演示 public 图片可直访是已记录范围，首映门禁只保护正常页面内容发送。
- HTTP/IP 首次入口是用户明确选择；本评审不把尚无域名/HTTPS 视为本轮阻断项。公开预览端口不得转发，首映时间依赖服务端正确时钟。
- 音频验证使用原生 Audio 路径和本地合成 WAV 请求样本，没有真实正式配乐或听感验收；脚本未显式断言播放时间推进。外部 JSON 信件明确标为排版样本，不是私人信件。
- 截图是 Chromium 模拟桌面/横竖屏结果。竖屏工作台及信件延续可滚动构图，单张视口截图不代表整页裁切错误，也不替代真实手机触摸、系统媒体策略和最终私人素材验收。
- 本评审未重新执行测试、部署、提交或推送；公开路由结果和最终运行版本需由执行方完成独立读回。
