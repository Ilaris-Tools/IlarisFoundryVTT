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
const TEST_NOTES_TEXT = 'Testtext E2E-018'

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('E2E-018 Notizen-Tab', () => {
    let actorDefaultSnapshot: ActorDefaultSnapshot | null = null

    test.afterEach(async ({ page }) => {
        if (!actorDefaultSnapshot) return
        try {
            await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
        } finally {
            actorDefaultSnapshot = null
        }
    })

    test('Notizen-Tab öffnen, Testtext setzen und Persistenz nach Tab-Wechsel prüfen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        // ── Phase 1: HeldenSheet öffnen ──────────────────────────────────────
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        // ── Phase 2: Tab-ID-Discovery ────────────────────────────────────────
        // Robuste Discovery: Tab-ID aus dem DOM ermitteln, nicht hardcoden.
        // Nach PR-A (Umbenennung notes → notizen) liefert getAttribute('data-tab') den neuen Wert,
        // ohne dass die Spec angepasst werden muss.
        const notesTabLink = actorWindow.locator('nav a[data-tab]').filter({ hasText: 'Notizen' })
        await expect(notesTabLink).toBeVisible({ timeout: 10000 })

        const notesTabId = await notesTabLink.getAttribute('data-tab')

        if (!notesTabId) {
            test.fail(
                true,
                'Precondition failed: Kein nav a[data-tab] mit Text "Notizen" gefunden. Bitte HeldenSheet-Navigation prüfen.',
            )
            return
        }

        // ── Phase 3: Notizen-Tab aktivieren ─────────────────────────────────
        await notesTabLink.click()

        const notesSection = actorWindow.locator(
            `section[data-group="primary"][data-tab="${notesTabId}"]`,
        )
        await expect(notesSection).toBeVisible({ timeout: 10000 })

        // Prose-Mirror-Element muss im Tab gerendert sein
        await expect(notesSection.locator('prose-mirror')).toBeVisible({ timeout: 5000 })

        // ── Phase 4: Testtext per Foundry-API setzen ─────────────────────────
        await page.evaluate(
            async ({ aName, text }: { aName: string; text: string }) => {
                const actor = (game as any).actors?.getName(aName)
                if (!actor) throw new Error(`Actor "${aName}" not found`)
                await actor.update({ 'system.notes': text })
            },
            { aName: ACTOR_NAME, text: TEST_NOTES_TEXT },
        )

        // Warten bis Foundry den Actor-Update in der Runtime verarbeitet hat
        await page.waitForFunction(
            ({ aName, text }: { aName: string; text: string }) =>
                (game as any).actors?.getName(aName)?.system?.notes === text,
            { aName: ACTOR_NAME, text: TEST_NOTES_TEXT },
            { timeout: 10000 },
        )

        // ── Phase 5: Tab-Wechsel (Attribute) und Rückkehr zum Notizen-Tab ───
        await actorWindow.locator('nav [data-tab="attribute"]').click()
        await expect(
            actorWindow.locator('section[data-group="primary"][data-tab="attribute"]'),
        ).toBeVisible({ timeout: 5000 })

        await notesTabLink.click()
        await expect(notesSection).toBeVisible({ timeout: 10000 })

        // ── Phase 6: Persistenz prüfen ───────────────────────────────────────
        // Der Testtext muss nach Rückkehr im Notizen-Tab sichtbar sein.
        await expect(notesSection).toContainText(TEST_NOTES_TEXT, { timeout: 10000 })
    })
})
