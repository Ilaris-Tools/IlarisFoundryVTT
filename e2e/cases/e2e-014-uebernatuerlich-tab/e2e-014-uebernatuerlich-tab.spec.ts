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

test.describe('E2E-014 Übernatürliche Fertigkeiten-Tab', () => {
    let actorDefaultSnapshot: ActorDefaultSnapshot | null = null

    test.afterEach(async ({ page }) => {
        if (!actorDefaultSnapshot) return
        try {
            await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
        } finally {
            actorDefaultSnapshot = null
        }
    })

    test('Stil-Select setzen, Fertigkeit + Liturgie aufklappen, Dialoge öffnen und schließen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        // ── Phase 0: Laufzeit-Discovery ──────────────────────────────────────
        const discovered = await page.evaluate((aName: string) => {
            const actor = (game as any).actors?.getName(aName)
            if (!actor) throw new Error(`Actor "${aName}" not found`)

            const fertigkeit = actor.items.find(
                (i: any) => i.type === 'uebernatuerliche_fertigkeit',
            )
            const liturgie = actor.items.find((i: any) => i.type === 'liturgie')

            // First stil key that is not 'ohne'
            const stileList = actor.misc?.uebernatuerliche_stile_list ?? {}
            const stilKey = Object.keys(stileList).find((k) => k !== 'ohne') ?? null

            return {
                fertigkeitName: fertigkeit?.name ?? null,
                fertigkeitId: fertigkeit?.id ?? null,
                liturgieName: liturgie?.name ?? null,
                liturgieId: liturgie?.id ?? null,
                stilKey,
            }
        }, ACTOR_NAME)

        if (
            !discovered.fertigkeitName ||
            !discovered.fertigkeitId ||
            !discovered.liturgieName ||
            !discovered.liturgieId ||
            !discovered.stilKey
        ) {
            test.fail(
                true,
                `Precondition failed: HatAlles muss eine uebernatuerliche_fertigkeit, eine liturgie und mindestens einen Stil (außer "ohne") besitzen. Got: ${JSON.stringify(discovered)}`,
            )
            return
        }

        const { fertigkeitName, fertigkeitId, liturgieName, liturgieId, stilKey } = discovered

        // ── Actor-Sheet öffnen ──────────────────────────────────────────────
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        // ── Übernatürlich-Tab aktivieren ────────────────────────────────────
        await actorWindow.locator('nav [data-tab="uebernatuerlich"]').click()
        const uebernatuerlichTab = actorWindow.locator('section.tab.uebernatuerlich')
        await expect(uebernatuerlichTab).toBeVisible({ timeout: 10000 })

        // ── Phase 1: Stil-Select setzen ─────────────────────────────────────

        // Sicherstellen dass Stil auf "ohne" steht (idempotent via API)
        await page.evaluate(
            async ({ aName }: { aName: string }) => {
                const actor = (game as any).actors?.getName(aName)
                await actor?.update({ 'system.misc.selected_uebernatuerlicher_stil': 'ohne' })
            },
            { aName: ACTOR_NAME },
        )

        const stilSelect = uebernatuerlichTab.locator('select.selected-uebernatuerlicher-stil')
        await expect(stilSelect).toBeVisible({ timeout: 10000 })

        // Stil setzen
        await stilSelect.selectOption({ value: stilKey })

        // Warten bis Akteur gespeichert hat
        await page.waitForFunction(
            ({ aName, key }: { aName: string; key: string }) => {
                const actor = (game as any).actors?.getName(aName)
                return actor?.system?.misc?.selected_uebernatuerlicher_stil === key
            },
            { aName: ACTOR_NAME, key: stilKey },
            { timeout: 15000 },
        )

        // UI-Assertion: Select zeigt den gesetzten Wert
        await expect(stilSelect).toHaveValue(stilKey, { timeout: 10000 })

        // ── Phase 2: ausklappView Fertigkeit ────────────────────────────────

        const fertigkeitExpandRow = uebernatuerlichTab.locator(`#ausklappen-view-${fertigkeitId}`)

        // Negativprüfung: noch eingeklappt
        await expect(fertigkeitExpandRow).toHaveClass(/hero-expandable-row-hidden/, {
            timeout: 5000,
        })

        // Name-Label klicken (ausklappView)
        await uebernatuerlichTab
            .locator(`label[data-action="ausklappView"][data-ausklappentarget="${fertigkeitId}"]`)
            .click()

        // Row ist nicht mehr hidden
        await expect(fertigkeitExpandRow).not.toHaveClass(/hero-expandable-row-hidden/, {
            timeout: 5000,
        })

        // Beschreibungstext sichtbar und nicht leer
        const fertigkeitTextLabel = fertigkeitExpandRow.locator(
            '.hero-expandable-row-cell label.hero-text-preformatted',
        )
        await expect(fertigkeitTextLabel).toBeVisible({ timeout: 5000 })
        await expect(fertigkeitTextLabel).not.toBeEmpty()

        // Wieder einklappen
        await uebernatuerlichTab
            .locator(`label[data-action="ausklappView"][data-ausklappentarget="${fertigkeitId}"]`)
            .click()
        await expect(fertigkeitExpandRow).toHaveClass(/hero-expandable-row-hidden/, {
            timeout: 5000,
        })

        // ── Phase 3: ausklappView Liturgie ──────────────────────────────────

        const liturgieExpandRow = uebernatuerlichTab.locator(`#ausklappen-view-${liturgieId}`)

        // Negativprüfung: noch eingeklappt
        await expect(liturgieExpandRow).toHaveClass(/hero-expandable-row-hidden/, {
            timeout: 5000,
        })

        // Name-Label klicken
        await uebernatuerlichTab
            .locator(`label[data-action="ausklappView"][data-ausklappentarget="${liturgieId}"]`)
            .click()

        // Row ist nicht mehr hidden
        await expect(liturgieExpandRow).not.toHaveClass(/hero-expandable-row-hidden/, {
            timeout: 5000,
        })

        // Beschreibungstext sichtbar und nicht leer (erster Span, da mehrere vorhanden)
        const liturgieTextSpan = liturgieExpandRow
            .locator('.hero-expandable-row-cell .hero-text-preformatted')
            .first()
        await expect(liturgieTextSpan).toBeVisible({ timeout: 5000 })
        await expect(liturgieTextSpan).not.toBeEmpty()

        // Wieder einklappen
        await uebernatuerlichTab
            .locator(`label[data-action="ausklappView"][data-ausklappentarget="${liturgieId}"]`)
            .click()
        await expect(liturgieExpandRow).toHaveClass(/hero-expandable-row-hidden/, {
            timeout: 5000,
        })

        // ── Phase 4: Fertigkeit PW-Zelle → direkter Chat-Würfelwurf ─────────
        // Hinweis: data-rolltype="uebernatuerliche_fertigkeit" öffnet KEINEN Dialog,
        // sondern würfelt direkt in den Chat (kein UebernatuerlichDialog).

        const fertigkeitRollCell = uebernatuerlichTab.locator(
            `td[data-action="rollable"][data-rolltype="uebernatuerliche_fertigkeit"][data-fertigkeit="${fertigkeitName}"]`,
        )
        await expect(fertigkeitRollCell).toBeVisible({ timeout: 10000 })

        const chatCountBefore = await page.evaluate(
            () => (game as any).messages?.contents?.length ?? 0,
        )

        await fertigkeitRollCell.click()

        // Warten bis eine neue Chat-Nachricht erscheint (direkter Würfelwurf)
        await page.waitForFunction(
            (before: number) => ((game as any).messages?.contents?.length ?? 0) > before,
            chatCountBefore,
            { timeout: 15000 },
        )

        // Negativprüfung: kein Dialog erschienen (direkter Roll, kein UebernatuerlichDialog)
        await expect(page.locator('.application.uebernatuerlich-dialog')).toHaveCount(0)

        // ── Phase 5: Roll-Dialog Liturgie öffnen ────────────────────────────

        const liturgieRollIcon = uebernatuerlichTab.locator(
            `td[data-action="rollable"][data-rolltype="karma_diag"][data-itemid="${liturgieId}"]`,
        )
        await expect(liturgieRollIcon).toBeVisible({ timeout: 10000 })

        // Negativprüfung: kein Dialog offen vor Klick
        await expect(page.locator('.application.uebernatuerlich-dialog')).toHaveCount(0)

        await liturgieRollIcon.click()

        const liturgieDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(liturgieDialog).toBeVisible({ timeout: 15000 })

        // Dialog sofort schließen
        await liturgieDialog.locator('button[data-action="close"]').click()
        await liturgieDialog.waitFor({ state: 'hidden', timeout: 10000 })
    })
})
