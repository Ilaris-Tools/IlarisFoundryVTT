import { expect, Locator, Page } from '@playwright/test'

export type FoundryCredentials = {
    url: string
    username: string
    worldName: string
    password?: string
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

    // Dismiss Foundry resolution / compatibility warnings programmatically
    await page
        .evaluate(() => {
            document
                .querySelectorAll(
                    '#notifications .notification, #notifications li, .notifications-list li',
                )
                .forEach((el) => el.remove())
        })
        .catch(() => {})

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
