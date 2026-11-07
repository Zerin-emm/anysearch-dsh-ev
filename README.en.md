# dsh-anysearch-ev

**English** | [简体中文](README.md)

> An independent DeepSeek Harness plugin built on [`@anysearch/anysearch-dsh`](https://github.com/anysearch-team/anysearch-dsh) (MIT): same AnySearch search/fetch providers, plus an in-UI **API key settings card**. Leave the field blank to use AnySearch's anonymous quota.

## What it adds over the upstream plugin

| | Upstream | This fork |
|---|---|---|
| `web_search` / `web_fetch` / `anysearch_*` | ✅ | ✅ |
| API key settings UI | ❌ (credentials file only) | ✅ card on the Plugins page |
| GitHub install without building | ✅ | ✅ (`lib/` is committed) |

The two are **mutually exclusive**: both register the `web` provider id `anysearch` and the same tool names. Uninstall the upstream plugin first.

## Install

```bash
# 1) remove the upstream plugin if present
npx -y @deepseek-ai/dsh plugin --profile desktop remove @anysearch/anysearch-dsh

# 2) install this fork (no build needed)
npx -y @deepseek-ai/dsh plugin --profile desktop add github:Zerin-emm/anysearch-dsh-ev

# 3) restart DeepSeek Harness
```

Alternatives: `pnpm add github:Zerin-emm/anysearch-dsh-ev` inside the profile, or the market's install-from-link flow with a release `.tgz`.

## Configure the key

Settings → Plugins → **AnySearch API Key**:

- type a key → Save → the badge reads "configured";
- save an empty field → the stored key is removed and the plugin falls back to the anonymous quota.

The key is written to DSH's credential store (`~/.dsh/.credentials.yaml`, ref `ANYSEARCH_API_KEY`), never to plugin settings and never echoed back. An `ANYSEARCH_API_KEY` process environment variable still takes precedence.

## Development

```bash
pnpm install
pnpm run build                 # tsc (host half) + esbuild (lib/client-ui.js)
node tests/smoke-client.mjs    # bundle smoke test
```

`lib/client-ui.js` is a DSH client bundle (`window.__ModuleLoader__.load` envelope) and must stay committed.

## Upstream sync and automatic releases

A daily GitHub Action merges `anysearch-team/anysearch-dsh` into this fork:

- **no conflicts**: it pushes the merge; when upstream has just tagged a release it also bumps the version to `<upstream-version>-fork.1`, commits, tags, and publishes the release (`dsh-anysearch-ev-<version>.tgz`);
- **conflicts**: it opens an issue and leaves the version and release alone (conflicts are usually `package.json` and `pnpm-lock.yaml`).

Versions mirror upstream: upstream `0.1.9` becomes `0.1.9-fork.1` here. Manual tags still trigger `release.yml`.

## License

MIT. Original implementation © AnySearch Team — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
