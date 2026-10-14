# 主题清单与设置

`theme/ride-ui.json` 描述源码入口、身份、API、能力、输出环境和设置。参考文件是 `reference/ride-ui-manifest-v1.json`，实际规则以 `pnpm theme:check` 和运行包校验结果为准。

## 清单关键项

| 字段 | 说明 |
| --- | --- |
| `id` / `name` / `version` | 稳定唯一的主题身份、展示名和发布版本 |
| `entry` | 相对主题目录的源码入口，示例为 `src/main.ts` |
| `api.major` / `api.minMinor` | 示例要求 API 1.11 |
| `orientations` | 主题实际支持的方向 |
| `requiredCapabilities` | 没有就无法工作，尽量保持最小集合 |
| `optionalCapabilities` | 有则启用，没有则降级 |
| `runtime` | 发布者、发行身份、Web 渲染变体、目标和运行要求 |
| `config` | schema 版本、schema 相对路径和默认值 |

示例声明 phone / agent、phone / vehicle-cast、最低 Android API 26 和 WebView 120，以及视口范围与数据能力。这些声明是主题兼容要求，不能代替目标设备实测或授予任何设备访问权。仅支持手机时，应将目标收窄到实际支持范围。

## 主题设置

示例设置包含 `accent`、`hideSpeedDecimal` 和 `showPower`。schema 与默认值必须一致，运行包包含 `config/schema.json` 和 `config/defaults.json`。

App 在 `theme-settings` 模式打开设置。主题从 `context.config` 获取 `schemaVersion`、`revision` 和 `data`，用独立草稿编辑，点击保存后请求：

```ts
const result = await client.requestAction('theme.config-patch', {
  schemaVersion: context.config.schemaVersion,
  baseRevision: context.config.revision,
  patch: { accent: 'cyan', hideSpeedDecimal: true, showPower: true },
})
const returned = (result.result as { config?: typeof context.config } | undefined)?.config
if (returned) {
  // 采用宿主返回的 revision 和 data，更新组件状态。
}
if (!result.ok) {
  // conflict：用最新配置重置草稿，请用户重新选择；其他错误展示失败。
}
```

请求前检查 `theme.config-patch` 能力，防止重复保存。`baseRevision` 保护并发更新；冲突返回最新配置。不要盲目重试覆盖别人的修改。主题不写 localStorage，不自行持久化设置。

## 界面适配

根据 `context.safeArea` 设置四边安全间距，按宿主方向、视口、语言和配色布局。低功耗或动画关闭时减少动效；无输入输出保留必要数据显示。预览模式可能禁用交互，始终由能力决定是否显示和执行按钮。

使用显式按钮触发保存。主题沙箱不支持表单提交，不能以原生表单导航代替 SDK 动作。

## 资源规则

运行资源随包交付，使用本地图片、样式和字体。不要使用 fetch、远程脚本、远程样式、远程字体、动态执行、Capacitor、直接父页面导航或宿主存储。主题设置只走 SDK；开发调试器和文档站不进入主题运行包。

修改后使用 [调试器](debugger.md) 检查保存、拒绝、横竖屏与缺失数据，再 [构建安装包](build-install.md)。
