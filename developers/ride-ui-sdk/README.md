# Motexa Ride UI SDK + 浏览器调试器

开发运行在 **Motexa App 内**的仪表主题。App 将车辆数据转换成标准展示数据，主题使用 SDK 订阅数据并请求宿主允许的交互动作。

**SDK 1.5.0 · 消息 API 1.11 · Demo 0.2.0**

本仓库包含编译后的 SDK、Vue / TypeScript 示例源码、合成数据调试器、主题校验与打包工具、中英文 Markdown 文档。无需 App 源码即可开发和预览。真实数据由 App 主题宿主提供；独立第三方 App 不能用此 SDK 读取车辆。

## 开始开发

需要 Node.js 22.12+ 和 pnpm 10.33.2。Windows 终端可将 `pnpm` 替换为 `pnpm.cmd`。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

浏览器打开终端显示的地址并进入 `/mock-host.html`。修改 `theme/src/` 开发主题；创建自己的主题时同步修改 `theme/ride-ui.json` 和 `theme/submission.json` 中的身份。不要只打开 `index.html`：主题需要宿主握手和数据。

## 文档

| 中文 | English |
| --- | --- |
| [SDK 与公开范围](docs/zh-CN/overview.md) | [SDK overview](docs/en-US/overview.md) |
| [快速开始](docs/zh-CN/quick-start.md) | [Quick start](docs/en-US/quick-start.md) |
| [浏览器调试器](docs/zh-CN/debugger.md) | [Browser debugger](docs/en-US/debugger.md) |
| [数据与客户端 API](docs/zh-CN/api.md) | [Data and client API](docs/en-US/api.md) |
| [主题清单与设置](docs/zh-CN/theme-config.md) | [Manifest and settings](docs/en-US/theme-config.md) |
| [构建与 App 安装](docs/zh-CN/build-install.md) | [Build and App installation](docs/en-US/build-install.md) |
| [GitHub 发布与常见问题](docs/zh-CN/publishing.md) | [GitHub publishing and FAQ](docs/en-US/publishing.md) |

`docs/` 是文档内容的唯一维护入口，同一份 Markdown 可在 GitHub 阅读、生成 GitHub Pages，也由 Motexa 官网开发文档页读取。

## 构建交付

```sh
pnpm release:build
pnpm docs:preview
```

`dist/docs-site/` 是可部署到任意静态网站子目录的文档站，内含在线调试器和 Demo 下载。预览地址为 `http://127.0.0.1:5188/`。

`dist/release/` 提供 GitHub 源码 ZIP、包含构建产物的完整交付 ZIP、Demo 的 `*.ride-ui-runtime.zip`、摘要和版本清单。Demo 安装包导入 Motexa App，**不是独立 APK**。构建和校验不代表已通过 App 授权或真机验证。

## 目录

```text
theme/                  示例源码、主题清单和配置 schema
mock-host.*             浏览器合成数据宿主 / 调试器
mock-config.ts          调试器内存配置存储
vendor/ride-ui-sdk/      已编译 SDK、类型声明和公共工具
reference/              公开 Web 主题清单参考
docs/                   中英文文档和导航清单
tools/                  校验、构建、文档站与发布包工具
.github/workflows/      持续集成与可手动启用的 Pages 部署
```

## 许可与边界

[LICENSE.md](LICENSE.md) 中的 MIT **只覆盖示例代码与示例工具**。它不覆盖 `vendor/`、`reference/`、SDK 文档或 Motexa App。SDK 作为开发接口交付，本仓库没有将整个 SDK 重新授权为 MIT。[第三方声明](THIRD-PARTY-NOTICES.md) 保留依赖各自的许可。公开可见不等同于全部内容都采用开源许可。

SDK 提供标准数据和受控展示交互，当前不是严格只读。仓库不包含 App 源码、原生实现、底层协议文档、原始设备帧、私钥或签名材料。设备连接、车辆命令、权限、数据持久化和安装授权由 App 管理。

## English

This development kit builds dashboard themes hosted **inside the Motexa App**. It includes a compiled SDK, a Vue/TypeScript example, a synthetic browser debugger, validation/packaging tools, and bilingual documentation. Run `pnpm install --frozen-lockfile`, then `pnpm dev`. Run `pnpm release:build` to produce standalone source and delivery archives, a static documentation site, and an App-importable demo package.

The scoped MIT license covers the example only. It does not relicense the SDK, SDK documentation, or the App. The debugger uses synthetic data and does not connect to hardware. See the [English overview](docs/en-US/overview.md).
