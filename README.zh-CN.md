# dsh-anysearch-ev

> 基于 [`@anysearch/anysearch-dsh`](https://github.com/anysearch-team/anysearch-dsh)（MIT）的独立插件：保留 AnySearch 的搜索/抓取能力，并**补上一个 API Key 设置卡片**，留空即使用匿名额度。

- 完整的 `web_search` / `web_fetch` / `anysearch_*` 工具能力，与上游一致；
- 在 DSH 的「插件」页多一张卡片：**API Key 输入框 + 保存**；
- 密钥只写进 DSH 凭据文件（`~/.dsh/.credentials.yaml` 的 `ANYSEARCH_API_KEY`），不写插件设置、不回显；
- 留空保存 = 删除已存密钥，回到 AnySearch 匿名额度。

## 与官方插件的关系

| | 官方 `@anysearch/anysearch-dsh` | 本插件 |
|---|---|---|
| 搜索 / 抓取 / 垂直工具 | ✅ | ✅（同一套实现） |
| API Key 设置界面 | ❌（只能改凭据文件） | ✅ 插件页卡片 |
| 从 GitHub 免构建安装 | ✅ | ✅（仓库自带 `lib/`） |
| 版本号 | `0.1.8` | `0.1.8-fork.1`（跟随上游） |

**两者是替换关系**：它们注册同一个 `web` provider（id `anysearch`）和同名工具，不能同时启用。安装本插件前请先卸载官方插件。

## 安装

1. 先卸载官方插件（如果装过）：

   ```bash
   npx -y @deepseek-ai/dsh plugin --profile desktop remove @anysearch/anysearch-dsh
   ```

2. 安装本插件（仓库自带编译产物，GitHub 安装不需要构建）：

   ```bash
   npx -y @deepseek-ai/dsh plugin --profile desktop add github:Zerin-emm/anysearch-dsh-ev
   ```

   也可以：

   ```bash
   # profile 目录下直接 pnpm
   pnpm add github:Zerin-emm/anysearch-dsh-ev

   # 或插件市场 → 从链接安装：填 Release 的 .tgz 地址
   ```

3. 重启 DSH。

## 配置 API Key

打开 **设置 → 插件**，找到「AnySearch API Key」卡片：

- 输入 `as_sk_...` → **保存**：状态变为「● 已配置密钥」；
- 留空 → **保存**：清除密钥，状态变为「○ 匿名额度」。

也可以继续用凭据文件或环境变量（优先级：进程环境变量 > 凭据文件）：

```yaml
# ~/.dsh/.credentials.yaml
ANYSEARCH_API_KEY: "as_sk_your_key"
```

获取 Key：<https://www.anysearch.com/console/api-keys>（配置后每天 1000 次免费额度）。

## 卸载 / 回退官方

```bash
npx -y @deepseek-ai/dsh plugin --profile desktop remove dsh-anysearch-ev
npx -y @deepseek-ai/dsh plugin --profile desktop add @anysearch/anysearch-dsh
```

## 开发

```bash
pnpm install
pnpm run build        # tsc（服务端）+ esbuild 打包客户端 lib/client-ui.js
pnpm run check        # 上游检查 + 产物一致性
node tests/smoke-client.mjs   # 客户端 bundle 烟雾测试
```

客户端产物 `lib/client-ui.js` 是 DSH 的模块加载格式（`window.__ModuleLoader__.load`），由 `scripts/build-client.mjs` 生成，**需要提交进仓库**。

## 跟随上游

本仓库通过 GitHub Actions 每天从上游 `anysearch-team/anysearch-dsh` 合并一次：

- 无冲突：直接合并并推送；
- 有冲突：自动开一个 PR，人工处理（通常只涉及 `package.json` 与 `pnpm-lock.yaml`）。

上游是稳定服务，更新频率很低；v0.1.8 起上游已把 DSH 依赖范围放宽为 `*`，不再因 DSH 版本被拒装。

## License

MIT。原始实现版权归 AnySearch Team 所有，见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE)。
