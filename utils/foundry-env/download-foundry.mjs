#!/usr/bin/env node
/**
 * Download a Foundry VTT Linux/NodeJS release zip.
 *
 * Usage: node download-foundry.mjs <version> <output-zip>
 *   <version> e.g. "14.360" (the part after the dot is the global build number)
 *
 * Sources, in order of preference:
 *   1. FOUNDRY_DOWNLOAD_URL  — direct link to a release zip (e.g. your own
 *      object storage, as used by the Hetzner scripts). No login needed.
 *   2. FOUNDRY_USERNAME + FOUNDRY_PASSWORD — logs into foundryvtt.com and
 *      fetches the timed release URL for the requested build.
 *
 * No npm dependencies; uses Node's global fetch with manual cookie handling
 * because the foundryvtt.com login flow needs CSRF + session cookies.
 */
import { createWriteStream } from 'node:fs'
import { mkdir, rename, stat } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const BASE = 'https://foundryvtt.com'

const [, , version, outFile] = process.argv
if (!version || !outFile) {
    console.error('Usage: node download-foundry.mjs <version> <output-zip>')
    process.exit(2)
}

const jar = new Map()

function storeCookies(response) {
    for (const header of response.headers.getSetCookie?.() ?? []) {
        const [pair] = header.split(';')
        const eq = pair.indexOf('=')
        if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
    }
}

function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        redirect: 'manual',
        ...options,
        headers: {
            'User-Agent': 'IlarisFoundryVTT-e2e-setup',
            Cookie: cookieHeader(),
            ...(options.headers ?? {}),
        },
    })
    storeCookies(response)
    return response
}

async function downloadToFile(url, file, { headers = {} } = {}) {
    // Follow redirects manually so cookies are only sent to foundryvtt.com.
    let current = url
    for (let hop = 0; hop < 5; hop++) {
        const sameOrigin = current.startsWith(BASE)
        const response = await fetch(current, {
            redirect: 'manual',
            headers: {
                'User-Agent': 'IlarisFoundryVTT-e2e-setup',
                ...(sameOrigin ? { Cookie: cookieHeader() } : {}),
                ...headers,
            },
        })
        if (sameOrigin) storeCookies(response)
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('location')
            if (!location) throw new Error(`Redirect without Location from ${current}`)
            current = new URL(location, current).toString()
            continue
        }
        if (!response.ok) {
            throw new Error(`Download failed: HTTP ${response.status} from ${current}`)
        }
        const tmp = `${file}.partial`
        await mkdir(dirname(file), { recursive: true })
        await pipeline(Readable.fromWeb(response.body), createWriteStream(tmp))
        const info = await stat(tmp)
        if (info.size < 10 * 1024 * 1024) {
            throw new Error(
                `Downloaded file is suspiciously small (${info.size} bytes) — ` +
                    'probably an error page instead of the release zip.',
            )
        }
        await rename(tmp, file)
        return
    }
    throw new Error('Too many redirects while downloading release')
}

async function loginAndGetReleaseUrl() {
    const { FOUNDRY_USERNAME, FOUNDRY_PASSWORD } = process.env

    // 1. Fetch the homepage for the CSRF cookie + form token.
    const home = await request(`${BASE}/`)
    const homeHtml = await home.text()
    const tokenMatch = homeHtml.match(/name="csrfmiddlewaretoken"\s+value="([^"]+)"/)
    if (!tokenMatch || !jar.has('csrftoken')) {
        throw new Error('Could not obtain CSRF token from foundryvtt.com')
    }

    // 2. Log in (Django form login, same fields the felddy launcher uses).
    const form = new URLSearchParams({
        csrfmiddlewaretoken: tokenMatch[1],
        login_username: FOUNDRY_USERNAME,
        login_password: FOUNDRY_PASSWORD,
        login_redirect: '/',
        login: '',
    })
    const login = await request(`${BASE}/auth/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: `${BASE}/`,
        },
        body: form.toString(),
    })
    if (!jar.has('sessionid')) {
        throw new Error(
            `Login to foundryvtt.com failed (HTTP ${login.status}). ` +
                'Check FOUNDRY_USERNAME / FOUNDRY_PASSWORD.',
        )
    }

    // 3. The release download endpoint redirects to a signed, timed URL.
    const build = version.includes('.') ? version.split('.').pop() : version
    return `${BASE}/releases/download?build=${build}&platform=linux`
}

try {
    const directUrl = process.env.FOUNDRY_DOWNLOAD_URL
    const url = directUrl || (await loginAndGetReleaseUrl())
    console.log(
        `[download-foundry] Downloading ${directUrl ? 'from FOUNDRY_DOWNLOAD_URL' : `build ${version}`}...`,
    )
    await downloadToFile(url, outFile)
    console.log(`[download-foundry] Saved release to ${outFile}`)
} catch (error) {
    console.error(`[download-foundry] ${error.message}`)
    process.exit(1)
}
