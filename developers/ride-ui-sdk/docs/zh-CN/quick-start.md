# 快速开始

目标是在浏览器中启动示例，再修改为自己的 App 内主题。无需 App 源码，也无需连接设备。

## 环境

需要 Node.js **22.12 或更高版本**、pnpm **10.33.2** 和现代浏览器。推荐 Node.js 22 LTS。Windows 使用 `pnpm.cmd` 可以避免 PowerShell 脚本执行策略影响。

在解压后的仓库根目录运行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开终端显示的开发服务器地址，在 `/mock-host.html` 进入调试器。正常状态会显示 `Theme connected`，右侧出现仪表。端口由 Vite 分配，以终端为准。

## 认识示例

| 文件 | 修改用途 |
| --- | --- |
| `theme/src/PartnerTheme.vue` | 仪表布局与展示 |
| `theme/src/useDashboard.ts` | 客户端订阅、缺失值处理、动作和配置 |
| `theme/src/ThemeSettings.vue` | 主题设置界面 |
| `theme/src/style.css` | 主题样式和适配 |
| `theme/ride-ui.json` | 身份、API、能力与运行要求 |
| `theme/submission.json` | 源码提交信息 |
| `theme/config.schema.json` | 设置字段和校验 |

示例 ID 为 `partner.example-dashboard`，版本 `0.2.0`。发布自己的主题时改为稳定、唯一的 ID，并同步清单、提交信息中的身份和运行声明。运行包 `releaseId` 应随发布版本保持一致。客户端从清单读取 ID，避免两处手写不同值。

## 最小订阅

```ts
import { createRideUiClient } from '@motexa/ride-ui-sdk/client'
import manifest from '../ride-ui.json'

const client = createRideUiClient(manifest.id)
const stop = client.subscribeSnapshot(snapshot => {
  const soc = snapshot.telemetry.soc
  const label = soc.value == null ? '--' : soc.displayValue
  // 将 label 写入你的组件状态。
  console.log(label)
})
client.ready()

// 在组件卸载时：
// stop()
// client.dispose()
```

先注册监听，再调用 `ready()`。不要自己发送桥接消息。直接打开主题 `index.html` 不会产生数据，浏览器必须通过模拟宿主加载它。

## 开发验证

```sh
pnpm theme:check
pnpm typecheck
pnpm theme:replay-check
pnpm theme:build
```

`theme:check` 检查清单与源码规则；类型检查验证公共 API 的使用；回放检查验证合成场景；构建生成包含调试器的 `dist/development/`。

至少手动查看横屏、竖屏、320px 宽度、明暗配色、缺失与过期数据、低功耗、设置保存和动作拒绝。详细步骤见 [调试器](debugger.md)；可安装包见 [构建与 App 安装](build-install.md)。
