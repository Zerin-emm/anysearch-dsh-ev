/**
 * Bump the fork version in every file that mirrors it.
 *
 * The package version lives in four places: `package.json`, the source
 * constant, and the two committed build outputs the release ships. This script
 * keeps them in lockstep so `check:dist` still passes after a sync.
 *
 * Usage: node .github/scripts/bump-fork-version.mjs <new-version>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const target = process.argv[2]
if (target === undefined || target === '') {
  console.error('usage: bump-fork-version.mjs <new-version>')
  process.exit(1)
}

const pkgPath = 'package.json'
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const from = pkg.version

if (from === target) {
  console.log(`version already ${target}`)
  process.exit(0)
}

pkg.version = target
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

for (const file of ['src/version.ts', 'lib/version.js', 'lib/version.d.ts']) {
  let text = readFileSync(file, 'utf8')
  // The declaration file spells the client id out as a literal, so replace the
  // `dsh/<version>` form before the bare version.
  text = text.split(`dsh/${from}`).join(`dsh/${target}`)
  text = text.split(from).join(target)
  writeFileSync(file, text)
}

console.log(`version ${from} -> ${target}`)
