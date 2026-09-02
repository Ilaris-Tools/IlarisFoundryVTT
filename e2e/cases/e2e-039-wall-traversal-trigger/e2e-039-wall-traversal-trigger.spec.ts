/** E2E-039 - Wand aus Dornen traversal through a real canvas token drag. */
import { expect, test } from '@playwright/test'
import {
    clearChatLog,
    clickResistButton,
    foundryConfig,
    loginAndJoinWorld,
    openChatSidebar,
} from '../../shared/fixtures/foundry'

const CASTER_NAME = 'HatAlles'
const TARGET_ACTOR_NAME = 'Testlauf-Held'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'

async function clearWallTraversalDocuments(page: import('@playwright/test').Page) {
    await page
        .evaluate(async () => {
            const scene = canvas.scene as any
            const regionIds = Array.from(scene?.regions ?? [])
                .filter((region: any) => region.flags?.Ilaris?.e2eWallTraversal)
                .map((region: any) => region.id)
            if (regionIds.length) await scene.deleteEmbeddedDocuments('Region', regionIds)
            const tokenIds = Array.from(scene?.tokens ?? [])
                .filter((token: any) => token.flags?.Ilaris?.e2eWallTraversal)
                .map((token: any) => token.id)
            if (tokenIds.length) await scene.deleteEmbeddedDocuments('Token', tokenIds)
            await new Promise((resolve) => setTimeout(resolve, 250))
        })
        .catch(() => {})
}

async function dragTokenAcrossWall(
    page: import('@playwright/test').Page,
    tokenId: string,
    destination: { x: number; y: number },
) {
    const points = await page.evaluate(
        ({ id, target }) => {
            const token = canvas.tokens?.get(id)
            if (!token) throw new Error('E2E Wand-Ziel ist nicht auf dem Canvas bereit.')
            const transform = canvas.stage.worldTransform
            const start = transform.apply(token.center)
            const end = transform.apply(target)
            return { start: { x: start.x, y: start.y }, end: { x: end.x, y: end.y } }
        },
        { id: tokenId, target: destination },
    )

    await page.mouse.move(points.start.x, points.start.y)
    await page.mouse.down()
    await page.mouse.move(points.end.x, points.end.y, { steps: 12 })
    await page.mouse.up()
}

async function resolveTraversalPrompt(page: import('@playwright/test').Page, success: boolean) {
    await clickResistButton(page)
    await expect(page.locator('.application.fertigkeit-dialog').last()).toBeVisible()
    await page.evaluate((resistSuccess) => {
        const dialog = Array.from((foundry.applications as any).instances?.values() ?? []).find(
            (app: any) => app._resistContext?.preEffectData?.traversal,
        ) as any
        if (!dialog) throw new Error('Widerstandsprobe für die Wand wurde nicht geöffnet.')
        Hooks.callAll('Ilaris.postSkillRoll', dialog, { rollResult: { success: resistSuccess } })
    }, success)
}

