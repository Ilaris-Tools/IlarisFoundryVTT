#!/usr/bin/env node
/** Claude Web adapter: run one disposable cloud Foundry E2E lifecycle when credentials exist. */
import { spawnSync } from 'node:child_process'
import { getMissingCredentials } from '../../utils/foundry-env/runtime.js'

const missing = getMissingCredentials(process.env)
if (missing.length) {
    console.log(`[foundry-env] Remote E2E setup skipped: missing ${missing.join('; ')}.`)
    process.exit(0)
}

const testPaths = process.env.FOUNDRY_E2E_PATHS?.split(/\s+/).filter(Boolean) ?? []
const result = spawnSync('npm', ['run', 'foundry:cloud', '--', ...testPaths], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)
