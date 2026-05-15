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

const ITEM_NAME_GEGENSTAND = 'E2E-Testgegenstand'
const ITEM_NAME_BEHAELTER = 'E2E-Behälter'
const ITEM_NAME_INHALT = 'E2E-Inhalt'

const DUKATEN_INPUT = 10
const SILBERTALER_INPUT = 25
const DUKATEN_EXPECTED = 12
const SILBERTALER_EXPECTED = 5

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wartet bis ein Item mit gegebenem Namen auf dem Akteur vorhanden ist. */
async function waitForItemExists(
    page: import('@playwright/test').Page,
    actorName: string,
    itemName: string,
) {
    await page.waitForFunction(
        ({ aName, iName }: { aName: string; iName: string }) => {
            const actor = (game as any).actors?.getName(aName)
            return actor?.items?.some((i: any) => i.name === iName) ?? false
        },
        { aName: actorName, iName: itemName },
        { timeout: 15000 },
    )
}

/** Wartet bis ein Item mit gegebenem Namen auf dem Akteur nicht mehr vorhanden ist. */
async function waitForItemGone(
    page: import('@playwright/test').Page,
    actorName: string,
    itemName: string,
) {
    await page.waitForFunction(
        ({ aName, iName }: { aName: string; iName: string }) => {
            const actor = (game as any).actors?.getName(aName)
            return !actor?.items?.some((i: any) => i.name === iName)
        },
        { aName: actorName, iName: itemName },
        { timeout: 15000 },
    )
}

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('E2E-013 Inventar-Tab — Geld und Gegenstände', () => {
    let actorDefaultSnapshot: ActorDefaultSnapshot | null = null

    test.afterEach(async ({ page }) => {
        if (!actorDefaultSnapshot) return
        try {
            await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
        } finally {
            actorDefaultSnapshot = null
        }
    })

    test('Geld normalisieren, Gegenstand anlegen/löschen, Behälter anlegen, Inhalt legen, umgekehrt löschen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        // ── Actor-Sheet öffnen ──────────────────────────────────────────────
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        // ── Inventar-Tab aktivieren ─────────────────────────────────────────
        await actorWindow.locator('nav [data-tab="inventar"]').click()
        const inventar = actorWindow.locator('section.tab.inventar')
        await expect(inventar).toBeVisible({ timeout: 10000 })

        // ── Phase 1: Geld normalisieren ─────────────────────────────────────

        // Negativprüfung: normalisierten Wert noch nicht voraussetzen
        const dukatenInput = inventar.locator('input[name="system.geld.dukaten"]')
        const silbertalerInput = inventar.locator('input[name="system.geld.silbertaler"]')
        await expect(dukatenInput).not.toHaveValue(String(DUKATEN_EXPECTED))
        await expect(silbertalerInput).not.toHaveValue(String(SILBERTALER_EXPECTED))

        // Geld-Werte direkt über die Foundry API setzen (AppV2 submitOnChange
        // reagiert nur auf native change-Events; direkte API-Mutation ist robuster)
        await page.evaluate(
            async ({ aName, d, s }: { aName: string; d: number; s: number }) => {
                const actor = (game as any).actors?.getName(aName)
                if (!actor) throw new Error(`Actor "${aName}" not found`)
                await actor.update({
                    'system.geld.dukaten': d,
                    'system.geld.silbertaler': s,
                })
            },
            { aName: ACTOR_NAME, d: DUKATEN_INPUT, s: SILBERTALER_INPUT },
        )

        // Warten bis Akteur gespeichert hat
        await page.waitForFunction(
            ({ aName, d, s }: { aName: string; d: number; s: number }) => {
                const actor = (game as any).actors?.getName(aName)
                return actor?.system?.geld?.dukaten === d && actor?.system?.geld?.silbertaler === s
            },
            { aName: ACTOR_NAME, d: DUKATEN_INPUT, s: SILBERTALER_INPUT },
            { timeout: 15000 },
        )

        // Sheet explizit re-rendern damit die Inputs die aktuellen Werte zeigen
        // (actor.sheet.render() ist zuverlässiger als ein Tab-Re-Click auf den bereits aktiven Tab)
        await page.evaluate((aName: string) => {
            const actor = (game as any).actors?.getName(aName)
            actor?.sheet?.render()
        }, ACTOR_NAME)
        await expect(dukatenInput).toHaveValue(String(DUKATEN_INPUT), { timeout: 10000 })

        // zusammenrechnen klicken
        const zusammenrechnenBtn = inventar.locator(
            'button[data-action="clickable"][data-clicktype="shorten_money"]',
        )
        await expect(zusammenrechnenBtn).toBeVisible({ timeout: 10000 })
        await zusammenrechnenBtn.click()

        // Warten bis normalisierter Wert persistiert ist
        await page.waitForFunction(
            ({ aName, d, s }: { aName: string; d: number; s: number }) => {
                const actor = (game as any).actors?.getName(aName)
                return actor?.system?.geld?.dukaten === d && actor?.system?.geld?.silbertaler === s
            },
            { aName: ACTOR_NAME, d: DUKATEN_EXPECTED, s: SILBERTALER_EXPECTED },
            { timeout: 15000 },
        )

        // UI-Assertions: Inputs zeigen normalisierte Werte
        await expect(dukatenInput).toHaveValue(String(DUKATEN_EXPECTED), { timeout: 10000 })
        await expect(silbertalerInput).toHaveValue(String(SILBERTALER_EXPECTED), {
            timeout: 10000,
        })

        // ── Phase 2: Normalen Gegenstand anlegen und löschen ───────────────

        const addItemLink = inventar.locator(
            'a[data-action="itemCreate"][data-itemclass="gegenstand"]',
        )
        await expect(addItemLink).toBeVisible({ timeout: 10000 })
        await addItemLink.click()

        // Neu geöffnetes Gegenstand-Sheet abwarten
        const gegenstandSheet = page.locator('.application.sheet.item.gegenstand').last()
        await expect(gegenstandSheet).toBeVisible({ timeout: 15000 })

        // Umbenennen
        const gegenstandNameInput = gegenstandSheet.locator('input[name="name"]')
        await gegenstandNameInput.fill(ITEM_NAME_GEGENSTAND)
        await gegenstandNameInput.press('Tab')

        // Warten bis Item auf Akteur persistiert ist
        await waitForItemExists(page, ACTOR_NAME, ITEM_NAME_GEGENSTAND)

        // Sheet schließen
        await gegenstandSheet.locator('button[data-action="close"]').click()
        await gegenstandSheet.waitFor({ state: 'hidden', timeout: 10000 })

        // Item in Inventarliste sichtbar
        const gegenstandRow = inventar
            .locator('div.twokindrow div.flexrow')
            .filter({ hasText: ITEM_NAME_GEGENSTAND })
        await expect(gegenstandRow).toBeVisible({ timeout: 10000 })

        // Löschen
        await gegenstandRow.locator('a[data-action="itemDelete"]').click()
        await waitForItemGone(page, ACTOR_NAME, ITEM_NAME_GEGENSTAND)

        // Negativprüfung: Item nicht mehr sichtbar
        await expect(gegenstandRow).not.toBeVisible({ timeout: 10000 })

        // ── Phase 3: Behälter mit negativem Platzbedarf anlegen ────────────

        await addItemLink.click()

        const behaelterSheet = page.locator('.application.sheet.item.gegenstand').last()
        await expect(behaelterSheet).toBeVisible({ timeout: 15000 })

        // Name setzen
        const behaelterNameInput = behaelterSheet.locator('input[name="name"]')
        await behaelterNameInput.fill(ITEM_NAME_BEHAELTER)
        await behaelterNameInput.press('Tab')

        // Gewicht auf -5 setzen → wird zum Container (item_list)
        const behaelterGewichtInput = behaelterSheet.locator('input[name="system.gewicht"]')
        await behaelterGewichtInput.fill('-5')
        await behaelterGewichtInput.press('Tab')

        // Warten bis Container-Item persistiert ist (gewicht < 0)
        await page.waitForFunction(
            ({ aName, iName }: { aName: string; iName: string }) => {
                const actor = (game as any).actors?.getName(aName)
                const item = actor?.items?.find((i: any) => i.name === iName)
                return item != null && item.system?.gewicht < 0
            },
            { aName: ACTOR_NAME, iName: ITEM_NAME_BEHAELTER },
            { timeout: 15000 },
        )

        // Sheet schließen
        await behaelterSheet.locator('button[data-action="close"]').click()
        await behaelterSheet.waitFor({ state: 'hidden', timeout: 10000 })

        // Handkarren-Überschrift des Behälters sichtbar
        const behaelterHeading = inventar.locator('h2').filter({ hasText: ITEM_NAME_BEHAELTER })
        await expect(behaelterHeading).toBeVisible({ timeout: 10000 })

        // ── Phase 4: Inhalt in Behälter legen ─────────────────────────────

        await addItemLink.click()

        const inhaltSheet = page.locator('.application.sheet.item.gegenstand').last()
        await expect(inhaltSheet).toBeVisible({ timeout: 15000 })

        // Name setzen
        const inhaltNameInput = inhaltSheet.locator('input[name="name"]')
        await inhaltNameInput.fill(ITEM_NAME_INHALT)
        await inhaltNameInput.press('Tab')

        // Aufbewahrungsort-Dropdown abwarten (sichtbar, da gewicht=0 per Default ≥ 0)
        const aufbewahrungsortSelect = inhaltSheet.locator(
            'select[name="system.aufbewahrungs_ort"]',
        )
        await expect(aufbewahrungsortSelect).toBeVisible({ timeout: 15000 })

        // Aufbewahrungsort auf E2E-Behälter setzen
        await aufbewahrungsortSelect.selectOption({ label: ITEM_NAME_BEHAELTER })

        // Warten bis Aufbewahrungsort persistiert ist
        await page.waitForFunction(
            ({ aName, iName, ort }: { aName: string; iName: string; ort: string }) => {
                const actor = (game as any).actors?.getName(aName)
                const item = actor?.items?.find((i: any) => i.name === iName)
                return item?.system?.aufbewahrungs_ort === ort
            },
            { aName: ACTOR_NAME, iName: ITEM_NAME_INHALT, ort: ITEM_NAME_BEHAELTER },
            { timeout: 15000 },
        )

        // Sheet schließen
        await inhaltSheet.locator('button[data-action="close"]').click()
        await inhaltSheet.waitFor({ state: 'hidden', timeout: 10000 })

        // E2E-Inhalt im Inventar sichtbar (im Behälter-Block)
        const inhaltRow = inventar
            .locator('div.twokindrow div.flexrow')
            .filter({ hasText: ITEM_NAME_INHALT })
        await expect(inhaltRow).toBeVisible({ timeout: 10000 })

        // ── Phase 5: Umgekehrt löschen (Inhalt zuerst, dann Behälter) ─────

        // Schritt 1: E2E-Inhalt löschen
        await inhaltRow.locator('a[data-action="itemDelete"]').click()
        await waitForItemGone(page, ACTOR_NAME, ITEM_NAME_INHALT)

        // Negativprüfung: E2E-Inhalt nicht mehr sichtbar
        await expect(inhaltRow).not.toBeVisible({ timeout: 10000 })

        // Schritt 2: E2E-Behälter löschen
        // Item-ID ermitteln, um den Container-Level Delete-Button eindeutig zu adressieren
        const behaelterId = await page.evaluate(
            ({ aName, iName }: { aName: string; iName: string }) => {
                const actor = (game as any).actors?.getName(aName)
                return actor?.items?.find((i: any) => i.name === iName)?.id ?? null
            },
            { aName: ACTOR_NAME, iName: ITEM_NAME_BEHAELTER },
        )
        expect(behaelterId).not.toBeNull()

        await inventar
            .locator(`a[data-action="itemDelete"][data-itemid="${behaelterId}"]`)
            .first()
            .click()
        await waitForItemGone(page, ACTOR_NAME, ITEM_NAME_BEHAELTER)

        // Negativprüfung: Behälter-Überschrift nicht mehr sichtbar
        await expect(behaelterHeading).not.toBeVisible({ timeout: 10000 })
    })
})
