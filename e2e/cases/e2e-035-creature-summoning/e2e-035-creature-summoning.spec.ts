import { expect, test } from '@playwright/test'
import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    restoreFoundrySetting,
    setFoundrySettingForTest,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'

test.describe('E2E-035 · creature summoning', () => {
    let createdTokenIds: string[] = []
    let createdItemIds: string[] = []
    let creaturePacksSetting:
        | import('../../shared/fixtures/foundry').FoundrySettingSnapshot
        | undefined

    test.beforeEach(async ({ page }) => {
        createdTokenIds = []
        createdItemIds = []
        creaturePacksSetting = undefined
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(
                async ({ actorName, tokenIds, itemIds }) => {
                    const scene = canvas.scene
                    if (scene && tokenIds.length)
                        await scene.deleteEmbeddedDocuments('Token', tokenIds)
                    const actor = game.actors?.getName(actorName)
                    if (actor && itemIds.length)
                        await actor.deleteEmbeddedDocuments('Item', itemIds)
                },
                { actorName: ACTOR_NAME, tokenIds: createdTokenIds, itemIds: createdItemIds },
            )
            .catch(() => {})
        if (creaturePacksSetting)
            await restoreFoundrySetting(page, creaturePacksSetting).catch(() => {})
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
})
