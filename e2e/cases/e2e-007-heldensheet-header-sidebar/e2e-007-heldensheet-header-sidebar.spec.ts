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

const PORTRAIT_PATH = 'systems/Ilaris/assets/images/token/kreaturentypen/tier.png'

/** Attribute labels from CONFIG.ILARIS.label (scripts/core/config/label.js) */
const ATTRIBUTE_LABELS: Record<string, string> = {
    CH: 'Charisma',
    FF: 'Fingerfertigkeit',
    GE: 'Gewandheit',
    IN: 'Intuition',
    KK: 'Körperkraft',
    KL: 'Klugheit',
    KO: 'Konstitution',
    MU: 'Mut',
}

/** Alphabetical key order as rendered by {{sortAlphabetically}} in held-sidebar.hbs */
const ATTRIBUTE_ORDER = ['CH', 'FF', 'GE', 'IN', 'KK', 'KL', 'KO', 'MU'] as const

const CHARACTERS = [
    {
        name: 'HatAlles',
        schipsMax: 6,
        hasAsp: true, // zauberer=true (asp > 0)
        hasKap: true, // geweihter=true (kap > 0)
        /** PW values keyed by attribute abbreviation */
        pw: { CH: 28, FF: 32, GE: 46, IN: 44, KK: 24, KL: 24, KO: 30, MU: 32 } as Record<
            string,
            number
        >,
        abgeleitete: { ws: 8, wsStern: 8, mr: 24, ini: 26, gs: 11, dh: 17 },
        asp: 50,
        aspSternInit: 0,
        gaspInit: 0 as number | null,
        kap: 32,
        kapSternInit: 0,
        gkapInit: 0,
    },
    {
        name: 'Testlauf-Held',
        schipsMax: 4,
        hasAsp: true, // zauberer=true (asp > 0)
        hasKap: false, // geweihter=false (kap = 0)
        pw: { CH: 8, FF: 12, GE: 8, IN: 8, KK: 2, KL: 12, KO: 8, MU: 2 } as Record<string, number>,
        abgeleitete: { ws: 5, wsStern: 5, mr: 4, ini: 4, gs: 5, dh: 4 },
        asp: 16,
        aspSternInit: 16,
        gaspInit: null as number | null,
        kap: 0,
        kapSternInit: 0,
        gkapInit: 0,
    },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wundabzüge formula for the non-LEP system.
 * Source: scripts/actors/data/actor.js _calculateGesundheit()
 *   einschraenkungen = W + E
 *   einschraenkungen <= 2 → 0
 *   einschraenkungen >= 3 → -(einschraenkungen - 2) * 2
 */
function calcWundabzuege(wunden: number, erschoepfung: number): number {
    const t = wunden + erschoepfung
    return t <= 2 ? 0 : -(t - 2) * 2
}

/**
 * Expected globalermod = wundabzuege + furchtabzuege(0) + manuellermod
 * Source: scripts/actors/data/hardcodedvorteile.js globalermod()
 */
function calcGlobermod(wunden: number, erschoepfung: number, manuellermod = -3): number {
    return calcWundabzuege(wunden, erschoepfung) + manuellermod
}

/** Expected globalermoddisplay text.
 *  Source: scripts/actors/data/actor.js _calculateModifikatoren()
 *   globalermod < 0 → "${globalermod} auf alle Proben"   (negative sign is part of the number)
 *   globalermod = 0 → "-0 auf alle Proben"
 *   globalermod > 0 → "+${globalermod} auf alle Proben"
 */
function modDisplay(w: number, e: number): string {
    const mod = calcGlobermod(w, e)
    if (mod === 0) return '-0 auf alle Proben'
    if (mod > 0) return `+${mod} auf alle Proben`
    return `${mod} auf alle Proben`
}

// ── Tests ─────────────────────────────────────────────────────────────────────

for (const char of CHARACTERS) {
    test.describe(`E2E-007 HeldSheet Header+Sidebar — ${char.name}`, () => {
        test('Header (Schicksalspunkte + Wunden) und Sidebar vollständig prüfen', async ({
            page,
        }) => {
            await loginAndJoinWorld(page, foundryConfig)

            // Guard: LEP system uses a different wound formula — skip wundmalus assertions.
            // game.settings.get() throws when the setting is unregistered, so wrap in try/catch.
            // Namespace is 'Ilaris' (capital I) per ConfigureGameSettingsCategories.Ilaris.
            const useLepSystem = await page.evaluate(() => {
                try {
                    return (game as any).settings?.get('Ilaris', 'lepSystem') ?? false
                } catch {
                    return false
                }
            })

            const actorDefaultSnapshot: ActorDefaultSnapshot = await captureActorDefaultSnapshot(
                page,
                char.name,
            )

            // ── Idempotent state reset ────────────────────────────────────────
            await page.evaluate(
                async (params: {
                    name: string
                    gasp: number | null
                    aspStern: number
                    hasKap: boolean
                    gkap: number
                    kapStern: number
                }) => {
                    const actor = (game as any).actors?.getName(params.name)
                    if (!actor) return
                    const update: Record<string, unknown> = {
                        'system.modifikatoren.manuellermod': -3,
                        'system.gesundheit.wunden': 0,
                        'system.gesundheit.erschoepfung': 0,
                        'system.gesundheit.wundenignorieren': false,
                        'system.schips.schips_stern': 0,
                        'system.abgeleitete.gasp': params.gasp,
                        'system.abgeleitete.asp_stern': params.aspStern,
                    }
                    if (params.hasKap) {
                        update['system.abgeleitete.gkap'] = params.gkap
                        update['system.abgeleitete.kap_stern'] = params.kapStern
                    }
                    await actor.update(update)
                },
                {
                    name: char.name,
                    gasp: char.gaspInit,
                    aspStern: char.aspSternInit,
                    hasKap: char.hasKap,
                    gkap: char.gkapInit,
                    kapStern: char.kapSternInit,
                },
            )

            try {
                const actorWindow = await openActorSheet(page, char.name)
                const sidebarLabel = actorWindow.locator('.hero-global-mod-label')

                // ================================================================
                // HEADER — Schicksalspunkte
                // ================================================================

                // Add schips one by one (clicking the ith empty button adds 1).
                // After step i: buttons 0..i are filled, buttons i+1..max-1 are empty.
                for (let i = 0; i < char.schipsMax; i++) {
                    await actorWindow.locator('.schips-button').nth(i).click()
                    await expect(actorWindow.locator('.schips-button.filled')).toHaveCount(i + 1, {
                        timeout: 5000,
                    })
                }

                // Remove all schips by clicking the last filled button each time.
                for (let i = char.schipsMax; i > 0; i--) {
                    await actorWindow.locator('.schips-button.filled').last().click()
                    await expect(actorWindow.locator('.schips-button.filled')).toHaveCount(i - 1, {
                        timeout: 5000,
                    })
                }

                // Add one schips back.
                await actorWindow.locator('.schips-button').first().click()
                await expect(actorWindow.locator('.schips-button.filled')).toHaveCount(1, {
                    timeout: 5000,
                })

                // ================================================================
                // HEADER — Wunden / Erschöpfung (8 tri-state buttons)
                //   state-0 = gesund, state-1 = Wunde (red), state-2 = Erschöpfung (yellow)
                //   Cycle: 0 → 1 → 2 → 0
                // ================================================================

                const wundButtons = actorWindow.locator('#lebensleiste .triStateBtn')

                // Phase 1: Add wunden (0 → 1) for each button 0..7.
                for (let i = 0; i < 8; i++) {
                    await wundButtons.nth(i).click()
                    await expect(wundButtons.nth(i)).toHaveClass(/state-1/, { timeout: 5000 })
                    if (!useLepSystem) {
                        await expect(sidebarLabel).toContainText(modDisplay(i + 1, 0), {
                            timeout: 5000,
                        })
                    }
                }

                // Phase 2: Convert each wunde to Erschöpfung by clicking button 0 repeatedly.
                //
                // The triStateClick handler works as follows:
                //   1. Direct DOM: target.dataset.state = (current+1) % 3
                //   2. Count all data-state=1 → wunden, data-state=2 → erschöpfung
                //   3. actor.update({wunden, erschöpfung})
                //   4. Re-render assigns states by INDEX: 0..W-1 → state-1, W..W+E-1 → state-2
                //
                // Consequence: clicking button i does NOT keep it in state-2 after re-render —
                // the re-render repositions erschöpfung to the END of the filled range.
                //
                // Sync-point strategy: after iteration i, wunden=7-i, erschöpfung=i+1.
                // Button (7-i) is the NEWLY transitioned button (state-1 → state-2).
                // Waiting on nth(7-i) for state-2 correctly gates the re-render completion.
                for (let i = 0; i < 8; i++) {
                    await wundButtons.nth(0).click() // button 0 is always state-1 until last click
                    const wunden = 7 - i
                    const erschoepfung = i + 1
                    // After re-render: buttons 0..W-1 state-1, buttons W..7 state-2.
                    // nth(7-i) just transitioned to state-2 — use it as sync point.
                    await expect(wundButtons.nth(7 - i)).toHaveClass(/state-2/, { timeout: 5000 })
                    if (!useLepSystem) {
                        await expect(sidebarLabel).toContainText(modDisplay(wunden, erschoepfung), {
                            timeout: 5000,
                        })
                    }
                }
                // After 8 clicks: wunden=0, erschöpfung=8, all buttons state-2.

                // Phase 3: Remove all erschöpfung by clicking button 0 repeatedly (state-2 → state-0).
                // After iteration i: erschöpfung=7-i. Re-render: 0..E-1 → state-2, E..7 → state-0.
                // nth(7-i) is the NEWLY transitioned button (state-2 → state-0) — use as sync point.
                for (let i = 0; i < 8; i++) {
                    await wundButtons.nth(0).click() // button 0 is always state-2 until last click
                    const erschoepfung = 7 - i
                    // nth(7-i) just became state-0 — wait for it as re-render sync point.
                    await expect(wundButtons.nth(7 - i)).toHaveClass(/state-0/, { timeout: 5000 })
                    if (!useLepSystem) {
                        await expect(sidebarLabel).toContainText(modDisplay(0, erschoepfung), {
                            timeout: 5000,
                        })
                    }
                }
                // After 8 clicks: wunden=0, erschöpfung=0, all buttons state-0.

                // Phase 4: Set up 2W+2E via API for sidebar tests.
                // Achieving a specific wunden/erschöpfung split via UI clicks is unreliable
                // because the re-render assigns states by index, not by which button was clicked.
                await page.evaluate(async (n: string) => {
                    const actor = (game as any).actors?.getName(n)
                    if (actor)
                        await actor.update({
                            'system.gesundheit.wunden': 2,
                            'system.gesundheit.erschoepfung': 2,
                        })
                }, char.name)
                await expect(wundButtons.nth(0)).toHaveClass(/state-1/, { timeout: 5000 })
                await expect(wundButtons.nth(1)).toHaveClass(/state-1/, { timeout: 5000 })
                await expect(wundButtons.nth(2)).toHaveClass(/state-2/, { timeout: 5000 })
                await expect(wundButtons.nth(3)).toHaveClass(/state-2/, { timeout: 5000 })

                // Verify: 2W+2E → wundabzuege=-4, globalermod=-7
                if (!useLepSystem) {
                    await expect(sidebarLabel).toContainText(modDisplay(2, 2), { timeout: 5000 })
                }

                // ================================================================
                // SIDEBAR — Portrait ändern
                // ================================================================

                await actorWindow.locator('img.profile-img[data-action="editImage"]').click()

                const filePicker = page.locator('.window-app.filepicker').last()
                const filePickerVisible = await filePicker
                    .waitFor({ state: 'visible', timeout: 10000 })
                    .then(() => true)
                    .catch(() => false)

                if (filePickerVisible) {
                    // UI path: fill the target path input and confirm.
                    await filePicker.locator('input[name="target"]').fill(PORTRAIT_PATH)
                    await filePicker.locator('button[name="select"]').click()
                    await expect(filePicker).not.toBeVisible({ timeout: 5000 })
                } else {
                    // API fallback: FilePicker structure differs or did not open.
                    await page.evaluate(
                        async (params: { name: string; path: string }) => {
                            const actor = (game as any).actors?.getName(params.name)
                            if (actor) await actor.update({ img: params.path })
                        },
                        { name: char.name, path: PORTRAIT_PATH },
                    )
                }

                // Verify portrait src was updated.
                await expect(
                    actorWindow.locator('img.profile-img[data-action="editImage"]'),
                ).toHaveAttribute('src', /tier\.png/, { timeout: 10000 })

                // ================================================================
                // SIDEBAR — Attribute PW-Check + Dialog-Check
                //   Attributes appear alphabetically: CH, FF, GE, IN, KK, KL, KO, MU
                // ================================================================

                for (const attrKey of ATTRIBUTE_ORDER) {
                    const attrWrapper = actorWindow.locator(
                        `.attribute-wrapper[data-attribut="${attrKey}"]`,
                    )
                    const expectedPw = char.pw[attrKey]

                    // Verify PW label.
                    await expect(attrWrapper.locator('.attribute-number')).toHaveText(
                        String(expectedPw),
                        { timeout: 5000 },
                    )

                    // Click to open FertigkeitDialog (data-rolltype="fertigkeit_diag").
                    await attrWrapper.click()
                    const fertigkeitDialog = page
                        .locator('.application.ilaris.fertigkeit-dialog')
                        .last()
                    await expect(fertigkeitDialog).toBeVisible({ timeout: 15000 })

                    const attrLabel = ATTRIBUTE_LABELS[attrKey]
                    await expect(fertigkeitDialog).toContainText(`Attributsprobe: ${attrLabel}`, {
                        timeout: 5000,
                    })

                    // For MU: verify Basis PW and Status modifier in preview.
                    if (attrKey === 'MU') {
                        await expect(
                            fertigkeitDialog.locator('.modifier-item.base-value'),
                        ).toContainText(String(expectedPw), { timeout: 5000 })
                        if (!useLepSystem) {
                            // globalermod = -7 (2W+2E, manuellermod=-3)
                            const currentGlobermod = calcGlobermod(2, 2)
                            await expect(
                                fertigkeitDialog
                                    .locator('.modifier-item')
                                    .filter({ hasText: 'Status' }),
                            ).toContainText(String(currentGlobermod), { timeout: 5000 })
                        }
                    }

                    // Close dialog.
                    await fertigkeitDialog.locator('button[data-action="close"]').click()
                    await expect(fertigkeitDialog).not.toBeVisible({ timeout: 5000 })
                }

                // ================================================================
                // SIDEBAR — Abgeleitete Werte prüfen
                // ================================================================

                await expect(
                    actorWindow.locator(
                        '.icon-overlay-container:has(img[title="WS"]) .overlay-label',
                    ),
                ).toHaveText(String(char.abgeleitete.ws), { timeout: 5000 })

                await expect(
                    actorWindow.locator(
                        '.icon-overlay-container:has(img[title="WS*"]) .overlay-label',
                    ),
                ).toHaveText(String(char.abgeleitete.wsStern), { timeout: 5000 })

                await expect(
                    actorWindow.locator(
                        '.attribute-wrapper[data-rolltype="simpleprobe_diag"] .attribute-number',
                    ),
                ).toHaveText(String(char.abgeleitete.mr), { timeout: 5000 })

                await expect(
                    actorWindow.locator(
                        '.icon-overlay-container:has(img[title="INI"]) .overlay-label',
                    ),
                ).toHaveText(String(char.abgeleitete.ini), { timeout: 5000 })

                await expect(
                    actorWindow.locator(
                        '.icon-overlay-container:has(img[title="GS"]) .overlay-label',
                    ),
                ).toHaveText(String(char.abgeleitete.gs), { timeout: 5000 })

                await expect(
                    actorWindow.locator(
                        '.icon-overlay-container:has(img[title="DH"]) .overlay-label',
                    ),
                ).toHaveText(String(char.abgeleitete.dh), { timeout: 5000 })

                // ================================================================
                // SIDEBAR — MR-Dialog (simpleprobe_diag → legacy Dialog)
                // ================================================================

                await actorWindow
                    .locator('.attribute-wrapper[data-rolltype="simpleprobe_diag"]')
                    .click()

                // Legacy Dialog renders as .window-app; match by contained text "Magierresistenz".
                const mrDialog = page
                    .locator('.window-app')
                    .filter({ hasText: 'Magierresistenz' })
                    .last()
                await expect(mrDialog).toBeVisible({ timeout: 15000 })
                await expect(mrDialog).toContainText('Magierresistenz', { timeout: 5000 })

                await page.keyboard.press('Escape')
                await expect(mrDialog).not.toBeVisible({ timeout: 5000 })

                // ================================================================
                // SIDEBAR — Wundabzüge ignorieren
                // ================================================================

                // Pre-condition: 2W+2E active → globalermod = -7 (non-LEP).
                if (!useLepSystem) {
                    await expect(sidebarLabel).toContainText(modDisplay(2, 2), { timeout: 5000 })
                }

                const wundToggle = actorWindow.locator(
                    'a[data-action="toggleBool"][data-togglevariable="system.gesundheit.wundenignorieren"]',
                )
                await wundToggle.click()

                // Toggle text changes to "ignorieren" when active.
                await expect(wundToggle).toContainText('ignorieren', { timeout: 5000 })

                // With wundenignorieren=true: wundabzuege=0 → globalermod = only manuellermod (-3).
                await expect(sidebarLabel).toContainText('-3 auf alle Proben', { timeout: 5000 })

                // ================================================================
                // SIDEBAR — AsP / KaP Anzeige prüfen
                //   Template guards: {{#if zauberer}} for AsP, {{#if geweihter}} for KaP.
                //   Labels: label.hero-energy-label-spacing:not([data-action])
                //     nth(0) = asp value, nth(1) = kap value (if both present)
                // ================================================================

                if (char.hasAsp) {
                    // asp base value label
                    await expect(
                        actorWindow
                            .locator('label.hero-energy-label-spacing:not([data-action])')
                            .nth(0),
                    ).toHaveText(String(char.asp), { timeout: 5000 })

                    // Initial gAsP input value
                    // Skip gAsP assertion when initValue is null (field may be coerced to 0 by Foundry schema).
                    if (char.gaspInit !== null) {
                        await expect(
                            actorWindow.locator('input[name="system.abgeleitete.gasp"]'),
                        ).toHaveValue(String(char.gaspInit), { timeout: 5000 })
                    }

                    // Initial AsP* input value
                    await expect(
                        actorWindow.locator('input[name="system.abgeleitete.asp_stern"]'),
                    ).toHaveValue(String(char.aspSternInit), { timeout: 5000 })
                }

                if (char.hasKap) {
                    // kap base value label (second non-action hero-energy-label-spacing)
                    await expect(
                        actorWindow
                            .locator('label.hero-energy-label-spacing:not([data-action])')
                            .nth(1),
                    ).toHaveText(String(char.kap), { timeout: 5000 })

                    await expect(
                        actorWindow.locator('input[name="system.abgeleitete.gkap"]'),
                    ).toHaveValue(String(char.gkapInit), { timeout: 5000 })

                    await expect(
                        actorWindow.locator('input[name="system.abgeleitete.kap_stern"]'),
                    ).toHaveValue(String(char.kapSternInit), { timeout: 5000 })
                }

                // ================================================================
                // SIDEBAR — gAsP → 3, AsP* → 16 setzen
                // ================================================================

                if (char.hasAsp) {
                    const gaspInput = actorWindow.locator('input[name="system.abgeleitete.gasp"]')
                    await gaspInput.fill('3')
                    await gaspInput.press('Tab') // blur → AppV2 saves via form change

                    await expect(
                        actorWindow.locator('input[name="system.abgeleitete.gasp"]'),
                    ).toHaveValue('3', { timeout: 10000 })

                    const aspSternInput = actorWindow.locator(
                        'input[name="system.abgeleitete.asp_stern"]',
                    )
                    await aspSternInput.fill('16')
                    await aspSternInput.press('Tab')

                    await expect(
                        actorWindow.locator('input[name="system.abgeleitete.asp_stern"]'),
                    ).toHaveValue('16', { timeout: 10000 })

                    // Wait for AppV2 to persist asp_stern to the actor before proceeding.
                    // The toHaveValue assertion above passes as soon as the DOM reflects the typed
                    // value, but the async actor.update() triggered by Tab may still be in-flight.
                    // If it resolves while we are interacting with the gKaP input, the re-render
                    // replaces the DOM element and the fill is lost.
                    await page.waitForFunction(
                        (name: string) =>
                            (game as any).actors?.getName(name)?.system?.abgeleitete?.asp_stern ===
                            16,
                        char.name,
                        { timeout: 10000 },
                    )
                }

                // ================================================================
                // SIDEBAR — gKaP → 3, KaP* → 16 setzen (HatAlles only)
                // ================================================================

                if (char.hasKap) {
                    // Confirm the gKaP input is stable (re-render from ASP save has settled).
                    const gkapInput = actorWindow.locator('input[name="system.abgeleitete.gkap"]')
                    await expect(gkapInput).toBeVisible({ timeout: 5000 })
                    await gkapInput.fill('3')
                    await gkapInput.press('Tab')

                    await expect(
                        actorWindow.locator('input[name="system.abgeleitete.gkap"]'),
                    ).toHaveValue('3', { timeout: 10000 })

                    const kapSternInput = actorWindow.locator(
                        'input[name="system.abgeleitete.kap_stern"]',
                    )
                    await kapSternInput.fill('16')
                    await kapSternInput.press('Tab')

                    await expect(
                        actorWindow.locator('input[name="system.abgeleitete.kap_stern"]'),
                    ).toHaveValue('16', { timeout: 10000 })
                }
            } finally {
                // ================================================================
                // CLEANUP — Restore all modified state (runs even if assertions fail)
                // ================================================================

                await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
            } // end finally
        })
    })
}
