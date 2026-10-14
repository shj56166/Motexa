# 浏览器调试器

调试器是一个合成数据宿主：通过与 App 相同的公开 SDK 消息契约加载主题，用于检查 UI、握手、配置和受控动作。它不连接真实设备，也不能证明某款手机或车机已经兼容。

## 打开调试器

开发时执行 `pnpm dev` 并打开 `/mock-host.html`。查看构建产物时：

```sh
pnpm theme:build
pnpm exec vite preview --outDir dist/development --host 127.0.0.1 --port 5187 --strictPort
```

访问 `http://127.0.0.1:5187/mock-host.html`。独立文档站也提供调试器链接。应通过 HTTP 服务器打开，不使用 `file://` 双击 HTML。

## 控件说明

| 控件 | 检查目标 |
| --- | --- |
| Replay scenario / Replay time / Play | 选择场景、定位时间、循环播放 60 秒时间线 |
| Speed / Power | 手动场景的速度和功率，功率支持负值 |
| Host / Render target | 模拟 phone / agent 环境及 phone / vehicle-cast 输出 |
| Input | 触摸输入与无输入展示 |
| Locale | 中文与英文宿主环境 |
| Width / Height / Orientation | 像素视口和横竖屏布局 |
| Mode | 实时仪表、主题设置、只读背景预览 |
| App speed decimals | App 速度小数开关，与主题隐藏小数组合 |
| Color scheme | 深色与浅色 |
| Telemetry quality | fresh、stale / held、missing |
| Vehicle gear / Parking | 手动选择低／中／高／未知挡位与 P／解除 P／不可用 |
| Action response | 动作成功或拒绝 |
| Recording / Low power / Animations | 记录标识、低功耗和动画状态 |

Host / Render target 只改变公开环境描述，不模拟实际 Android WebView 或输出设备。回放场景启用后，速度、功率和质量由时间线控制，手动输入会禁用。

## 七种回放场景

| ID | 应观察的行为 |
| --- | --- |
| `normal` | 正常加减速与功率展示 |
| `vehicle-status` | 六种挡位／P 组合，之后显示未知挡位、陈旧和不可用状态 |
| `missing-gps` | GPS 缺失时显示缺失状态，其他来源依能力展示 |
| `stale` | 过期值保持但呈现 held / stale 状态 |
| `regeneration` | 负功率不被错误截断为 0 |
| `source-switch` | 来源切换后显示值和来源标识同步 |
| `clock-shift` | 墙上时钟回退不造成负时长或异常动画 |

## 验证设置和拒绝行为

1. 将 Mode 改为 Theme settings，修改颜色、速度小数和功率可见性，点击保存。
2. 切回 Live dashboard，再进入设置，确认同一次模拟宿主会话内保留修改。
3. 将 Action response 改为 Denied，再次保存；应显示失败信息，已有配置不改变。
4. 切换 Read-only preview 和 No input，确认交互依据宿主能力处理。
5. 将质量改为 Missing，速度与其他缺失指标显示 `--`，不能回退为旧测量值。

调试器的配置只存在内存中，刷新浏览器会重置。真实 App 的持久化和导入授权不能用模拟宿主代替。

## 常见问题

`Waiting for theme handshake`：确认通过模拟宿主打开，SDK 已调用 `ready()`，浏览器控制台没有加载错误。

`Theme ID mismatch`：客户端使用的 ID 与 `theme/ride-ui.json` 不同。

页面空白：先运行类型检查和构建，再查看 DevTools Console。使用静态网站子目录时，保持 `mock-host.html`、`index.html` 与 `assets/` 的相对结构。

动作返回 `denied`：检查模式、Action response 和当前 `context.capabilities`。完整语义见 [客户端 API](api.md)。
