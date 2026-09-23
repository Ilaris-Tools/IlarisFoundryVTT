/** E2E-040 - GM administration of persistent Ilaris Zones through Scene Controls. */
import { expect, test } from '@playwright/test'
import { E2E_BASELINE } from '../../shared/baseline'
import { foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

const FLAG_KEY = 'e2eZoneAdministration'

type ZoneFixture = {
    targetRegionId: string
    comparisonRegionId: string
    malformedRegionId: string
    targetEffectId: string
    comparisonEffectId: string
    targetTokenId: string
    messageIds: string[]
}

async function cleanupZoneAdministrationFixture(
    page: import('@playwright/test').Page,
    fixture: ZoneFixture | null = null,
) {
    await page
        .evaluate(
            async ({ flagKey, owned }) => {
                const scene = canvas.scene as any
                // Remove fixture effects before Regions: Region deletion invokes the
                // normal cleanup hook, so this order avoids racing it with a second
                // direct ActiveEffect deletion during failure recovery.
                for (const actor of game.actors ?? []) {
                    const effectIds = Array.from(actor.effects ?? [])
                        .filter((effect: any) =>
                            owned
                                ? owned.effectIds.includes(effect.id)
                                : effect.flags?.Ilaris?.[flagKey] === true,
                        )
                        .map((effect: any) => effect.id)
                    if (effectIds.length)
                        await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds)
                }
                const regionIds = owned
                    ? owned.regionIds.filter((id: string) => scene?.regions?.has(id))
                    : Array.from(scene?.regions ?? [])
                          .filter((region: any) => region.flags?.Ilaris?.[flagKey] === true)
                          .map((region: any) => region.id)
                if (regionIds.length) await scene.deleteEmbeddedDocuments('Region', regionIds)
            },
            {
                flagKey: FLAG_KEY,
                owned: fixture && {
                    effectIds: [fixture.targetEffectId, fixture.comparisonEffectId],
                    regionIds: [
                        fixture.targetRegionId,
                        fixture.comparisonRegionId,
                        fixture.malformedRegionId,
                    ],
                },
            },
        )
        .catch(() => {})
}

async function createZoneAdministrationFixture(
    page: import('@playwright/test').Page,
): Promise<ZoneFixture> {
    return page.evaluate(
        async ({ flagKey, actorName }) => {
            const actor = game.actors?.getName(actorName) as any
            const scene = canvas.scene as any
            const token = canvas.tokens?.placeables?.find(
                (entry: any) => entry.actor?.id === actor?.id,
            )
            if (!actor || !scene || !token)
                throw new Error('E2E Zone administration fixture is unavailable.')

            const { createZoneRegionData } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
            const profile = {
                shape: 'circle',
                distance: 2,
                lifecycle: 'persistent',
                effectMode: 'passive',
                targeting: { includeCaster: true },
                trigger: { onEnter: false },
            }
            const state = (applicationId: string, remaining: number, membership: string[]) => ({
                applicationId,
                spellUuid: `Item.${applicationId}`,
                casterUuid: actor.uuid,
                casterTokenId: token.id,
                profile,
                preEffects: [{ instant: false, changes: [] }],
                durationType: 'sceneRounds',
                remaining,
                originalValue: remaining,
                membership,
            })
            const origin = { x: token.center.x, y: token.center.y, direction: 0 }
            const createdRegions = await scene.createEmbeddedDocuments('Region', [
                {
                    ...createZoneRegionData(profile, origin, {
                        flags: { Ilaris: { [flagKey]: true } },
                    }),
                    name: 'E2E Verwaltungszone Alpha',
                    flags: { Ilaris: { [flagKey]: true, zone: state('e2e-admin-target', 3, []) } },
                },
                {
                    ...createZoneRegionData(profile, origin, {
                        flags: { Ilaris: { [flagKey]: true } },
                    }),
                    name: 'E2E Verwaltungszone Beta',
                    flags: {
                        Ilaris: {
                            [flagKey]: true,
                            zone: state('e2e-admin-comparison', 4, [token.id]),
                        },
                    },
                },
                {
                    ...createZoneRegionData(
                        profile,
                        { ...origin, x: origin.x + canvas.grid.size * 8 },
                        {
                            flags: { Ilaris: { [flagKey]: true } },
                        },
                    ),
                    name: 'E2E Unvollständige Zone',
                    flags: {
                        Ilaris: { [flagKey]: true, zone: { profile: { lifecycle: 'persistent' } } },
                    },
                },
            ])
            const target = createdRegions.find(
                (region: any) => region.name === 'E2E Verwaltungszone Alpha',
            )
            const comparison = createdRegions.find(
                (region: any) => region.name === 'E2E Verwaltungszone Beta',
            )
            const malformed = createdRegions.find(
                (region: any) => region.name === 'E2E Unvollständige Zone',
            )
            if (!target || !comparison || !malformed)
                throw new Error('E2E Regions could not be identified.')

            const effectData = (region: any, applicationId: string) => ({
                name: `E2E passive effect ${region.name}`,
                changes: [],
                duration: {},
                flags: {
                    Ilaris: { [flagKey]: true },
                    ilaris: {
                        passiveZone: true,
                        zoneRegionId: region.id,
                        zoneApplicationId: `${applicationId}:${token.id}`,
                        targetTokenId: token.id,
                        spellUuid: `Item.${applicationId}`,
                        preEffectIndex: 0,
                    },
                },
            })
            const [targetEffect, comparisonEffect] = await actor.createEmbeddedDocuments(
                'ActiveEffect',
                [
                    effectData(target, 'e2e-admin-target'),
                    effectData(comparison, 'e2e-admin-comparison'),
                ],
            )
            return {
                targetRegionId: target.id,
                comparisonRegionId: comparison.id,
                malformedRegionId: malformed.id,
                targetEffectId: targetEffect.id,
                comparisonEffectId: comparisonEffect.id,
                targetTokenId: token.id,
                messageIds: (game.messages?.contents ?? []).map((message: any) => message.id),
            }
        },
        { flagKey: FLAG_KEY, actorName: E2E_BASELINE.actors.hero },
    )
}

