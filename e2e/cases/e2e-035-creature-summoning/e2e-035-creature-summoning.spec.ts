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
const KRAEHENRUF_FIXTURE_NAME = 'E2E Krähenruf (Fixture)'
const KRAEHENRUF_FIXTURE_FLAG = 'e2eKraehenrufFixture'

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
            const { getCreatureSourceOptions } =
                await import('/systems/Ilaris/scripts/effects/pre-effects/summoned-creatures.js')
            const selectedCreature = (await getCreatureSourceOptions(['untot'])).find(
                (option: any) =>
                    option.uuid === creatureSource.uuid || option.name === creatureSource.name,
            )
            if (!selectedCreature) throw new Error('Skelettarius-Auswahl fehlt im Kreaturenpicker.')
            preEffect.summonCreature.selectedCreatureUuid = selectedCreature.uuid

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
                selectedCreatureUuid: selectedCreature.uuid,
                sourceCreatureUuid: creatureSource.uuid,
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
        expect(result.selectedCreatureUuid).toBe(result.sourceCreatureUuid)
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
            async ({ actorName, packId, fixtureName, fixtureFlag }) => {
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
                let spell = actor.items.find(
                    (item: any) => item.flags?.ilaris?.[fixtureFlag],
                ) as any
                const boundResourceCost = {
                    enabled: true,
                    resource: 'gasp',
                    amount: 2,
                }
                if (spell) {
                    await spell.update({
                        'system.preEffects.0': {
                            ...foundry.utils.deepClone(source.system.preEffects[0]),
                            summonCreature: {
                                ...foundry.utils.deepClone(
                                    source.system.preEffects[0].summonCreature,
                                ),
                                boundResourceCost,
                            },
                        },
                    })
                } else {
                    const spellData = source.toObject()
                    delete spellData._id
                    spellData.name = fixtureName
                    spellData.flags ??= {}
                    spellData.flags.ilaris = {
                        ...(spellData.flags.ilaris || {}),
                        [fixtureFlag]: true,
                    }
                    spellData.system.preEffects[0].summonCreature.boundResourceCost =
                        boundResourceCost
                    ;[spell] = await actor.createEmbeddedDocuments('Item', [spellData])
                }
                return {
                    casterTokenId: casterToken.id,
                    boundGasp: Number(actor.system.abgeleitete.gasp) || 0,
                }
            },
            {
                actorName: ACTOR_NAME,
                packId: SPELL_PACK,
                fixtureName: KRAEHENRUF_FIXTURE_NAME,
                fixtureFlag: KRAEHENRUF_FIXTURE_FLAG,
            },
        )
        createdTokenIds.push(fixture.casterTokenId)

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
        await openSpellDialog(actorWindow, KRAEHENRUF_FIXTURE_NAME)
        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible()
        await expect(spellDialog).toContainText(KRAEHENRUF_FIXTURE_NAME)

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
                    boundGasp:
                        Number(game.actors?.getName('HatAlles')?.system?.abgeleitete?.gasp) || 0,
                    boundResource: token.flags?.ilaris?.summonCreature?.boundResource,
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
            boundGasp: fixture.boundGasp + 2,
            boundResource: expect.objectContaining({ resource: 'gasp', amount: 2 }),
        })
        expect(
            Math.max(Math.abs(state.x - state.caster.x), Math.abs(state.y - state.caster.y)),
        ).toBeLessThanOrEqual(1200)
        expect(state.overlapsOtherToken).toBe(false)
        await expect(page.locator('.application.fertigkeit-dialog')).toHaveCount(0)
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
        await expect
            .poll(() =>
                page.evaluate(
                    (actorName) =>
                        Number(game.actors?.getName(actorName)?.system?.abgeleitete?.gasp) || 0,
                    ACTOR_NAME,
                ),
            )
            .toBe(fixture.boundGasp)
        createdTokenIds = createdTokenIds.filter((id) => id !== expiry.summonedTokenId)
        createdEffectIds = createdEffectIds.filter((id) => id !== expiry.markerId)
    })

    test('Skelettarius visibly filters the creature picker and opens a Beherrschungsprobe', async ({
        page,
    }, testInfo) => {
        const pageErrors: string[] = []
        page.on('pageerror', (error) => pageErrors.push(error.message))
        creaturePacksSetting = await setFoundrySettingForTest(
            page,
            'Ilaris',
            'kreaturenPacks',
            '["Ilaris.kreaturen"]',
        )
        const fixture = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const scene = canvas.scene as any
                const spellPack = game.packs?.get(packId) as any
                const creaturePack = game.packs?.get('Ilaris.kreaturen') as any
                const source = (await spellPack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Skelettarius Totenherr',
                ) as any
                const creatures = (await creaturePack?.getDocuments()) || []
                const creature = creatures.find(
                    (entry: any) =>
                        entry.type === 'kreatur' &&
                        entry.system.kreaturentyp === 'untot' &&
                        entry.name === 'Skelett mit Rüstung',
                ) as any
                const blockerActor = game.actors?.getName('Testlauf-Npc') as any
                if (!actor || !scene || !source || !creature || !blockerActor)
                    throw new Error('Skelettarius-Pickerfixture fehlt.')

                const gridSize = canvas.grid.size
                const originX = canvas.dimensions.sceneX + gridSize * 20
                const originY = canvas.dimensions.sceneY + gridSize * 20
                const [casterToken, blockerToken] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Skelettarius Caster',
                        actorId: actor.id,
                        actorLink: true,
                        x: originX,
                        y: originY,
                        flags: { ilaris: { e2eSkelettariusPicker: true } },
                    },
                    {
                        name: 'E2E Skelettarius Blocker',
                        actorId: blockerActor.id,
                        actorLink: true,
                        x: originX - gridSize,
                        y: originY - gridSize,
                        flags: { ilaris: { e2eSkelettariusPicker: true } },
                    },
                ])
                const spellData = source.toObject()
                delete spellData._id
                spellData.name = 'E2E Skelettarius Picker'
                spellData.flags ??= {}
                spellData.flags.ilaris = {
                    ...(spellData.flags.ilaris || {}),
                    e2eSkelettariusPicker: true,
                }
                spellData.system.preEffects[0] = {
                    ...foundry.utils.deepClone(spellData.system.preEffects[0]),
                    summonCreature: {
                        ...foundry.utils.deepClone(spellData.system.preEffects[0].summonCreature),
                        enabled: true,
                        sourceUuid: '',
                        kreaturentypen: ['tier', 'untot'],
                        lifetime: 'permanent',
                        boundResourceCost: { enabled: false },
                        dominationChecks: {
                            enabled: true,
                            entries: [
                                {
                                    kreaturentyp: 'untot',
                                    difficulty: 0,
                                    probeType: 'attribut',
                                    attribut: 'MU',
                                },
                            ],
                        },
                    },
                }
                const [spell] = await actor.createEmbeddedDocuments('Item', [spellData])
                return {
                    casterTokenId: casterToken.id,
                    blockerTokenId: blockerToken.id,
                    spellId: spell.id,
                    creatureUuid: creature.uuid,
                    creatureName: creature.name,
                    expectedPlacement: { x: originX - gridSize * 2, y: originY - gridSize * 2 },
                    tokenIdsBefore: scene.tokens.map((token: any) => token.id),
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )
        createdTokenIds.push(fixture.casterTokenId, fixture.blockerTokenId)
        createdItemIds.push(fixture.spellId)

        await page.waitForFunction(
            (tokenId) => Boolean(canvas.tokens?.get(tokenId)),
            fixture.casterTokenId,
        )
        await page.evaluate(
            (tokenId) => canvas.tokens?.get(tokenId)?.control(),
            fixture.casterTokenId,
        )
        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, 'E2E Skelettarius Picker')
        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        const typeSelector = spellDialog.locator('.summon-creature-type')
        const sourceSelector = spellDialog.locator('.summon-creature-source')
        await expect(typeSelector).toBeVisible()
        await expect(sourceSelector).toBeVisible()

        await typeSelector.selectOption('tier')
        await expect(sourceSelector.locator('option')).not.toHaveCount(0)
        await typeSelector.selectOption('untot')
        await expect(sourceSelector.locator(`option[value="${fixture.creatureUuid}"]`)).toHaveCount(
            1,
        )
        await sourceSelector.selectOption(fixture.creatureUuid)
        await expect(sourceSelector).toHaveValue(fixture.creatureUuid)
        await page.screenshot({ path: testInfo.outputPath('skelettarius-picker.png') })

        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })
        const chatBeforeCast = await page.evaluate(() => game.messages.contents.length)
        await spellDialog
            .locator('.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]')
            .click()
        await page.waitForFunction((count) => game.messages.contents.length > count, chatBeforeCast)
        const summoned = await page.waitForFunction(
            ({ tokenIdsBefore, creatureUuid }) =>
                Array.from(canvas.scene?.tokens ?? [])
                    .find(
                        (token: any) =>
                            !tokenIdsBefore.includes(token.id) &&
                            token.flags?.ilaris?.summonCreature?.sourceUuid === creatureUuid,
                    )
                    ?.toObject() || null,
            { tokenIdsBefore: fixture.tokenIdsBefore, creatureUuid: fixture.creatureUuid },
        )
        const summonedToken = await summoned.jsonValue<any>()
        createdTokenIds.push(summonedToken._id)
        expect({ x: summonedToken.x, y: summonedToken.y }).toEqual(fixture.expectedPlacement)
        const creatureSheet = page
            .locator('form.application.sheet.ilaris.actor')
            .filter({ hasText: fixture.creatureName })
            .last()
        await expect(creatureSheet).toBeVisible()
        await creatureSheet.getByRole('button', { name: 'Close Window' }).click()
        await expect(creatureSheet).toHaveCount(0)

        const dominationDialog = page.locator('.application.fertigkeit-dialog').last()
        await expect(dominationDialog).toBeVisible()
        const chatBeforeDomination = await page.evaluate(() => game.messages.contents.length)
        await dominationDialog
            .locator(
                '.modifier-summary.probe-summary.clickable-summary[data-action="previewClick"]',
            )
            .click()
        await page.waitForFunction(
            (count) => game.messages.contents.length > count,
            chatBeforeDomination,
        )
        await expect(dominationDialog).toBeVisible()
        expect(pageErrors).toEqual([])
    })

    test('disabled and missing domination configurations do not open a further roll', async ({
        page,
    }) => {
        creaturePacksSetting = await setFoundrySettingForTest(
            page,
            'Ilaris',
            'kreaturenPacks',
            '["Ilaris.kreaturen"]',
        )
        const fixture = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const scene = canvas.scene as any
                const spellPack = game.packs?.get(packId) as any
                const creaturePack = game.packs?.get('Ilaris.kreaturen') as any
                const source = (await spellPack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Skelettarius Totenherr',
                ) as any
                const creature = (await creaturePack?.getDocuments())?.find(
                    (entry: any) =>
                        entry.type === 'kreatur' && entry.system.kreaturentyp === 'untot',
                ) as any
                if (!actor || !scene || !source || !creature)
                    throw new Error('Beherrschungsprobe-E2E-Fixture fehlt.')
                const [casterToken] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Beherrschungsprobe Caster',
                        actorId: actor.id,
                        actorLink: true,
                        x: canvas.dimensions.sceneX + canvas.grid.size * 30,
                        y: canvas.dimensions.sceneY + canvas.grid.size * 28,
                        flags: { ilaris: { e2eDominationSkip: true } },
                    },
                ])
                const createSpell = async (name: string, dominationChecks: any) => {
                    const spellData = source.toObject()
                    delete spellData._id
                    spellData.name = name
                    spellData.flags ??= {}
                    spellData.flags.ilaris = {
                        ...(spellData.flags.ilaris || {}),
                        e2eDominationSkip: true,
                    }
                    spellData.system.preEffects[0] = {
                        ...foundry.utils.deepClone(spellData.system.preEffects[0]),
                        summonCreature: {
                            ...foundry.utils.deepClone(
                                spellData.system.preEffects[0].summonCreature,
                            ),
                            enabled: true,
                            sourceUuid: creature.uuid,
                            kreaturentypen: ['untot'],
                            lifetime: 'permanent',
                            boundResourceCost: { enabled: false },
                            dominationChecks,
                        },
                    }
                    const [spell] = await actor.createEmbeddedDocuments('Item', [spellData])
                    return { id: spell.id, name }
                }
                const disabled = await createSpell('E2E Skelettarius global deaktiviert', {
                    enabled: false,
                    entries: [
                        {
                            kreaturentyp: 'untot',
                            difficulty: 12,
                            probeType: 'attribut',
                            attribut: 'MU',
                        },
                    ],
                })
                const missing = await createSpell('E2E Skelettarius ohne Eintrag', {
                    enabled: true,
                    entries: [],
                })
                return {
                    casterTokenId: casterToken.id,
                    creatureUuid: creature.uuid,
                    creatureName: creature.name,
                    items: [disabled, missing],
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )
        createdTokenIds.push(fixture.casterTokenId)
        createdItemIds.push(...fixture.items.map((item: any) => item.id))
        await page.waitForFunction(
            (tokenId) => Boolean(canvas.tokens?.get(tokenId)),
            fixture.casterTokenId,
        )
        await page.evaluate(
            (tokenId) => canvas.tokens?.get(tokenId)?.control(),
            fixture.casterTokenId,
        )
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        for (const item of fixture.items) {
            const tokenIdsBefore = await page.evaluate(() =>
                canvas.scene?.tokens.map((token) => token.id),
            )
            await openSpellDialog(actorWindow, item.name)
            const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
            await expect(spellDialog.locator('.summon-creature-selector')).toHaveCount(0)
            await page.evaluate(() => {
                ;(CONFIG.Dice as any).randomUniform = () => 0.01
            })
            const chatBeforeCast = await page.evaluate(() => game.messages.contents.length)
            await spellDialog
                .locator(
                    '.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
                )
                .click()
            await page.waitForFunction(
                (count) => game.messages.contents.length > count,
                chatBeforeCast,
            )
            const tokenId = await page.waitForFunction(
                ({ before, creatureUuid }) =>
                    Array.from(canvas.scene?.tokens ?? []).find(
                        (token: any) =>
                            !before.includes(token.id) &&
                            token.flags?.ilaris?.summonCreature?.sourceUuid === creatureUuid,
                    )?.id || null,
                { before: tokenIdsBefore, creatureUuid: fixture.creatureUuid },
            )
            createdTokenIds.push(await tokenId.jsonValue<string>())
            await expect(page.locator('.application.fertigkeit-dialog')).toHaveCount(0)
            const creatureSheet = page
                .locator('form.application.sheet.ilaris.actor')
                .filter({ hasText: fixture.creatureName })
                .last()
            await expect(creatureSheet).toBeVisible()
            await creatureSheet.getByRole('button', { name: 'Close Window' }).click()
            await expect(creatureSheet).toHaveCount(0)
            await spellDialog.getByRole('button', { name: 'Close Window' }).click()
            await expect(spellDialog).toHaveCount(0)
        }
    })
})
