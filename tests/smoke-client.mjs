/**
 * Smoke test for the built browser bundle.
 *
 * Runs `lib/client-ui.js` in a VM with a minimal `window.__ModuleLoader__` and a
 * mock `require('react')`, then drives the plugin's `apply()` against a fake
 * client context. It proves the bundle registers, exports `inject`/`apply`, and
 * that the card reads the credential reference when it mounts.
 *
 * Usage: node tests/smoke-client.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const code = readFileSync(join(root, 'lib', 'client-ui.js'), 'utf8')

let registered = null
const sandbox = {
  window: {
    __ModuleLoader__: {
      load(entry) {
        registered = entry
      },
    },
  },
  console,
  Symbol,
  Object,
  Set,
  Map,
  Promise,
  queueMicrotask,
  setTimeout,
}
vm.runInNewContext(code, sandbox)

if (registered === null) throw new Error('bundle did not call __ModuleLoader__.load')
if (registered.id !== 'dsh-anysearch-ev') throw new Error(`unexpected id: ${registered.id}`)

const react = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  useState: (initial) => [initial, () => {}],
  useEffect: (fn) => {
    fn()
  },
  useReducer: (reducer, initial) => [initial, () => {}],
}
const plugin = registered.factory((name) => {
  if (name === 'react') return react
  throw new Error(`unexpected require: ${name}`)
})

if (typeof plugin.apply !== 'function') throw new Error('missing apply export')
if (!Array.isArray(plugin.inject) || !plugin.inject.includes('remote.credentials')) {
  throw new Error(`unexpected inject: ${JSON.stringify(plugin.inject)}`)
}

const calls = []
let credentialView = { configured: true, writable: true }
let slot = null
const ctx = {
  effect: (fn) => fn(),
  slots: {
    inject: (name, fn) => fn(),
    register: (config, component) => {
      slot = { config, component }
      return () => {}
    },
  },
  remote: {
    $on: () => () => {},
    credentials: {
      describe: async (refs) => {
        calls.push(['describe', refs[0]])
        return { ok: true, value: { [refs[0]]: credentialView } }
      },
      set: async (ref, value) => {
        calls.push(['set', ref, value])
        credentialView = { configured: true, writable: true }
      },
      unset: async (ref) => {
        calls.push(['unset', ref])
        credentialView = { configured: false, writable: true }
      },
    },
  },
}

plugin.apply(ctx)

if (slot === null) throw new Error('card was not registered')
if (slot.config.name !== 'plugins.item') throw new Error('card registered outside plugins.item')
if (slot.config.id !== 'anysearch-key') throw new Error('unexpected card id')

const element = slot.component()
if (element === null || typeof element !== 'object') throw new Error('card did not render')

await new Promise((resolve) => setTimeout(resolve, 20))
if (!calls.some(([kind, ref]) => kind === 'describe' && ref === 'ANYSEARCH_API_KEY')) {
  throw new Error(`card did not read the credential: ${JSON.stringify(calls)}`)
}

console.log(
  'client smoke test passed:',
  JSON.stringify({ id: registered.id, inject: plugin.inject, calls: calls.length }),
)