test.describe('E2E-040 · Zone administration', () => {
    let diagnostics: string[] = []
    let savedUiConfig: unknown = null
    let fixture: ZoneFixture | null = null

    test.beforeEach(async ({ page }) => {
        diagnostics = []
        page.on('pageerror', (error) => diagnostics.push(`pageerror: ${error.message}`))
        page.on('console', (message) => {
            if (message.type() === 'error') diagnostics.push(`console: ${message.text()}`)
        })
        await loginAndJoinWorld(page, foundryConfig)
        savedUiConfig = await page.evaluate(() =>
            foundry.utils.deepClone(game.settings.get('core', 'uiConfig')),
        )
        fixture = null
    })

    test.afterEach(async ({ page }) => {
        await cleanupZoneAdministrationFixture(page, fixture)
        if (savedUiConfig)
            await page
                .evaluate((config) => game.settings.set('core', 'uiConfig', config), savedUiConfig)
                .catch(() => {})
        expect(diagnostics).toEqual([])
    })

    test('lets a GM select, extend, reconcile, and dismiss only the chosen Zone', async ({
        page,
    }) => {
        const currentFixture = await createZoneAdministrationFixture(page)
        fixture = currentFixture
        const regionsControl = page
            .locator('#scene-controls button.layer[data-control="regions"]')
            .first()
        await expect(regionsControl).toBeVisible()
        await regionsControl.click()
        const managerTool = page
            .locator('#scene-controls-tools button.tool[data-tool="ilarisZoneAdministration"]')
            .first()
        await expect(managerTool).toBeVisible()
        await managerTool.click()

        const manager = page.locator('.zone-administration-dialog').last()
        await expect(manager).toBeVisible()
        await expect(manager).toContainText('Ilaris-Zonen verwalten')
        await expect(manager).toContainText('E2E Unvollständige Zone')
        const targetRow = manager
            .locator(`[data-zone-id="${currentFixture.targetRegionId}"]`)
            .first()
        const comparisonRow = manager
            .locator(`[data-zone-id="${currentFixture.comparisonRegionId}"]`)
            .first()
        await expect(targetRow).toContainText('E2E Verwaltungszone Alpha')
        await expect(comparisonRow).toContainText('E2E Verwaltungszone Beta')
        await expect(targetRow.locator('[data-action="selectZone"]')).toBeVisible()
        await expect(targetRow.locator('[data-action="editZone"]')).toBeVisible()
        await expect(targetRow.locator('[data-action="saveDuration"]')).toBeVisible()
        await expect(targetRow.locator('[data-action="dismissZone"]')).toBeVisible()
        await manager.screenshot({ path: 'test-results/e2e-040-zone-administration-light.png' })

        await targetRow.locator('[data-action="selectZone"]').click()
        await expect
            .poll(() =>
                page.evaluate(
                    (regionId) =>
                        canvas.activeLayer === canvas.regions &&
                        canvas.regions?.get(regionId)?.controlled === true,
                    currentFixture.targetRegionId,
                ),
            )
            .toBe(true)

        const durationInput = targetRow.locator('input[name="remaining"]')
        await durationInput.fill('6')
        await targetRow.locator('[data-action="saveDuration"]').click()
        await expect(targetRow).toContainText('6 Szenenrunden')
        const afterDuration = await page.evaluate(
            ({ targetRegionId, comparisonRegionId, targetEffectId, comparisonEffectId }) => {
                const target = canvas.scene?.regions?.get(targetRegionId) as any
                const comparison = canvas.scene?.regions?.get(comparisonRegionId) as any
                const actor = game.actors?.getName('Testlauf-Held') as any
                return {
                    targetRemaining: target?.flags?.Ilaris?.zone?.remaining,
                    comparisonRemaining: comparison?.flags?.Ilaris?.zone?.remaining,
                    effects: [targetEffectId, comparisonEffectId].map((id) =>
                        Boolean(actor?.effects?.get(id)),
                    ),
                }
            },
            currentFixture,
        )
        expect(afterDuration).toEqual({
            targetRemaining: 6,
            comparisonRemaining: 4,
            effects: [true, true],
        })

        await manager.getByRole('button', { name: 'Abgleich durchführen' }).click()
        await expect(page.locator('#notifications')).toContainText(
            'Ilaris-Zonen wurden abgeglichen.',
        )
        const afterReconciliation = await page.evaluate(
            ({ targetRegionId, targetTokenId, messageIds }) => {
                const zone = (canvas.scene?.regions?.get(targetRegionId) as any)?.flags?.Ilaris
                    ?.zone
                const messages = (game.messages?.contents ?? []).map((message: any) => message.id)
                return { membership: zone?.membership, messageIds: messages, targetTokenId }
            },
            currentFixture,
        )
        expect(afterReconciliation.membership).toContain(currentFixture.targetTokenId)
        expect(afterReconciliation.messageIds).toEqual(currentFixture.messageIds)

        for (const theme of ['light', 'dark']) {
            await page.evaluate(
                async ({ config, colorScheme }) => {
                    await game.settings.set('core', 'uiConfig', {
                        ...(config as object),
                        colorScheme: {
                            ...((config as any).colorScheme ?? {}),
                            applications: colorScheme,
                        },
                    })
                },
                { config: savedUiConfig, colorScheme: theme },
            )
            await expect(page.locator(`body.theme-${theme}`)).toBeVisible()
            await expect(manager).toBeVisible()
            await manager.screenshot({
                path: `test-results/e2e-040-zone-administration-${theme}.png`,
            })
        }

        await targetRow.locator('[data-action="dismissZone"]').click()
        const confirmation = page
            .locator('.application.dialog, .dialog')
            .filter({ hasText: 'Zone aufheben' })
            .last()
        await expect(confirmation).toBeVisible()
        await confirmation.getByRole('button', { name: 'Zone aufheben' }).click()
        await expect(targetRow).toHaveCount(0)
        await expect(comparisonRow).toBeVisible()
        await expect
            .poll(() =>
                page.evaluate(
                    ({
                        targetRegionId,
                        comparisonRegionId,
                        targetEffectId,
                        comparisonEffectId,
                    }) => {
                        const actor = game.actors?.getName('Testlauf-Held') as any
                        return {
                            targetRegion: Boolean(canvas.scene?.regions?.get(targetRegionId)),
                            comparisonRegion: Boolean(
                                canvas.scene?.regions?.get(comparisonRegionId),
                            ),
                            targetEffect: Boolean(actor?.effects?.get(targetEffectId)),
                            comparisonEffect: Boolean(actor?.effects?.get(comparisonEffectId)),
                        }
                    },
                    currentFixture,
                ),
            )
            .toEqual({
                targetRegion: false,
                comparisonRegion: true,
                targetEffect: false,
                comparisonEffect: true,
            })
    })
})
