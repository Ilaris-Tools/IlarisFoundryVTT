/** E2E-043 – Ignifaxius creates and resolves the reusable Nachbrennen lifecycle. */
import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    enableTargetSelectionForTest,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openChatSidebar,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
    setFoundrySettingForTest,
} from '../../shared/fixtures/foundry'

const CASTER_NAME = 'HatAlles'
const TARGET_NAME = 'Testlauf-Held'
const COMPANION_NAME = 'Testlauf-Npc'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'
const SPELL_NAME = 'Ignifaxius Flammenstrahl'

type Fixture = {
    targetTokenId: string
    companionTokenId: string
    combatId?: string
    previousActiveCombatIds?: string[]
}

async function cleanup(page: import('@playwright/test').Page, fixture: Fixture | null) {
    await page
        .evaluate(
            async ({ targetTokenId, companionTokenId, combatId, previousActiveCombatIds }) => {
                const scene = canvas.scene as any
                if (combatId && game.combats?.has(combatId))
                    await game.combats.get(combatId)?.delete()
                if (previousActiveCombatIds?.length)
                    await Combat.updateDocuments(
                        previousActiveCombatIds.map((id: string) => ({ _id: id, active: true })),
                    )
                const tokenIds = [targetTokenId, companionTokenId].filter((tokenId) =>
                    scene?.tokens?.has(tokenId),
                )
                if (tokenIds.length) await scene.deleteEmbeddedDocuments('Token', tokenIds)
                for (const token of game.user.targets ?? [])
                    token.setTarget(false, { releaseOthers: false })
            },
            fixture || {},
        )
        .catch(() => {})
}

async function createTarget(page: import('@playwright/test').Page): Promise<Fixture> {
    const fixture = await page.evaluate(
        async ({ casterName, targetName, companionName }) => {
            const caster = game.actors.getName(casterName) as any
            const targetActor = game.actors.getName(targetName) as any
            const companionActor = game.actors.getName(companionName) as any
            const scene = canvas.scene as any
            const casterToken = canvas.tokens?.placeables?.find(
                (token: any) => token.actor?.id === caster?.id,
            )
            if (!caster || !targetActor || !companionActor || !scene || !casterToken)
                throw new Error('Nachbrennen-E2E fehlt.')

            const grid = canvas.grid.size
            const [target, companion] = await scene.createEmbeddedDocuments('Token', [
                {
                    name: 'E2E Nachbrennen-Ziel',
                    actorId: targetActor.id,
                    actorLink: false,
                    x: casterToken.center.x + grid * 3 - grid / 2,
                    y: casterToken.center.y - grid / 2,
                    flags: { Ilaris: { e2eNachbrennen: true } },
                },
                {
                    name: 'E2E Nachbrennen-Begleiter',
                    actorId: companionActor.id,
                    actorLink: true,
                    x: casterToken.center.x + grid * 5 - grid / 2,
                    y: casterToken.center.y - grid / 2,
                    flags: { Ilaris: { e2eNachbrennen: true } },
                },
            ])
            return { targetTokenId: target.id, companionTokenId: companion.id }
        },
        { casterName: CASTER_NAME, targetName: TARGET_NAME, companionName: COMPANION_NAME },
    )
    await page.waitForFunction(
        (tokenId) => Boolean(canvas.tokens?.get(tokenId)),
        fixture.targetTokenId,
    )
    await page.evaluate((tokenId) => {
        canvas.tokens?.get(tokenId)?.setTarget(true, { releaseOthers: true })
    }, fixture.targetTokenId)
    return fixture
}

