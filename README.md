# Motexa 骑行 · Motexa Ride

面向电动两轮车的 Android 车辆数据与骑行工具。连接兼容的保护板、控制器、车辆和充电器，在同一个 App 中查看实时状态、使用骑行仪表、记录轨迹与能耗，并管理仪表主题。

[Motexa 官网](https://motexa.top) · [App 下载](https://motexa.top/download) · [App Release](https://github.com/shj56166/Motexa/releases/tag/v2.7.0) · [开发文档](https://motexa.top/docs/developers) · [SDK + Demo](developers/ride-ui-sdk/README.md)

本仓库提供 App 发布文件、项目介绍和公开的仪表主题 SDK + Demo，**不包含 Motexa App、服务端或底层设备协议实现的项目源码**。Demo 示例源码可以用于开发主题；其 MIT 许可范围见开发包内的 [LICENSE.md](developers/ride-ui-sdk/LICENSE.md)。

## 功能一览

| 功能 | 支持内容 |
| --- | --- |
| 首页与设备状态 | 电池、控制器和车辆数据概览，连接状态、异常提示及数据有效性展示 |
| 电池与电芯 | 总电压、电流、SOC、功率、容量、温度、充放电 MOS、单体电压、最高/最低电芯、压差、均衡与保护状态；字段随设备变化 |
| 控制器与车辆 | 读取兼容设备的速度、电压、电流、功率、温度、油门、挡位、故障及设备参数；车辆电量、续航和里程等按设备能力展示 |
| 充电器 | HW 速充连接与登录，输入/输出电压、电流、功率、温度、充电时间及电量统计；兼容设备可设置电压/电流及控制输出，显示设备确认结果 |
| 设备管理 | 按保护板、控制器、车辆、充电器分类扫描与连接，记忆设备、协议及连接资料，车辆分组、常用设备切换和断线恢复 |
| 实时骑行仪表 | 速度、功率、距离、能耗、效率、续航与连接提示，横竖屏显示，内置 SU7 Ultra、Race LED Pro 等主题 |
| 仪表自定义 | 指标选择、卡片布局、配色和背景图片；主题版本管理，文件/局域网导入、扫码获取地址、安装前预览及主题自带设置页 |
| Android 悬浮骑行 | 在其他应用上方显示骑行数据，设置大小、指标、位置及深浅色；需要系统悬浮窗权限 |
| 骑行记录 | 前台/后台记录、历史详情、地图与轨迹、3D 轨迹预览、记录导出、回收站与短骑行整理 |
| 加速测试 | 加速成绩记录、历史详情与 CSV/JSON 导出；结果受 GPS、设备数据和测试条件影响 |
| 能耗统计 | 历史骑行能耗趋势、平均能耗、净耗电与能量回收统计、容量及续航估算；缺少有效测量数据时标记不可用 |
| 极核投屏 | 扫码配对兼容车机，跟随仪表主题或手机屏幕投屏，方向和画质设置、连接诊断及自定义车机壁纸 |
| 骑行榜与加速榜 | 用户与单次成绩浏览、搜索和条件筛选，今日/本周/本月/今年范围及我的记录；联网和账号能力由服务端提供 |
| 账号与车辆资料 | 登录、注册、账号找回、账号安全、设备管理与车辆资料 |
| 备份与恢复 | Android 原生备份包导出、导入及按模块恢复，覆盖设置、骑行与加速记录等内容 |
| 数据与外观设置 | 数据来源、轮周与速度校准、即时/平滑速度、蓝牙刷新、超时显示、低性能模式、参数卡片与悬浮指标；深浅色、跟随系统和中英文界面 |
| 诊断与反馈 | GPS 诊断、蓝牙和运行日志、诊断包导出及问题反馈 |
| 应用更新 | 稳定版/Beta 分渠道检查更新、更新说明与 APK 下载；保留 GitHub 更新策略及历史发布入口 |

设备参数读取和修改按具体协议、设备能力与 App 权限开放，不能据此推断所有型号都能调参。明唐保护板提供参数修改、保存确认及历史/事件导出等能力；其他设备以实际界面为准。仪表“参数卡片设置”用于调整显示内容。

Beta 的协议测试中心（含极核测试）用于连接诊断。会员中心由配置决定是否开放；私有硬件/伴侣设备功能默认关闭，不属于普通安装包的已开放功能。已移除设置页的“骑行社区”入口，排行榜仍从骑行页进入。

## 已接入设备

以下按当前 App 的连接选项与生产设备注册表整理（2026-10-14）。“已接入”表示存在对应连接与数据展示实现，实际兼容范围仍受型号、固件、蓝牙模块及认证要求限制。

### 保护板与电量模块

| 品牌/系列 | 支持范围 |
| --- | --- |
| ANT / 蚂蚁 BMS | 新协议、旧协议，按设备保存默认或备用连接通道 |
| JK / 极空 BMS | JK04、JK02 24S、JK02 32S 协议系列 |
| JBD / 嘉佰达 BMS | 兼容的 BLE 保护板 |
| 彦阳保护板 | 已接入系列，手动选择对应协议 |
| 陆行模块 | EM02 电量模块，手动选择对应协议 |
| 明唐保护板 | 实时数据、参数与历史/事件能力按设备返回结果提供 |
| 蓝宝模块 | 电量模块，手动选择对应协议 |

### 控制器

连接前选择准确型号；相似的蓝牙名称不保证协议相同。

| 品牌/系列 | 品牌/系列 |
| --- | --- |
| 蓝石 / BlueStone 300 | 远驱 / FarDriver BLE |
| 远驱 YuanQu FOC（含按设备保存的兼容模式） | 凌博 / Lingbo BLE |
| 大泰 / Datai | 速牛 / Suniu |
| 雁鑫 / Yanxin VITMC（含 X500 密码连接） | APT A8 |
| APT 旧版 | 顿恩 / DN Dunen |
| 智科 / Zhike | AUSI |
| 晶汇 / JH | 甲胄动力 / Jiazhou |
| 昕达动能 / Xinda | 好盈 / Hobbywing SPD |

### 车辆、车机与充电器

| 类型 | 接入与限制 |
| --- | --- |
| 极核 / ZEEHO / CFMOTO 车辆 | 独立连接及官方 App 辅助读取模式；显示实际可用的车辆数据，挡位与 P 状态仅在设备提供有效值时展示 |
| 九号 / Ninebot 车辆 | 已实现部分二代加密协议连接，包括 MMAX90 兼容入口；需联系开发者核对车型与连接条件。V3 和旧协议暂不支持，MMAX90 挡位/P 状态尚未验证 |
| 极核车机投屏 | 面向具备对应投屏能力的车机；App 提供 AE5/AE5i 等兼容选项，不能据此推断极核全部车型均支持 |
| HW 速充 | 已接入蓝牙充电器系列，需正确登录凭据；不提供 Wi-Fi 配置、凭据修改、校准或固件升级 |

## 安装与首次连接

1. 从 [Motexa 官网](https://motexa.top) 或对应的 [App Release](https://github.com/shj56166/Motexa/releases/tag/v2.7.0) 获取 APK。Android 最低版本为 7.0（API 24）；核对发布页的版本与摘要后安装。
2. 首次启动完成引导，并按使用需要允许蓝牙、定位和通知权限。部分 Android 版本扫描 BLE 需要定位权限及系统定位服务。
3. 在“设置 → 设备连接”选择设备类别；控制器先选择准确型号，保护板选择自动或对应协议，车辆选择匹配的连接模式。
4. 确认设备已通电，原厂 App 或其他工具未占用连接，再扫描并连接。官方 App 辅助模式按照页面引导操作。
5. 在设备页核对数据，再进入骑行页选择仪表、记录或加速测试。后台记录、悬浮窗及屏幕投屏分别需要对应的系统权限。

扫描不到设备时，检查蓝牙、权限、距离和设备占用；连接成功但无数据时，检查型号/协议选择，必要时导出诊断包并反馈。

## SDK + Demo：开发自己的仪表主题

**SDK 1.5.0 · 消息 API 1.11 · Demo 0.2.0**

开发运行在 **Motexa App 内**的 Web 仪表主题。开发包包含编译后的 SDK、TypeScript 类型、Vue/TypeScript 示例源码、合成数据浏览器调试器、校验/打包工具和中英文文档。开发和浏览器预览无需 App 项目源码；真实车辆数据由 App 主题宿主提供，SDK 不提供独立第三方 App 的车辆连接入口。

- [在线开发文档](https://motexa.top/docs/developers) · [在线合成数据调试器](https://motexa.top/developers/debugger/mock-host.html)
- [开发包源码与指南](developers/ride-ui-sdk/README.md)：公开 SDK + Demo 文件，便于查看和修改示例。
- [SDK + Demo 开发 ZIP](developers/downloads/Motexa-Ride-UI-SDK-1.5.0-GitHub.zip)：可独立解压开发。
- [完整交付 ZIP](developers/downloads/Motexa-Ride-UI-SDK-1.5.0-GitHub-Release.zip)：开发包、浏览器构建、文档站和 Demo。
- [Demo 安装包](developers/downloads/partner.example-dashboard-0.2.0-web-default.ride-ui-runtime.zip)：导入 Motexa App，**不是 APK**。
- [静态文档站](developers/downloads/Motexa-Ride-UI-SDK-1.5.0-Docs-Site.zip) · [版本及 SHA-256 清单](developers/downloads/release.json)

需要 Node.js 22.12+、pnpm 10.33.2。在克隆本仓库后运行（Windows 可使用 `pnpm.cmd`）：

```sh
cd developers/ride-ui-sdk
pnpm install --frozen-lockfile
pnpm dev
```

打开终端给出的 `/mock-host.html` 调试器，修改 `theme/src/` 开发主题。`pnpm release:build` 完成检查、构建及打包。App 导入运行包还需要身份、安装授权及兼容性检查；本次构建校验不代表 Demo 已完成真机安装验收。

开发包不包含 App/服务端源码、原生插件、设备协议驱动、真实骑行记录、原始设备帧、私钥或签名材料。SDK 提供标准数据订阅及受控展示交互。示例的 MIT 许可不扩展到 SDK、参考清单、SDK 文档或 App；第三方依赖保留各自许可。

## GitHub 更新兼容

稳定版与 Beta 的历史更新检查地址保持可用：

- [稳定版 version.json](https://raw.githubusercontent.com/shj56166/Motexa/HEAD/version.json)
- [Beta version.beta.json](https://raw.githubusercontent.com/shj56166/Motexa/HEAD/version.beta.json)

更新策略、公钥、根目录 APK 和已有 Release 资源继续用于原有 App 更新流程。SDK 位于独立目录，其发行版标记为预发布，不替代 App 的 Latest Release。旧版 App 可继续通过原 GitHub 地址检查更新。

## English

Motexa Ride is an Android app for electric two-wheelers. Connect compatible battery management systems, controllers, vehicles and chargers; view live telemetry, use configurable dashboards, record rides and acceleration tests, and review routes and energy use.

[Official website](https://motexa.top) · [App release](https://github.com/shj56166/Motexa/releases/tag/v2.7.0) · [Developer docs](https://motexa.top/docs/developers) · [SDK and demo](developers/ride-ui-sdk/README.md)

Features include cell voltages and balancing/protection status, controller and vehicle telemetry, HW charger readings and supported output controls, remembered connections and vehicle groups, SU7 Ultra/Race LED Pro dashboards, theme import and settings, Android ride overlays, background recording, history and exports, maps and 3D routes, acceleration records, energy/range estimates, compatible ZEEHO head-unit casting and wallpapers, rankings, account/vehicle profiles, backup/restore, display/data-source settings, GPS diagnostics, feedback and channel-specific updates. Available readings and parameter changes depend on each device. Protocol testing is a Beta feature; membership is configuration-dependent and private companion hardware is disabled by default.

| Category | Integrated families |
| --- | --- |
| BMS / meters | ANT new/legacy; JK04, JK02 24S/32S; JBD; Yanyang; Luxing EM02; MingTang; Bluebabe |
| Controllers | BlueStone 300; FarDriver BLE; YuanQu FOC; Lingbo; Datai; Suniu; Yanxin VITMC/X500; APT A8; legacy APT; DN Dunen; Zhike; AUSI; Jinghui/JH; Jiazhou; Xinda; Hobbywing SPD |
| Vehicles | ZEEHO/CFMOTO independent and official-app-assisted modes; selected Ninebot second-generation encrypted profiles including an MMAX90 compatibility entry |
| Casting | Compatible ZEEHO head units; AE5/AE5i options do not imply support for every vehicle model |
| Chargers | Compatible HW fast chargers with device credentials; no Wi-Fi configuration, credential modification, calibration or firmware upgrade |

Integration is protocol-family based and does not guarantee every model or firmware. Ninebot V3 and legacy profiles are not supported; MMAX90 gear/parking states remain unverified. Android 7.0+ is required; Bluetooth, location, background recording, overlays and screen casting need their respective permissions.

The **Ride UI SDK 1.5.0 / API 1.11 / Demo 0.2.0** includes a compiled SDK, public types, Vue/TypeScript example source, a synthetic browser debugger, bilingual docs and packaging tools. Use `cd developers/ride-ui-sdk`, `pnpm install --frozen-lockfile`, then `pnpm dev`; build with `pnpm release:build`. The runtime demo is an App-importable theme package, not an APK. Real data comes from the Motexa App host; the SDK is not a standalone vehicle driver. Build verification does not imply verified installation on a physical phone.

This repository does not publish the Motexa App/backend source, native protocol implementations, credentials or signing keys. The demo's scoped MIT license does not relicense the SDK or App. Existing `version.json`, `version.beta.json`, update public keys, APKs and historical release assets remain in place for older App clients. SDK releases are prereleases and do not replace the latest App release.
