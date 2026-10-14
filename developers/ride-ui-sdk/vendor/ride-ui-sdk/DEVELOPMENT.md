# Motexa App 内主题开发 SDK

本 SDK 用于开发运行在 Motexa App 内的仪表主题。主题通过稳定的消息接口消费 App 已转换的车辆数据，并请求宿主允许的交互动作。开发者不需要实现车辆通信协议。

```text
车辆设备 → App 私有连接与协议转换层 → 标准数据与宿主策略 → SDK → 主题
主题 → SDK 动作请求 → 宿主校验与执行 → 动作结果
```

当前 SDK 包版本为 1.5.0，消息 API 为 1.11，两种版本号分别描述开发包和通信契约。当前开放的是 Web 仪表主题；其他扩展类型需要宿主另行提供能力，不能通过 SDK 任意调用原生插件。独立第三方 Android App 没有此 SDK 的数据访问入口。

API 1.11 新增完整快照字段 `vehicleGear`（1 低挡、2 中挡、3 高挡）和 `vehicleParking`（1 处于 P、0 解除 P），二者没有单位且独立表达。仅当 `freshness === 'fresh'` 且 `value != null` 时显示当前状态；不得用真值判断丢弃 P＝0。极核／ZEEHO 已提供数据，九号 MMAX90 对应状态尚未验证，保持 `null/missing/unavailable`。旧宿主缺少字段时 SDK 自动补齐为不可用。预览中的 `vehicle-status` 场景覆盖六种组合、未知、陈旧与不可用。

## 开发包和接入

开发包包含 Vue / TypeScript 主题模板、本地模拟宿主、编译后的 SDK、类型声明、主题清单参考、校验和打包工具。模拟数据由 SDK 人工生成，不包含真实用户骑行记录或设备原始帧。真实数据只在主题被 App 加载并完成宿主握手后提供。

示例 demo 按开发包根目录 `LICENSE.md` 指定的范围采用 MIT 开源许可；该许可不扩展到 vendored SDK、App 或底层协议实现。SDK 提供数据订阅和受控展示交互，当前不属于严格只读 API。

在解压后的开发包根目录执行：

```text
pnpm install
pnpm dev
pnpm theme:check
pnpm theme:pack-runtime
```

Windows 可使用 `pnpm.cmd`。先修改 `theme/ride-ui.json` 中的主题标识、版本、支持方向、最低 API 次版本和必需能力，再修改主题源码。模板的 README 说明本地预览、设置和手机导入流程。

主题运行时仅导入 `@motexa/ride-ui-sdk/client` 和 `@motexa/ride-ui-sdk/contract`；`replay` 入口用于开发时的模拟宿主。创建一个客户端，注册监听后调用 `ready()`：

```ts
import { createRideUiClient } from '@motexa/ride-ui-sdk/client'
import type { RideUiInitContextV1 } from '@motexa/ride-ui-sdk/contract'

const client = createRideUiClient('example.dashboard')
let context: RideUiInitContextV1 | null = null

client.subscribeContext((next) => { context = next })
client.subscribeSnapshot((snapshot) => {
  const soc = snapshot.telemetry.soc
  // 使用实际 UI 更新函数；缺失数据不显示为 0。
  console.log(soc.value == null ? '--' : soc.displayValue)
})
client.subscribeDisplayFrame((frame) => {
  console.log(frame.speedKmh == null ? '--' : frame.speedKmh.toFixed(0))
})
client.ready()

async function refresh() {
  if (!context?.capabilities.includes('ride.refresh')) return
  const result = await client.requestAction('ride.refresh')
  if (!result.ok) console.log(result.error?.code)
}

// 页面卸载时调用 client.dispose()。
```

主题 ID 必须与清单一致。SDK 先发送空会话的 `theme.ready`，宿主通过 `host.init` 分配会话；后续消息由 SDK 自动携带会话标识。会话标识用于隔离消息，不能作为安装授权或车辆凭证使用。主题不要自行实现桥接或寻找其他 WebView 的宿主入口。