test.describe('E2E-039 · Wand aus Dornen traversal trigger', () => {
    let wasPaused = false
    let runtimeDiagnostics: string[] = []

    test.beforeEach(async ({ page }) => {
        runtimeDiagnostics = []
        page.on('pageerror', (error) => runtimeDiagnostics.push(`pageerror: ${error.message}`))
        page.on('console', (message) => {
            if (message.type() === 'error') runtimeDiagnostics.push(`console: ${message.text()}`)
        })
        await loginAndJoinWorld(page, foundryConfig)
        wasPaused = await page.evaluate(async () => {
            for (const application of foundry.applications?.instances?.values?.() ?? [])
                await application.close?.({ animate: false })
            const paused = game.paused
            if (paused) await game.togglePause(false)
            return paused
        })
        await clearWallTraversalDocuments(page)
        await clearChatLog(page)
        await openChatSidebar(page)
    })

    test.afterEach(async ({ page }) => {
        await clearWallTraversalDocuments(page)
        await clearChatLog(page).catch(() => {})
        if (wasPaused)
            await page.evaluate(async () => {
                if (!game.paused) await game.togglePause(true, { broadcast: true })
            })
        expect(runtimeDiagnostics).toEqual([])
    })

    test('damages every normal traversal and retains then clears the failure marker', async ({
        page,
        browser,
    }) => {
        const playerContext = await browser.newContext()
        const playerPage = await playerContext.newPage()
        try {
            const setup = await page.evaluate(
                async ({ casterName, targetActorName, packId }) => {
                    const actor = game.actors?.getName(casterName) as any
                    const targetActor = game.actors?.getName(targetActorName) as any
                    const player = game.users?.getName('e2e-player') as any
                    const scene = canvas.scene as any
                    const spell = (await game.packs?.get(packId)?.getDocuments())?.find(
                        (entry: any) => entry.name === 'Wand aus Dornen',
                    ) as any
                    if (!actor || !targetActor || !player || !scene || !spell)
                        throw new Error('E2E Wand aus Dornen fehlt.')
                    const grid = canvas.grid.size
                    const origin = {
                        x: canvas.dimensions.sceneX + grid * 10,
                        y: canvas.dimensions.sceneY + grid * 8,
                    }
                    const [targetDocument] = await scene.createEmbeddedDocuments('Token', [
                        {
                            name: 'E2E Wand-Durchquerung',
                            actorId: targetActor.id,
                            actorLink: false,
                            ownership: {
                                default: 0,
                                [player.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                            },
                            x: origin.x,
                            y: origin.y,
                            flags: { Ilaris: { e2eWallTraversal: true } },
                        },
                    ])
                    await new Promise((resolve) => setTimeout(resolve, 250))
                    const target = canvas.tokens?.get(targetDocument.id)
                    if (!target) throw new Error('E2E Wand-Ziel konnte nicht gerendert werden.')
                    const { createPersistentZone } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                    const { createZoneRegionData } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                    const zone = foundry.utils.deepClone(spell.system.zone)
                    const placement = {
                        x: target.center.x - grid * 2,
                        y: target.center.y + grid * 2,
                        direction: 0,
                    }
                    const region = await createPersistentZone({
                        scene,
                        regionData: createZoneRegionData(zone, placement, {
                            flags: { Ilaris: { e2eWallTraversal: true } },
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
                    if (!region) throw new Error('E2E Wand-Region wurde nicht erzeugt.')
                    await canvas.animatePan({ x: target.center.x, y: target.center.y + grid * 2 })
                    return {
                        regionId: region.id,
                        tokenId: targetDocument.id,
                        start: { x: target.center.x, y: target.center.y },
                        destination: { x: target.center.x, y: target.center.y + grid * 4 },
                    }
                },
                { casterName: CASTER_NAME, targetActorName: TARGET_ACTOR_NAME, packId: SPELL_PACK },
            )

            await loginAndJoinWorld(playerPage, {
                ...foundryConfig,
                username: 'e2e-player',
            })
            await page.evaluate(async () => {
                if (game.paused) await game.togglePause(false, { broadcast: true })
            })
            // A client joining after the GM's broadcast may retain the stale
            // paused bootstrap value. This fixture-only local refresh mirrors
            // the already-unpaused session and permits the real map drag.
            await playerPage.evaluate(() => {
                if (game.paused) game.togglePause(false)
            })
            await playerPage.waitForFunction(() => !game.paused)
            await openChatSidebar(playerPage)
            await playerPage.evaluate(async ({ tokenId, start }) => {
                const token = canvas.tokens?.get(tokenId)
                if (!token) throw new Error('Spieler-Ziel ist nicht auf dem Canvas bereit.')
                await canvas.animatePan({ x: start.x, y: start.y + canvas.grid.size * 2 })
            }, setup)

            await dragTokenAcrossWall(playerPage, setup.tokenId, setup.destination)
            await expect
                .poll(() =>
                    page.evaluate(
                        ({ tokenId, start }) =>
                            (canvas.scene?.tokens.get(tokenId)?.y ?? start.y) > start.y,
                        setup,
                    ),
                )
                .toBe(true)
            await expect
                .poll(() =>
                    page.evaluate(
                        (regionId) =>
                            game.messages.contents.some((message: any) => {
                                const serialized = message.content.match(
                                    /data-pre-effect-data="([^"]+)"/,
                                )?.[1]
                                if (!serialized) return false
                                return (
                                    JSON.parse(decodeURIComponent(serialized)).traversal
                                        ?.regionId === regionId
                                )
                            }),
                        setup.regionId,
                    ),
                )
                .toBe(true)

            await resolveTraversalPrompt(playerPage, false)
            await expect
                .poll(() =>
                    page.evaluate(
                        ({ tokenId, regionId }) => {
                            const actor = canvas.tokens?.get(tokenId)?.actor as any
                            return Array.from(actor?.effects ?? []).some(
                                (effect: any) =>
                                    effect.flags?.ilaris?.zoneTraversalMarker === true &&
                                    effect.flags?.ilaris?.zoneRegionId === regionId,
                            )
                        },
                        { tokenId: setup.tokenId, regionId: setup.regionId },
                    ),
                )
                .toBe(true)
            await playerPage.evaluate((tokenId) => {
                canvas.tokens?.get(tokenId)?.actor?.sheet?.render(true)
            }, setup.tokenId)
            const effectSheet = playerPage
                .locator('.application, .window-app')
                .filter({ hasText: 'E2E Wand-Durchquerung' })
                .last()
            await expect(effectSheet).toBeVisible()
            await effectSheet.locator('nav [data-tab="effekte"]').click()
            await expect(effectSheet).toContainText('Durchquerung fehlgeschlagen')
            await effectSheet.screenshot({ path: 'test-results/e2e-039-wall-traversal-marker.png' })
            await expect
                .poll(() =>
                    playerPage.evaluate(
                        (regionId) =>
                            game.messages.contents.some(
                                (message: any) =>
                                    message.flags?.ilaris?.zoneTraversalFailure?.regionId ===
                                        regionId && message.content.includes('Token vor der Wand'),
                            ),
                        setup.regionId,
                    ),
                )
                .toBe(true)
            await playerPage.screenshot({ path: 'test-results/e2e-039-wall-traversal-failure.png' })

            // The rules delegate reset to the GM; the second traversal remains a normal player drag.
            await page.evaluate(
                async ({ tokenId, start }) =>
                    canvas.scene?.tokens.get(tokenId)?.update({
                        x: start.x - canvas.grid.size / 2,
                        y: start.y - canvas.grid.size / 2,
                    }),
                setup,
            )
            await playerPage.waitForTimeout(300)
            await dragTokenAcrossWall(playerPage, setup.tokenId, setup.destination)
            await expect.poll(() => playerPage.locator('.resist-button').count()).toBeGreaterThan(1)
            await resolveTraversalPrompt(playerPage, true)
            await expect
                .poll(() =>
                    page.evaluate(
                        ({ tokenId, regionId }) => {
                            const actor = canvas.tokens?.get(tokenId)?.actor as any
                            return Array.from(actor?.effects ?? []).some(
                                (effect: any) => effect.flags?.ilaris?.zoneRegionId === regionId,
                            )
                        },
                        { tokenId: setup.tokenId, regionId: setup.regionId },
                    ),
                )
                .toBe(false)
        } finally {
            await playerContext.close()
        }
    })

    test('keeps initial wall placement inert and resolves a normal outbound traversal', async ({
        page,
        browser,
    }) => {
        const playerContext = await browser.newContext()
        const playerPage = await playerContext.newPage()
        try {
            const setup = await page.evaluate(
                async ({ casterName, targetActorName, packId }) => {
                    const actor = game.actors?.getName(casterName) as any
                    const targetActor = game.actors?.getName(targetActorName) as any
                    const player = game.users?.getName('e2e-player') as any
                    const scene = canvas.scene as any
                    const spell = (await game.packs?.get(packId)?.getDocuments())?.find(
                        (entry: any) => entry.name === 'Wand aus Dornen',
                    ) as any
                    if (!actor || !targetActor || !player || !scene || !spell)
                        throw new Error('E2E Wand aus Dornen fehlt.')
                    const grid = canvas.grid.size
                    const origin = {
                        x: canvas.dimensions.sceneX + grid * 16,
                        y: canvas.dimensions.sceneY + grid * 8,
                    }
                    const [targetDocument] = await scene.createEmbeddedDocuments('Token', [
                        {
                            name: 'E2E Wand-Ausgang',
                            actorId: targetActor.id,
                            actorLink: false,
                            ownership: {
                                default: 0,
                                [player.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                            },
                            x: origin.x,
                            y: origin.y,
                            flags: { Ilaris: { e2eWallTraversal: true } },
                        },
                    ])
                    await new Promise((resolve) => setTimeout(resolve, 250))
                    const target = canvas.tokens?.get(targetDocument.id)
                    if (!target) throw new Error('E2E Wand-Ausgang konnte nicht gerendert werden.')
                    const { createPersistentZone } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                    const { createZoneRegionData } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                    const zone = foundry.utils.deepClone(spell.system.zone)
                    const region = await createPersistentZone({
                        scene,
                        regionData: createZoneRegionData(
                            zone,
                            {
                                x: target.center.x - grid * 2,
                                y: target.center.y - grid / 2,
                                direction: 0,
                            },
                            { flags: { Ilaris: { e2eWallTraversal: true } } },
                        ),
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
                    if (!region) throw new Error('E2E Wand-Region wurde nicht erzeugt.')
                    await new Promise((resolve) => setTimeout(resolve, 250))
                    return {
                        regionId: region.id,
                        tokenId: targetDocument.id,
                        start: { x: target.center.x, y: target.center.y },
                        destination: { x: target.center.x, y: target.center.y + grid * 4 },
                        initialInside: targetDocument.testInsideRegion(region),
                        initialTraversalPrompts: game.messages.contents.filter((message: any) =>
                            message.content.includes('Widerstand leisten (GE)'),
                        ).length,
                    }
                },
                { casterName: CASTER_NAME, targetActorName: TARGET_ACTOR_NAME, packId: SPELL_PACK },
            )

            expect(setup.initialInside).toBe(true)
            expect(setup.initialTraversalPrompts).toBe(0)
            await loginAndJoinWorld(playerPage, { ...foundryConfig, username: 'e2e-player' })
            await page.evaluate(async () => {
                if (game.paused) await game.togglePause(false, { broadcast: true })
            })
            // A client joining after the GM's broadcast may retain the stale
            // paused bootstrap value. This fixture-only local refresh mirrors
            // the already-unpaused session and permits the real map drag.
            await playerPage.evaluate(() => {
                if (game.paused) game.togglePause(false)
            })
            await playerPage.waitForFunction(() => !game.paused)
            await openChatSidebar(playerPage)
            await playerPage.evaluate(async ({ tokenId, start }) => {
                const token = canvas.tokens?.get(tokenId)
                if (!token) throw new Error('Spieler-Ziel ist nicht auf dem Canvas bereit.')
                await canvas.animatePan({ x: start.x, y: start.y + canvas.grid.size * 2 })
            }, setup)

            await dragTokenAcrossWall(playerPage, setup.tokenId, setup.destination)
            await expect
                .poll(() =>
                    page.evaluate(
                        ({ tokenId, start }) =>
                            (canvas.scene?.tokens.get(tokenId)?.y ?? start.y) > start.y,
                        setup,
                    ),
                )
                .toBe(true)
            await expect
                .poll(() =>
                    page.evaluate(
                        (regionId) =>
                            game.messages.contents.some((message: any) => {
                                const serialized = message.content.match(
                                    /data-pre-effect-data="([^"]+)"/,
                                )?.[1]
                                return (
                                    serialized &&
                                    JSON.parse(decodeURIComponent(serialized)).traversal
                                        ?.regionId === regionId
                                )
                            }),
                        setup.regionId,
                    ),
                )
                .toBe(true)

            await resolveTraversalPrompt(playerPage, false)
            await expect
                .poll(() =>
                    page.evaluate(
                        ({ tokenId, regionId, start }) => {
                            const token = canvas.scene?.tokens.get(tokenId)
                            const actor = token?.actor as any
                            return {
                                remainedOutside: (token?.y ?? start.y) > start.y,
                                hasMarker: Array.from(actor?.effects ?? []).some(
                                    (effect: any) =>
                                        effect.flags?.ilaris?.zoneTraversalMarker === true &&
                                        effect.flags?.ilaris?.zoneRegionId === regionId,
                                ),
                                hasNotice: game.messages.contents.some(
                                    (message: any) =>
                                        message.flags?.ilaris?.zoneTraversalFailure?.regionId ===
                                            regionId &&
                                        message.content.includes('Token vor der Wand'),
                                ),
                            }
                        },
                        { tokenId: setup.tokenId, regionId: setup.regionId, start: setup.start },
                    ),
                )
                .toEqual({ remainedOutside: true, hasMarker: true, hasNotice: true })
        } finally {
            await playerContext.close()
        }
    })
})
