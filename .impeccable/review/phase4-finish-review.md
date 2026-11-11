# 1. Disposition — ship

保持已获确认的电影胶片工作台方向。首映邀请、生日纸页与片尾在三种尺寸中保持同一套字体、色调与叙事；无需 rebuild。初审发现的两项 P2 已在限定复核中 resolved，当前本地 Phase 4 可 ship。本结论不授权部署；下方保留初审发现与修复证据。

# 2. Scope / evidence

- 独立读取 PRODUCT.md、DESIGN.md、终幕与首映 direction contract、craft-floor 和 docs/premiere-guide.md；未读取代理定义文件。
- 检查 git diff 与新增 BirthdayFinale、PremiereGate、premiere/server、finale、API、page、FilmArchive、OpeningScene、MusicPlayer、useMusicPlayer、types 和相关测试源码。
- 使用 view_image 实际逐张检查 docs/screenshots/phase4 下全部 24 张截图：desktop 1440×1000、landscape 844×390、mobile 390×844，各自 premiere / rewind / the-end / continued / birthday-letter / credits / long-letter / long-letter-end。长信明确为合成排版与安全测试样本，未视为私人内容。
- 两份浏览器错误 JSON 均为 []。实施方报告生产桌面、横屏、竖屏各 15/15，门禁 6/6、终幕 fixture 3/3、旧内容/audio fixture 4/4，共 58 项；build、lint、typecheck 通过。本审查没有操控浏览器或自行重跑这些测试。
- 检查既有一次 detector 输出；347 条中 346 条为 token 元数据不完整相关 advisory，另 1 条是此前接受的实体放大镜边框，未重复运行 detector。

# 3. Prioritized findings

1. **P2 — 收卷舞台的动画覆盖垂直居中，横屏主物件被裁切并与控件重叠。** BirthdayFinale.tsx:61–64 将 `.rewind-stage` 的 y 设置为 18→0，随后又到 20；该元素本来依靠 globals.css:3009 的 `translate(-50%, -60%)` 居中。实际 desktop-rewind 物件明显落在下半部；landscape-rewind 的胶卷和底片被视口底部裁掉，暂停/跳过控件压在物件上。portrait 也呈现靠下构图。这破坏了终幕首个机械叙事瞬间，属于实际渲染问题。
2. **P2 — 奶油纸上片尾按钮的悬停文字失去对比。** `.birthday-paper > footer > .text-button` 没有覆写全局 `.text-button:hover { color: #fff1d8; }`。landscape-long-letter 与 landscape-long-letter-end 中，按钮文字/箭头实际变成近白色，落在 #e4dac7 纸面上，颜色对比约 1.2:1。这个关键继续操作需保留深色状态。

未发现足以另列的 P0/P1 源码或内容隔离问题。邀请页没有先发送章节和信件；服务端到时判定、无缓存状态接口、显式偏移日期解析、错误配置保持关闭与无 URL 预览绕过均能从源码和专项测试对应起来。

# 4. Concrete fixes / verification

- 将静态居中与动画位移分离：例如外层保留各断点百分比 translate，内层承担 y/scale/opacity。避免通过固定像素补偿掩盖横竖屏差异。补拍三尺寸 rewind，确认胶卷/底片完整处于舞台区，并与底部暂停/跳过控件保持间距；再检查 THE END? 等后续字幕的定位未受影响。补充一次 intro 中旋转检查，防止 GSAP 固定已计算的 transform。
- 给纸页内继续按钮定义符合纸面材质的深色 hover/active，并保留现有深色 focus-visible 描边。补拍 landscape 长信开始与末端的悬停状态，确认文字对比至少 4.5:1、焦点与箭头清晰；确认桌面和竖屏同样适用。
- 修复后针对终幕回归即可；现有门禁专项无需因纯视觉修复全部重跑。复核更新截图与相关断言通过后，可将 disposition 更新为 ship。

**限定复核记录（2026-11-11）：** 仅复核上述两项，未扩展全局审计。

- **发现 1 — resolved。** 当前源码新增 `.rewind-anchor` 静态定位外层，三个断点的百分比 translate 保留在外层，GSAP 的 y/scale/opacity 仅作用内层 `.rewind-stage`。使用 view_image 检查更新的 desktop / landscape / mobile-rewind.png：垂直构图已恢复，横屏胶卷和底片不再被底边裁切，三尺寸均与暂停/跳过操作保持间距。竖屏原有横向出血构图保留。静态锚点也避免旋转时由内联动画固定百分比定位。
- **发现 2 — resolved。** 当前 CSS 显式将 `.birthday-paper .text-button:hover/:active` 设为 #211d19。使用 view_image 检查新增三尺寸 letter-action-focus-hover.png，文字及箭头均清晰可读；实施方记录的 computedColor 均为 rgb(33, 29, 25)。深棕色 `:focus-visible` 描边规则仍保留；这三张截图属于指针悬停并 focus 状态，未显示键盘模态描边，故不以截图宣称已验证键盘轮廓。
- 正常终幕截图 finale-browser-errors.json 仍为 []。实施方报告修复后生产 build 通过，终幕专项桌面/横屏/竖屏各 4 项、合计 12/12（54.6s）通过，覆盖暂停恢复、字幕顺序、取消/快速跳过、减少动态效果、片尾重访、阅读旋转及焦点；本复核读取 test-results/phase4-finale-fixes/.last-run.json 确认 status=passed、failedTests=[]，未自行运行浏览器。
- 两项均无待修问题，限定复核 disposition 为 **ship**，原 accepted limits 继续适用。

# 5. Accepted limits

- 当前是本地、JSON 配置的 Phase 4；受保护 admin、数据库、Auth 与私有 Storage 属于 Phase 5，尚未交付。public 演示图片路径在首映前仍可直访，文档明确说明；门禁不构成媒体 ACL。
- 日期使用 2027-02-07T00:00:00+08:00 / Asia/Shanghai，正常服务依靠服务端时钟。PREMIERE_PREVIEW 仅为作者本机服务配置，不能作为登录或公开部署配置。
- 私人生日信、真实姓名、署名和正式音乐仍为空；空状态与通用祝福没有冒充真实记忆。长信 fixture 仅用于验证阅读、滚动和纯文本处理。
- 未新增交付图片素材；新增栅格仅为实际截图，沿用的六张许可演示图片来源保持原有记录。真实手机、真实音频内容与最终私人素材验收尚未进行。
- 本轮只审查源码、截图与已报告验证结果；没有发布、提交、推送或外部环境操作。