## 数据契约

| 入口 | 用途 |
| --- | --- |
| `subscribeContext` | 宿主模式、能力、语言、方向环境和主题配置 |
| `subscribeSnapshot` | 完整场景与标准遥测快照 |
| `subscribeFrame` | 速度、功率等高频展示更新 |
| `subscribeDisplayFrame` | 宿主提供的速度显示帧 |
| `requestAction` | 请求宿主执行声明的动作并取得结果 |

具体字段以开发包内 `contract.d.ts` 为准，遥测键以 `RIDE_UI_TELEMETRY_KEYS_V1` 为准。速度、电压、电流、SOC、温度、距离等字段提供数值、单位和展示文本；来源、质量、新鲜度和采样时间用来解释值是否可用。`sourceRef` 等来源元数据按不透明标识处理，不假设它是设备地址或可调用的原生会话。

- `null` 表示缺失，不能自动补为 0；过期或保持的值应体现其状态。
- 普通文本优先使用宿主的 `displayValue` / `displayUnit`，图形计算使用数值与 `canonicalUnit`。
- 收到显示帧后，速度数字、指针和进度条使用其 `speedKmh`，包括 `null`；`telemetry.speed` 保持测量语义，不再叠加速度平滑。
- 字段存在不代表每台设备都能提供；能力与数据有效性以当前宿主为准。
- 主题不得依赖原始设备帧、厂商字段偏移或内部连接状态机来获得兼容性。

同一 API 主版本内，主题应容忍未知可选字段；需要新能力时声明最低次版本和 `requiredCapabilities`。宿主能力以 `host.init` 的 `capabilities` / `environment.dataCapabilities` 为准，开发包版本本身不授予能力。

## 受控动作

当前动作名以 `RIDE_UI_IMPLEMENTED_CAPABILITIES` 为准，宿主按模式和运行状态提供子集。例如刷新、请求退出、切换方向、打开主题设置、触感反馈和提交主题配置。`vehicle.open-settings` 只是请求宿主打开设置界面，不授予主题写车辆参数的能力。

发起动作前检查 `context.capabilities`，结果可能为 `denied`、`unavailable`、`invalid`、`conflict`、`timeout` 或 `failed`。宿主继续校验当前会话、动作、上下文、参数和授权；主题声明能力不能替代宿主检查。

主题配置通过 `theme.config-patch` 提交 `schemaVersion`、`baseRevision` 和 patch，由宿主校验并持久化。发生冲突时采用宿主返回的最新配置。连接切换、BLE 轮询、设备凭证、车辆命令、权限和记录生命周期由 App 管理。

## 运行与安装边界

主题运行在隔离的 Web 宿主中，只通过 SDK 交换消息。运行包须自包含，禁止网络请求、远程脚本、动态执行、Capacitor / 原生插件调用，以及自行访问宿主存储。所需资源随主题打包；模拟宿主只用于本地开发，不进入运行包。

`theme:pack-runtime` 生成的 SHA-256 和资源清单用于完整性校验，不代表主题已获授权。App 仍须完成导入、身份验证及安装策略检查后才运行主题。主题开发 SDK 不提供 APK 签名、服务器授权、任意原生模块加载或跨 App 数据服务。

## 公开资料范围

对外分发 SDK 客户端、标准类型、消息语义、主题模板、合成回放、主题打包工具和本指南。完整 App 源码、原生插件源码、协议驱动、原始帧样本、GATT 细节、厂商命令与校验算法、内部 session 契约、凭证及签名材料不属于开发包。

SDK 的接口定义可以公开。安全边界由 App 的隔离、能力校验和授权执行实现；仅靠隐藏接口名称不能建立安全边界。SDK 不包含底层协议实现，也不承诺阻止其他人独立实现同名接口。
