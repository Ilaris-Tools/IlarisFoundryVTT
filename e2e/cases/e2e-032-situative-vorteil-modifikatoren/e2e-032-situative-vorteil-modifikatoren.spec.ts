/**
 * E2E-032 – contextual Vorteil modifiers in skill and supernatural dialogs.
 *
 * @spec openspec/changes/add-contextual-roll-modifiers/specs/contextual-roll-modifiers/spec.md
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'

async function importVorteil(page: import('@playwright/test').Page, name: string) {
    await page.evaluate(
        async ({ actorName, vorteilName }) => {
            const actor = game.actors.getName(actorName)
            const pack = game.packs.get('Ilaris.vorteile')
            if (!actor || !pack)
                throw new Error(`Actor or Vorteil pack not found for ${vorteilName}`)

            const index = await pack.getIndex()
            const entry = index.find((item) => item.name === vorteilName)
            if (!entry) throw new Error(`Vorteil not found: ${vorteilName}`)

            const source = (await pack.getDocument(entry._id)).toObject()
            delete source._id
            await actor.createEmbeddedDocuments('Item', [source])
        },
        { actorName: ACTOR_NAME, vorteilName: name },
    )
}

async function rollSkillAndReadFormula(
    page: import('@playwright/test').Page,
    dialog: import('@playwright/test').Locator,
) {
    const before = await page.evaluate(() => game.messages.contents.length)
    await dialog.locator('[data-action="previewClick"]').click()
    await page.waitForFunction((baseline) => game.messages.contents.length > baseline, before, {
        timeout: 20000,
    })
    return page.evaluate(() => game.messages.contents.at(-1)?.rolls?.[0]?.formula ?? '')
}

test.describe('E2E-032 · Situative Vorteil-Modifikatoren', () => {
    let snapshot: ActorDefaultSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        snapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(() => {
                delete (CONFIG.Dice as any).randomUniform
            })
            .catch(() => {})
        await restoreActorFromDefaultSnapshot(page, snapshot).catch(() => {})
        await clearChatLog(page).catch(() => {})
    })

    test('skill situation shows Zerstörerisch I and includes it in the deterministic roll', async ({
        page,
    }) => {
        await importVorteil(page, 'Zerstörerisch I')
        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await actorWindow.locator('nav [data-tab="fertigkeiten"]').click()

        const rollable = actorWindow
            .locator(
                'section.tab.fertigkeiten tbody tr.main-row td[data-action="rollable"][data-rolltype="fertigkeit_diag"]',
            )
            .first()
        await rollable.click()

        const dialog = page.locator('.application.ilaris.fertigkeit-dialog').last()
        await expect(dialog).toBeVisible({ timeout: 15000 })
        const situation = dialog.locator('select[id^="situation-"]')
        await situation.selectOption('gegenstandZerstoeren')

        await expect(
            dialog
                .locator('.modifier-item')
                .filter({ hasText: 'Gegenstand zerstören/durchbrechen' }),
        ).toContainText('+4', { timeout: 5000 })

        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.5
        })
        const formula = await rollSkillAndReadFormula(page, dialog)
        expect(formula).toMatch(/\+\s*4\s*$/)
    })

    test('supernatural condition shows Scharfsinnig I and includes it in the deterministic roll', async ({
        page,
    }) => {
        await importVorteil(page, 'Scharfsinnig I')
        const spellName = await page.evaluate((actorName) => {
            const actor = game.actors.getName(actorName)
            return actor?.items.find((item) => item.type === 'zauber')?.name ?? ''
        }, ACTOR_NAME)
        expect(spellName).toBeTruthy()

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, spellName)
        const dialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(dialog).toBeVisible({ timeout: 15000 })

        const situation = dialog.locator(
            'input[name="ilaris-situation"][value="ermittlungRecherche"]',
        )
        await expect(situation).toBeVisible({ timeout: 10000 })
        await situation.check()

        await expect(
            dialog.locator('.modifier-item').filter({ hasText: 'Ermittlung & Recherche' }),
        ).toContainText('2', { timeout: 5000 })

        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.5
        })
        const before = await page.evaluate(() => game.messages.contents.length)
        await dialog.locator('[data-action="angreifen"]').click()
        await page.waitForFunction((baseline) => game.messages.contents.length > baseline, before, {
            timeout: 20000,
        })
        const formula = await page.evaluate(
            (baseline) => game.messages.contents.slice(baseline)[0]?.rolls?.[0]?.formula ?? '',
            before,
        )
        expect(formula).toMatch(/\+\s*2\s*$/)
    })
})
