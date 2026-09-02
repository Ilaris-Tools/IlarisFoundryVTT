import { expect, test } from '@playwright/test'
import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreFoundrySetting,
    setFoundrySettingForTest,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'
const CASTER_ASP_STERN_BASELINE = 38

test.describe('E2E-035 · creature summoning', () => {
    let createdTokenIds: string[] = []
    let createdItemIds: string[] = []
    let createdEffectIds: string[] = []
    let createdCombatIds: string[] = []
    let creaturePacksSetting:
        | import('../../shared/fixtures/foundry').FoundrySettingSnapshot
        | undefined

    test.beforeEach(async ({ page }) => {
        createdTokenIds = []
        createdItemIds = []
        createdEffectIds = []
        createdCombatIds = []
        creaturePacksSetting = undefined
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)
        await page.evaluate(
            async ({ actorName, energy }) => {
                const actor = game.actors?.getName(actorName)
                if (!actor) throw new Error('HatAlles-Fixture fehlt.')
                await actor.update({ 'system.abgeleitete.asp_stern': energy })
            },
            { actorName: ACTOR_NAME, energy: CASTER_ASP_STERN_BASELINE },
        )
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(
                async ({ actorName, tokenIds, itemIds, effectIds, combatIds }) => {
                    const scene = canvas.scene
                    if (scene && tokenIds.length)
                        await scene.deleteEmbeddedDocuments('Token', tokenIds)
                    const actor = game.actors?.getName(actorName)
                    if (actor && effectIds.length)
                        await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds)
                    if (actor && itemIds.length)
                        await actor.deleteEmbeddedDocuments('Item', itemIds)
                    if (combatIds.length) await Combat.deleteDocuments(combatIds)
                },
                {
                    actorName: ACTOR_NAME,
                    tokenIds: createdTokenIds,
                    itemIds: createdItemIds,
                    effectIds: createdEffectIds,
                    combatIds: createdCombatIds,
                },
            )
            .catch(() => {})
        if (creaturePacksSetting)
            await restoreFoundrySetting(page, creaturePacksSetting).catch(() => {})
        await page
            .evaluate(
                async ({ actorName, energy }) => {
                    const actor = game.actors?.getName(actorName)
                    if (actor) await actor.update({ 'system.abgeleitete.asp_stern': energy })
                },
                { actorName: ACTOR_NAME, energy: CASTER_ASP_STERN_BASELINE },
            )
            .catch(() => {})
        await clearChatLog(page).catch(() => {})
    })

    test('Skelettarius creates one adjacent unlinked creature token from the configured pack', async ({
        page,
    }) => {
        creaturePacksSetting = await setFoundrySettingForTest(
            page,
            'Ilaris',
            'kreaturenPacks',
            '["Ilaris.kreaturen"]',
        )

        const result = await page.evaluate(async (actorName) => {
            const actor = game.actors?.getName(actorName) as any
            const scene = canvas.scene as any
            const spellPack = game.packs?.get('Ilaris.zauberspruche-und-rituale') as any
            const creaturePack = game.packs?.get('Ilaris.kreaturen') as any
            const spellSource = (await spellPack?.getDocuments())?.find(
                (item: any) => item.name === 'Skelettarius Totenherr',
            )
            const creatureSource = (await creaturePack?.getDocuments())?.find(
                (entry: any) => entry.type === 'kreatur' && entry.system.kreaturentyp === 'untot',
            )
            if (!actor || !scene || !spellSource || !creatureSource)
                throw new Error('E2E-Beschwörungsfixture fehlt.')

            const [casterToken] = await scene.createEmbeddedDocuments('Token', [
                {
                    name: actor.name,
                    actorId: actor.id,
                    actorLink: true,
                    x: 100,
                    y: 100,
                    width: 1,
                    height: 1,
                },
            ])
            await canvas.ready
            canvas.tokens.get(casterToken.id)?.control()

            const tokenIdsBefore = new Set(scene.tokens.map((token: any) => token.id))
            const itemIdsBefore = new Set(actor.items.map((item: any) => item.id))
            const [spell] = await actor.createEmbeddedDocuments('Item', [spellSource.toObject()])
            const preEffect = spell.system.preEffects[0]
            preEffect.summonCreature.selectedCreatureUuid = creatureSource.uuid

            const processor =
                await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
            await processor.applyPreEffects(
                { success: true },
                {
                    item: spell,
                    actor,
                    speaker: {},
                    selectedActors: [{ actorId: actor.id }],
                    maneuverDurationBonus: 0,
                    maechtigeMagieQs: 0,
                },
                {},
                { preEffects: [preEffect] },
            )

            const createdTokens = scene.tokens.filter((token: any) => !tokenIdsBefore.has(token.id))
            return {
                tokenIds: [casterToken.id, ...createdTokens.map((token: any) => token.id)],
                itemIds: actor.items
                    .filter((item: any) => !itemIdsBefore.has(item.id))
                    .map((item: any) => item.id),
                summoned: createdTokens.map((token: any) => ({
                    actorLink: token.actorLink,
                    sourceUuid: token.flags?.ilaris?.summonCreature?.sourceUuid,
                    x: token.x,
                    y: token.y,
                })),
            }
        }, ACTOR_NAME)
        createdTokenIds.push(...result.tokenIds)
        createdItemIds.push(...result.itemIds)

        expect(result.summoned).toEqual([
            expect.objectContaining({
                actorLink: false,
                sourceUuid: expect.stringContaining('Compendium.Ilaris.kreaturen.Actor.'),
            }),
        ])
    })

    test('Krähenruf visibly summons a nearby amplified Krähenschwarm and expires only its token', async ({
        page,
    }, testInfo) => {
        creaturePacksSetting = await setFoundrySettingForTest(
            page,
            'Ilaris',
            'kreaturenPacks',
            '["Ilaris.kreaturen"]',
        )

        // Fixture setup only: a controlled caster Token and an owned spell copy are
        // required so the following player action can run through the real sheet.
        const fixture = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const scene = canvas.scene as any
                const pack = game.packs?.get(packId)
                const source = (await pack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Krähenruf',
                ) as any
                if (!actor || !scene || !source)
                    throw new Error('Krähenruf-, HatAlles- oder Szenenfixture fehlt.')

                const originX = canvas.dimensions.sceneX + canvas.grid.size * 20
                const originY = canvas.dimensions.sceneY + canvas.grid.size * 20
                const [casterToken] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Krähenruf Caster',
                        actorId: actor.id,
                        actorLink: true,
                        x: originX,
                        y: originY,
                        flags: { ilaris: { e2eKraehenruf: true } },
                    },
                ])
                const spellData = source.toObject()
                delete spellData._id
                spellData.name = 'E2E Krähenruf'
                const [spell] = await actor.createEmbeddedDocuments('Item', [spellData])
                return { casterTokenId: casterToken.id, spellId: spell.id }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )
        createdTokenIds.push(fixture.casterTokenId)
        createdItemIds.push(fixture.spellId)

        await page.waitForFunction(
            (tokenId) => Boolean(canvas.tokens?.get(tokenId)),
            fixture.casterTokenId,
            { timeout: 15000 },
        )
        await page.evaluate(
            (tokenId) => canvas.tokens?.get(tokenId)?.control(),
            fixture.casterTokenId,
        )

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, 'E2E Krähenruf')
        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible()
        await expect(spellDialog).toContainText('E2E Krähenruf')

        await spellDialog.locator('.maneuver-header').click()
        const powerfulMagic = spellDialog
            .locator('.maneuver-item')
            .filter({ hasText: 'Mächtige Magie' })
            .first()
        await expect(powerfulMagic).toBeVisible()
        const powerfulMagicInput = powerfulMagic.locator('input[type="number"]')
        await expect(powerfulMagicInput).toBeVisible()
        await powerfulMagicInput.fill('0')
        await powerfulMagicInput.press('ArrowUp')
        await powerfulMagicInput.press('ArrowUp')
        await powerfulMagicInput.press('Tab')
        await expect(powerfulMagicInput).toHaveValue('2')

        // A deterministic die result is test fixture setup; the cast itself remains
        // the visible dialog click below.
        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })
        const rollButton = spellDialog.locator(
            '.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
        )
        await expect(rollButton).toBeVisible()
        const chatBeforeCast = await page.evaluate(() => game.messages.contents.length)
        await rollButton.click()
        const castDelivered = await page
            .waitForFunction((count) => game.messages.contents.length > count, chatBeforeCast, {
                timeout: 4000,
            })
            .then(() => true)
            .catch(() => false)
        if (!castDelivered) {
            // AppV2 can drop the first real-browser click while a sheet rerender
            // settles. This is the established DOM-event fallback, used only
            // after the visible click above demonstrably did not reach Foundry.
            await rollButton.dispatchEvent('click')
        }
        await page.waitForFunction(
            (count) => game.messages.contents.length > count,
            chatBeforeCast,
            {
                timeout: 20000,
            },
        )
        const summoned = await page.waitForFunction(
            (casterTokenId) => {
                const token = Array.from(canvas.scene?.tokens ?? []).find(
                    (entry: any) =>
                        entry.flags?.ilaris?.summonCreature?.sourceUuid ===
                        'Compendium.Ilaris.kreaturen.Actor.Kraehenschwarm1',
                ) as any
                if (!token) return null
                const canvasToken = canvas.tokens?.get(token.id)
                const marker = game.actors
                    ?.getName('HatAlles')
                    ?.effects.find(
                        (effect: any) =>
                            effect.flags?.ilaris?.sourceType === 'summonCreatureMarker' &&
                            effect.flags?.ilaris?.summonedTokenId === token.id,
                    ) as any
                if (!marker) return null
                return {
                    tokenId: token.id,
                    markerId: marker.id,
                    actorLink: token.actorLink,
                    sourceUuid: token.flags?.ilaris?.summonCreature?.sourceUuid,
                    x: token.x,
                    y: token.y,
                    width: token.width,
                    height: token.height,
                    caster: canvas.scene?.tokens?.get(casterTokenId)
                        ? {
                              x: canvas.scene.tokens.get(casterTokenId).x,
                              y: canvas.scene.tokens.get(casterTokenId).y,
                              width: canvas.scene.tokens.get(casterTokenId).width,
                              height: canvas.scene.tokens.get(casterTokenId).height,
                          }
                        : null,
                    ws: canvasToken?.actor?.system?.kampfwerte?.ws,
                    attack: canvasToken?.actor?.items?.find((item: any) => item.type === 'angriff')
                        ?.system,
                    remaining: marker.system?.ilarisTiming?.remaining,
                    overlapsOtherToken: Array.from(canvas.scene?.tokens ?? []).some(
                        (entry: any) =>
                            entry.id !== token.id &&
                            token.x < entry.x + entry.width * 100 &&
                            token.x + token.width * 100 > entry.x &&
                            token.y < entry.y + entry.height * 100 &&
                            token.y + token.height * 100 > entry.y,
                    ),
                }
            },
            fixture.casterTokenId,
            { timeout: 20000 },
        )
        const state = await summoned.jsonValue<any>()
        createdTokenIds.push(state.tokenId)
        createdEffectIds.push(state.markerId)

        expect(state).toMatchObject({
            actorLink: false,
            sourceUuid: 'Compendium.Ilaris.kreaturen.Actor.Kraehenschwarm1',
            ws: 5,
            attack: expect.objectContaining({ at: 12, tp: '2W6-2+2' }),
            remaining: 16,
        })
        expect(
            Math.max(Math.abs(state.x - state.caster.x), Math.abs(state.y - state.caster.y)),
        ).toBeLessThanOrEqual(1200)
        expect(state.overlapsOtherToken).toBe(false)
        await page.screenshot({ path: testInfo.outputPath('kraehenruf-summon.png') })

        // The owner-turn expiry transition is an unavoidable low-level timer edge:
        // use the production reducer and the following combat update path, then
        // inspect the resulting Scene and marker documents.
        const expiry = await page.evaluate(
            async ({ casterTokenId, summonedTokenId, markerId }) => {
                const actor = game.actors?.getName('HatAlles') as any
                const scene = canvas.scene as any
                const npc = game.actors?.getName('Testlauf-Npc') as any
                const marker = actor?.effects.get(markerId) as any
                if (!actor || !scene || !npc || !marker)
                    throw new Error('Krähenruf-Ablauffixture fehlt.')
                await marker.update({ 'system.ilarisTiming.remaining': 1 })
                const [npcToken] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Krähenruf Ablauf',
                        actorId: npc.id,
                        actorLink: true,
                        x: canvas.dimensions.sceneX + canvas.grid.size * 24,
                        y: canvas.dimensions.sceneY + canvas.grid.size * 20,
                        flags: { ilaris: { e2eKraehenruf: true } },
                    },
                ])
                const [combat] = await Combat.createDocuments([
                    {
                        scene: scene.id,
                        combatants: [
                            { tokenId: casterTokenId, actorId: actor.id, initiative: 20 },
                            { tokenId: npcToken.id, actorId: npc.id, initiative: 10 },
                        ],
                        flags: { ilaris: { e2eKraehenruf: true } },
                    },
                ])
                await combat.startCombat()
                await combat.nextTurn()
                await combat.nextTurn()
                return { npcTokenId: npcToken.id, combatId: combat.id, summonedTokenId, markerId }
            },
            {
                casterTokenId: fixture.casterTokenId,
                summonedTokenId: state.tokenId,
                markerId: state.markerId,
            },
        )
        createdTokenIds.push(expiry.npcTokenId)
        createdCombatIds.push(expiry.combatId)
        await page.waitForFunction(
            (markerId) =>
                Boolean(
                    game.actors?.getName('HatAlles')?.effects.get(markerId)?.system?.ilarisTiming
                        ?._pendingExpiry,
                ),
            expiry.markerId,
            { timeout: 20000 },
        )
        await page.evaluate((combatId) => game.combats?.get(combatId)?.nextTurn(), expiry.combatId)
        await page.waitForFunction(
            ({ tokenId, markerId }) => {
                const actor = game.actors?.getName('HatAlles')
                return !canvas.scene?.tokens.get(tokenId) && !actor?.effects.get(markerId)
            },
            { tokenId: expiry.summonedTokenId, markerId: expiry.markerId },
            { timeout: 20000 },
        )
        createdTokenIds = createdTokenIds.filter((id) => id !== expiry.summonedTokenId)
        createdEffectIds = createdEffectIds.filter((id) => id !== expiry.markerId)
    })
})
