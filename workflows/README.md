# GitHub Pages 工作流（模板）

`pages.yml` 是"构建指定应用并部署到 Pages"的工作流。

**它是一个模板，不是生效的 workflow**：发布这个仓库所用的 token 只有 `repo` 权限，
而写 `.github/workflows/*` 需要 `workflow` 权限（GitHub 会返回一个误导性的 404）。
要启用，二选一：

1. 在 GitHub 网页里新建 `.github/workflows/pages.yml`，把本文件内容粘进去（推荐，30 秒）
2. 给 token 加 `workflow` 权限后重新推送

启用后：仓库 Settings → Pages → Source 选 **GitHub Actions**，然后
Actions → "Build apps and deploy to Pages" → Run workflow → 填 `spreadsheet,documents`。

> 注意：Page 站点部署在 `/<repo>/` 子路径。`photo-studio`、`whiteboard` 里有硬编码的
> 根路径资源（如 `/photo-engine.wasm`），在 Pages 上可能缺资源；其余应用正常。
