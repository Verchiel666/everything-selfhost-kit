# everything-selfhost-kit

在**受限环境**里构建并自托管 [HeyPuter/everything](https://github.com/HeyPuter/everything)（用 AI 重写的浏览器版 Office / Photoshop / AutoCAD / 3D，51 个应用，MIT）的一套小脚本。

> 场景来源：一台 Android 手机上——没有 git 二进制、`github.com` 不通、系统禁止执行应用目录里的任何文件（`node_modules/.bin/*` 直接 `EACCES`）。上游的构建说明默认你在正常 Linux/macOS 上，这些坑没人写过，所以记在这里。

**非官方项目**，与 Puter 无关。上游代码 MIT，本仓库只包含脚本与文档。

---

## 快速开始

```sh
# 1) 取源码（走 tarball：1.3 GB 的仓库 clone 太慢，受限环境下也没 git）
EVERYTHING_ROOT=~/everything sh scripts/fetch-source.sh

# 2) 构建想要的 app（可以一次多个）
EVERYTHING_ROOT=~/everything SITE_DIR=~/site \
  sh scripts/build-apps.sh spreadsheet documents notes

# 3) 起本地服务（零依赖，带跨应用资源回退）
node scripts/serve.mjs ~/site 8080 0.0.0.0     # → http://127.0.0.1:8080/
```

没有系统 npm？`sh scripts/bootstrap-npm.sh`（只要 node + curl）。

## 里面有什么

| 文件 | 作用 |
|---|---|
| `scripts/fetch-source.sh` | 用 codeload tarball 取上游源码，解压到 `EVERYTHING_ROOT` |
| `scripts/build-apps.sh` | 批量构建：装依赖 → worker 构建 → 主构建 → 拷进站点目录 |
| `scripts/serve.mjs` | 零依赖静态服务器：SPA 回退 + **跨应用资源回退**（见坑 4）+ 404 日志 |
| `scripts/gen-launcher.mjs` | 扫描站点目录生成单文件中文启动页（分类 / 搜索 / 自动抓图标） |
| `scripts/bootstrap-npm.sh` | 在没有系统 npm 的机器上用 node 自举 npm |
| `docs/BUILD-NOTES.md` | 4 个真实坑：报错原文、原因、绕过办法、谁会踩到 |
| `workflows/pages.yml` | 构建指定 app 并部署 Pages 的工作流**模板**（见 [workflows/README.md](workflows/README.md)，需一步手动启用） |

## 四个坑（详情见 [docs/BUILD-NOTES.md](docs/BUILD-NOTES.md)）

| # | 症状 | 谁会遇到 |
|---|---|---|
| 1 | `dlopen failed: cannot locate symbol "napi_get_cb_info"`（lightningcss） | 嵌入式 / 非标准 node 运行时 |
| 2 | `Cannot find module @rollup/rollup-android-arm64`、`napi_get_undefined` | 同上（Vite 7 的 Rollup 原生插件） |
| 3 | 页面全白，`/assets/*.js` 404 | **任何人**把 app 放到域名子路径时（vue 配置缺 `base: './'`） |
| 4 | `WebAssembly ... Incorrect response MIME type` | **任何人**在子路径托管 photo-studio / whiteboard |

1、2 是"运行时缺 NAPI 符号"一类，换 WASM 版依赖或升级到 Vite 8（Rolldown）即可；3 用 `base: './'` 覆盖配置；4 用本仓库带跨应用回退的 `serve.mjs`，或把 app 部署在域名根路径。

## 用 GitHub Actions 代替本地构建

```sh
# 仓库 Actions 里手动触发，填要构建的 app（逗号分隔）
Actions → "Build apps and deploy to Pages" → Run workflow → apps: spreadsheet,documents
```

工作流自己下上游 tarball、装依赖、构建、生成启动页、部署 Pages。在正常 Linux runner 上不存在坑 1/2，脚本仍然可用。

## 注意

- 上游是活跃的实验项目，架构随时会变；本脚本只依赖"每个 app 目录自带 `package.json` + `vite.config.js`"这一约定。
- 浏览器数据默认存本地（IndexedDB/localStorage），清站点数据会丢；跨设备要登录 Puter 账号。
- CAD 应用自己标注 early alpha，别当唯一数据副本。
- 部分应用只有英文界面。

## English

A small toolkit to build and self-host [HeyPuter/everything](https://github.com/HeyPuter/everything) in constrained environments (no git, no execution of local binaries — e.g. Android/embedded node). It contains build/deploy scripts, a zero-dependency static server with a cross-app asset fallback, a launcher generator, and notes on four real build pitfalls (missing NAPI symbols → use WASM deps or Vite 8; absolute `/assets/` URLs → force `base: './'`; hard-coded root paths for `.wasm` → cross-app fallback). Unofficial, MIT, not affiliated with Puter.

## License

MIT (this repository). Upstream apps are MIT by the Puter team — see their repo for attribution.
