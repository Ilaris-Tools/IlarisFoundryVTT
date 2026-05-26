import { expect, test } from '@playwright/test'

import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTOR_NAME = 'HatAlles'
const TEST_EFFECT_NAME = 'E2E-Testeffekt'
const TEST_EFFECT_TURNS = 2

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('E2E-015 Effekte-Tab', () => {
    let actorDefaultSnapshot: ActorDefaultSnapshot | null = null
    let testEffectId: string | null = null

    test.afterEach(async ({ page }) => {
        try {
            // Cleanup: delete test effect if test aborted before Phase 4
            if (testEffectId) {
                await page.evaluate(
                    ({ aName, effectId }: { aName: string; effectId: string }) => {
                        const actor = (game as any).actors?.getName(aName)
                        if (!actor) return
                        const effect = actor.appliedEffects.find((e: any) => e.id === effectId)
                        if (effect) {
                            return actor.deleteEmbeddedDocuments('ActiveEffect', [effectId])
                        }
                    },
                    { aName: ACTOR_NAME, effectId: testEffectId },
                )
                testEffectId = null
            }
        } finally {
            if (actorDefaultSnapshot) {
                await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
                actorDefaultSnapshot = null
            }
        }
    })

    test('Vorteil-Effekte ohne Löschen-Button, Testeffekt anlegen mit Dauer, löschen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        // ── Phase 1: Effekte-Tab öffnen ───────────────────────────────────

        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        await actorWindow.locator('nav [data-tab="effekte"]').click()
        const effekteTab = actorWindow.locator('section.tab.effekte')
        await expect(effekteTab).toBeVisible({ timeout: 10000 })

        // ── Phase 1b: Vorteil-Effekt-Discovery ───────────────────────────

        const vorteilEffectId = await page.evaluate((aName: string) => {
            const actor = (game as any).actors?.getName(aName)
            if (!actor) throw new Error(`Actor "${aName}" not found`)
            const effect = actor.appliedEffects.find(
                (e: any) => e.flags?.ilaris?.sourceType === 'vorteil',
            )
            return effect?.id ?? null
        }, ACTOR_NAME)

        if (!vorteilEffectId) {
            throw new Error(`Actor "${ACTOR_NAME}" hat keinen Vorteil-Effekt im Tab`)
        }

        // Vorteil-Effekt-Link ist sichtbar
        const vorteilEditLink = effekteTab.locator(
            `a[data-action="itemEdit"][data-itemid="${vorteilEffectId}"]`,
        )
        await expect(vorteilEditLink).toBeVisible({ timeout: 10000 })

        // Negativprüfung: kein Löschen-Button für Vorteil-Effekt
        await expect(
            effekteTab.locator(`a[data-action="itemDelete"][data-itemid="${vorteilEffectId}"]`),
        ).toHaveCount(0)

        // Vorteil-Effekt hat keine Dauer-Anzeige ("Runden")
        await expect(vorteilEditLink).not.toContainText('Runden')

        // ── Phase 2: Testeffekt anlegen ───────────────────────────────────

        const createdId = await page.evaluate(
            ({
                aName,
                effectName,
                turns,
            }: {
                aName: string
                effectName: string
                turns: number
            }) => {
                const actor = (game as any).actors?.getName(aName)
                if (!actor) throw new Error(`Actor "${aName}" not found`)
                return actor
                    .createEmbeddedDocuments('ActiveEffect', [
                        {
                            name: effectName,
                            icon: 'icons/svg/aura.svg',
                            disabled: false,
                            duration: { turns: turns },
                            changes: [],
                            flags: { ilaris: { sourceType: 'manual' } },
                        },
                    ])
                    .then((docs: any[]) => docs[0]?.id ?? null)
            },
            { aName: ACTOR_NAME, effectName: TEST_EFFECT_NAME, turns: TEST_EFFECT_TURNS },
        )

        if (!createdId) {
            throw new Error('ActiveEffect konnte nicht erstellt werden')
        }
        testEffectId = createdId

        // Sheet neu rendern
        await page.evaluate((aName: string) => {
            const actor = (game as any).actors?.getName(aName)
            actor?.sheet?.render()
        }, ACTOR_NAME)

        // Tab erneut anklicken zur Sicherheit
        await actorWindow.locator('nav [data-tab="effekte"]').click()
        await expect(effekteTab).toBeVisible({ timeout: 5000 })

        // ── Phase 3: Testeffekt sichtbar & Dauer-Anzeige ─────────────────

        const testEffectEditLink = effekteTab.locator(
            `a[data-action="itemEdit"][data-itemid="${testEffectId}"]`,
        )
        await expect(testEffectEditLink).toBeVisible({ timeout: 10000 })

        // Dauer-Anzeige: "2 Runden"
        await expect(testEffectEditLink).toContainText(`${TEST_EFFECT_TURNS} Runden`, {
            timeout: 5000,
        })

        // ── Phase 4: Testeffekt löschen ───────────────────────────────────

        const deleteBtn = effekteTab.locator(
            `a[data-action="itemDelete"][data-itemid="${testEffectId}"]`,
        )
        await expect(deleteBtn).toBeVisible({ timeout: 5000 })

        await deleteBtn.click()

        // Kein Bestätigungsdialog — direktes Löschen
        // Testeffekt-Link nicht mehr vorhanden
        await expect(
            effekteTab.locator(`a[data-action="itemEdit"][data-itemid="${testEffectId}"]`),
        ).toHaveCount(0, { timeout: 10000 })

        testEffectId = null
    })
})
