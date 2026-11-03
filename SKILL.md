---
name: everything-selfhost
description: 在受限环境（Android / 无 git / 禁止执行本地二进制）构建并自托管 HeyPuter/everything 的浏览器版 Office/PS/CAD 应用：三个脚本 + 四个构建坑（NAPI 插件、Rollup 原生绑定、绝对路径 base、根路径 wasm）与 GitHub Pages 部署。
---

# everything-selfhost

上游：https://github.com/HeyPuter/everything （MIT，51 个浏览器应用）
本工具包：https://github.com/Verchiel666/everything-selfhost-kit

## 什么时候用

- 要把 everything 的某个应用构建出来自己托管（公司电脑装不了软件、内网、教学机房）
- 构建时遇到 `napi_*` dlopen 失败、`/assets/*.js` 404、wasm MIME 错
- 要在 Android / 嵌入式 node / 无 git 的环境里跑前端 monorepo 构建

## 三条命令

```sh
EVERYTHING_ROOT=~/everything sh scripts/fetch-source.sh
EVERYTHING_ROOT=~/everything SITE_DIR=~/site sh scripts/build-apps.sh spreadsheet documents
node scripts/serve.mjs ~/site 8080 0.0.0.0
```

## 三个铁律

1. 不要用 `npm run build`（受限环境执行 `.bin` 会 EACCES）→ `node node_modules/vite/bin/vite.js build`
2. 覆盖 `base: './'`（否则子路径部署全 404）
3. 依赖统一 `npm ci --registry=<镜像> --ignore-scripts`；`@rollup/*`、`lightningcss` 原生插件在嵌入式 node 上加载不了，用 WASM 版或升 Vite 8

## 详情

本技能同目录：`docs/BUILD-NOTES.md`（4 个坑的报错原文与绕过）、`scripts/`（可直接跑）。
