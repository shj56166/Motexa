# 贡献与问题反馈

请先阅读 [公开范围](docs/zh-CN/overview.md) 和 [许可](LICENSE.md)。示例源码可按其 MIT 范围修改；SDK、参考清单和文档不因贡献流程而变更许可。

反馈问题时附上 SDK/API/Demo 版本、Node/pnpm 版本、浏览器或 WebView 版本、重现步骤、调试器模式及场景。只使用合成数据制作复现，不要上传设备凭证、真实骑行记录、App 内部日志或私有协议资料。

提交示例修改前运行 `pnpm release:build`；只修改文档时运行 `pnpm docs:build`。新增文档同步提供中英文并更新 `docs/navigation.json`。调试器只负责主题表现和公共消息接口，不加入设备连接或 App 私有桥接。
