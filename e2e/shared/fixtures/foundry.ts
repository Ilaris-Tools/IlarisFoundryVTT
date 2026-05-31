import { expect, Locator, Page } from '@playwright/test'

export type FoundryCredentials = {
    url: string
    username: string
    worldName: string
    password?: string
}

export type ActorDefaultSnapshot = {
    actorId: string
    actorName: string
    system: Record<string, unknown>
    items: Array<{
        id: string
        source: Record<string, unknown>
    }>
}

export const foundryConfig: FoundryCredentials = {
    url: process.env.E2E_FOUNDRY_URL ?? 'http://localhost:30000',
    username: process.env.E2E_FOUNDRY_USER ?? 'Gamemaster',
    worldName: process.env.E2E_FOUNDRY_WORLD ?? 'Vanilla Ilaris',
    password: process.env.E2E_FOUNDRY_PASSWORD,
}

async function firstVisible(page: Page, selectors: string[]): Promise<Locator> {
    for (const selector of selectors) {
        const locator = page.locator(selector).first()
        if (await locator.isVisible().catch(() => false)) return locator
    }
    throw new Error(`No visible selector found. Tried: ${selectors.join(', ')}`)
}

async function isWorldUiVisible(page: Page): Promise<boolean> {
    for (const selector of ['#chat-log', '#ui-left', '#sidebar']) {
        if (
            await page
                .locator(selector)
                .first()
                .isVisible()
                .catch(() => false)
        )
            return true
    }
    return false
}

