import * as path from 'path'
import { fileURLToPath } from 'url'

import { expect, test } from '@playwright/test'

import { foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTOR_NAME = 'HatAllesXMLIMPORTTEST'

// XML-Fixture liegt im selben Verzeichnis wie dieser Test — CI-kompatibel
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const XML_FIXTURE_PATH = path.join(__dirname, 'testcharakter.xml')

// Erwartete Werte aus der XML-Fixture
const EXPECTED_MU = 16
const EXPECTED_GE = 23
const EXPECTED_KLINGENWAFFEN = 10

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('E2E-016 Sephrasto XML-Import', () => {
    let importedActorId: string | null = null

    test.afterEach(async ({ page }) => {
        if (!importedActorId) return
        try {
            await page.evaluate(async (actorId: string) => {
                const actor = (game as any).actors?.get(actorId)
                if (actor) await actor.delete()
            }, importedActorId)
        } finally {
            importedActorId = null
        }
    })

    test('XML hochladen, Bestätigungs-Dialog prüfen, Actor importieren und verifizieren', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        // ── Phase 0: Guard-Cleanup (stale Actor aus vorherigem Lauf) ─────
        await page.evaluate(async (name: string) => {
            const existing = (game as any).actors?.getName(name)
            if (existing) await existing.delete()
        }, ACTOR_NAME)

        // ── Phase 1: Akteure-Sidebar öffnen ──────────────────────────────
        await page.locator('[data-tab="actors"]').first().click()

        const importBtn = page.locator('button.import-xml-character')
        await expect(importBtn).toBeVisible({ timeout: 10000 })

        // Negativprüfung: Actor existiert noch nicht
        const existsBefore = await page.evaluate(
            (name: string) => !!(game as any).actors?.getName(name),
            ACTOR_NAME,
        )
        expect(existsBefore).toBe(false)

        // ── Phase 2: Datei hochladen ──────────────────────────────────────
        // KRITISCH: filechooser-Listener VOR dem Klick registrieren,
        // da <input type="file"> sofort nach click() aus dem DOM entfernt wird.
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            importBtn.click(),
        ])
        await fileChooser.setFiles(XML_FIXTURE_PATH)

        // ── Phase 3: Bestätigungs-Dialog ─────────────────────────────────
        const confirmBtn = page.locator('button:has-text("Charakter importieren")')
        await expect(confirmBtn).toBeVisible({ timeout: 15000 })

        // Dialog-Inhalt enthält den Charakternamen aus der XML
        const dialogWindow = page.locator('.app.dialog, .window-app, .application').filter({
            has: confirmBtn,
        })
        await expect(dialogWindow).toContainText(ACTOR_NAME, { timeout: 5000 })

        await confirmBtn.click()

        // ── Phase 4: Warten bis Actor importiert ist ─────────────────────
        await page.waitForFunction(
            (name: string) => !!(game as any).actors?.getName(name),
            ACTOR_NAME,
            { timeout: 30000 },
        )

        // ── Phase 5: Actor-Daten verifizieren ────────────────────────────
        const actorData = await page.evaluate((name: string) => {
            const actor = (game as any).actors?.getName(name)
            if (!actor) return null

            const klingenwaffen = actor.items.find(
                (i: any) => i.type === 'fertigkeit' && i.name === 'Klingenwaffen',
            )
            const fernkampfwaffe = actor.items.find((i: any) => i.type === 'fernkampfwaffe')

            return {
                id: actor.id as string,
                muWert: (actor.system.attribute?.MU?.wert ?? null) as number | null,
                geWert: (actor.system.attribute?.GE?.wert ?? null) as number | null,
                klingenwaffenWert: (klingenwaffen?.system?.fw ?? null) as number | null,
                hasFernkampfwaffe: !!fernkampfwaffe,
            }
        }, ACTOR_NAME)

        expect(actorData, `Actor "${ACTOR_NAME}" nicht in game.actors gefunden`).not.toBeNull()
        expect(actorData!.muWert).toBe(EXPECTED_MU)
        expect(actorData!.geWert).toBe(EXPECTED_GE)
        expect(actorData!.klingenwaffenWert).toBe(EXPECTED_KLINGENWAFFEN)
        expect(actorData!.hasFernkampfwaffe).toBe(true)

        importedActorId = actorData!.id

        // Negativprüfung Cleanup-Vorbereitung: ID ist gesetzt → afterEach löscht
        expect(importedActorId).toBeTruthy()
    })
})
