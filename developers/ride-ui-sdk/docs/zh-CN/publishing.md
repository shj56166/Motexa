# GitHub 发布与常见问题

发布的是独立 SDK 开发仓库，不是整个 Motexa App 工程。根目录 README、双语文档、示例、SDK、CI 和 Pages 工作流均已准备。

## 创建仓库

1. 解压 `Motexa-Ride-UI-SDK-1.5.0-GitHub.zip`，进入解压目录。
2. 在 GitHub 创建空仓库；使用该目录初始化并提交。不要从完整 App 工程目录推送。
3. 本地先执行 `pnpm install --frozen-lockfile` 与 `pnpm release:build`，确认构建通过。
4. 推送后查看 CI 结果，发布 Release 时上传 `dist/release/` 中的交付包、Demo 和摘要。

远程地址和仓库名由维护者确定，文档不预设不存在的链接。发布标签可使用 `sdk-v1.5.0`；Demo 有独立版本，发行说明同时列出 SDK、API 与 Demo 版本。

## GitHub Release 说明模板

```text
Motexa Ride UI SDK 1.5.0 / API 1.11 / Demo 0.2.0

包含：公共 SDK、Vue/TypeScript 示例、合成数据浏览器调试器、
主题打包与校验工具、中英文开发文档。

GitHub.zip：独立仓库源码。
GitHub-Release.zip：源码 + 浏览器构建 + 文档站 + Demo 运行包。
*.ride-ui-runtime.zip：供 Motexa App 导入，不是 APK。
摘要见各 .sha256 与 release.json。

示例代码按 LICENSE.md 指定范围采用 MIT。
SDK、参考清单、SDK 文档和 App 不在该 MIT 范围内。
构建校验已完成；真机验证状态应按本次实际结果填写。
```

## 将文档用在网站

`docs/zh-CN/` 与 `docs/en-US/` 是内容来源，`docs/navigation.json` 定义导航。文档相对链接在 GitHub 可直接阅读，网站构建会转换为对应页面地址。

```sh
pnpm release:build
pnpm docs:preview
```

静态站输出到 `dist/docs-site/`，不依赖后端，使用相对资源路径，可部署在域名根目录或子目录。含语言切换、文章导航、目录、合成调试器和 Demo 下载。

也可直接解压发布产物 `Motexa-Ride-UI-SDK-1.5.0-Docs-Site.zip`，将其中的站点内容部署到静态服务器。若服务器设置 CSP，在线调试器需要允许自包含预览页面的内联脚本与样式；主题仍保持 `allow-scripts` 沙箱。

GitHub Pages：在仓库 Settings → Pages 选择 GitHub Actions，再手动运行 `Deploy developer docs to Pages` 工作流。CI 只构建，不自动发布；Pages 工作流需要维护者主动启动。

Motexa 官网从同一 `docs/` 读取正文，在 `/docs/developers` 和 `/docs/developers/:slug` 展示。官网构建前同步公开调试器和发布产物，维护流程见官网 README。不要修改生成的 HTML 或在网站中复制另一份 Markdown。

## 许可常见问题

**仓库是否全部 MIT？** 不是。MIT 只覆盖根目录许可列明的示例代码和示例工具。公开可见的 SDK、参考资料和文档没有因此改为 MIT。不要在 GitHub 创建仓库时额外添加覆盖整个项目的 MIT LICENSE。

**能否独立接入车辆？** 此 SDK 没有该入口。真实数据由 App 内主题宿主提供。

**是否严格只读？** 当前包含受控交互动作；车辆连接、参数写入和权限由 App 管理。

**调试器会带入用户数据吗？** 场景是合成数据；反馈问题时不要附真实骑行记录、设备凭证或内部日志。

**摘要正确就能安装吗？** 摘要只证明文件完整性，App 还要处理身份、授权、兼容性和安装策略。

**需要公开原生协议文档吗？** 不需要。仅维护标准展示契约、示例和主题开发指南，内部 App 与原生协议资料不在发布范围。
