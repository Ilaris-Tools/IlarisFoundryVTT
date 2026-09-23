/**
 * E2E-031 - Supernatural ActiveEffect stacking in combat context.
 *
 * Creates temporary effects only on the dedicated E2E actor and removes them
 * after each run. The assertions use the actual melee dialog context, which
 * also drives the rendered applied-modifier rows and suppression disclosure.
 */

import { expect, test } from '@playwright/test'
import {
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openMeleeAttackDialogForWeapon,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'Testlauf-Held'

test.describe('E2E-031 - Supernatural effect stacking', () => {
    let effectIds: string[] = []
    let stackingSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        stackingSetting = await page.evaluate(async () => {
            const namespace = 'Ilaris'
            const key = 'supernaturalEffectStacking'
            return { namespace, key, value: game.settings.get(namespace, key) }
        })

        effectIds = await page.evaluate(async (actorName) => {
            const actor = game.actors.getName(actorName)
            if (!actor) throw new Error(`Actor not found: ${actorName}`)
            const makeEffect = (name: string, value: string) => ({
                name,
                changes: [],
                system: {
                    ilarisSource: 'uebernatuerlich',
                    ilarisModifiers: [
                        {
                            phase: 'roll',
                            target: 'at',
                            value,
                            stacking: 'strongest-supernatural',
                            selector: {},
                        },
                    ],
                },
                flags: { ilaris: { sourceType: 'uebernatuerlich' } },
            })
            const created = await actor.createEmbeddedDocuments('ActiveEffect', [
                makeEffect('E2E Mirakel +8', '8'),
                makeEffect('E2E Fluch -5', '-5'),
                makeEffect('E2E Fluch -3', '-3'),
            ])
            return created.map((effect: any) => effect.id)
        }, ACTOR_NAME)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(
                async ({ actorName, ids }) => {
                    const actor = game.actors.getName(actorName)
                    if (actor && ids.length)
                        await actor.deleteEmbeddedDocuments('ActiveEffect', ids)
                },
                { actorName: ACTOR_NAME, ids: effectIds },
            )
            .catch(() => {})
        await restoreFoundrySetting(page, stackingSetting).catch(() => {})
    })

    async function readCombatContext(page: import('@playwright/test').Page) {
        return page.evaluate(async (actorName) => {
            const actor = game.actors.getName(actorName)
            const item = actor?.items.find((candidate: any) => candidate.type === 'nahkampfwaffe')
            if (!actor || !item) throw new Error('Melee actor or weapon not found')

            const { AngriffDialog } =
                await import('/systems/Ilaris/scripts/combat/dialogs/angriff.js')
            const dialog = new AngriffDialog(actor, item)
            const result = dialog.getIlarisModifierResult('at')
            const summary = dialog.getSummaryContext({ baseAT: 0, baseVT: 0 }, 0, 0, '1d20')
            return {
                value: result.value,
                selected: result.selected.map((entry: any) => entry.sourceName),
                suppressed: result.suppressed.map((entry: any) => entry.sourceName),
                attackRows: summary.sections[0].rows.map((row: any) => row.label),
                suppression: summary.sections[0].suppression,
            }
        }, ACTOR_NAME)
    }

    test('selects strongest positive and negative components, then switches to Foundry stacking', async ({
        page,
    }) => {
        const ilaris = await readCombatContext(page)

        expect(ilaris.selected).toEqual(expect.arrayContaining(['E2E Mirakel +8', 'E2E Fluch -5']))
        expect(ilaris.suppressed).toContain('E2E Fluch -3')
        expect(ilaris.attackRows).toEqual(
            expect.arrayContaining(['Ilaris: E2E Mirakel +8', 'Ilaris: E2E Fluch -5']),
        )
        expect(ilaris.suppression.entries).toEqual(
            expect.arrayContaining([expect.objectContaining({ sourceName: 'E2E Fluch -3' })]),
        )

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openMeleeAttackDialogForWeapon(actorWindow, 'Kurzschwert')
        const attackDialog = page.locator('.application.angriff-dialog').last()
        const attackSummary = attackDialog.locator('.modifier-summary.attack-summary')
        await expect(attackSummary).toContainText('Ilaris: E2E Mirakel +8')
        await expect(attackSummary).toContainText('Ilaris: E2E Fluch -5')
        await expect(attackSummary).not.toContainText('Ilaris: E2E Fluch -3')
        const disclosure = attackSummary.locator('details.ilaris-suppression-ledger')
        await disclosure.locator('summary').click()
        await expect(disclosure).toContainText('E2E Fluch -3')

        await page.evaluate(() =>
            game.settings.set('Ilaris', 'supernaturalEffectStacking', 'foundry'),
        )
        const foundry = await readCombatContext(page)

        expect(foundry.selected).toEqual(
            expect.arrayContaining(['E2E Mirakel +8', 'E2E Fluch -5', 'E2E Fluch -3']),
        )
        expect(foundry.suppressed).toHaveLength(0)
    })
})
