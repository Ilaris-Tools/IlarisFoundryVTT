import { expect, test } from '@playwright/test'

import { foundryConfig, loginAndJoinWorld, openActorSheet } from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'Testlauf-Held'

test.describe('E2E-004 Wunden Modifier Kampfdialog', () => {
    test('Wunden-Checkboxen, Sidebar-Modifier und Kampfdialog-Wundabzüge prüfen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        // --- Vorbedingung: sauberer Startzustand via Foundry API ---

        // Guard: lepSystem-Einstellung muss deaktiviert sein (andere Wundformel)
        const lepActive = await page.evaluate(
            () => (game as any).settings?.get('Ilaris', 'lepSystem') === true,
        )
        if (lepActive) {
            throw new Error(
                'E2E-004 benötigt lepSystem = false. Bitte in den Welteinstellungen deaktivieren.',
            )
        }

        await page.evaluate((name) => {
            const actor = (game as any).actors?.getName?.(name)
            return actor?.update({
                'system.gesundheit.wunden': 0,
                'system.gesundheit.erschoepfung': 0,
                'system.gesundheit.wundenignorieren': false,
                'system.modifikatoren.manuellermod': 0,
                'system.furcht.furchtstufe': 0,
            })
        }, ACTOR_NAME)

        const sidebarLabel = actorWindow.locator('.hero-global-mod-label')
        // Nach Reset: globalermod = 0 → Display "-0 auf alle Proben"
        await expect(sidebarLabel).toContainText('0 auf alle Proben', { timeout: 10000 })

        const woundButtons = actorWindow.locator('#lebensleiste .triStateBtn')
        await expect(woundButtons).toHaveCount(8, { timeout: 10000 })

        const ignoriereBtn = actorWindow.locator(
            'a.hero-wound-toggle[data-togglevariable="system.gesundheit.wundenignorieren"]',
        )
        // Sicherstellung: Button startet in "nicht ignorieren"-Zustand
        await expect(ignoriereBtn).toContainText('nicht ignorieren', { timeout: 5000 })

        // =================================================================
        // Phase 1: Wunden-Buttons 1–8 anklicken, Sidebar-Modifier prüfen
        // =================================================================

        // Klicks 1 und 2: wunden = 1, 2 → kein Abzug (Kaum ein Kratzer)
        await woundButtons.nth(0).click()
        await woundButtons.nth(1).click()
        await expect(sidebarLabel).toContainText('0 auf alle Proben', { timeout: 10000 })

        // Klick 3: wunden = 3 → -(3-2)*2 = -2
        await woundButtons.nth(2).click()
        await expect(sidebarLabel).toContainText('-2 auf alle Proben', { timeout: 10000 })

        // Klicks 4–8: Abzug steigt je -2, bis -12
        const expectedModifiers: [number, number][] = [
            [3, -4],
            [4, -6],
            [5, -8],
            [6, -10],
            [7, -12],
        ]
        for (const [btnIndex, expectedMod] of expectedModifiers) {
            await woundButtons.nth(btnIndex).click()
            await expect(sidebarLabel).toContainText(`${expectedMod} auf alle Proben`, {
                timeout: 10000,
            })
        }

        // =================================================================
        // Phase 2: Wundabzüge ignorieren → Kampfdialog, Kalte-Wut-Bonus prüfen
        // =================================================================

        // Ignorieren aktivieren: wundenignorieren = true
        await ignoriereBtn.click()
        await expect(ignoriereBtn).not.toContainText('nicht', { timeout: 10000 })
        // Sidebar-Guard: ignorieren muss globalermod auf 0 setzen
        await expect(sidebarLabel).toContainText('0 auf alle Proben', { timeout: 10000 })

        // Zum Kampf-Tab wechseln
        await actorWindow.locator('nav [data-tab="kampf"]').click()

        // Ersten Angriffsdialog-Button der ersten Nahkampfwaffe anklicken
        const firstWeaponRow = actorWindow.locator('section.tab.kampf tbody tr').first()
        await expect(firstWeaponRow).toBeVisible({ timeout: 15000 })
        const attackDiagBtn = firstWeaponRow
            .locator('[data-action="rollable"][data-rolltype="angriff_diag"]')
            .first()
        await attackDiagBtn.click()

        const attackDialog = page.locator('.application.angriff-dialog').last()
        await expect(attackDialog).toBeVisible({ timeout: 15000 })

        const attackSummary = attackDialog.locator('.modifier-summary.attack-summary')
        const defenseSummary = attackDialog.locator('.modifier-summary.defense-summary')
        await expect(attackSummary).toBeVisible({ timeout: 10000 })
        await expect(defenseSummary).toBeVisible({ timeout: 10000 })

        // Angriff: Bonus durch Kalte Wut +12 sichtbar (wunden=8, ignore=true → (8-2)*2=12)
        await expect(attackSummary).toContainText('Bonus durch Kalte Wut oder ähnliches: +12', {
            timeout: 10000,
        })
        // Verteidigung: Bonus durch Kalte Wut +12 sichtbar
        await expect(defenseSummary).toContainText('Bonus durch Kalte Wut oder ähnliches: +12', {
            timeout: 10000,
        })
        // Negativcheck: kein "Status (Wunden/Furcht)" wenn ignorieren aktiv (globalermod = 0)
        await expect(attackSummary).not.toContainText('Status (Wunden/Furcht)')
        await expect(defenseSummary).not.toContainText('Status (Wunden/Furcht)')

        // Dialog schliessen
        const closeBtn1 = attackDialog.locator('button[data-action="close"]').first()
        if (await closeBtn1.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn1.click()
        } else {
            await page.keyboard.press('Escape')
        }
        await expect(attackDialog).not.toBeVisible({ timeout: 10000 })

        // =================================================================
        // Phase 3: Wundabzüge wieder aktivieren → Kampfdialog, Abzug -12 prüfen
        // =================================================================

        // Ignorieren deaktivieren: wundenignorieren = false → Erschwernisse aktiv
        await expect(ignoriereBtn).not.toContainText('nicht', { timeout: 5000 })
        await ignoriereBtn.click()
        await expect(ignoriereBtn).toContainText('nicht ignorieren', { timeout: 10000 })

        // Kampfdialog erneut oeffnen (Kampf-Tab bleibt aktiv)
        await attackDiagBtn.click()
        const attackDialog2 = page.locator('.application.angriff-dialog').last()
        await expect(attackDialog2).toBeVisible({ timeout: 15000 })

        const attackSummary2 = attackDialog2.locator('.modifier-summary.attack-summary')
        const defenseSummary2 = attackDialog2.locator('.modifier-summary.defense-summary')
        await expect(attackSummary2).toBeVisible({ timeout: 10000 })
        await expect(defenseSummary2).toBeVisible({ timeout: 10000 })

        // Angriff: Status (Wunden/Furcht): -12 sichtbar (wunden=8, ignore=false → globalermod=-12)
        await expect(attackSummary2).toContainText('Status (Wunden/Furcht): -12', {
            timeout: 10000,
        })
        // Verteidigung: Status (Wunden/Furcht): -12 sichtbar
        await expect(defenseSummary2).toContainText('Status (Wunden/Furcht): -12', {
            timeout: 10000,
        })
        // Negativcheck: kein "Kalte Wut" wenn Erschwernisse aktiv
        await expect(attackSummary2).not.toContainText('Bonus durch Kalte Wut')
        await expect(defenseSummary2).not.toContainText('Bonus durch Kalte Wut')

        // Dialog schliessen
        const closeBtn2 = attackDialog2.locator('button[data-action="close"]').first()
        if (await closeBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn2.click()
        } else {
            await page.keyboard.press('Escape')
        }
        await expect(attackDialog2).not.toBeVisible({ timeout: 10000 })

        // =================================================================
        // Phase 4: Alle Wunden per API entfernen (vermeidet Re-Render-Racebedingung
        //          beim schnellen Doppelklick auf triStateBtn)
        // =================================================================

        await page.evaluate((name) => {
            const actor = (game as any).actors?.getName?.(name)
            return actor?.update({
                'system.gesundheit.wunden': 0,
                'system.gesundheit.erschoepfung': 0,
            })
        }, ACTOR_NAME)

        // Sidebar zeigt wieder Null-Modifier
        await expect(sidebarLabel).toContainText('0 auf alle Proben', { timeout: 15000 })

        // Alle Buttons müssen den Zustand "leer" (.state-0) tragen
        for (let i = 0; i < 8; i++) {
            await expect(woundButtons.nth(i)).toHaveClass(/state-0/)
        }
    })
})
