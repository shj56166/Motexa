# 构建与 App 安装

构建提供三类产物：开发预览、可供 App 导入的主题运行包，以及包含 SDK / 示例 / 文档的公开发布包。**主题运行包不是 Android APK。**

## 常用命令

| 命令 | 结果 |
| --- | --- |
| `pnpm theme:check` | 校验清单与主题源码规则 |
| `pnpm typecheck` | 检查 Vue / TypeScript 类型 |
| `pnpm theme:replay-check` | 检查六种合成回放 |
| `pnpm theme:build` | `dist/development/`，含浏览器调试器 |
| `pnpm theme:pack-runtime` | `dist/runtime-web/` 与主题运行 ZIP、完整性 JSON |
| `pnpm theme:runtime-check` | 校验运行 ZIP 资源和摘要 |
| `pnpm theme:pack` | 旧源码审阅 ZIP，不能安装 |
| `pnpm docs:build` | 静态文档站，需要已有开发构建和运行 ZIP |
| `pnpm release:build` | 完整构建、检查、文档站与发布打包 |

## Demo 安装产物

```sh
pnpm theme:pack-runtime
pnpm theme:runtime-check
```

示例输出 `dist/partner.example-dashboard-0.2.0-web-default.ride-ui-runtime.zip`。邻接 `.integrity.json` 记录 ZIP 和包清单摘要；完整发布另提供 `.sha256`。运行包只含编译后的主题资源、清单、配置与许可，不含浏览器调试器或主题源码。

构建时资源名、尺寸和逐文件 SHA-256 都进入清单。SHA-256 验证文件是否变化，不表示发布者身份已获 App 认可。运行包构建工具不签名、不安装、不授予权限。

## 在 App 内导入

将 `*.ride-ui-runtime.zip` 交给 Motexa App 的骑行主题导入入口，按 App 的预览、验证和启用流程操作。不同版本的入口可能不同，以 App 当前界面为准。首次导入需要满足 App 联网验证与安装策略；不修改 App 以绕过验证。

也可以通过同一局域网导入：

```sh
pnpm theme:serve-runtime -- --bind 0.0.0.0 --port 5189
```

电脑浏览器打开 `http://127.0.0.1:5189/`，选择与手机同网段的 IPv4 地址或二维码。手机在 App 主题页选择“从内网获取”，扫描或粘贴 URL。服务只分发该运行 ZIP，二维码传递地址，安装仍由 App 处理。

手机无法访问时检查同一局域网、电脑防火墙、网卡地址和端口。模拟宿主不需要开放局域网；只在需要手机获取安装包时使用 `0.0.0.0`。

## 发布包

```sh
pnpm release:build
```

`dist/release/` 包含：

- `Motexa-Ride-UI-SDK-1.5.0-GitHub.zip`：独立仓库源码、编译 SDK、文档、CI 与 Pages 工作流。
- `Motexa-Ride-UI-SDK-1.5.0-GitHub-Release.zip`：上述源码以及浏览器构建、运行文件、文档站和 Demo 安装包。
- `Motexa-Ride-UI-SDK-1.5.0-Docs-Site.zip`：可直接部署的静态文档站，含调试器与 Demo 下载。
- Demo `*.ride-ui-runtime.zip` 与 `.integrity.json`。
- 逐产物 `.sha256` 和 `release.json`。

ZIP 内 `SDK-CONTENTS.sha256.json` 校验解压后的逐文件摘要，不包含自身。发布器采用明确的目录和文件范围，不把当前工作目录全部压缩。

自动验证覆盖类型、清单、合成回放、资源与摘要。手机和车机的安装、布局、性能及宿主能力必须另行实测；浏览器通过不代表真机验收完成。