export async function loginAndJoinWorld(page: Page, config: FoundryCredentials = foundryConfig) {
    await registerFoundryOverlayHandlers(page)

    await page.goto(config.url, { waitUntil: 'domcontentloaded' })

    // Foundry redirects asynchronously from / to /join, /game, or /setup
    await page.waitForURL(/(\/join|\/game|\/setup)/, { timeout: 30000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

    // Already in game (e.g. local dev session still active)
    if (page.url().includes('/game') && (await isWorldUiVisible(page))) {
        await page.waitForFunction(
            () => typeof game !== 'undefined' && game.ready && !!game.messages,
            undefined,
            { timeout: 30000 },
        )
        return
    }

    // Expect join form
    const userField = page
        .locator('input[name="userid"], input[name="username"], select[name="userid"]')
        .first()
    await expect(userField).toBeVisible({ timeout: 15000 })

    const tagName = await userField.evaluate((el) => el.tagName.toLowerCase())
    if (tagName === 'select') {
        const optionState = await userField.evaluate((el, username) => {
            const select = el as HTMLSelectElement
            const option = Array.from(select.options).find(
                (o) => o.textContent?.trim() === username,
            )
            if (!option) return { exists: false, disabled: false }
            return { exists: true, disabled: option.disabled, value: option.value }
        }, config.username)

        if (!optionState.exists)
            throw new Error(`Foundry user not found in join select: ${config.username}`)
        if (optionState.disabled)
            throw new Error(
                `Foundry user is already connected: ${config.username}. Set E2E_FOUNDRY_USER to a free account.`,
            )

        await userField.selectOption({ label: config.username })
    } else {
        await userField.fill(config.username)
    }

    // Fill password only if a field is visible AND a password is configured
    const passwordField = page.locator('input[type="password"]').first()
    if ((await passwordField.isVisible().catch(() => false)) && config.password) {
        await passwordField.fill(config.password)
    }

    await dismissFoundryCompatibilityWarnings(page)

    // Click Join and wait for the page to navigate to /game
    await page.getByRole('button', { name: /join game session/i }).click()
    await page.waitForURL(/\/game/, { timeout: 60000 })

    // If we landed on a world selection screen, pick the world and launch
    if (!page.url().includes('/game')) {
        const worldEntry = page
            .locator('.world-list li, .worlds-list li, [data-world], .world')
            .filter({ hasText: config.worldName })
            .first()

        if (await worldEntry.isVisible({ timeout: 10000 }).catch(() => false)) {
            await worldEntry.click()
        }

        const launchBtn = page
            .locator(
                'button:has-text("Launch World"), button:has-text("Join World"), button:has-text("Welt starten"), button:has-text("Welt beitreten")',
            )
            .first()

        if (await launchBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await Promise.all([page.waitForURL(/\/game/, { timeout: 60000 }), launchBtn.click()])
        }
    }

    // Final checks: world UI visible, URL is /game, and Foundry runtime fully ready.
    await page.waitForURL(/\/game/, { timeout: 60000 })
    await page.waitForSelector('#chat-log, #ui-left', { timeout: 45000 })
    await page.waitForFunction(
        () => typeof game !== 'undefined' && game.ready && !!game.messages,
        undefined,
        { timeout: 30000 },
    )

    await dismissFoundryCompatibilityWarnings(page)

    // Explicitly dismiss the breaking-change dialog that may have appeared during startup
    // (the dialog is rendered asynchronously after game.ready via fetch + enrichHTML).
    await dismissBreakingChangeDialogIfPresent(page)
}

async function registerFoundryOverlayHandlers(page: Page): Promise<void> {
    // addLocatorHandler runs before later Playwright actions and keeps transient Foundry
    // overlays from covering click targets during E2E interaction.
    await page.addLocatorHandler(page.locator('.ilaris-changelog-notification'), async (dialog) => {
        const btn = dialog.locator(
            'button[data-action="acknowledge"], button:has-text("Verstanden")',
        )
        if (await btn.isVisible().catch(() => false)) {
            await btn.click()
            return
        }

        await dialog.evaluate((element) => element.remove()).catch(() => {})
    })

    const compatibilityWarning = page
        .locator('#notifications .notification, #notifications li, .notifications-list li')
        .filter({ hasText: /unsupported on chromium version less than/i })
        .first()

    await page.addLocatorHandler(compatibilityWarning, async (warning) => {
        await warning.evaluate((element) => element.remove()).catch(() => {})
    })
}

export async function dismissFoundryCompatibilityWarnings(page: Page): Promise<void> {
    await page
        .evaluate(() => {
            const warningPattern = /unsupported on chromium version less than/i

            document
                .querySelectorAll(
                    '#notifications .notification, #notifications li, .notifications-list li',
                )
                .forEach((element) => {
                    const text = element.textContent ?? ''
                    if (warningPattern.test(text)) {
                        element.remove()
                    }
                })
        })
        .catch(() => {})
}

/**
 * Dismisses the Ilaris breaking-change notification dialog if it is currently visible.
 * Waits briefly to account for the async render (fetch + enrichHTML) that happens
 * after game.ready. Safe to call any time; does nothing if the dialog never appears.
 */
export async function dismissBreakingChangeDialogIfPresent(page: Page): Promise<void> {
    const dialog = page.locator('.ilaris-changelog-notification')
    const appeared = await dialog
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() => true)
        .catch(() => false)
    if (!appeared) return
    await dialog
        .locator('button[data-action="acknowledge"], button:has-text("Verstanden")')
        .click()
        .catch(() => {})
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
}

export async function clearChatLog(page: Page) {
    const clearButtons = page.locator(
        '#chat-controls a[title*="Leeren"], #chat-controls a[title*="Clear"], [data-action="flush"], .chat-control-icon .fa-trash',
    )

    const hasVisibleUiClear =
        (await clearButtons.count()) > 0 &&
        (await clearButtons
            .first()
            .isVisible()
            .catch(() => false))

    if (hasVisibleUiClear) {
        await clearButtons.first().click()
        const confirm = page
            .locator('button:has-text("Ja"), button:has-text("Yes"), .dialog .yes')
            .first()
        if (await confirm.isVisible().catch(() => false)) {
            await confirm.click()
        }
        return
    }

    // Fallback when chat controls are not visible (e.g. chat sidebar collapsed): clear via Foundry API.
    await page.evaluate(async () => {
        const ids = (game.messages?.contents ?? []).map((m: any) => m.id)
        if (ids.length > 0) await ChatMessage.deleteDocuments(ids)
    })
}

export async function openActorSheet(page: Page, actorName: string) {
    const actorsTab = page
        .locator('[data-tab="actors"], a:has-text("Actors"), a:has-text("Akteure")')
        .first()
    await actorsTab.click()

    const actorEntry = page
        .locator('.directory-item, li.actor, [data-document-id]')
        .filter({ hasText: actorName })
        .first()

    await expect(actorEntry).toBeVisible({ timeout: 15000 })

    const actorWindow = page
        .locator('.window-app, .application')
        .filter({ hasText: actorName })
        .last()

    if (await actorWindow.isVisible().catch(() => false)) return actorWindow

    await actorEntry.dblclick()

    const openedByDblClick = await actorWindow
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false)

    if (!openedByDblClick) {
        // Fallback: render actor sheet directly via Foundry API when UI dblclick is flaky.
        const rendered = await page.evaluate((name) => {
            const actor = game?.actors?.getName?.(name)
            if (!actor?.sheet) return false
            actor.sheet.render(true)
            return true
        }, actorName)

        if (!rendered) {
            throw new Error(`Actor not found or sheet not renderable: ${actorName}`)
        }

        await actorWindow.waitFor({ state: 'visible', timeout: 15000 })
    }

    await expect(actorWindow).toBeVisible({ timeout: 15000 })
    return actorWindow
}

