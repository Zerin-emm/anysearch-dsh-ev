/**
 * Build the browser half of the plugin.
 *
 * DSH client bundles are not plain ESM: the host loads each package's
 * `exports["./client"]` file and evaluates it against a module loader that
 * hands the bundle `react` and the other host modules through `require`.
 * This script therefore bundles `src/client/index.ts` as CommonJS (with the
 * host modules kept external), then wraps the result in the same
 * `window.__ModuleLoader__.load({ id, factory })` envelope the official
 * client packages use.
 *
 * Usage: node scripts/build-client.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const entry = join(root, 'src', 'client', 'index.ts')
const outFile = join(root, 'lib', 'client-ui.js')
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

/** Host modules the bundle requires at runtime; never bundled. */
const EXTERNALS = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

/** Locate esbuild: local install first, then npx. */
function esbuildCommand() {
  const local = join(root, 'node_modules', 'esbuild', 'bin', 'esbuild')
  if (existsSync(local)) return { command: process.execPath, args: [local] }
  // npx ships as a .cmd shim on Windows; use the shell for both platforms.
  return { command: 'npx', args: ['--yes', 'esbuild'], shell: true }
}

const work = mkdtempSync(join(tmpdir(), 'anysearch-client-'))
const raw = join(work, 'client.cjs')

try {
  const { command, args, shell } = esbuildCommand()
  const esbuildArgs = [
    entry,
    '--bundle',
    '--format=cjs',
    '--platform=browser',
    '--target=es2022',
    '--log-level=warning',
    ...EXTERNALS.flatMap((name) => [`--external:${name}`]),
    `--outfile=${raw}`,
  ]
  execFileSync(command, [...args.slice(0, args[0] === '--yes' ? 2 : 1), ...esbuildArgs], {
    cwd: root,
    stdio: 'inherit',
    shell,
    env: process.env,
  })

  const body = readFileSync(raw, 'utf8').trimEnd()
  const wrapped = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(packageJson.name)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${body}
\t\treturn module.exports;
\t}
});
`
  writeFileSync(outFile, wrapped, 'utf8')
  console.log(`built ${outFile}`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
