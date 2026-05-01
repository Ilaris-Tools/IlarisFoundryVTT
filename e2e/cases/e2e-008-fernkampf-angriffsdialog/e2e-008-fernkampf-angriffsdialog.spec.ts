import { expect, test } from '@playwright/test'

import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openRangedAttackDialogForWeapon,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'

// Hilfsfunktion: Angreifen-Button klicken mit Fallback fuer flaky AppV2-Clicks
async function rollAndCaptureAttack(
    page: import('@playwright/test').Page,
    attackDialog: import('@playwright/test').Locator,
): Promise<{ flavor: string; total: number | null; formula: string }> {
    const beforeCount = await page.evaluate(() => game.messages.contents.length)

    const attackButton = attackDialog.locator(
        '.modifier-summary.attack-summary.clickable-summary.angreifen',
    )
    await attackButton.click()

    const chatIncreased = await page
        .waitForFunction((baseline) => game.messages.contents.length > baseline, beforeCount, {
            timeout: 4000,
        })
        .then(() => true)
        .catch(() => false)

    if (!chatIncreased) {
        // Fallback fuer flaky click delivery in AppV2 overlays
        await page.evaluate(() => {
            const node = document.querySelector(
                '.application.fernkampf-dialog .modifier-summary.attack-summary.clickable-summary.angreifen',
            )
            node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        })
    }

    await page.waitForFunction(
        (baseline) => game.messages.contents.length === baseline + 1,
        beforeCount,
        { timeout: 20000 },
    )

    return page.evaluate(() => {
        const msg = game.messages.contents.at(-1)
        return {
            flavor: msg?.flavor ?? '',
            total: msg?.rolls?.[0]?.total ?? null,
            formula: msg?.rolls?.[0]?.formula ?? '',
        }
    })
}

// Hilfsfunktion: Schaden-Button klicken mit Fallback
async function rollAndCaptureDamage(
    page: import('@playwright/test').Page,
    attackDialog: import('@playwright/test').Locator,
): Promise<{ flavor: string; total: number | null }> {
    const beforeCount = await page.evaluate(() => game.messages.contents.length)

    const damageButton = attackDialog.locator(
        '.modifier-summary.damage-summary.clickable-summary.schaden',
    )
    await damageButton.click()

    const chatIncreased = await page
        .waitForFunction((baseline) => game.messages.contents.length > baseline, beforeCount, {
            timeout: 4000,
        })
        .then(() => true)
        .catch(() => false)

    if (!chatIncreased) {
        await page.evaluate(() => {
            const node = document.querySelector(
                '.application.fernkampf-dialog .modifier-summary.damage-summary.clickable-summary.schaden',
            )
            node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        })
    }

    await page.waitForFunction(
        (baseline) => game.messages.contents.length === baseline + 1,
        beforeCount,
        { timeout: 20000 },
    )

    return page.evaluate(() => {
        const msg = game.messages.contents.at(-1)
        return {
            flavor: msg?.flavor ?? '',
            total: msg?.rolls?.[0]?.total ?? null,
        }
    })
}

