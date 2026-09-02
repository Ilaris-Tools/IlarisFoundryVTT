/** E2E-041 - Pandämonium passive Zone ownership and movement marker lifecycle. */
import { expect, test } from '@playwright/test'
import { clearChatLog, foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

const FLAG_KEY = 'e2ePandemoniumZone'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'

async function cleanup(page: import('@playwright/test').Page) {
    await page
        .evaluate(async (flagKey) => {
            const scene = canvas.scene as any
            const regionIds = Array.from(scene?.regions ?? [])
                .filter((region: any) => region.flags?.Ilaris?.[flagKey] === true)
                .map((region: any) => region.id)
            if (regionIds.length) await scene.deleteEmbeddedDocuments('Region', regionIds)
            for (const actor of game.actors ?? []) {
                const effectIds = Array.from(actor.effects ?? [])
                    .filter((effect: any) => effect.flags?.Ilaris?.[flagKey] === true)
                    .map((effect: any) => effect.id)
                if (effectIds.length) await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds)
            }
            const tokenIds = Array.from(scene?.tokens ?? [])
                .filter((token: any) => token.flags?.Ilaris?.[flagKey] === true)
                .map((token: any) => token.id)
            if (tokenIds.length) await scene.deleteEmbeddedDocuments('Token', tokenIds)
        }, FLAG_KEY)
        .catch(() => {})
}

test.describe('E2E-041 · Pandämonium passive Zone', () => {
    let diagnostics: string[] = []

    test.beforeEach(async ({ page }) => {
        diagnostics = []
        page.on('pageerror', (error) => diagnostics.push(`pageerror: ${error.message}`))
        page.on('console', (message) => {
            if (message.type() === 'error') diagnostics.push(`console: ${message.text()}`)
        })
        await loginAndJoinWorld(page, foundryConfig)
        await cleanup(page)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await cleanup(page)
        await clearChatLog(page).catch(() => {})
        expect(diagnostics).toEqual([])
    })

    test('creates a Region-owned DOT and a source-linked table-managed movement marker', async ({
        page,
    }) => {
        const result = await page.evaluate(
            async ({ flagKey, packId }) => {
                const caster = game.actors?.getName('HatAlles') as any
                const targetActor = game.actors?.getName('Testlauf-Held') as any
                const scene = canvas.scene as any
                const spell = (await game.packs?.get(packId)?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Pandämonium',
                ) as any
                if (!caster || !targetActor || !scene || !spell)
                    throw new Error('Pandämonium-E2E-Grundlage fehlt.')
                const origin = {
                    x: canvas.dimensions.sceneX + canvas.grid.size * 12,
                    y: canvas.dimensions.sceneY + canvas.grid.size * 12,
                }
                const [tokenDocument] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Pandämonium-Ziel',
                        actorId: targetActor.id,
                        x: origin.x,
                        y: origin.y,
                        flags: { Ilaris: { [flagKey]: true } },
                    },
                ])
                await new Promise((resolve) => setTimeout(resolve, 250))
                const token = canvas.tokens?.get(tokenDocument.id) as any
                if (!token?.actor) throw new Error('Pandämonium-Ziel ist nicht auf dem Canvas.')
                const { createZoneRegionData } =
                    await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                const { createPersistentZone, resolveZoneMovementResistance } =
                    await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                const zone = foundry.utils.deepClone(spell.system.zone)
                const region = (await createPersistentZone({
                    scene,
                    regionData: createZoneRegionData(
                        zone,
                        { ...token.center, direction: 0 },
                        {
                            flags: { Ilaris: { [flagKey]: true } },
                        },
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
                    preEffects: spell.system.preEffects,
                })) as any
                if (!region) throw new Error('Pandämonium-Region wurde nicht erzeugt.')
                const ownership = region.flags?.Ilaris?.zone
                const dot = Array.from(token.actor.effects ?? []).find(
                    (effect: any) => effect.flags?.ilaris?.zoneRegionId === region.id,
                ) as any
                await resolveZoneMovementResistance(
                    token.actor,
                    {
                        sceneId: scene.id,
                        regionId: region.id,
                        tokenId: tokenDocument.id,
                        applicationId: ownership.applicationId,
                        spellUuid: spell.uuid,
                        spellName: spell.name,
                        casterUuid: caster.uuid,
                        failureMarkerName: 'Bewegung fehlgeschlagen',
                        origin: { x: origin.x, y: origin.y },
                    },
                    false,
                )
                const marker = Array.from(token.actor.effects ?? []).find(
                    (effect: any) => effect.flags?.ilaris?.zoneMovementResistanceMarker === true,
                ) as any
                const tokenPositionAfterFailure = { x: tokenDocument.x, y: tokenDocument.y }
                await resolveZoneMovementResistance(
                    token.actor,
                    {
                        sceneId: scene.id,
                        regionId: region.id,
                        tokenId: tokenDocument.id,
                        applicationId: ownership.applicationId,
                        spellUuid: spell.uuid,
                    },
                    true,
                )
                await region.delete()
                await new Promise((resolve) => setTimeout(resolve, 250))
                return {
                    dot: dot && {
                        type: dot.changes?.[0]?.type,
                        value: dot.changes?.[0]?.value,
                        damageType: dot.flags?.ilaris?.dotDamageTypes?.[0]?.damageType,
                        durationType: dot.system?.ilarisTiming?.durationType,
                    },
                    marker: marker && {
                        regionId: marker.flags?.ilaris?.zoneRegionId,
                        spellUuid: marker.flags?.ilaris?.spellUuid,
                        origin: marker.flags?.ilaris?.zoneMovementOrigin,
                    },
                    tokenPositionAfterFailure,
                    tokenPositionBeforeFailure: origin,
                    markerRemaining: Array.from(token.actor.effects ?? []).some(
                        (effect: any) =>
                            effect.flags?.ilaris?.zoneMovementResistanceMarker === true,
                    ),
                    dotRemaining: Array.from(token.actor.effects ?? []).some(
                        (effect: any) => effect.flags?.ilaris?.zoneRegionId === region.id,
                    ),
                    notices: game.messages.contents.filter((message: any) =>
                        message.content.includes('Bewegungsursprung'),
                    ).length,
                    regionId: region.id,
                }
            },
            { flagKey: FLAG_KEY, packId: SPELL_PACK },
        )

        expect(result.dot).toEqual({
            type: 'dot',
            value: '2W6',
            damageType: 'PROFAN',
            durationType: 'infinite',
        })
        expect(result.marker).toEqual({
            regionId: result.regionId,
            spellUuid: expect.stringContaining('veNTD1rnQURhqGjs'),
            origin: result.tokenPositionBeforeFailure,
        })
        expect(result.tokenPositionAfterFailure).toEqual(result.tokenPositionBeforeFailure)
        expect(result.notices).toBe(1)
        expect(result.markerRemaining).toBe(false)
        expect(result.dotRemaining).toBe(false)
    })
})
