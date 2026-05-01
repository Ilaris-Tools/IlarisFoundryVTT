import { expect, test } from '@playwright/test'

import { foundryConfig, loginAndJoinWorld, openActorSheet } from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'Testlauf-Npc'
const ATTACK_NAME = 'Breitschwert'

test.describe('E2E-002 Kreatur Angriff AT editieren', () => {
    test('AT Breitschwert 11→12→11 editieren und im Kreatur-Sheet prüfen', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)

        // Actor Sheet öffnen (Rückgabewert nicht verwendet — separater Locator unten
        // verwendet .application.kreaturen statt der generischeren Fixture-Locator-Basis,
        // um Angriff-Item-Sheets (.application.sheet.item.angriff) sicher auszuschließen)
        await openActorSheet(page, ACTOR_NAME)

        // Präziser Locator für das Kreatur-Sheet (.kreaturen-Klasse schließt Angriff-Item-Sheets aus)
        const kreaturSheet = page
            .locator('.application.kreaturen')
            .filter({ hasText: ACTOR_NAME })
            .last()
        await expect(kreaturSheet).toBeVisible({ timeout: 15000 })

        // Edit-Link für den Angriff (Klick auf den Namen öffnet das Item-Sheet)
        const angriffEditLink = kreaturSheet
            .locator('.angriffe a[data-action="itemEdit"]')
            .filter({ hasText: ATTACK_NAME })
            .first()
        await expect(angriffEditLink).toBeVisible({ timeout: 15000 })

        // AT-Label im Kreatur-Sheet (persistente Referenz — wird nach Auto-Save reaktiv aktualisiert)
        const atLabel = kreaturSheet.locator(
            `label.onhover[data-rolltype="at"][data-item="${ATTACK_NAME}"]`,
        )

        // === Erster Durchlauf: AT 11 → 12 ===
        await angriffEditLink.click()

        const angriffSheet = page.locator('.application.sheet.item.angriff').last()
        await expect(angriffSheet).toBeVisible({ timeout: 15000 })

        const atInput = angriffSheet.locator('input[name="system.at"]')
        await expect(atInput).toBeVisible({ timeout: 10000 })
        await atInput.fill('12')
        await atInput.press('Tab') // submitOnChange: true → löst Auto-Save aus

        // Warten bis der AT-Wert im Kreatur-Sheet reaktiv auf 12 aktualisiert ist
        await expect(atLabel).toContainText(': 12', { timeout: 10000 })

        // Negativprüfung: AT darf nicht mehr 11 zeigen
        await expect(atLabel).not.toContainText(': 11')

        // Angriff-Sheet schließen
        await angriffSheet.locator('button[data-action="close"]').click()
        await angriffSheet.waitFor({ state: 'hidden', timeout: 10000 })

        // === Zweiter Durchlauf: AT 12 → 11 (Wiederherstellung des Ausgangszustands) ===
        await angriffEditLink.click()

        const angriffSheet2 = page.locator('.application.sheet.item.angriff').last()
        await expect(angriffSheet2).toBeVisible({ timeout: 15000 })

        const atInput2 = angriffSheet2.locator('input[name="system.at"]')
        await expect(atInput2).toBeVisible({ timeout: 10000 })
        await atInput2.fill('11')
        await atInput2.press('Tab')

        // Warten bis AT wieder auf 11 aktualisiert ist
        await expect(atLabel).toContainText(': 11', { timeout: 10000 })

        // Angriff-Sheet schließen
        await angriffSheet2.locator('button[data-action="close"]').click()
        await angriffSheet2.waitFor({ state: 'hidden', timeout: 10000 })

        // Abschlussprüfung: AT ist sauber auf 11 wiederhergestellt
        await expect(atLabel).toContainText(': 11')
    })
})
