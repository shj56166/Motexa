# 数据与客户端 API

公共类型以包内 `vendor/ride-ui-sdk/dist/client.d.ts`、`contract.d.ts` 为准；完整遥测键见导出的 `RIDE_UI_TELEMETRY_KEYS_V1`。主题运行时代码只导入 `client` 和 `contract`，`replay` 仅供开发调试。

## 客户端生命周期

```ts
import { createRideUiClient } from '@motexa/ride-ui-sdk/client'
import type { RideUiInitContextV1 } from '@motexa/ride-ui-sdk/contract'

const client = createRideUiClient('partner.example-dashboard')
let context: RideUiInitContextV1 | null = null
client.subscribeContext(next => { context = next })
client.subscribeDisplayFrame(frame => {
  const text = frame.speedKmh == null ? '--' : frame.speedKmh.toFixed(0)
  console.log(text, frame.state)
})
client.ready()

async function refresh() {
  if (!context?.capabilities.includes('ride.refresh')) return
  const result = await client.requestAction('ride.refresh')
  if (!result.ok) console.log(result.error?.code)
}

// 页面或组件卸载时调用 client.dispose()。
```

一个主题实例使用一个客户端。订阅方法返回取消订阅函数。SDK 处理 `theme.ready` → `host.init` 的握手和后续消息会话；不要自行复刻桥接。会话标识仅用于消息隔离。

| 方法 | 用途 |
| --- | --- |
| `ready()` | 通知宿主主题已准备好 |
| `subscribeContext(listener)` | 模式、语言、配色、安全区域、能力、配置与初始快照 |
| `subscribeSnapshot(listener)` | 完整场景和标准遥测快照 |
| `subscribeFrame(listener)` | 高频速度、功率和部分遥测 |
| `subscribeDisplayFrame(listener)` | 宿主速度显示帧 |
| `requestAction(action, payload?)` | 返回宿主动作结果的 Promise |
| `reportError(error)` | 向宿主报告主题错误 |
| `dispose()` | 释放监听和待处理请求 |

## 数据字段与缺失值

`snapshot.telemetry[key]` 是 `RideUiMetricValueV1`：

| 字段 | 使用方法 |
| --- | --- |
| `value` / `canonicalUnit` | 数值与计算单位；`null` 表示不可用 |
| `displayValue` / `displayUnit` | 宿主格式化文本和展示单位 |
| `source` | gps、bms、controller、vehicle、fused 或 none |
| `quality` | measured、fused、held、estimated 或 missing |
| `freshness` | fresh、stale 或 unavailable |
| `sampledAtEpochMs` | 样本墙上时钟时间，可能为 null |
| `ageMs` / `timeMappingQuality` | 可选的新鲜度和时间映射信息 |
| `sourceRef` 等来源元数据 | 不透明标识，不解释为设备地址或可调用会话 |
| `estimateMeta` | 可选估算语义、状态和覆盖信息 |

普通文本优先用展示字段，图形计算用数值。`null` 不能补成 0，过期或估算值不能冒充实时测量。常见键包括 `speed`、`soc`、`power`、`busCurrent`，其他字段按契约读取；每个设备只会提供它实际支持的子集。

## 挡位与 P 状态（API 1.11）

这两个状态通过 `subscribeSnapshot` 接收，不属于高频快帧。它们没有单位，且相互独立：车辆处于 P 时仍可以选定低／中／高挡。

| 键 | 数值含义 |
| --- | --- |
| `vehicleGear` | 1＝低挡、2＝中挡、3＝高挡；未知或缺失为 `null` |
| `vehicleParking` | 1＝处于 P、0＝解除 P；未知或缺失为 `null` |

极核／ZEEHO 已提供这两个状态。九号 MMAX90 的实时挡位和 P 映射尚未验证，返回 `null`、`quality: 'missing'`、`freshness: 'unavailable'`；零车速不能用来推断 P。旧 API 1.x 宿主缺少新字段时，SDK 同样补齐为不可用。

```ts
client.subscribeSnapshot(snapshot => {
  const gear = snapshot.telemetry.vehicleGear
  const parking = snapshot.telemetry.vehicleParking
  const gearText = gear?.freshness === 'fresh' && gear.value != null
    ? ({ 1: '低挡', 2: '中挡', 3: '高挡' } as Record<number, string>)[gear.value] ?? '--'
    : '--'
  const parkingText = parking?.freshness === 'fresh' && parking.value != null
    ? parking.value === 1 ? 'P' : '已解除 P'
    : '--'
  console.log(gearText, parkingText)
})
```

不要用真值判断过滤 `0`。字段保留原始来源和采样时间；电池更新不会使旧状态重新变成 fresh。陈旧状态可以用于历史提示，但不能当作当前状态。预览器的 **Vehicle gear / parking states** 场景依次展示六种组合、未知挡位、陈旧与不可用状态，也支持手动调整。

## 速度显示帧

收到 `subscribeDisplayFrame` 回调后，速度数字、指针和进度条使用 `frame.speedKmh`，**包括 null**。显示值为空时不要回退到 `telemetry.speed`。`frame.state` 为 `live`、`held` 或 `missing`。

`telemetry.speed` 保持测量语义。不要在主题中叠加第二次平滑。速度小数可用 `resolveRideUiSpeedPrecision(context.speedDecimalEnabled, hideSpeedDecimal)` 计算。显示帧中的序号和单调时间可用于动画顺序，不要仅靠墙上时钟判断先后。

## 能力和动作

`context.capabilities` 决定当前允许请求的动作，`context.environment?.dataCapabilities` 描述数据能力。清单的 `requiredCapabilities` / `optionalCapabilities` 是声明，不是授权。

| 动作 | 意图 |
| --- | --- |
| `ride.request-exit` / `ride.refresh` | 请求退出或刷新 |
| `display.set-orientation` | 请求方向，payload 为 `{ mode: 'portrait' }` 或 `{ mode: 'landscape' }` |
| `theme.open-picker` / `theme.open-settings` | 打开宿主主题选择或设置 |
| `theme.config-patch` | 提交版本化主题设置，见设置指南 |
| `vehicle.open-settings` | 请求宿主打开设置界面，不授予车辆参数写入权 |
| `dynamics.recalibrate` / `ride.black-screen-lock` | 请求宿主处理校准或锁屏 |
| `feedback.haptic` / `preview.metrics-reorder` | 宿主声明支持时请求触感或预览排列 |

列表描述动作名称，不代表所有宿主、所有模式均可用。除有明确 payload 示例的动作外，参数以公共类型和宿主支持范围为准，不自行猜测。

动作结果含 `requestId`、`ok`、可选 `result` 和 `error`。失败码包括 `denied`、`unavailable`、`invalid`、`conflict`、`timeout`、`failed`。失败后保持 UI 与宿主实际状态一致，不显示虚假的成功状态。

## 兼容性

清单声明 API 主版本和最低次版本。API 1.x 内容忍未知可选字段，访问可选 `environment` 时使用空值保护。新功能先检查能力。SDK 包版本不能代替宿主实际 API 和能力判断。

更多设置流程见 [主题清单与设置](theme-config.md)，运行规则见 [构建与 App 安装](build-install.md)。