test.describe('E2E-008 Fernkampf-Angriffsdialog', () => {
    // ------------------------------------------------------------------ //
    // Szenario A: Standard-Angriff (alle Selects auf neutralen Werten)
    // ------------------------------------------------------------------ //
    test('A: Standard-Angriff – alle Selects neutral, Chat validieren', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openRangedAttackDialogForWeapon(actorWindow)

        const attackDialog = page.locator('.application.fernkampf-dialog').last()
        await expect(attackDialog).toBeVisible({ timeout: 15000 })
        await expect(attackDialog).toContainText('Fernkampfangriff:')

        // Selects auf neutrale Werte zuruecksetzen (Teisisolation)
        // gzkl=2 (mittel, kein Modifikator), alle anderen auf 0
        await attackDialog.locator('select[id^="gzkl-"]').selectOption('2')
        await attackDialog.locator('select[id^="lcht-"]').selectOption('0')
        await attackDialog.locator('select[id^="wttr-"]').selectOption('0')
        await attackDialog.locator('select[id^="bwng-"]').selectOption('0')
        await attackDialog.locator('select[id^="dckg-"]').selectOption('0')
        await attackDialog.locator('select[id^="kgtl-"]').selectOption('0')

        // Modifier-Summary sichtbar mit Basis FK und ohne ungewaehlte Strafmodifier
        const attackSummary = attackDialog.locator('.modifier-summary.attack-summary')
        await expect(attackSummary).toBeVisible({ timeout: 10000 })
        await expect(attackSummary).toContainText('Basis FK:', { timeout: 10000 })
        await expect(attackSummary).not.toContainText('Dämmerung')
        await expect(attackSummary).not.toContainText('Wind')
        await expect(attackSummary).not.toContainText('schnell')
        await expect(attackSummary).not.toContainText('Dreivierteldeckung')

        const msg = await rollAndCaptureAttack(page, attackDialog)

        expect(msg.flavor).toContain('Fernkampf (')
        expect(msg.flavor).not.toContain('Attacke (')
        expect(msg.formula.toLowerCase()).toContain('d20')
        expect(Number.isNaN(Number(msg.total))).toBeFalsy()
        expect(Number(msg.total)).toBeGreaterThan(0)
        expect(msg.flavor).not.toContain('undefined')
        // Keine ungewaehlten Strafmodifier im Chat
        expect(msg.flavor).not.toContain('Dämmerung')
        expect(msg.flavor).not.toContain('Wind')
        expect(msg.flavor).not.toContain('Sturm')
        expect(msg.flavor).not.toContain('schnell')
    })

    // ------------------------------------------------------------------ //
    // Szenario B: Alle Selects auf erster Stufe
    // ------------------------------------------------------------------ //
    test('B: Alle Selects auf erster Stufe – Modifier sichtbar und im Chat', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openRangedAttackDialogForWeapon(actorWindow)

        const attackDialog = page.locator('.application.fernkampf-dialog').last()
        await expect(attackDialog).toBeVisible({ timeout: 15000 })

        // Alle Selects auf erste Stufe:
        // gzkl=1 (gross, +4 AT), lcht=1 (Daemmerung, -4), wttr=1 (Wind, -4),
        // bwng=1 (schnell, -4), dckg=-1 (halbe Deckung, -4), kgtl=1 (im offenen Feld, Patzer+1)
        await attackDialog.locator('select[id^="gzkl-"]').selectOption('1')
        await attackDialog.locator('select[id^="lcht-"]').selectOption('1')
        await attackDialog.locator('select[id^="wttr-"]').selectOption('1')
        await attackDialog.locator('select[id^="bwng-"]').selectOption('1')
        await attackDialog.locator('select[id^="dckg-"]').selectOption('-1')
        await attackDialog.locator('select[id^="kgtl-"]').selectOption('1')

        // Modifier-Summary zeigt gesetzte Faktoren (debounced, bis 10 s warten)
        const attackSummary = attackDialog.locator('.modifier-summary.attack-summary')
        await expect(attackSummary).toContainText('Dämmerung', { timeout: 10000 })
        await expect(attackSummary).toContainText('Wind')
        await expect(attackSummary).toContainText('schnell')
        await expect(attackSummary).toContainText('Deckung')

        const msg = await rollAndCaptureAttack(page, attackDialog)

        expect(msg.flavor).toContain('Fernkampf (')
        expect(msg.flavor).not.toContain('Attacke (')
        // Alle gesetzten Modifier muessen im Chat-Flavor erscheinen
        expect(msg.flavor).toContain('Dämmerung')
        expect(msg.flavor).toContain('Wind')
        expect(msg.flavor).toContain('schnell')
        expect(msg.flavor).toContain('Deckung')
        // Hoehere Stufen duerfern NICHT erscheinen
        expect(msg.flavor).not.toContain('Sturm')
        expect(msg.flavor).not.toContain('Blind')
        expect(msg.flavor).not.toContain('undefined')
    })

    // ------------------------------------------------------------------ //
    // Szenario C: Alle Selects auf hoechster Stufe
    // ------------------------------------------------------------------ //
    test('C: Alle Selects auf hoechster Stufe – starke Erschwernis im Chat', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openRangedAttackDialogForWeapon(actorWindow)

        const attackDialog = page.locator('.application.fernkampf-dialog').last()
        await expect(attackDialog).toBeVisible({ timeout: 15000 })

        // Alle auf Maximum:
        // gzkl=5 (winzig, -12), lcht=4 (Blind, -32), wttr=2 (Sturm, -8),
        // bwng=3 (extrem schnell, -12), dckg=-2 (Dreivierteldeckung, -8), kgtl=2 (im beengten Raum)
        await attackDialog.locator('select[id^="gzkl-"]').selectOption('5')
        await attackDialog.locator('select[id^="lcht-"]').selectOption('4')
        await attackDialog.locator('select[id^="wttr-"]').selectOption('2')
        await attackDialog.locator('select[id^="bwng-"]').selectOption('3')
        await attackDialog.locator('select[id^="dckg-"]').selectOption('-2')
        await attackDialog.locator('select[id^="kgtl-"]').selectOption('2')

        // Modifier-Summary zeigt die extremen Faktoren
        const attackSummary = attackDialog.locator('.modifier-summary.attack-summary')
        await expect(attackSummary).toContainText('Blind', { timeout: 10000 })
        await expect(attackSummary).toContainText('Sturm')
        await expect(attackSummary).toContainText('extrem schnell')
        await expect(attackSummary).toContainText('winzig')

        const msg = await rollAndCaptureAttack(page, attackDialog)

        expect(msg.flavor).toContain('Fernkampf (')
        expect(msg.flavor).not.toContain('Attacke (')
        expect(msg.flavor).toContain('Blind')
        expect(msg.flavor).toContain('Sturm')
        expect(msg.flavor).toContain('extrem schnell')
        expect(msg.flavor).not.toContain('undefined')
    })

    // ------------------------------------------------------------------ //
    // Szenario D: Scharfschuss NUMBER=4 → Angriff + Schaden
    // ------------------------------------------------------------------ //
    test('D: Scharfschuss=4 – Angriff- und Schaden-Chat pruefen', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openRangedAttackDialogForWeapon(actorWindow)

        const attackDialog = page.locator('.application.fernkampf-dialog').last()
        await expect(attackDialog).toBeVisible({ timeout: 15000 })

        // Manoever-Sektion aufklappen
        await attackDialog.locator('.maneuver-header').click()
        await expect(attackDialog.locator('.maneuver-grid')).not.toHaveClass(/collapsed/, {
            timeout: 5000,
        })

        // Scharfschuss NUMBER-Feld auf 4 setzen
        const scharfschussInput = attackDialog
            .locator('.maneuver-item')
            .filter({ hasText: 'Scharfschuss' })
            .locator('input[type="number"]')
        await scharfschussInput.fill('4')
        await scharfschussInput.dispatchEvent('change')

        // Modifier-Summary zeigt Scharfschuss-Modifikation (debounced)
        const attackSummary = attackDialog.locator('.modifier-summary.attack-summary')
        await expect(attackSummary).toContainText('Scharfschuss', { timeout: 10000 })

        // --- Angriffswurf ---
        const attackMsg = await rollAndCaptureAttack(page, attackDialog)

        expect(attackMsg.flavor).toContain('Fernkampf (')
        expect(attackMsg.flavor).not.toContain('Attacke (')
        expect(attackMsg.flavor).toContain('Scharfschuss')
        expect(attackMsg.formula.toLowerCase()).toContain('d20')
        expect(Number.isNaN(Number(attackMsg.total))).toBeFalsy()
        expect(attackMsg.flavor).not.toContain('undefined')

        // --- Schadenswurf ---
        const damageMsg = await rollAndCaptureDamage(page, attackDialog)

        expect(damageMsg.flavor).toContain('Schaden (')
        expect(Number.isNaN(Number(damageMsg.total))).toBeFalsy()
        expect(Number(damageMsg.total)).toBeGreaterThan(0)
        expect(damageMsg.flavor).not.toContain('undefined')
    })

    // ------------------------------------------------------------------ //
    // Szenario E: Patzer / Triumph (analog E2E-005)
    // ------------------------------------------------------------------ //
    test.describe('E: Patzer/Triumph-Szenarien', () => {
        test.afterEach(async ({ page }) => {
            // CONFIG.Dice.randomUniform nach jedem Test zuruecksetzen,
            // auch wenn der Test fehlschlaegt.
            await page
                .evaluate(() => {
                    delete CONFIG.Dice.randomUniform
                })
                .catch(() => {})
        })

        test('Vier Wuerfe: 0.99→Patzer, 0.01→Triumph, 0.95 und 0.05→Normalwurf', async ({
            page,
        }) => {
            await loginAndJoinWorld(page, foundryConfig)
            await clearChatLog(page)

            const actorWindow = await openActorSheet(page, ACTOR_NAME)
            await openRangedAttackDialogForWeapon(actorWindow)

            const attackDialog = page.locator('.application.fernkampf-dialog').last()
            await expect(attackDialog).toBeVisible({ timeout: 15000 })
            await expect(attackDialog).toContainText('Fernkampfangriff:')

            const attackButton = attackDialog.locator(
                '.modifier-summary.attack-summary.clickable-summary.angreifen',
            )

            // Triumph-Text ist je nach Einstellung 'Triumph' oder 'Crit'
            const triumphText = await page.evaluate(() =>
                game.settings.get('Ilaris', 'renameTriumphWithCrit') ? 'Crit' : 'Triumph',
            )
            const patzerText = 'Patzer'

            // Modifikator dynamisch berechnen: -(FK + globalermod) neutralisiert den Bonus,
            // sodass nur das rohe W20-Ergebnis zaehlt.
            // Ergebnis: die=1 → total=1 < 12 (Patzer), die=20 → total=20 ≥ 12 (Triumph).
            // Kein Setting wird geaendert — normale Spielmechanik.
            const neutralMod = await page.evaluate((actorName: string) => {
                const actor = game.actors.getName(actorName)
                const fkWeapon = actor?.items.find((i: any) => i.type === 'fernkampfwaffe')
                const fk: number = fkWeapon?.system?.fk ?? 0
                const globalMod: number = actor?.system?.abgeleitete?.globalermod ?? 0
                return -(fk + globalMod)
            }, ACTOR_NAME)
            const modifikatorInput = attackDialog.locator('input[id^="modifikator-"]')
            await modifikatorInput.fill(String(neutralMod))
            await modifikatorInput.dispatchEvent('change')

            /**
             * Klickt Angreifen und wartet auf genau eine neue Chat-Nachricht.
             * Gibt flavor und W20-Ergebnis zurueck.
             */
            async function rollAndCapture(): Promise<{
                flavor: string
                dieResult: number | null
            }> {
                const beforeCount = await page.evaluate(() => game.messages.contents.length)

                await attackButton.click()

                const chatIncreased = await page
                    .waitForFunction(
                        (baseline) => game.messages.contents.length > baseline,
                        beforeCount,
                        { timeout: 4000 },
                    )
                    .then(() => true)
                    .catch(() => false)

                if (!chatIncreased) {
                    await page.evaluate(() => {
                        const node = document.querySelector(
                            '.application.fernkampf-dialog .modifier-summary.attack-summary.clickable-summary.angreifen',
                        )
                        node?.dispatchEvent(
                            new MouseEvent('click', { bubbles: true, cancelable: true }),
                        )
                    })
                }

                await page.waitForFunction(
                    (baseline) => game.messages.contents.length === baseline + 1,
                    beforeCount,
                    { timeout: 20000 },
                )

                return page.evaluate(() => {
                    const msg = game.messages.contents.at(-1)
                    return {
                        flavor: msg?.flavor ?? '',
                        dieResult:
                            msg?.rolls?.[0]?.dice?.[0]?.results?.find(
                                (r: { active: boolean }) => r.active,
                            )?.result ?? null,
                    }
                })
            }

            // === Durchgang 1: randomUniform 0.99 → W20 = 1 → Patzer ===
            await page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.99
            })
            const roll1 = await rollAndCapture()
            expect(roll1.dieResult).toBe(1)
            expect(roll1.flavor).toContain(patzerText)
            expect(roll1.flavor).not.toContain(triumphText)

            // === Durchgang 2: randomUniform 0.01 → W20 = 20 → Triumph ===
            await page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.01
            })
            const roll2 = await rollAndCapture()
            expect(roll2.dieResult).toBe(20)
            expect(roll2.flavor).toContain(triumphText)
            expect(roll2.flavor).not.toContain(patzerText)

            // === Durchgang 3: randomUniform 0.95 → nahe 1, kein Patzer ===
            await page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.95
            })
            const roll3 = await rollAndCapture()
            expect(roll3.flavor).not.toContain(patzerText)
            expect(roll3.flavor).not.toContain(triumphText)

            // === Durchgang 4: randomUniform 0.05 → nahe 20, kein Triumph ===
            await page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.05
            })
            const roll4 = await rollAndCapture()
            expect(roll4.flavor).not.toContain(patzerText)
            expect(roll4.flavor).not.toContain(triumphText)
            // Bereinigung erfolgt durch afterEach
        })
    })
})
