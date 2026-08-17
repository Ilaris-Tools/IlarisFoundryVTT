#!/usr/bin/env node
/**
 * Bring a freshly started Foundry server into a testable state:
 *   - submit the license key and accept the EULA (first launch only)
 *   - make sure the "Vanilla Ilaris" world is live (launch it from /setup if needed)
 *   - join as Gamemaster and seed the baseline e2e actors
 *
 * Run from the repo root (needs the repo's @playwright/test). Idempotent —
 * on an already-bootstrapped server it just verifies and exits.
 */
import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const BASE_URL = process.env.E2E_FOUNDRY_URL ?? 'http://localhost:30000'
const WORLD_ID = process.env.FOUNDRY_WORLD_ID ?? 'vanilla-ilaris'
const LICENSE_KEY = (process.env.FOUNDRY_LICENSE_KEY ?? '').replace(/[^A-Za-z0-9]/g, '')
const GM_USER = process.env.E2E_FOUNDRY_USER ?? 'Gamemaster'
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const FIXTURES_DIR = path.join(REPO, 'e2e', 'fixtures', 'actors')

const log = (message) => console.log(`[foundry-bootstrap] ${message}`)

function route(url) {
    const { pathname } = new URL(url)
    for (const key of ['license', 'auth', 'setup', 'join', 'game', 'players']) {
        if (pathname.startsWith(`/${key}`)) return key
    }
    return pathname === '/' ? 'root' : pathname
}

async function clickIfVisible(page, selector, timeout = 1500) {
    const locator = page.locator(selector).first()
    try {
        await locator.waitFor({ state: 'visible', timeout })
        await locator.click()
        return true
    } catch {
        return false
    }
}

async function handleLicense(page) {
    log('License page detected — submitting license key...')
    if (!LICENSE_KEY) throw new Error('FOUNDRY_LICENSE_KEY not set but license page shown')

    const keyInput = page
        .locator('input[name="licenseKey"], input#key, input[placeholder*="license" i]')
        .first()
    if (await keyInput.isVisible().catch(() => false)) {
        await keyInput.fill(LICENSE_KEY)
        await clickIfVisible(page, 'button[type="submit"], button:has-text("Submit")', 5000)
        await page.waitForLoadState('networkidle').catch(() => {})
    }

    // EULA: agreement checkbox + sign button (may render on the same route).
    const agree = page.locator('input#eula-agree, input[name="agree"]').first()
    if (await agree.isVisible({ timeout: 5000 }).catch(() => false)) {
        log('Accepting EULA...')
        await agree.check()
        await clickIfVisible(
            page,
            'button#sign, button[name="sign"], button:has-text("Sign")',
            5000,
        )
        await page.waitForLoadState('networkidle').catch(() => {})
    }
}

async function handleSetup(page) {
    log(`Setup screen detected — launching world "${WORLD_ID}"...`)

    // Dismiss onboarding tour overlays that block clicks.
    await clickIfVisible(page, '.tour [data-action="exit"], .tour .step-button.exit')
    await page.keyboard.press('Escape').catch(() => {})

    const tile = page.locator(`[data-package-id="${WORLD_ID}"]`).first()
    if (await tile.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tile.hover().catch(() => {})
        const launch = tile
            .locator('[data-action="worldLaunch"], button:has-text("Launch"), .control.play')
            .first()
        if (await launch.isVisible().catch(() => false)) {
            await launch.click()
            await page.waitForURL(/\/(join|game|players)/, { timeout: 60000 }).catch(() => {})
            return
        }
    }

    // Fallback: use the setup API directly.
    log('World tile interaction failed — trying the /setup API...')
    await page.evaluate(async (worldId) => {
        await fetch('setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'launchWorld', world: worldId }),
        })
    }, WORLD_ID)
    await page.waitForURL(/\/(join|game|players)/, { timeout: 60000 })
}

async function handleJoin(page) {
    log(`Join screen detected — joining as ${GM_USER}...`)
    const userField = page
        .locator('select[name="userid"], input[name="userid"], input[name="username"]')
        .first()
    await userField.waitFor({ state: 'visible', timeout: 15000 })

    const tagName = await userField.evaluate((el) => el.tagName.toLowerCase())
    if (tagName === 'select') {
        await userField.selectOption({ label: GM_USER })
    } else {
        await userField.fill(GM_USER)
    }
    const password = process.env.E2E_FOUNDRY_PASSWORD
    const passwordField = page.locator('input[type="password"]').first()
    if (password && (await passwordField.isVisible().catch(() => false))) {
        await passwordField.fill(password)
    }
    await page.getByRole('button', { name: /join game session/i }).click()
    await page.waitForURL(/\/game/, { timeout: 60000 })
}

