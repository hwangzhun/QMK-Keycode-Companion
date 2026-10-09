# QMK Keycode Companion / QMK 键码助手

一个纯前端的中英文单键键码查找与生成工具。搜索快捷键或按键功能，复制一个 QMK 表达式，再到 VIA 设置实际键位。采用拉丝铝合金、铬银切边、冰蓝 LCD 和实体按钮风格。

A bilingual, client-side keycode finder and single-key shortcut builder. Find a command, copy its QMK expression, and assign it in VIA. Fonts and dictionaries are bundled locally; no account, backend, or keyboard connection is required.

## 使用 / Workflow

1. 搜索 `Ctrl+V`、`ctrl + v`、`粘贴`、`Volume Up` 或 `KC_ESC`。
2. 结果显示功能名、组合及有效表达式。点击“复制代码”直接复制，或“载入生成器”调整组合。搜索“粘贴”会列出 Windows / Linux 的 `Ctrl+V` 与 macOS 的 `Cmd+V`。
3. 在 VIA 选中需要修改的键位，打开 **Any**，粘贴表达式并确认。例如把原来的 V 键改成 `LCTL(KC_V)`。

Search → Copy → Select the key in VIA → Any → Paste. Each output is one expression, never a whole-keyboard configuration. Shortcut names describe common uses; the host OS and application determine their behavior.

### 单键生成 / Single-key builder

- 默认提供单键与快捷键模式，可选择左右 Ctrl、Shift、Alt、Win / Cmd。载入基础键结果会清空之前的修饰键。
- 支持 `Ctrl+Shift+Esc`、`Cmd+V`、`Alt+F4`、`RCtrl+RShift+A` 等组合；大小写与分隔符旁空格不影响结果。`Ctrl++` 表示 Ctrl 加加号键。
- 常用功能包含复制、粘贴、剪切、撤销、重做、全选、保存、查找；重做分别采用 Ctrl+Y 和 Cmd+Shift+Z。具体系统和应用可能采用不同组合。
- “高级生成”保留层切换、Mod-Tap、Layer-Tap 和键码兼容版本选择。高级参数不依赖键盘型号或键位矩阵。
- 无效表达式不能复制。剪贴板不可用时，代码仍可选中手动复制；搜索结果、生成输出和复制失败提示均提供可选代码。
- 中英文切换保留搜索与生成器参数；仅语言偏好保存在本机。生成器参数和兼容版本不跨刷新保存。旧版 `qmk-companion.project.v1` 数据不读取、不修改。

### 生成规则 / Generator rules

- 默认使用旧版 VIA（协议 12）；高级区域可切换到 QMK 键码 v8 / v9（协议 13）。请按实际固件选择。v8、v9 在固定的上游快照中共用字典，不承诺所有固件年代兼容。
- 符号按 US ANSI 主机布局生成；例如 `KC_PLUS` 输出 `LSFT(KC_EQL)`。
- Mod-Tap / Layer-Tap 的点击键只允许基础键码，不允许 Shift 符号或快捷键。Layer-Tap 为 0–15 层，普通层切换为 0–31 层；目标层必须由实际固件提供。
- 同一组合不能混用左右修饰键，以避免 QMK 静默改变编码。修饰键不能组合媒体等扩展键码。
- 媒体、鼠标、灯光等功能需要固件支持。本工具不连接键盘、不刷写或编译固件，不提供布局编辑、文件导入导出、连续宏及应用专属快捷键库。

The generated expression is validated against the selected dictionary. Tap-hold actions retain QMK's basic-key and layer limits; shifted symbols use the US ANSI host layout. Device firmware determines feature availability. Data sources and licenses are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 本地运行 / Development

使用 Node.js 24（`.nvmrc`）。

```bash
npm ci
npm run dev
```

打开终端显示的地址，通常为 `http://localhost:5173`。

```bash
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

已有 Chrome 时，可使用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome npm run test:e2e`。

## 部署 / Deployment

### GitHub Pages

1. 将项目推送到 GitHub 仓库的 `main` 分支（如使用其他分支，修改 `.github/workflows/pages.yml`）。
2. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
3. 已提供的 workflow 会安装依赖、运行单元及浏览器测试、构建并部署 `dist/`。
4. 使用相对资源路径，无需将仓库名称写死进 Vite；根域名和 `/QMK-Keycode-Companion/` 等子路径均可加载。

Push to `main`, select **GitHub Actions** as your Pages source, and the included workflow will verify and deploy the static build. Relative assets support both repository subpaths and custom domains.

### Cloudflare Pages

- 构建命令 / Build command：`npm run build`
- 输出目录 / Output directory：`dist`
- 根目录 / Root directory：项目根目录 / repository root
- 环境变量 / Environment variable：`NODE_VERSION=24`

连接仓库后使用这些设置即可。也可直接上传 `dist/` 静态构建。网站没有服务器路由或需要设置的 API 密钥。

Use these settings for a Git-connected Pages project, or upload the generated `dist/` directly. No API keys or server routing are required.

## 实现与验证 / Architecture and verification

- React + TypeScript + Vite；纯前端，CSS 金属界面和本地字体。
- `src/core/` 提供共享表达式生成、编码校验、快捷键文本解析、统一搜索结果和剪贴板操作。
- `src/data/` 提供双语基础键目录、常用快捷键预设及固定版本字典。
- 测试覆盖组合解析、平台预设、独立 VIA 解析器交叉校验、桌面和手机复制流程、失败回退、语言切换、旧存储保护和 Pages 子路径资源。
- 浏览器测试与表达式校验不能代替实际键盘固件验证。

GPL-3.0. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
