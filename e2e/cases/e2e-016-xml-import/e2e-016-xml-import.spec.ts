import * as path from 'path'
import { fileURLToPath } from 'url'

import { expect, test } from '@playwright/test'

import { foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'
import {
    extractFoundryCharacterData,
    parseXmlCharacter,
    validateCharacterIntegrity,
} from '../../shared/helpers/xml-integrity-validator'
import { openActorSheet } from '../../shared/fixtures/foundry'

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
        const dialogContent = page.locator('.dialog-content')
        await expect(dialogContent).toContainText(ACTOR_NAME, { timeout: 5000 })

        // A visible locator alone is not sufficient: Playwright can activate a
        // clipped footer although a user cannot reach it. Scroll the actual
        // content area and prove that the confirmation control is in view.
        const scrollContainer = page.locator('.application.ilaris-import-dialog .window-content')
        await scrollContainer.evaluate((element) => {
            element.scrollTop = element.scrollHeight
        })
        await expect(confirmBtn).toBeInViewport()

        await confirmBtn.click()

        // ── Phase 4: Warten bis Actor importiert ist ─────────────────────
        await page.waitForFunction(
            (name: string) => !!(game as any).actors?.getName(name),
            ACTOR_NAME,
            { timeout: 30000 },
        )

        // Import läuft intern mehrstufig (Actor zuerst, Items danach).
        // Daher explizit warten, bis die erwarteten Items vorhanden sind.
        await page.waitForFunction(
            (name: string) => {
                const actor = (game as any).actors?.getName(name)
                if (!actor) return false
                const hasKlingenwaffen = actor.items.some(
                    (i: any) => i.type === 'fertigkeit' && i.name?.trim() === 'Klingenwaffen',
                )
                const hasFernkampfwaffe = actor.items.some((i: any) => i.type === 'fernkampfwaffe')
                return hasKlingenwaffen && hasFernkampfwaffe
            },
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
                ws: (actor.system.abgeleitete?.ws ?? null) as number | null,
                wsStern: (actor.system.abgeleitete?.ws_stern ?? null) as number | null,
                hasFernkampfwaffe: !!fernkampfwaffe,
                hasLegacyTypeItems: actor.items.some(
                    (i: any) =>
                        i.type === 'freie_fertigkeit' ||
                        i.type === 'uebernatuerliche_fertigkeit' ||
                        i.type === 'freiestalent' ||
                        i.type === 'abgeleiteter-wert',
                ) as boolean,
            }
        }, ACTOR_NAME)

        expect(actorData, `Actor "${ACTOR_NAME}" nicht in game.actors gefunden`).not.toBeNull()
        importedActorId = actorData!.id

        expect(actorData!.muWert).toBe(EXPECTED_MU)
        expect(actorData!.geWert).toBe(EXPECTED_GE)
        expect(actorData!.klingenwaffenWert).toBe(EXPECTED_KLINGENWAFFEN)
        expect(actorData!.ws).toBe(8)
        expect(actorData!.wsStern).toBe(8)
        expect(actorData!.hasFernkampfwaffe).toBe(true)
        expect(actorData!.hasLegacyTypeItems).toBe(false)

        // A newly imported Held must also render the Kampf template. This
        // caught the former Object.entries(undefined) failure only after a
        // user tried to open the character sheet.
        const renderErrors: string[] = []
        page.on('pageerror', (error) => renderErrors.push(error.message))
        const actorSheet = await openActorSheet(page, ACTOR_NAME)
        await actorSheet.locator('nav [data-tab="kampf"]').click()
        await expect(actorSheet.locator('section.tab.kampf')).toBeVisible({ timeout: 10000 })
        await expect(
            actorSheet.locator('select[name="system.misc.selected_kampfstil"]'),
        ).toBeVisible()
        expect(renderErrors).toEqual([])

        // Negativprüfung Cleanup-Vorbereitung: ID ist gesetzt → afterEach löscht
        expect(importedActorId).toBeTruthy()

        // ── Phase 6: Tiefgreifende Datenintegritätsprüfung ──────────────────
        // Validiere, dass ALLE Felder aus der Original-XML korrekt in Foundry
        // abgebildet wurden (Attribute, Skills, Vorteile, Waffen, Rüstungen, Talente)
        let xmlData
        try {
            xmlData = parseXmlCharacter(XML_FIXTURE_PATH)
        } catch (error) {
            throw new Error(
                `Phase 6 failed: Unable to parse XML fixture "${XML_FIXTURE_PATH}": ${error instanceof Error ? error.message : String(error)}`,
            )
        }

        const foundryData = await extractFoundryCharacterData(page, ACTOR_NAME)
        const integrityResult = validateCharacterIntegrity(xmlData, foundryData)

        // Detaillierte Fehlerausgabe bei Mismatch
        if (!integrityResult.valid) {
            const errorLog = integrityResult.mismatches
                .map(
                    (m) =>
                        `${m.category}: ${m.field} | Expected: ${JSON.stringify(m.expected)} | Actual: ${JSON.stringify(m.actual)}`,
                )
                .join('\n')

            console.error('Character Integrity Violations:\n' + errorLog)
        }

        expect(
            integrityResult.valid,
            `Character integrity check failed: ${integrityResult.summary}\n${integrityResult.mismatches.map((m) => `- ${m.category}: ${m.field}`).join('\n')}`,
        ).toBe(true)
    })
})