test.describe('E2E-043 · Nachbrennen', () => {
    let fixture: Fixture | null = null
    let casterSnapshot: ActorDefaultSnapshot
    let targetSelectionSetting: Awaited<ReturnType<typeof enableTargetSelectionForTest>>
    let damageTypesSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot
    let diagnostics: string[] = []
    let manualEffect: { actorId: string; effectId: string } | null = null

    test.beforeEach(async ({ page }) => {
        diagnostics = []
        page.on('pageerror', (error) =>
            diagnostics.push(`pageerror: ${error.stack || error.message}`),
        )
        page.on('console', (message) => {
            if (message.type() === 'error') diagnostics.push(`console: ${message.text()}`)
        })
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)
        await openChatSidebar(page)
        targetSelectionSetting = await enableTargetSelectionForTest(page)
        damageTypesSetting = await setFoundrySettingForTest(
            page,
            'Ilaris',
            'damageTypes',
            await page.evaluate(() => {
                const types = JSON.parse(game.settings.get('Ilaris', 'damageTypes'))
                return JSON.stringify(
                    types.map((type: any) =>
                        type.value === 'FEUER'
                            ? {
                                  ...type,
                                  behavior: {
                                      ...(type.behavior || {}),
                                      elementalSideEffect: 'nachbrennen',
                                  },
                              }
                            : type,
                    ),
                )
            }),
        )
        casterSnapshot = await captureActorDefaultSnapshot(page, CASTER_NAME)
        await page.evaluate(
            async ({ casterName, packId, spellName }) => {
                const caster = game.actors.getName(casterName) as any
                const spell = caster?.items.find((item: any) => item.name === spellName)
                const source = (await (game.packs?.get(packId) as any)?.getDocuments?.())?.find(
                    (item: any) => item.name === spellName,
                )
                if (!spell || !source)
                    throw new Error('Ignifaxius fehlt im E2E-Akteur oder Kompendium.')
                // The shared caster fixture can legitimately have less energy than Ignifaxius costs.
                // Raise it only for this test; the captured actor snapshot restores the original value.
                await caster.update({ 'system.energien.asp.value': 20 })
                await spell.update({
                    'system.ballistic': foundry.utils.deepClone(source.system.ballistic),
                    'system.preEffects': foundry.utils.deepClone(source.system.preEffects),
                })
            },
            { casterName: CASTER_NAME, packId: SPELL_PACK, spellName: SPELL_NAME },
        )
    })

    test.afterEach(async ({ page }) => {
        if (manualEffect)
            await page
                .evaluate(
                    ({ actorId, effectId }) =>
                        game.actors
                            ?.get(actorId)
                            ?.deleteEmbeddedDocuments('ActiveEffect', [effectId]),
                    manualEffect,
                )
                .catch(() => {})
        manualEffect = null
        await cleanup(page, fixture)
        await restoreActorFromDefaultSnapshot(page, casterSnapshot).catch(() => {})
        await restoreFoundrySetting(page, targetSelectionSetting).catch(() => {})
        await restoreFoundrySetting(page, damageTypesSetting).catch(() => {})
        await clearChatLog(page).catch(() => {})
        await page.evaluate(() => delete (CONFIG.Dice as any).randomUniform).catch(() => {})
        expect(diagnostics).toEqual([])
    })

    test('a failed visible KO-20 check creates a four-phase status and resolves once', async ({
        page,
    }) => {
        fixture = await createTarget(page)
        const actorSheet = await openActorSheet(page, CASTER_NAME)
        await openSpellDialog(actorSheet, SPELL_NAME)
        const dialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(dialog).toBeVisible()
        await actorSheet.getByRole('button', { name: 'Close Window' }).click()
        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })
        await dialog.locator('[data-action="angreifen"]').click()
        await openChatSidebar(page)
        const decline = page.locator('.defend-button[data-weapon-id="no-defense"]').last()
        await expect(decline).toBeVisible({ timeout: 20000 })
        await decline.click()

        const countercheck = page
            .locator('.application, .dialog')
            .filter({ hasText: /Widerstandsprobe: .*Nachbrennen/ })
            .last()
        await expect(countercheck).toBeVisible({ timeout: 20000 })
        // A FertigkeitDialog resolves through its rendered preview action, not an OK button.
        // Use the opposite deterministic roll from the successful Ignifaxius cast.
        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.99
        })
        await countercheck.locator('[data-action="previewClick"]').click()
        await expect
            .poll(() =>
                page.evaluate((tokenId) => {
                    const actor = canvas.tokens?.get(tokenId)?.actor as any
                    return actor?.effects?.find((effect: any) =>
                        effect.statuses?.has?.('Nachbrennen'),
                    )?.system?.ilarisCondition?.sources?.[0]?.timing?.remaining
                }, fixture?.targetTokenId),
            )
            .toBe(4)
        await page
            .locator('#sidebar')
            .screenshot({ path: 'test-results/e2e-043-nachbrennen-pending.png' })
        const woundsAfterInitialDamage = await page.evaluate((tokenId) => {
            return (canvas.tokens?.get(tokenId)?.actor as any)?.system?.gesundheit?.wunden ?? 0
        }, fixture.targetTokenId)

        const combatState = await page.evaluate(
            async ({ tokenId, companionTokenId }) => {
                const scene = canvas.scene as any
                const previousActiveCombatIds = Array.from(game.combats ?? [])
                    .filter((entry: any) => entry.active)
                    .map((entry: any) => entry.id)
                if (previousActiveCombatIds.length)
                    await Combat.updateDocuments(
                        previousActiveCombatIds.map((id) => ({ _id: id, active: false })),
                    )
                const combat = await Combat.create({
                    name: 'E2E Nachbrennen-Phasen',
                    scene: scene.id,
                    active: true,
                    round: 0,
                    turn: null,
                    flags: { Ilaris: { e2eNachbrennen: true } },
                })
                await combat.createEmbeddedDocuments('Combatant', [
                    { tokenId, initiative: 20 },
                    { tokenId: companionTokenId, initiative: 10 },
                ])
                return { combatId: combat.id, previousActiveCombatIds }
            },
            { tokenId: fixture.targetTokenId, companionTokenId: fixture.companionTokenId },
        )
        fixture.combatId = combatState.combatId
        fixture.previousActiveCombatIds = combatState.previousActiveCombatIds
        const wasPaused = await page.evaluate(async (combatId) => {
            const combat = game.combats?.get(combatId)
            if (!combat) throw new Error('Nachbrennen-Kampf fehlt.')
            const paused = game.paused
            if (paused) await game.togglePause(false)
            ui.combat.viewed = combat
            ui.combat.render(true)
            return paused
        }, fixture.combatId)
        const combatTab = page.locator('#sidebar-tabs [data-tab="combat"]').first()
        await combatTab.click()
        const combatControls = page.locator('#sidebar .combat-controls').first()
        await expect(combatControls.locator('button[data-action="startCombat"]')).toBeVisible()
        await combatControls.locator('button[data-action="startCombat"]').click()
        const nextTurn = combatControls.locator('button[data-action="nextTurn"]').last()
        await expect(nextTurn).toBeVisible()
        // Four target-owned phases, interleaved with the companion's turns.
        for (let turn = 0; turn < 8; turn += 1) await nextTurn.click()
        if (wasPaused) await page.evaluate(() => game.togglePause(true))
        await expect
            .poll(() =>
                page.evaluate(
                    ({ tokenId }) => {
                        const actor = canvas.tokens?.get(tokenId)?.actor as any
                        return {
                            wounds: actor?.system?.gesundheit?.wunden ?? 0,
                            pending: actor?.effects?.some((effect: any) =>
                                effect.statuses?.has?.('Nachbrennen'),
                            ),
                        }
                    },
                    { tokenId: fixture?.targetTokenId },
                ),
            )
            .toEqual({ wounds: woundsAfterInitialDamage + 1, pending: false })
        await openChatSidebar(page)
        await expect(
            page.locator('.chat-message').filter({ hasText: 'erleidet 1 Wunde' }).last(),
        ).toBeVisible()
        await page
            .locator('#sidebar')
            .screenshot({ path: 'test-results/e2e-043-nachbrennen-complete.png' })
    })

    test('the existing effect-row delete control extinguishes only Nachbrennen', async ({
        page,
    }) => {
        fixture = await createTarget(page)
        const state = await page.evaluate(async (targetName) => {
            const actor = game.actors?.getName(targetName) as any
            if (!actor) throw new Error('Nachbrennen-Ziel für das Löschen fehlt.')
            const { addConditionSource } =
                await import('/systems/Ilaris/scripts/effects/status-conditions.js')
            const effect = await addConditionSource(actor, 'Nachbrennen', {
                id: 'e2e-nachbrennen-pending',
                type: 'nachbrennen',
                timing: { durationType: 'ownerTurns', expiresOn: 'turnStart', remaining: 4 },
            })
            await addConditionSource(actor, 'Nachbrennen', { id: 'e2e-unrelated', type: 'manual' })
            actor.sheet.render(true)
            return {
                actorId: actor.id,
                effectId: effect.id,
                wounds: actor.system.gesundheit.wunden,
            }
        }, TARGET_NAME)
        manualEffect = { actorId: state.actorId, effectId: state.effectId }
        const targetSheet = page
            .locator('.application, .window-app')
            .filter({ hasText: TARGET_NAME })
            .last()
        await expect(targetSheet).toBeVisible()
        await targetSheet.locator('nav [data-tab="effekte"]').click()
        const deleteControl = targetSheet.locator(
            `[data-action="itemDelete"][data-itemclass="effect"][data-itemid="${state.effectId}"]`,
        )
        await expect(deleteControl).toBeVisible()
        await targetSheet.screenshot({ path: 'test-results/e2e-043-nachbrennen-extinguish.png' })
        await deleteControl.click()
        await expect
            .poll(() =>
                page.evaluate((actorId) => {
                    const effect = (game.actors?.get(actorId) as any)?.effects?.find((entry: any) =>
                        entry.statuses?.has?.('Nachbrennen'),
                    )
                    return (
                        effect?.system?.ilarisCondition?.sources?.map(
                            (source: any) => source.type,
                        ) ?? []
                    )
                }, state.actorId),
            )
            .toEqual(['manual'])
        const woundsAfterPhases = await page.evaluate(async (actorId) => {
            const actor = game.actors?.get(actorId) as any
            const { reduceConditionSourcesForCombatant } =
                await import('/systems/Ilaris/scripts/effects/status-conditions.js')
            for (let phase = 0; phase < 4; phase += 1)
                await reduceConditionSourcesForCombatant({ actor }, 'turnStart')
            return actor.system.gesundheit.wunden
        }, state.actorId)
        expect(woundsAfterPhases).toBe(state.wounds)
    })
})
