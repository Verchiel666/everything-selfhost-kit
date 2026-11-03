# 构建笔记：4 个真实坑

全部为本机实测（2026-11，Android + 嵌入式 node v24 + DSH）。报错原文照抄，方便搜索。

---

## 坑 1：lightningcss 原生插件加载失败

```
Error: [lightningcss minify] Cannot find module '../lightningcss.android-arm64.node'
  ...
  at Object.<anonymous> (.../lightningcss/node/index.js:20:12)
  [cause]: Error: dlopen failed: cannot locate symbol "napi_get_cb_info"
      referenced by ".../lightningcss-android-arm64/lightningcss.android-arm64.node"
```

**原因**：平台包其实装上了，但嵌入式 node 运行时不向 `dlopen` 的第三方 `.node` 导出 NAPI 符号，插件加载失败；lightningcss 的加载器把真实错误吞掉后回退到旧路径，于是报"找不到模块"。

**谁会踩到**：Vite / Parcel 等在 CSS 压缩阶段用 lightningcss 的场景，且 node 是非标准构建（嵌入式、部分 Android/Termux 打包）。

**绕过**（任一）：
- 关掉 CSS 压缩：`build.cssMinify = false`（产物略大，功能无损）
- 用系统标准 node（不是 .so 形式的嵌入式 node）

---

## 坑 2：Rollup 的 Android/ARM 原生 binding 同样加载不了

```
Error: Cannot find module @rollup/rollup-android-arm64. npm has a bug related to optional dependencies ...
  [cause]: Error: dlopen failed: cannot locate symbol "napi_get_undefined"
      referenced by ".../@rollup/rollup-android-arm64/rollup.android-arm64.node"
```

**原因**：同坑 1，NAPI 符号不可见。Rollup 4 只有原生实现，没有 JS 回退。

**绕过**（任一）：
- 装 WASM 版替换：`npm i --no-save @rollup/wasm-node@<与 rollup 同版本>`，然后
  `rm -rf node_modules/rollup && mv node_modules/@rollup/wasm-node node_modules/rollup`
- 把该 app 升到 Vite 8（Rolldown）：`npm i --no-save vite@8`。Rolldown 的
  `@rolldown/binding-android-arm64` 在同样环境下能正常加载（实测可用）。

**注意**：Vite 7 还需要 `esbuild` 的**可执行二进制**（会 `spawn ... EACCES`），而
`esbuild: false` + `minify: false` 并不能完全绕开。所以老应用最省事的路是升 Vite 8。

---

## 坑 3：页面全白，`/assets/*.js` 404

```
GET http://host/spreadsheet/assets/index-abc123.js 404
```

**原因**：该 app 的 `vite.config.js` 没有设置 `base`，默认 `'/'`，产物里是
`src="/assets/index-xxx.js"` 这类**绝对路径**。一旦把应用放在子目录（`/spreadsheet/`），
请求会打到站点根，全部 404。

**谁会踩到**：**所有人**——只要你不是把 app 部署在域名根路径。上游大多数应用写了
`base: './'`，但 `3d`、`contacts`、`photo-studio`、`whiteboard` 没有（2026-11 状态）。

**绕过**：覆盖一份本地配置再构建

```js
// vite.config.local.mjs
import base from './vite.config.js';
const r = typeof base === 'function' ? base({ command: 'build', mode: 'production' }) : base;
export default { ...r, base: './', build: { ...(r.build || {}), cssMinify: false } };
```

```sh
node node_modules/vite/bin/vite.js build --config vite.config.local.mjs
# 或命令行：npx vite build --base=./
```

`build-apps.sh` 已经自动做了这件事。

---

## 坑 4：硬编码的根路径资源（wasm）

```
Failed to execute 'compile' on 'WebAssembly': Incorrect response MIME type. Expected 'application/wasm'.
Graphics unavailable
```

**原因**：photo-studio 的 worker 里写死了 `fetch('/photo-engine.wasm')`（绝对路径）。
部署在 `/<app>/` 子目录时，这个请求打到站点根，服务器返回了 HTML（404 页或 SPA 回退），
于是 MIME 不是 `application/wasm`。`whiteboard` 也有类似的根路径 `fetch('/...')`。

**谁会踩到**：所有把这两个应用部署在子路径下的人。

**绕过**：
- 用本仓库的 `scripts/serve.mjs`：它在站点根找不到文件时会**到各 app 目录里找同名文件**
  （日志会打 `fallback /photo-engine.wasm -> photo-studio`）
- 或把应用部署在域名根路径（每个 app 一个子域名 / 一个端口）

---

## 附：`npm run build` 在 Android 上直接失败

```
sh: /.../node_modules/.bin/vite: Permission denied
```

Android 禁止执行应用私有目录里的文件。不要把 `node_modules/.bin/*` 加到 PATH 里试，
直接调 JS 入口：`node node_modules/vite/bin/vite.js build`。

## 附：安装依赖的参数

```sh
npm ci --registry=https://registry.npmmirror.com --no-audit --no-fund --ignore-scripts
```

`--ignore-scripts` 必须：postinstall 常常要 exec 二进制（会失败），而本项目的依赖都自带
预编译产物。若某依赖确实需要 postinstall，去掉该参数重试。
