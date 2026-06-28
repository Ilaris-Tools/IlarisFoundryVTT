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

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('E2E-019 Freie Fertigkeit Würfeldialog', () => {
    let actorDefaultSnapshot: ActorDefaultSnapshot | null = null

    test.afterEach(async ({ page }) => {
        if (!actorDefaultSnapshot) return
        try {
            await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
        } finally {
            actorDefaultSnapshot = null
        }
    })

    test('Freie Fertigkeit im Fertigkeiten-Tab rendern und Würfeldialog öffnen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        // ── Phase 0: Laufzeit-Discovery ──────────────────────────────────────
        // CANARY: Dieser Block verwendet i.type === 'freie_fertigkeit'.
        // Nach PR-F (Umbenennung freie_fertigkeit → freieFertigkeit) muss dieser Block auf
        // i.type === 'freieFertigkeit' aktualisiert werden. Bis dahin schlägt test.fail() an,
        // sobald der Typ migriert wurde und HatAlles keine 'freie_fertigkeit'-Items mehr hat.
        const discovered = await page.evaluate((aName: string) => {
            const actor = (game as any).actors?.getName(aName)
            if (!actor) throw new Error(`Actor "${aName}" not found`)

            const item = actor.items.find(
                (i: any) => i.type === 'freieFertigkeit' || i.type === 'freie_fertigkeit',
            )

            return {
                freieFertigkeitName: item?.name ?? null,
                freieFertigkeitId: item?.id ?? null,
            }
        }, ACTOR_NAME)

        if (!discovered.freieFertigkeitName || !discovered.freieFertigkeitId) {
            test.fail(
                true,
                `Precondition failed: HatAlles muss mindestens ein Item mit type === 'freie_fertigkeit' besitzen. Got: ${JSON.stringify(discovered)}`,
            )
            return
        }

        const { freieFertigkeitName } = discovered

        // ── Phase 1: HeldenSheet öffnen ──────────────────────────────────────
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        // ── Phase 2: Fertigkeiten-Tab aktivieren ─────────────────────────────
        await actorWindow.locator('nav [data-tab="fertigkeiten"]').click()
        const fertigkeitenSection = actorWindow.locator('section.tab.fertigkeiten')
        await expect(fertigkeitenSection).toBeVisible({ timeout: 10000 })

        // ── Phase 3: Würfel-Icon der Freien Fertigkeit klicken ───────────────
        // data-rolltype="fertigkeit_diag" + data-probetype="freieFertigkeit" öffnet den FertigkeitDialog.
        // (data-rolltype="freieFertigkeit" würde direkt in den Chat würfeln — kein Dialog.)
        const freieRow = fertigkeitenSection
            .locator('tr:not(.hero-expandable-row-hidden)')
            .filter({ hasText: freieFertigkeitName })
            .first()
        await expect(freieRow).toBeVisible({ timeout: 10000 })
        const rollIcon = freieRow
            .locator(
                `td[data-action="rollable"][data-rolltype="fertigkeit_diag"][data-probetype="freieFertigkeit"][data-fertigkeit="${freieFertigkeitName}"]`,
            )
            .first()
        await expect(rollIcon).toBeVisible({ timeout: 10000 })
        await rollIcon.click()

        // ── Phase 4: Dialog prüfen ────────────────────────────────────────────
        const fertigkeitDialog = page.locator('.application.ilaris.fertigkeit-dialog').last()
        await expect(fertigkeitDialog).toBeVisible({ timeout: 15000 })
        await expect(fertigkeitDialog).toContainText('Fertigkeitsprobe:')

        // ── Phase 5: Dialog schließen ─────────────────────────────────────────
        await fertigkeitDialog.locator('button[data-action="close"]').click()
        await fertigkeitDialog.waitFor({ state: 'hidden', timeout: 10000 })
    })
})
