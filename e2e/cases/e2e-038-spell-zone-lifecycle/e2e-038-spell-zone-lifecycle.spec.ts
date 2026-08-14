/** E2E-038 - Structured spell-zone resolution and persistent scene duration. */
import { expect, test } from '@playwright/test'
import { E2E_BASELINE } from '../../shared/baseline'
import {
    clearChatLog,
    enableTargetSelectionForTest,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openChatSidebar,
    openSpellDialog,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'

async function clearE2EZoneDocuments(page: import('@playwright/test').Page) {
    await page
        .evaluate(async () => {
            const scene = canvas.scene as any
            const regionIds = Array.from(scene?.regions ?? [])
                .filter((region: any) => {
                    const flags = region.flags?.Ilaris ?? {}
                    return Boolean(flags.e2eZone)
                })
                .map((region: any) => region.id)
            if (regionIds.length) await scene.deleteEmbeddedDocuments('Region', regionIds)
            const tokenIds = Array.from(scene?.tokens ?? [])
                .filter((token: any) => token.flags?.Ilaris?.e2eZone)
                .map((token: any) => token.id)
            if (tokenIds.length) await scene.deleteEmbeddedDocuments('Token', tokenIds)
            const combatIds = Array.from(game.combats ?? [])
                .filter((combat: any) => combat.flags?.Ilaris?.e2eZone)
                .map((combat: any) => combat.id)
            if (combatIds.length) await Combat.deleteDocuments(combatIds)
        })
        .catch(() => {})
}

test.describe('E2E-038 · Spell zone lifecycle', () => {
    let templateDeprecations: string[] = []

    test.beforeEach(async ({ page }) => {
        templateDeprecations = []
        page.on('console', (message) => {
            const text = message.text()
            if (
                /MeasuredTemplate|Scene#templates|MEASURED_TEMPLATE_TYPES|core\.gridTemplates/.test(
                    text,
                )
            )
                templateDeprecations.push(text)
        })
        await loginAndJoinWorld(page, foundryConfig)
        // A failed or externally terminated earlier run may not reach afterEach.
        // The isolated E2E world must therefore start without stale Ilaris zones.
        await clearE2EZoneDocuments(page)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await clearE2EZoneDocuments(page)
        await clearChatLog(page).catch(() => {})
        expect(templateDeprecations).toEqual([])
    })

    test('resolves the cone, circular form, and non-zone Faxius form', async ({ page }) => {
        const result = await page.evaluate(async (packId) => {
            const pack = game.packs?.get(packId)
            const spell = (await pack?.getDocuments())?.find(
                (entry: any) => entry.name === 'Tlalucs Odem Pestgestank',
            )
            if (!spell) throw new Error('Tlalucs Odem Pestgestank fehlt.')
            const { resolveSpellModificationContext } =
                await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
            return {
                base: resolveSpellModificationContext(spell, []).zone,
                sphere: resolveSpellModificationContext(spell, ['miasmasphaero']).zone,
                faxius: resolveSpellModificationContext(spell, ['miasmafaxius']).zone,
            }
        }, SPELL_PACK)

        expect(result.base).toMatchObject({ shape: 'cone', distance: 8, angle: 45 })
        expect(result.sphere).toMatchObject({
            shape: 'circle',
            placement: { anchor: 'caster', pivot: 'center' },
        })
        expect(result.faxius).toBeNull()
    })

    test('resolves a placed Pestgestank cone against only its contained token', async ({
        page,
    }) => {
        const result = await page.evaluate(async (actorName) => {
            const actor = game.actors?.getName(actorName) as any
            const scene = canvas.scene as any
            const gridSize = canvas.grid.size
            if (!actor || !scene || !gridSize) throw new Error('Akteur, Szene oder Grid fehlt.')
            const origin = {
                x: canvas.dimensions.sceneX + gridSize * 6,
                y: canvas.dimensions.sceneY + gridSize * 6,
            }
            const [inside, outside] = await scene.createEmbeddedDocuments('Token', [
                {
                    name: 'E2E Zonen-Ziel innen',
                    actorId: actor.id,
                    x: origin.x + gridSize * 2 - gridSize / 2,
                    y: origin.y - gridSize / 2,
                    flags: { Ilaris: { e2eZone: true } },
                },
                {
                    name: 'E2E Zonen-Ziel außen',
                    actorId: actor.id,
                    x: origin.x - gridSize * 3 - gridSize / 2,
                    y: origin.y - gridSize / 2,
                    flags: { Ilaris: { e2eZone: true } },
                },
            ])
            const { createZoneRegionData } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
            const { resolveZoneTargets } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-targets.js')
            const [region] = await scene.createEmbeddedDocuments('Region', [
                createZoneRegionData(
                    {
                        shape: 'cone',
                        distance: 4,
                        angle: 45,
                        placement: { anchor: 'free', pivot: 'tip', range: 8 },
                        targeting: { includeCaster: true },
                    },
                    { ...origin, direction: 0 },
                    { flags: { Ilaris: { e2eZone: true } } },
                ),
            ])
            if (!region) throw new Error('Pestgestank-Region wurde nicht erzeugt.')
            await new Promise((resolve) => setTimeout(resolve, 250))
            return {
                insideId: inside.id,
                outsideId: outside.id,
                targetIds: resolveZoneTargets(region).map((target: any) => target.tokenId),
            }
        }, ACTOR_NAME)

        expect(result.targetIds).toContain(result.insideId)
        expect(result.targetIds).not.toContain(result.outsideId)
    })

    test('cancels a draft Region and creates only its replacement before a cast', async ({
        page,
    }) => {
        const result = await page.evaluate(async () => {
            const scene = canvas.scene as any
            const { createZoneDraftRegion, deleteZoneDraftRegion } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
            const { createZoneRegionData } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
            const profile = {
                shape: 'circle',
                distance: 2,
                placement: { anchor: 'free', pivot: 'center', range: 8 },
            }
            const regionData = createZoneRegionData(
                profile,
                {
                    x: canvas.dimensions.sceneX + canvas.grid.size * 4,
                    y: canvas.dimensions.sceneY + canvas.grid.size * 4,
                },
                { flags: { Ilaris: { e2eZone: true } } },
            )
            const ownerUserId = game.user.id
            const first = await createZoneDraftRegion({
                scene,
                regionData,
                draftId: foundry.utils.randomID(16),
                ownerUserId,
                dialogId: 'e2e-zone-dialog',
            })
            if (!first) throw new Error('Erste Zonenplatzierung wurde nicht erzeugt.')
            const cancelled = await deleteZoneDraftRegion({
                scene,
                draftId: first.id,
                ownerUserId,
                dialogId: 'e2e-zone-dialog',
            })
            const replacement = await createZoneDraftRegion({
                scene,
                regionData,
                draftId: foundry.utils.randomID(16),
                ownerUserId,
                dialogId: 'e2e-zone-dialog',
            })
            return {
                cancelled,
                firstStillExists: Boolean(scene.regions.get(first.id)),
                replacementId: replacement?.id,
                draftIds: Array.from(scene.regions ?? [])
                    .filter(
                        (region: any) =>
                            region.flags?.Ilaris?.zoneDraft?.dialogId === 'e2e-zone-dialog',
                    )
                    .map((region: any) => region.id),
            }
        })

        expect(result.cancelled).toBe(true)
        expect(result.firstStillExists).toBe(false)
        expect(result.draftIds).toEqual([result.replacementId])
    })

    test('keeps zone spells on the manual path when target automation is disabled', async ({
        page,
    }) => {
        const result = await page.evaluate(async () => {
            const previous = game.settings.get('Ilaris', 'useTargetSelection')
            try {
                await game.settings.set('Ilaris', 'useTargetSelection', false)
                const { UebernatuerlichDialog } =
                    await import('/systems/Ilaris/scripts/combat/dialogs/uebernatuerlich.js')
                const dialog = Object.create(UebernatuerlichDialog.prototype) as any
                dialog.getEffectiveSpellModificationContext = () => ({ zone: { shape: 'cone' } })
                dialog.zonePlacement = null
                return {
                    requiresPlacement: dialog._hasZonePlacementRequirement(),
                    placementMissing: dialog._isZonePlacementMissing(),
                }
            } finally {
                await game.settings.set('Ilaris', 'useTargetSelection', previous)
            }
        })

        expect(result).toEqual({ requiresPlacement: false, placementMissing: false })
    })

    test('places and casts opt-in turn-start and round-start Zone triggers through Combat Tracker controls', async ({
        page,
        browser,
    }) => {
        test.setTimeout(180000)
        const playerContext = await browser.newContext()
        const playerPage = await playerContext.newPage()
        let targetSetting: Awaited<ReturnType<typeof enableTargetSelectionForTest>> | null = null
        let created: {
            itemId: string
            itemUuid: string
            targetTokenId: string
            combatId: string
            activeCombatIds: string[]
            messageIdsAtStart: string[]
            regionId?: string
        } | null = null
        let wasPaused = false
        try {
            await loginAndJoinWorld(playerPage, {
                ...foundryConfig,
                username: E2E_BASELINE.users.player,
            })
            await openChatSidebar(playerPage)
            targetSetting = await enableTargetSelectionForTest(page)
            created = await page.evaluate(
                async ({ actorName, packId, targetActorName }) => {
                    const actor = game.actors?.getName(actorName) as any
                    const targetActor = game.actors?.getName(targetActorName) as any
                    const scene = canvas.scene as any
                    const pack = game.packs?.get(packId)
                    const sourceSpell = (await pack?.getDocuments())?.find(
                        (entry: any) => entry.name === 'Wand aus Dornen',
                    ) as any
                    if (!actor || !targetActor || !scene || !sourceSpell)
                        throw new Error('E2E source data for the turn-start Zone is missing.')

                    const source = sourceSpell.toObject()
                    delete source._id
                    source.name = 'E2E Turnstart-Zone'
                    source.system.zone = {
                        shape: 'circle',
                        distance: 3,
                        placement: { anchor: 'caster', pivot: 'center' },
                        lifecycle: 'persistent',
                        duration: { remaining: 4, originalValue: 4 },
                        targeting: { includeCaster: false },
                        trigger: {
                            triggerOnCreate: false,
                            onEnter: false,
                            onTurnStart: true,
                            onRoundStart: true,
                        },
                    }
                    source.system.preEffects = [
                        {
                            baseDuration: 1,
                            instant: false,
                            changes: [],
                            avoidTest: { enabled: true, attribut: 'KO', diminishedOnly: false },
                        },
                    ]
                    const [item] = await actor.createEmbeddedDocuments('Item', [source])
                    // Match getCasterToken's actor-token selection so the temporary
                    // target is actually inside the Zone that the player places.
                    const casterToken = canvas.tokens?.placeables?.find(
                        (token: any) => token.actor?.id === actor.id,
                    )
                    if (!casterToken) throw new Error('The E2E caster has no active Scene Token.')
                    const origin = {
                        x: casterToken.document.x,
                        y: casterToken.document.y,
                    }
                    const [targetToken] = await scene.createEmbeddedDocuments('Token', [
                        {
                            name: 'E2E Turnstart Target',
                            actorId: targetActor.id,
                            actorLink: false,
                            x: origin.x + canvas.grid.size,
                            y: origin.y,
                            flags: { Ilaris: { e2eZone: true } },
                        },
                    ])
                    const activeCombatIds = Array.from(game.combats ?? [])
                        .filter((entry: any) => entry.active)
                        .map((entry: any) => entry.id)
                    if (activeCombatIds.length)
                        await Combat.updateDocuments(
                            activeCombatIds.map((id) => ({ _id: id, active: false })),
                        )
                    const combat = await Combat.create({
                        name: 'E2E Turnstart Combat',
                        scene: scene.id,
                        active: true,
                        round: 0,
                        turn: null,
                        flags: { Ilaris: { e2eZone: true } },
                    })
                    await combat.createEmbeddedDocuments('Combatant', [
                        { tokenId: casterToken.id, initiative: 20 },
                        { tokenId: targetToken.id, initiative: 10 },
                    ])
                    return {
                        itemId: item.id,
                        itemUuid: item.uuid,
                        targetTokenId: targetToken.id,
                        combatId: combat.id,
                        activeCombatIds,
                        messageIdsAtStart: (game.messages?.contents || []).map(
                            (message: any) => message.id,
                        ),
                    }
                },
                {
                    actorName: ACTOR_NAME,
                    packId: SPELL_PACK,
                    targetActorName: E2E_BASELINE.ownership.actor,
                },
            )

            const actorWindow = await openActorSheet(page, ACTOR_NAME)
            await openSpellDialog(actorWindow, 'E2E Turnstart-Zone')
            const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
            await expect(spellDialog).toBeVisible({ timeout: 15000 })
            // The actor sheet stays open behind the spell dialog and covers the
            // map. Close it through its rendered header control so the following
            // placement click reaches Foundry's Pixi canvas.
            await actorWindow.locator('.window-header button').last().click()
            await expect(actorWindow).toBeHidden()
            await expect(spellDialog).toBeVisible()
            const placementButton = spellDialog.locator('button[data-action="placeZone"]')
            await expect(placementButton).toBeVisible()
            await placementButton.click()
            await page.waitForFunction(
                () => Boolean((canvas.regions as any)?._placementContext),
                undefined,
                { timeout: 10000 },
            )
            // A caster-anchored circle snaps to the caster in the Region
            // placement callback. Confirm it through the uncovered canvas
            // margin because the spell dialog deliberately stays visible.
            await page.mouse.move(120, 400)
            await page.mouse.click(120, 400)
            await expect(spellDialog).toContainText('Zone platziert', { timeout: 10000 })

            await page.evaluate(() => {
                ;(window as any).__e2eZoneRandom = CONFIG.Dice.randomUniform
                CONFIG.Dice.randomUniform = () => 0.01
            })
            const beforeCast = await page.evaluate(() => game.messages.contents.length)
            const rollButton = spellDialog.locator(
                '.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
            )
            await expect(rollButton).toBeVisible()
            // AppV2 rerenders the roll summary while placement state changes,
            // leaving this visible control perpetually "unstable" to a normal
            // Playwright click. Force still delivers a browser click to the
            // rendered player control; it does not invoke the cast API.
            await rollButton.click({ force: true })
            await page.waitForFunction(
                (baseline) => game.messages.contents.length > baseline,
                beforeCast,
                { timeout: 15000 },
            )
            await page.waitForFunction(
                (itemUuid) =>
                    Array.from(canvas.scene?.regions ?? []).some(
                        (region: any) => region.flags?.Ilaris?.zone?.spellUuid === itemUuid,
                    ),
                created.itemUuid,
                { timeout: 15000 },
            )
            created.regionId = await page.evaluate(
                (itemUuid) =>
                    Array.from(canvas.scene?.regions ?? []).find(
                        (region: any) => region.flags?.Ilaris?.zone?.spellUuid === itemUuid,
                    )?.id ?? '',
                created.itemUuid,
            )
            await expect
                .poll(() =>
                    page.evaluate(
                        async ({ tokenId, regionId }) => {
                            const { resolveZoneTargets } =
                                await import('/systems/Ilaris/scripts/combat/zones/zone-targets.js')
                            const region = canvas.scene?.regions?.get(regionId)
                            return Boolean(
                                region?.flags?.Ilaris?.zone?.profile?.trigger?.onTurnStart &&
                                region?.flags?.Ilaris?.zone?.profile?.trigger?.onRoundStart &&
                                resolveZoneTargets(region).some(
                                    (target: any) => target.tokenId === tokenId,
                                ),
                            )
                        },
                        { tokenId: created.targetTokenId, regionId: created.regionId },
                    ),
                )
                .toBe(true)

            // Foundry's Zone-placement confirmation is a transient UI toast;
            // remove it after asserting the rendered placement label so it
            // cannot cover the visible Combat Tracker tab.
            await page
                .locator('#notifications .notification.info')
                .evaluateAll((notifications) =>
                    notifications.forEach((notification) => notification.remove()),
                )
            wasPaused = await page.evaluate(async (combatId) => {
                const combat = game.combats?.get(combatId)
                if (!combat) throw new Error('The temporary E2E combat is missing.')
                const paused = game.paused
                if (paused) await game.togglePause(false)
                ui.combat.viewed = combat
                ui.combat.render(true)
                return paused
            }, created.combatId)
            const combatTab = page.locator('#sidebar-tabs [data-tab="combat"]').first()
            await expect(combatTab).toBeVisible()
            await combatTab.click()
            await page.evaluate((combatId) => {
                const combat = game.combats?.get(combatId)
                if (!combat) throw new Error('The temporary E2E combat is missing.')
                ui.combat.viewed = combat
                ui.combat.render(true)
            }, created.combatId)
            const combatControls = page.locator('#sidebar .combat-controls').first()
            await expect(combatControls.locator('button[data-action="startCombat"]')).toBeVisible()
            await combatControls.locator('button[data-action="startCombat"]').click()
            await expect(
                combatControls.locator('button[data-action="nextTurn"]').last(),
            ).toBeVisible()
            const promptsBeforeTurn = await playerPage.locator('.resist-button').count()
            await combatControls.locator('button[data-action="nextTurn"]').last().click()
            await expect
                .poll(() => playerPage.locator('.resist-button').count(), { timeout: 15000 })
                .toBe(promptsBeforeTurn + 1)

            await combatControls.locator('button[data-action="previousTurn"]').click()
            await expect
                .poll(() => playerPage.locator('.resist-button').count(), { timeout: 5000 })
                .toBe(promptsBeforeTurn + 1)

            await combatControls.locator('button[data-action="nextTurn"]').last().click()
            await page.waitForFunction(
                (combatId) => {
                    const combat = game.combats?.get(combatId)
                    return combat?.round === 1 && combat?.turn === 1
                },
                created.combatId,
                { timeout: 15000 },
            )
            await expect
                .poll(() => playerPage.locator('.resist-button').count(), { timeout: 5000 })
                .toBe(promptsBeforeTurn + 1)

            await combatControls.locator('button[data-action="nextTurn"]').last().click()
            await page.waitForFunction(
                (combatId) => {
                    const combat = game.combats?.get(combatId)
                    return combat?.round === 2 && combat?.turn === 0
                },
                created.combatId,
                { timeout: 15000 },
            )
            await combatControls.locator('button[data-action="nextTurn"]').last().click()
            await page.waitForFunction(
                (combatId) => {
                    const combat = game.combats?.get(combatId)
                    return combat?.round === 2 && combat?.turn === 1
                },
                created.combatId,
                { timeout: 15000 },
            )
            await expect
                .poll(() => playerPage.locator('.resist-button').count(), { timeout: 15000 })
                .toBe(promptsBeforeTurn + 3)

            // Move the target out through the visible canvas before its next
            // turn. Its next turn must not dispatch a new Zone prompt.
            await spellDialog.locator('.window-header button').last().click()
            await expect(spellDialog).toBeHidden()
            const positions = await page.evaluate(
                ({ tokenId, regionId }) => {
                    const token = canvas.tokens?.get(tokenId)
                    const region = canvas.scene?.regions?.get(regionId)
                    const shape = region?.shapes?.[0]
                    if (!token || !region || !shape)
                        throw new Error('E2E Zone target or Region is missing.')
                    return {
                        outside: {
                            x: shape.x + shape.radius + canvas.grid.size * 4,
                            y: shape.y,
                        },
                    }
                },
                { tokenId: created.targetTokenId, regionId: created.regionId },
            )
            // Token dragging through Pixi is not deterministic in headless
            // Chromium. Casting, placement, and combat advancement above stay
            // UI-driven; this is the narrow document-level setup required to
            // prove that a Token which left before the next tick is skipped.
            await page.evaluate(
                async ({ tokenId, outside }) => {
                    const token = canvas.scene?.tokens?.get(tokenId)
                    if (!token) throw new Error('E2E Zone target is missing before leave setup.')
                    await token.update(outside)
                },
                { tokenId: created.targetTokenId, outside: positions.outside },
            )
            await page.waitForFunction(
                async ({ tokenId, regionId }) => {
                    const region = canvas.scene?.regions?.get(regionId)
                    const { resolveZoneTargets } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-targets.js')
                    return !resolveZoneTargets(region).some(
                        (target: any) => target.tokenId === tokenId,
                    )
                },
                { tokenId: created.targetTokenId, regionId: created.regionId },
                { timeout: 15000 },
            )
            await combatControls.locator('button[data-action="nextTurn"]').last().click()
            await page.waitForFunction(
                (combatId) => {
                    const combat = game.combats?.get(combatId)
                    return combat?.round === 3 && combat?.turn === 0
                },
                created.combatId,
                { timeout: 15000 },
            )
            await combatControls.locator('button[data-action="nextTurn"]').last().click()
            await page.waitForFunction(
                (combatId) => {
                    const combat = game.combats?.get(combatId)
                    return combat?.round === 3 && combat?.turn === 1
                },
                created.combatId,
                { timeout: 15000 },
            )
            const finalTurnState = await page.evaluate(
                async ({ combatId, tokenId, regionId }) => {
                    const { resolveZoneTargets } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-targets.js')
                    const combat = game.combats?.get(combatId)
                    const region = canvas.scene?.regions?.get(regionId)
                    return {
                        round: combat?.round,
                        turn: combat?.turn,
                        active: combat?.active,
                        targetInside: resolveZoneTargets(region).some(
                            (target: any) => target.tokenId === tokenId,
                        ),
                        lastTurnStartWindow: region?.flags?.Ilaris?.zone?.lastTurnStartWindow,
                        lastRoundStartWindow: region?.flags?.Ilaris?.zone?.lastRoundStartWindow,
                    }
                },
                {
                    combatId: created.combatId,
                    tokenId: created.targetTokenId,
                    regionId: created.regionId,
                },
            )
            expect(finalTurnState).toMatchObject({
                round: 3,
                turn: 1,
                active: true,
                targetInside: false,
                lastTurnStartWindow: expect.stringContaining(':2:1:'),
                lastRoundStartWindow: expect.stringContaining(':3:'),
            })
            await expect
                .poll(() => playerPage.locator('.resist-button').count(), { timeout: 5000 })
                .toBe(promptsBeforeTurn + 3)
        } finally {
            const teardownResult = await page
                .evaluate(async (state) => {
                    if ((window as any).__e2eZoneRandom) {
                        CONFIG.Dice.randomUniform = (window as any).__e2eZoneRandom
                        delete (window as any).__e2eZoneRandom
                    }
                    if (!state) return null
                    const scene = canvas.scene as any
                    const actor = game.actors?.getName('HatAlles') as any
                    if (game.combats?.get(state.combatId))
                        await Combat.deleteDocuments([state.combatId])
                    const activeCombatIds = state.activeCombatIds.filter((id) =>
                        game.combats?.has(id),
                    )
                    if (activeCombatIds.length)
                        await Combat.updateDocuments(
                            activeCombatIds.map((id) => ({ _id: id, active: true })),
                        )
                    if (state.regionId && scene?.regions?.has(state.regionId))
                        await scene.deleteEmbeddedDocuments('Region', [state.regionId])
                    const tokenIds = [state.targetTokenId].filter((id) => scene?.tokens?.has(id))
                    if (tokenIds.length) await scene.deleteEmbeddedDocuments('Token', tokenIds)
                    if (actor?.items?.get(state.itemId))
                        await actor.deleteEmbeddedDocuments('Item', [state.itemId])
                    const chatMessageIds = (game.messages?.contents || [])
                        .map((message: any) => message.id)
                        .filter((id: string) => !state.messageIdsAtStart.includes(id))
                    if (chatMessageIds.length) await ChatMessage.deleteDocuments(chatMessageIds)
                    return {
                        combatRemoved: !game.combats?.has(state.combatId),
                        regionRemoved: !scene?.regions?.has(state.regionId),
                        tokenRemoved: !scene?.tokens?.has(state.targetTokenId),
                        itemRemoved: !actor?.items?.has(state.itemId),
                        chatMessagesRemoved: chatMessageIds.every(
                            (id: string) => !game.messages?.get(id),
                        ),
                        originalCombatsRestored: state.activeCombatIds.every(
                            (id) => !game.combats?.has(id) || game.combats.get(id)?.active,
                        ),
                    }
                }, created)
                .catch(() => {})
            if (created)
                expect(teardownResult).toEqual({
                    combatRemoved: true,
                    regionRemoved: true,
                    tokenRemoved: true,
                    itemRemoved: true,
                    chatMessagesRemoved: true,
                    originalCombatsRestored: true,
                })
            if (wasPaused)
                await page
                    .evaluate(async () => {
                        if (!game.paused) await game.togglePause(true)
                    })
                    .catch(() => {})
            if (targetSetting) {
                await restoreFoundrySetting(page, targetSetting).catch(() => {})
                await expect
                    .poll(() =>
                        page.evaluate(
                            ({ namespace, key }) => game.settings.get(namespace, key),
                            targetSetting,
                        ),
                    )
                    .toBe(targetSetting.value)
            }
            await playerContext.close()
        }
    })

    test('sends one resistance prompt to the player-owned target on creation and re-entry', async ({
        page,
        browser,
    }) => {
        const playerContext = await browser.newContext()
        const playerPage = await playerContext.newPage()
        try {
            await loginAndJoinWorld(playerPage, {
                ...foundryConfig,
                username: E2E_BASELINE.users.player,
            })
            await expect
                .poll(() => playerPage.evaluate(() => game.user.name))
                .toBe(E2E_BASELINE.users.player)
            const result = await page.evaluate(
                async ({ casterName, targetName, packId }) => {
                    const caster = game.actors?.getName(casterName) as any
                    const target = game.actors?.getName(targetName) as any
                    const scene = canvas.scene as any
                    const pack = game.packs?.get(packId)
                    const spell = (await pack?.getDocuments())?.find(
                        (entry: any) => entry.name === 'Wand aus Dornen',
                    )
                    if (!caster || !target || !scene || !spell)
                        throw new Error('E2E-Zonenquellen fehlen.')
                    const { resolveSpellModificationContext } =
                        await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
                    const { createPersistentZone } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                    const { createZoneRegionData } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                    const origin = {
                        x: canvas.dimensions.sceneX + canvas.grid.size * 12,
                        y: canvas.dimensions.sceneY + canvas.grid.size * 12,
                    }
                    const [targetToken] = await scene.createEmbeddedDocuments('Token', [
                        {
                            name: 'E2E Dornentarget',
                            actorId: target.id,
                            x: origin.x,
                            y: origin.y,
                            flags: { Ilaris: { e2eZone: true } },
                        },
                    ])
                    const context = resolveSpellModificationContext(spell, [])
                    // This verifies generic create/re-entry resistance prompts.
                    // Wand aus Dornen itself is intentionally traversal-only.
                    const zone = {
                        ...context.zone,
                        trigger: {
                            ...context.zone.trigger,
                            triggerOnCreate: true,
                            onEnter: true,
                            onTraverse: false,
                        },
                    }
                    const region = await createPersistentZone({
                        scene,
                        regionData: createZoneRegionData(
                            zone,
                            { ...origin, direction: 0 },
                            { flags: { Ilaris: { e2eZone: true } } },
                        ),
                        dialog: {
                            item: spell,
                            actor: caster,
                            zoneCasterTokenId: '',
                            armedInputValues: {},
                            maneuverDurationBonus: 0,
                            maechtigeMagieQs: 0,
                            getSelectedSpellModificationId: () => '',
                        },
                        zone,
                        preEffects: [
                            {
                                baseDuration: 1,
                                instant: false,
                                changes: [
                                    { key: 'system.attribute.KO.pw', type: 'add', value: '-1' },
                                ],
                                avoidTest: { enabled: true, attribut: 'KO', diminishedOnly: false },
                            },
                        ],
                    })
                    if (!region) throw new Error('Dornengrenze wurde nicht erzeugt.')
                    return { regionId: region.id, tokenId: targetToken.id, origin }
                },
                {
                    casterName: ACTOR_NAME,
                    targetName: E2E_BASELINE.ownership.actor,
                    packId: SPELL_PACK,
                },
            )

            const promptCountForTarget = (tokenId: string) =>
                playerPage.evaluate((targetTokenId) => {
                    return game.messages.contents.filter((message: any) => {
                        const serialized = message.content.match(
                            /data-pre-effect-data="([^"]+)"/,
                        )?.[1]
                        if (!serialized) return false
                        const data = JSON.parse(decodeURIComponent(serialized))
                        return data.target?.tokenId === targetTokenId
                    }).length
                }, tokenId)
            await expect.poll(() => promptCountForTarget(result.tokenId)).toBe(1)

            await page.evaluate(async ({ tokenId, origin }) => {
                const token = canvas.scene?.tokens.get(tokenId) as any
                if (!token) throw new Error('E2E Dornentarget fehlt.')
                await token.update({ x: origin.x + canvas.grid.size * 20 })
                await new Promise((resolve) => setTimeout(resolve, 250))
                await token.update({ x: origin.x })
            }, result)

            await expect.poll(() => promptCountForTarget(result.tokenId)).toBe(2)
        } finally {
            await playerContext.close()
        }
    })

    test('creates a GM-owned thorn-wall Region and decrements it once per round', async ({
        page,
    }) => {
        const created = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const scene = canvas.scene as any
                const pack = game.packs?.get(packId)
                const spell = (await pack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Wand aus Dornen',
                )
                if (!actor || !scene || !spell) throw new Error('Wand, Akteur oder Szene fehlt.')
                const { resolveSpellModificationContext } =
                    await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
                const { createPersistentZone, reducePersistentZoneDurations } =
                    await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                const { createZoneRegionData, validateZonePlacement } =
                    await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                const context = resolveSpellModificationContext(spell, [])
                const [casterDocument] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Wand-Caster',
                        actorId: actor.id,
                        x: canvas.dimensions.sceneX + canvas.grid.size * 8,
                        y: canvas.dimensions.sceneY + canvas.grid.size * 8,
                        flags: { Ilaris: { e2eZone: true } },
                    },
                ])
                await new Promise((resolve) => setTimeout(resolve, 250))
                const casterToken = canvas.tokens?.get(casterDocument.id)
                if (!casterToken) throw new Error('Wand-Caster-Token fehlt.')
                const placement = {
                    x: casterToken.center.x,
                    y: casterToken.center.y,
                    direction: 0,
                }
                if (!validateZonePlacement(context.zone, casterToken, placement))
                    throw new Error('Wand aus Dornen liegt außerhalb der Zauberreichweite.')
                const region = (await createPersistentZone({
                    scene,
                    regionData: createZoneRegionData(context.zone, placement, {
                        flags: { Ilaris: { e2eZone: true } },
                    }),
                    dialog: {
                        item: spell,
                        actor,
                        zoneCasterTokenId: casterDocument.id,
                        armedInputValues: {},
                        maneuverDurationBonus: 0,
                        maechtigeMagieQs: 0,
                        getSelectedSpellModificationId: () => '',
                    },
                    zone: context.zone,
                    preEffects: [],
                })) as any
                if (!region) throw new Error('Persistente Zone wurde nicht erzeugt.')
                await new Promise((resolve) => setTimeout(resolve, 250))
                await reducePersistentZoneDurations({ scene }, {})
                await new Promise((resolve) => setTimeout(resolve, 250))
                return {
                    id: region.id,
                    shape: region.shapes[0]?.type,
                    sceneRegionIds: Array.from(scene.regions ?? []).map((entry: any) => entry.id),
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )

        expect(created.id).toBeTruthy()
        expect(created.shape).toBe('rectangle')
        expect(created.sceneRegionIds).toContain(created.id)

        // Foundry receives its own embedded-document updates asynchronously.
        // Reloading verifies persistence rather than this client's stale cache.
        await page.reload()
        await loginAndJoinWorld(page, foundryConfig)
        const persisted = await page.evaluate((regionId) => {
            const region = canvas.scene?.regions.get(regionId) as any
            return {
                remaining: region?.flags?.Ilaris?.zone?.remaining,
                durationType: region?.flags?.Ilaris?.zone?.durationType,
            }
        }, created.id)

        expect(persisted.durationType).toBe('sceneRounds')
        expect(persisted.remaining).toBe(255)
    })

    test('applies, removes, reapplies, and isolates passive Zone effects', async ({ page }) => {
        const result = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const scene = canvas.scene as any
                const pack = game.packs?.get(packId)
                const spell = (await pack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Dunkelheit',
                ) as any
                if (!actor || !scene || !spell)
                    throw new Error('Akteur, Szene oder Dunkelheit fehlt.')
                const {
                    createPersistentZone,
                    reconcilePersistentPassiveZones,
                    reducePersistentZoneDurations,
                    updatePersistentZoneMembership,
                } = await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                const { createZoneRegionData } =
                    await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                const origin = {
                    x: canvas.dimensions.sceneX + canvas.grid.size * 16,
                    y: canvas.dimensions.sceneY + canvas.grid.size * 16,
                }
                const [targetToken] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Passivzonen-Ziel',
                        actorId: actor.id,
                        x: origin.x,
                        y: origin.y,
                        flags: { Ilaris: { e2eZone: true } },
                    },
                ])
                await new Promise((resolve) => setTimeout(resolve, 500))
                const targetActor = canvas.tokens?.get(targetToken.id)?.actor as any
                if (!targetActor)
                    throw new Error('E2E Passivzonen-Ziel ist nicht auf dem Canvas bereit.')

                const makeRegion = async (zone = spell.system.zone) =>
                    createPersistentZone({
                        scene,
                        regionData: createZoneRegionData(zone, origin, {
                            flags: { Ilaris: { e2eZone: true } },
                        }),
                        dialog: {
                            item: spell,
                            actor,
                            zoneCasterTokenId: '',
                            armedInputValues: {},
                            maneuverDurationBonus: 0,
                            maechtigeMagieQs: 0,
                            getSelectedSpellModificationId: () => '',
                        },
                        zone,
                        preEffects: spell.system.preEffects,
                    })
                const first = (await makeRegion()) as any
                const second = (await makeRegion()) as any
                if (!first || !second)
                    throw new Error('Passive Dunkelheit-Zone wurde nicht erzeugt.')
                const ownedEffects = (regions = [first, second]) =>
                    Array.from(targetActor.effects ?? []).filter(
                        (effect: any) =>
                            effect.flags?.ilaris?.passiveZone &&
                            regions.some(
                                (region: any) => region.id === effect.flags?.ilaris?.zoneRegionId,
                            ),
                    )
                const initial = ownedEffects().map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                await reconcilePersistentPassiveZones(scene)
                await reconcilePersistentPassiveZones(scene)
                const afterReconciliation = ownedEffects().map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                const token = scene.tokens.get(targetToken.id) as any
                await token.update({ x: origin.x + canvas.grid.size * 10 })
                await new Promise((resolve) => setTimeout(resolve, 500))
                await updatePersistentZoneMembership(scene, token)
                const afterLeave = {
                    effectRegionIds: ownedEffects().map(
                        (effect: any) => effect.flags.ilaris.zoneRegionId,
                    ),
                    memberships: [first, second].map(
                        (region: any) => region.flags?.Ilaris?.zone?.membership ?? [],
                    ),
                }
                await token.update({ x: origin.x })
                await new Promise((resolve) => setTimeout(resolve, 500))
                await updatePersistentZoneMembership(scene, token)
                const afterReentry = ownedEffects().map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                await first.delete()
                // Foundry does not await asynchronous deleteRegion hook listeners.
                await new Promise((resolve) => setTimeout(resolve, 500))
                const afterFirstDeletion = ownedEffects().map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                const expiringZone = foundry.utils.deepClone(spell.system.zone)
                expiringZone.duration = { remaining: 1, originalValue: 1 }
                const expiring = (await makeRegion(expiringZone)) as any
                if (!expiring) throw new Error('Ablaufende passive Zone wurde nicht erzeugt.')
                await reducePersistentZoneDurations({ scene }, {})
                const afterExpiry = ownedEffects([first, second, expiring]).map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                return {
                    initial,
                    afterReconciliation,
                    afterLeave,
                    afterReentry,
                    firstId: first.id,
                    secondId: second.id,
                    afterFirstDeletion,
                    afterExpiry,
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )

        expect(result.initial.sort()).toEqual([result.firstId, result.secondId].sort())
        expect(result.afterReconciliation.sort()).toEqual([result.firstId, result.secondId].sort())
        expect(result.afterLeave).toEqual({ effectRegionIds: [], memberships: [[], []] })
        expect(result.afterReentry.sort()).toEqual([result.firstId, result.secondId].sort())
        expect(result.afterFirstDeletion).toEqual([result.secondId])
        expect(result.afterExpiry).toEqual([result.secondId])
    })
})
