# 键盘 / QMK / 鼠标 SDK 文档

VitePress 站点，覆盖：

| SDK | 路径 | npm |
|---|---|---|
| `@rdmctmzt/sdk-keyboard` | `/keyboard/` | [npm](https://www.npmjs.com/package/@rdmctmzt/sdk-keyboard) |
| `@rdmctmzt/sdk-qmk` | `/qmk/`（含 [VIA JSON 处理](/qmk/via-json)） | [npm](https://www.npmjs.com/package/@rdmctmzt/sdk-qmk) |
| `@rdmctmzt/sdk-mouse` | `/mouse/` | [npm](https://www.npmjs.com/package/@rdmctmzt/sdk-mouse) |

源码仓库：[sdk-keyboard](https://github.com/rdmctmzt/sdk-keyboard)  
在线文档：https://rdmctmzt.github.io/keyboard-docs/  
Demo：https://www.rdmctmzt.com/demoTool/

## 本地开发

```bash
pnpm install
pnpm dev
pnpm docs:build
pnpm selftest:qmk   # QMK 公开 API ↔ 文档
pnpm selftest       # 三包 SDK + 文档 + 上线风险（读 Demo/node_modules）
pnpm selftest:all
```

SDK 源码默认相对路径：`../sdk-keyboard`；自测默认读 `../Demo/node_modules` 已安装包。