export async function openMeleeAttackDialogForWeapon(actorWindow: Locator, weaponName: string) {
    await actorWindow.locator('nav [data-tab="kampf"]').click()

    const row = actorWindow
        .locator('section.tab.kampf tbody tr')
        .filter({ hasText: weaponName })
        .first()

    await expect(row).toBeVisible({ timeout: 15000 })

    const rollable = row.locator('[data-action="rollable"][data-rolltype="angriff_diag"]').first()
    await rollable.click()
}

/**
 * Navigates to the Kampf-Tab and opens the Fernkampf-Angriff dialog.
 * If weaponName is given, the row is filtered by that name.
 * If omitted, the first available [data-rolltype="fernkampf_diag"] button is clicked.
 */
export async function openRangedAttackDialogForWeapon(actorWindow: Locator, weaponName?: string) {
    await actorWindow.locator('nav [data-tab="kampf"]').click()

    let rollable: Locator

    if (weaponName) {
        const row = actorWindow
            .locator('section.tab.kampf tbody tr')
            .filter({ hasText: weaponName })
            .first()
        await expect(row).toBeVisible({ timeout: 15000 })
        rollable = row.locator('[data-action="rollable"][data-rolltype="fernkampf_diag"]').first()
    } else {
        rollable = actorWindow
            .locator('section.tab.kampf [data-action="rollable"][data-rolltype="fernkampf_diag"]')
            .first()
    }

    await expect(rollable).toBeVisible({ timeout: 15000 })
    await rollable.click()
}

/**
 * Navigates to the "Übernatürlich" tab and clicks the roll icon for a spell or liturgy.
 * Handles both magie_diag (Zauber) and karma_diag (Liturgie) roll types.
 *
 * @param actorWindow - Locator for the actor sheet window
 * @param spellName - Optional spell/liturgy name to target; uses the first found if omitted
 */
export async function openSpellDialog(actorWindow: Locator, spellName?: string) {
    await actorWindow.locator('nav [data-tab="uebernatuerlich"]').click()

    let rollable: Locator

    const rollTypeSelector =
        '[data-action="rollable"][data-rolltype="magie_diag"], [data-action="rollable"][data-rolltype="karma_diag"]'

    if (spellName) {
        const row = actorWindow
            .locator('section.tab.uebernatuerlich tbody tr')
            .filter({ hasText: spellName })
            .first()
        await expect(row).toBeVisible({ timeout: 15000 })
        rollable = row.locator(rollTypeSelector).first()
    } else {
        rollable = actorWindow.locator(`section.tab.uebernatuerlich ${rollTypeSelector}`).first()
    }

    await expect(rollable).toBeVisible({ timeout: 15000 })
    await rollable.click()
}

/**
 * Captures the current default state of an actor so tests can safely restore it in cleanup.
 * Snapshot includes actor.system and all embedded item systems.
 */
export async function captureActorDefaultSnapshot(
    page: Page,
    actorName: string,
): Promise<ActorDefaultSnapshot> {
    const snapshot = await page.evaluate((name) => {
        const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
        const actor = game.actors?.getName(name)
        if (!actor) throw new Error(`Actor not found for snapshot: ${name}`)

        return {
            actorId: actor.id,
            actorName: actor.name,
            system: clone(actor.system),
            items: actor.items.map((item: any) => ({
                id: item.id,
                source: clone(item.toObject()),
            })),
        }
    }, actorName)

    return snapshot as ActorDefaultSnapshot
}

/**
 * Restores an actor to a previously captured snapshot.
 * This method is generic and can be reused by any E2E case.
 */
export async function restoreActorFromDefaultSnapshot(page: Page, snapshot: ActorDefaultSnapshot) {
    await page.evaluate(async (state) => {
        const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
        const actor = game.actors?.get(state.actorId) ?? game.actors?.getName(state.actorName)
        if (!actor) {
            throw new Error(`Actor not found during restore: ${state.actorName} (${state.actorId})`)
        }

        await actor.update({ system: clone(state.system) })

        const snapshotIds = new Set(state.items.map((i) => i.id))
        const currentIds = actor.items.map((i: any) => i.id)

        const toDelete = currentIds.filter((id: string) => !snapshotIds.has(id))
        if (toDelete.length > 0) {
            await actor.deleteEmbeddedDocuments('Item', toDelete)
        }

        const toCreate = state.items
            .filter((saved) => !actor.items.get(saved.id))
            .map((saved) => {
                const data = clone(saved.source)
                delete data._id
                return data
            })
        if (toCreate.length > 0) {
            await actor.createEmbeddedDocuments('Item', toCreate)
        }

        const updates = state.items
            .map((saved) => {
                const current = actor.items.get(saved.id)
                if (!current) return null
                const data = clone(saved.source)
                data._id = saved.id
                return data
            })
            .filter((u) => !!u)

        if (updates.length > 0) {
            await actor.updateEmbeddedDocuments('Item', updates)
        }
    }, snapshot)
}