async function loadFixtureActors() {
    if (!existsSync(FIXTURES_DIR)) return []
    const actors = []
    for (const file of await readdir(FIXTURES_DIR)) {
        if (!file.endsWith('.json')) continue
        try {
            const data = JSON.parse(await readFile(path.join(FIXTURES_DIR, file), 'utf8'))
            if (data?.name && data?.type) actors.push(data)
            else log(`Skipping fixture ${file}: not a Foundry actor export`)
        } catch (error) {
            log(`Skipping fixture ${file}: ${error.message}`)
        }
    }
    return actors
}

async function seedWorld(page) {
    log('Waiting for game.ready...')
    await page.waitForFunction(() => typeof game !== 'undefined' && game.ready, undefined, {
        timeout: 60000,
    })

    // 1. Actor exports dropped into e2e/fixtures/actors/ (authoritative seed data).
    const fixtures = await loadFixtureActors()
    for (const fixture of fixtures) {
        const created = await page.evaluate(async (data) => {
            if (game.actors.getName(data.name)) return false
            delete data._id
            await Actor.create(data)
            return true
        }, fixture)
        log(
            created
                ? `Created fixture actor "${fixture.name}"`
                : `Actor "${fixture.name}" already exists`,
        )
    }

    // 2. Baseline actors many specs rely on, generated from the system's own
    //    compendia when no fixture with the same name was provided.
    const summary = await page.evaluate(async () => {
        const results = []

        if (!game.actors.getName('Testlauf-Held')) {
            const pack = game.packs.get('Ilaris.waffen')
            const items = []
            if (pack) {
                const index = await pack.getIndex()
                const entry = index.find((i) => i.name === 'Kurzschwert')
                if (entry) {
                    const weapon = await pack.getDocument(entry._id)
                    items.push(weapon.toObject())
                }
            }
            await Actor.create({ name: 'Testlauf-Held', type: 'held', items })
            results.push(`Testlauf-Held (held, ${items.length} weapon[s] from compendium)`)
        }

        if (!game.actors.getName('Testfall-Npc')) {
            await Actor.create({
                name: 'Testfall-Npc',
                type: 'kreatur',
                items: [
                    {
                        name: 'Breitschwert',
                        type: 'angriff',
                        system: {
                            tp: '1W6+4',
                            at: 11,
                            vt: 8,
                            typ: 'Nah',
                            rw: 1,
                            haerte: 0,
                            wm: 0,
                            lz: 0,
                        },
                    },
                ],
            })
            results.push('Testfall-Npc (kreatur, Breitschwert AT 11)')
        }

        return results
    })
    for (const line of summary) log(`Created baseline actor: ${line}`)

    const actorCount = await page.evaluate(() => game.actors.size)
    log(`World is live with ${actorCount} actor(s).`)
}

async function main() {
    const executablePath =
        process.env.E2E_CHROMIUM_PATH ??
        (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)

    const browser = await chromium.launch({ headless: true, executablePath })
    const page = await browser.newPage()
    page.setDefaultTimeout(20000)

    try {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
        await page.waitForURL(/\/(license|auth|setup|join|game|players)/, { timeout: 30000 })

        // The server walks through license -> setup -> join -> game; handle
        // whichever screen appears until we are in the game, with a hop limit
        // so a stuck screen fails loudly instead of looping forever.
        for (let hop = 0; hop < 10; hop++) {
            await page.waitForLoadState('domcontentloaded')
            const current = route(page.url())
            if (current === 'game') break
            if (current === 'license') await handleLicense(page)
            else if (current === 'setup') await handleSetup(page)
            else if (current === 'join' || current === 'players') await handleJoin(page)
            else if (current === 'auth') {
                throw new Error(
                    'Foundry asks for an admin password, but this setup expects none. ' +
                        'Clear adminPassword in Config/options.json of the data dir.',
                )
            } else {
                await page.waitForURL(/\/(license|auth|setup|join|game|players)/, {
                    timeout: 15000,
                })
            }
            if (route(page.url()) === current && current !== 'game') {
                // No navigation happened; give the server a moment before retrying.
                await page.waitForTimeout(2000)
            }
        }

        if (route(page.url()) !== 'game') {
            throw new Error(`Bootstrap did not reach /game (stuck on ${page.url()})`)
        }

        await seedWorld(page)
        log('Bootstrap complete — server is ready for e2e tests.')
    } finally {
        await browser.close()
    }
}

main().catch((error) => {
    console.error(`[foundry-bootstrap] FAILED: ${error.message}`)
    process.exit(1)
})
