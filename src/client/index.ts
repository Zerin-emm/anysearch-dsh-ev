// @ts-nocheck
/**
 * AnySearch API key settings card (browser half).
 *
 * The AnySearch provider resolves the `ANYSEARCH_API_KEY` credential reference
 * on every operation, so this card never edits provider configuration: it
 * writes or clears that one reference through DSH's credentials domain. An
 * empty save clears the reference, which is what puts the plugin back on the
 * anonymous quota.
 *
 * The bundle is wrapped by scripts/build-client.mjs into the module-loader
 * format every DSH client bundle uses (`window.__ModuleLoader__.load`).
 */
import { createElement as h, useEffect, useReducer, useState } from 'react'

/** Credential reference the AnySearch provider resolves. */
const REF = 'ANYSEARCH_API_KEY'

/** Card state shared by the mount and the credential watcher. */
let state = {
  /** Whether the host reports a configured credential; undefined until known. */
  configured: undefined,
  /** Whether the credentials domain accepts a write. */
  writable: true,
  /** Whether a save is in flight. */
  saving: false,
  /** One-line result of the last save attempt. */
  message: '',
}

/** Render-trigger set; the component re-renders after every state change. */
const listeners = new Set()

/** The browser plugin context, kept for the component's async calls. */
let clientCtx = null

/** Merge a patch into the card state and notify the mounted component. */
function setState(patch) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

/** Read whether a key is configured and whether the domain is writable. */
async function refresh(ctx) {
  if (ctx === null || ctx === undefined) return
  try {
    const response = await ctx.remote.credentials.describe([REF])
    if (response?.ok !== true) {
      setState({ configured: undefined })
      return
    }
    const view = response.value?.[REF]
    setState({
      configured: view?.configured === true,
      writable: view?.writable !== false,
    })
  } catch {
    setState({ configured: undefined })
  }
}

/**
 * Save the staged key, or clear it when the input is blank.
 * @param value - the staged credential literal.
 */
async function save(ctx, value) {
  if (ctx === null || ctx === undefined) return
  setState({ saving: true, message: '' })
  try {
    const trimmed = value.trim()
    if (trimmed === '') {
      await ctx.remote.credentials.unset(REF)
      setState({ message: '已清除密钥，使用匿名额度。' })
    } else {
      await ctx.remote.credentials.set(REF, trimmed)
      setState({ message: '已保存。下一次搜索生效。' })
    }
    await refresh(ctx)
  } catch {
    setState({ message: '保存失败：该凭据当前不可写，或接口拒绝了本次写入。' })
  } finally {
    setState({ saving: false })
  }
}

/** Shared inline styles; colors inherit the host theme. */
const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '14px 16px',
    border: '1px solid color-mix(in srgb, currentColor 14%, transparent)',
    borderRadius: '10px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  title: { fontSize: '14px', fontWeight: 600 },
  badge: (configured) => ({
    fontSize: '12px',
    opacity: configured === undefined ? 0.5 : 0.85,
  }),
  hint: { fontSize: '12px', opacity: 0.65, lineHeight: 1.5 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    fontSize: '13px',
    color: 'inherit',
    background: 'transparent',
    border: '1px solid color-mix(in srgb, currentColor 22%, transparent)',
    borderRadius: '8px',
    outline: 'none',
  },
  footer: { display: 'flex', alignItems: 'center', gap: '12px' },
  button: {
    padding: '7px 16px',
    fontSize: '13px',
    color: 'inherit',
    background: 'color-mix(in srgb, currentColor 10%, transparent)',
    border: '1px solid color-mix(in srgb, currentColor 22%, transparent)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  message: { fontSize: '12px', opacity: 0.75 },
}

/** The settings card mounted into the bundle page's `plugins.bundle.config` slot. */
function KeyCard(props) {
  const [, force] = useReducer((n) => n + 1, 0)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const listener = () => force(0)
    listeners.add(listener)
    void refresh(clientCtx)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  // The bundle page asks for the `page` view; anything else is another slot's
  // business (the summary line on plugin cards).
  if (props?.view !== 'page') return null

  const configured = state.configured
  const disabled = state.writable !== true || state.saving === true

  return h(
    'div',
    { style: styles.card },
    h(
      'div',
      { style: styles.header },
      h('span', { style: styles.title }, 'AnySearch API Key'),
      h(
        'span',
        { style: styles.badge(configured) },
        configured === undefined ? '状态未知' : configured ? '● 已配置密钥' : '○ 匿名额度',
      ),
    ),
    h(
      'div',
      { style: styles.hint },
      '密钥只写入 DSH 的凭据文件（.credentials.yaml），不会写进插件设置，也不会回显。',
    ),
    h('input', {
      type: 'password',
      value: draft,
      placeholder: 'as_sk_...（留空表示匿名额度）',
      disabled,
      autoComplete: 'off',
      spellCheck: false,
      style: styles.input,
      onChange: (event) => setDraft(event.target.value),
    }),
    h('div', { style: styles.hint }, '留空后点保存 = 清除已存密钥，回到 AnySearch 匿名额度。'),
    h(
      'div',
      { style: styles.footer },
      h(
        'button',
        {
          type: 'button',
          disabled,
          style: styles.button,
          onClick: async () => {
            await save(clientCtx, draft)
            setDraft('')
          },
        },
        state.saving ? '保存中…' : '保存',
      ),
      state.message !== '' ? h('span', { style: styles.message }, state.message) : null,
    ),
  )
}

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'remote', 'remote.credentials']

/** Package name the bundle-config slot is keyed by. */
const PACKAGE_NAME = 'dsh-anysearch-ev'

/**
 * Mount the settings card on this bundle's own page.
 *
 * The Plugins page renders `plugins.bundle.config` on a bundle's page, keyed by
 * the bundle's package name; a bundle's configuration belongs there rather than
 * in `plugins.item`, which the official settings pages occupy.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx) {
  clientCtx = ctx
  ctx.effect(
    () =>
      ctx.slots.inject('plugins.bundle.config', () =>
        ctx.slots.register(
          {
            name: 'plugins.bundle.config',
            key: PACKAGE_NAME,
          },
          KeyCard,
        ),
      ),
    'anysearch-ev: settings card',
  )
  ctx.effect(
    () =>
      ctx.remote.$on('credentials/reference-updated', (ref) => {
        if (ref === REF) void refresh(ctx)
      }),
    'anysearch-ev: credential invalidations',
  )
}
