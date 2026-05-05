import { expect, test } from '@playwright/test'

import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const HAUPTWAFFE_NAME = 'Ochsenherde'
const NEBENWAFFE_NAME = 'Kriegspferd'
const KAMPFSTIL = 'Reiterkampf'

const EXPECTED_AT_OCHSENHERDE = 28
const EXPECTED_AT_KRIEGSPFERD = 33

test.describe('E2E-012 Kampfstil-Auswahl und Berittener Kampf', () => {
    let actorDefaultSnapshot: ActorDefaultSnapshot | null = null

    test.afterEach(async ({ page }) => {
        if (!actorDefaultSnapshot) return

        try {
            await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
        } finally {
            actorDefaultSnapshot = null
        }
    })

    test('Kampfstil setzen erzeugt Warnung, Beritten-Checkbox hebt sie auf, AT-Modifier erscheint in Tabelle', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        // --- Precondition: set hauptwaffe/nebenwaffe and reset kampfstil via API ---
        await page.evaluate(
            async ({ actorName, hauptwaffeName, nebenwaffeName }) => {
                const actor = game.actors?.getName(actorName)
                if (!actor) throw new Error(`Actor "${actorName}" not found`)

                // Reset kampfstil and beritten
                await actor.update({
                    'system.misc.selected_kampfstil': 'ohne',
                    'system.misc.ist_beritten': false,
                })

                // Set hauptwaffe / nebenwaffe flags deterministically across all melee weapons
                let hauptCount = 0
                let nebenCount = 0
                for (const item of actor.items) {
                    if (item.type !== 'nahkampfwaffe') continue
                    const isHauptwaffe = item.name === hauptwaffeName
                    const isNebenwaffe = item.name === nebenwaffeName
                    await item.update({
                        'system.hauptwaffe': isHauptwaffe,
                        'system.nebenwaffe': isNebenwaffe,
                    })
                    if (isHauptwaffe) hauptCount += 1
                    if (isNebenwaffe) nebenCount += 1
                }

                if (hauptCount !== 1) {
                    throw new Error(
                        `Precondition invalid state: expected exactly 1 Hauptwaffe, got ${hauptCount}`,
                    )
                }
                if (nebenCount !== 1) {
                    throw new Error(
                        `Precondition invalid state: expected exactly 1 Nebenwaffe, got ${nebenCount}`,
                    )
                }

                const nebenwaffe = actor.items.find(
                    (i) => i.type === 'nahkampfwaffe' && i.name === nebenwaffeName,
                )
                if (!nebenwaffe) {
                    throw new Error(`Nebenwaffe "${nebenwaffeName}" not found`)
                }
            },
            {
                actorName: ACTOR_NAME,
                hauptwaffeName: HAUPTWAFFE_NAME,
                nebenwaffeName: NEBENWAFFE_NAME,
            },
        )

        // --- Open actor sheet ---
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        // Navigate to Kampf tab
        await actorWindow.locator('nav [data-tab="kampf"]').click()
        await expect(actorWindow.locator('section.tab[data-tab="kampf"]')).toBeVisible({
            timeout: 10000,
        })

        // --- Step 1: Select Kampfstil "Berittener Kampf" ---
        const kampfstilSelect = actorWindow.locator('select[name="system.misc.selected_kampfstil"]')
        await expect(kampfstilSelect).toBeVisible({ timeout: 10000 })
        await kampfstilSelect.selectOption(KAMPFSTIL)

        // Wait for actor update after submitOnChange
        await page.waitForFunction(
            ({ name, style }) => {
                const a = game.actors?.getName(name)
                return a?.system?.misc?.selected_kampfstil === style
            },
            { name: ACTOR_NAME, style: KAMPFSTIL },
            { timeout: 15000 },
        )

        // --- Step 2: Assert warning banner is visible ---
        const warningBanner = actorWindow.locator('.hero-kampf-alert-warning')
        await expect(warningBanner).toBeVisible({ timeout: 10000 })
        await expect(warningBanner).toContainText(
            'Kampfstil inaktiv: Der Charakter ist nicht beritten',
        )

        // --- Step 3: Activate Beritten checkbox ---
        const berittenCheckbox = actorWindow.locator('input[name="system.misc.ist_beritten"]')
        await expect(berittenCheckbox).toBeVisible({ timeout: 10000 })
        await berittenCheckbox.check()

        // Wait for actor update
        await page.waitForFunction(
            (name) => {
                const a = game.actors?.getName(name)
                return a?.system?.misc?.ist_beritten === true
            },
            ACTOR_NAME,
            { timeout: 15000 },
        )

        // --- Step 4: Assert warning banner is gone ---
        await expect(warningBanner).not.toBeVisible({ timeout: 10000 })
        await expect(warningBanner).toHaveCount(0)

        // --- Step 5: Assert AT values in the weapon table ---
        const kampfTab = actorWindow.locator('section.tab[data-tab="kampf"]')

        // Ochsenherde row: effective AT is exposed in tooltip as PW value
        const ochsenherdeRow = kampfTab.locator('tbody tr').filter({ hasText: HAUPTWAFFE_NAME })
        await expect(ochsenherdeRow).toBeVisible({ timeout: 10000 })
        const ochsenherdeAT = ochsenherdeRow.locator('td[data-rolltype="at"]')
        await expect(ochsenherdeAT).toHaveAttribute(
            'data-tooltip',
            new RegExp(`PW:\\s*\\+${EXPECTED_AT_OCHSENHERDE}`),
            { timeout: 10000 },
        )

        // Kriegspferd row: AT is shown directly in table cell text
        const kriegspferdRow = kampfTab.locator('tbody tr').filter({ hasText: NEBENWAFFE_NAME })
        await expect(kriegspferdRow).toBeVisible({ timeout: 10000 })
        const kriegspferdAT = kriegspferdRow.locator('td[data-rolltype="at"]')
        await expect(kriegspferdAT).toContainText(String(EXPECTED_AT_KRIEGSPFERD), {
            timeout: 10000,
        })
    })
})
