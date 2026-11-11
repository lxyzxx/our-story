# 生日首映与终幕配置

当前设置：**北京时间 2027 年 2 月 7 日 00:00 后才能开始观看**。零点前只显示电影邀请函与倒计时；到点后会向服务器确认开放，自动进入片头。网络不通时保留关闭，可手动重试。

## 在哪里修改

现在编辑 `src/content/archive.json`，后续 Phase 5 在受保护的 `/admin` 配置。

```json
"premiere": {
  "enabled": true,
  "opensAt": "2027-02-07T00:00:00+08:00",
  "timeZone": "Asia/Shanghai"
}
```

- `enabled: true` 启用倒计时门禁；设为 `false` 立即开放。
- `opensAt` 是唯一的开放时刻，必须带 `+08:00` 等偏移或 `Z`，不能只填本地日期。
- `timeZone` 控制日期的显示时区。北京时间采用 `Asia/Shanghai`。
- `premiere.copy` 可修改邀请语、按钮和连接错误文案。
- 启用时若日期或时区无效，会保持关闭并显示时间待安排，不会意外公开影片。缺省 premiere 的旧样本仍正常开放。

默认 JSON 编入服务端版本，修改后重新构建/启动。`ARCHIVE_CONTENT_FILE` 可指向服务端外部 JSON，此时按请求读取，替换文件应采用原子 rename。不要把密钥或真实私密照片提交到公开仓库。

## 作者本机预览

正常服务不带预览变量，端口 3001 展示倒计时。生产构建后可同时启动两个只监听本机的服务：

```bash
# 先停止本目录的开发服务
npm run build
npx next start --hostname 127.0.0.1 --port 3001
```

另一个终端：

```bash
PREMIERE_PREVIEW=1 npx next start --hostname 127.0.0.1 --port 3002
```

http://localhost:3002 可完整预览影片，http://localhost:3001 保持倒计时。开发模式可将 start 换成 dev，但不要与生产服务共用同一 `.next` 同时运行。

预览变量是服务端运行开关，公开服务必须关闭；不能作为管理员登录使用。没有 `?preview=1` 等访客可用的绕过方式。门禁以服务端时钟判断，修改手机时间不会提前开放。

当前公开演示图仍位于 public，可按路径单独访问。倒计时隐藏故事和信件，不等于已经实现真实照片的私有存储授权；那部分将在 Phase 5 完成。

## 生日信和片尾

在同一 JSON 的 `finale` 中填写：

| 字段 | 内容 |
| --- | --- |
| `letter` | 亲手写的生日信；用空行分段，按纯文本显示，不执行 HTML |
| `signature` | 信件落款，未填时使用 credit |
| `date` | 信件显示日期，可留空 |
| `credit` | A FILM BY 的署名 |
| `starring` | 主演姓名；未填时沿用片头 starring |
| `copy` | 生日祝福、信件标题、THE END? / NO. / TO BE CONTINUED... 与全部终幕操作文案 |

`music.finale` 填有使用授权的音频路径。无音乐或音频失败不会阻塞信件。信件、署名和正式音乐目前均等待作者提供，未虚构私人内容。

最后一章结束后收卷、暗灯、显示终幕字幕，约 6 秒进入信件；可暂停、跳过或退出。信件不会自动消失，主动进入片尾再返回。完成首映后，片头与工作台都有“重读生日信”。减少动态效果时直接进入阅读。横竖屏旋转保留当前阶段。

## 隔离测试

常规 Playwright 默认连接作者预览 3002，可设置 `PLAYWRIGHT_BASE_URL`。额外测试项目使用独立内容实例：

- `FINALE_FIXTURE_URL`：指向以 `tests/fixtures/archive-finale.json` 启动的服务，运行 `--project=finale-fixture`，验证长信、纯文本、原生音频及坏音轨。
- `ARCHIVE_FIXTURE_URL`：指向以 `tests/fixtures/archive-50.json` 启动的服务，运行 `--project=content-fixture`。
- `PREMIERE_TEST_URL`：指向无预览变量的独立服务；`PREMIERE_FIXTURE_FILE` 与该服务的 `ARCHIVE_CONTENT_FILE` 必须指向同一个 `/tmp/` JSON 副本。运行 `--project=premiere-gate` 会原子替换该临时文件，不要指向真实内容。

测试覆盖服务端未开放时的 HTML/接口内容隔离、客户端时间与参数绕过、错误配置、自动开放、网络中断恢复和三尺寸布局。真实设备与私人媒体上线验收仍待后续阶段。
