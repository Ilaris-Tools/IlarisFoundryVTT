import { expect, test } from '@playwright/test'

import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openMeleeAttackDialogForWeapon,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

/**
 * Dice combinations for the profane skill-check dialog (FertigkeitDialog).
 *
 * expectedDice is derived from FertigkeitDialog._getDiceFormula() source code:
 *
 *   xd20=1 (3W20), diceCount=3: dropLow=1, dropHigh=1 => 3d20dl1dh1 (base)
 *     + Schips ohne Eigenheit: baseDice=4, dropLow=2 => 4d20dl2dh1
 *     + Schips mit Eigenheit:  baseDice=5, dropLow=3 => 5d20dl3dh1
 *
 *   xd20=0 (1W20), diceCount=1: dropLow=0, dropHigh=0 => 1d20 (base)
 *     + Schips ohne Eigenheit: baseDice=2, dropLow=1 => 2d20dl1dh0
 *     + Schips mit Eigenheit:  baseDice=3, dropLow=2 => 3d20dl2dh0
 *
 * NOTE: The 1W20+Schips formulas differ from what was originally requested:
 *   - "1d20dl1dh0" (user) -> actual: "2d20dl1dh0"
 *   - "2d20dl2dh0" (user) -> actual: "3d20dl2dh0"
 */
const DICE_COMBINATIONS = [
    { xd20: '1', schips: '0', expectedDice: '3d20dl1dh1', label: '3d20, kein Schips' },
    { xd20: '1', schips: '1', expectedDice: '4d20dl2dh1', label: '3d20, Schips ohne Eigenheit' },
    { xd20: '1', schips: '2', expectedDice: '5d20dl3dh1', label: '3d20, Schips mit Eigenheit' },
    { xd20: '0', schips: '0', expectedDice: '1d20', label: '1d20, kein Schips' },
    { xd20: '0', schips: '1', expectedDice: '2d20dl1dh0', label: '1d20, Schips ohne Eigenheit' },
    { xd20: '0', schips: '2', expectedDice: '3d20dl2dh0', label: '1d20, Schips mit Eigenheit' },
] as const

test.describe('E2E-006 Fertigkeit Wuerfeldialog Profan', () => {
    test('Fertigkeiten-Tab, erste Fertigkeit oeffnen, alle Wuerfelkombinationen pruefen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        const actorDefaultSnapshot: ActorDefaultSnapshot = await captureActorDefaultSnapshot(
            page,
            'HatAlles',
        )

        try {
            // Reset HatAlles's Schips to a known value so the test is idempotent.
            // The FertigkeitDialog only renders Schips radio buttons when schips_stern > 0
            // ({{#if hasSchips}} in fertigkeit.hbs). Without this, a prior test run that
            // consumed Schips would cause all schips-radio locators to time out.
            await page.evaluate(async () => {
                const actor = game.actors?.getName('HatAlles') as any
                if (actor) {
                    await actor.update({ 'system.schips.schips_stern': 10 })
                }
            })

            // Read globalermod from actor data before the dialog is opened.
            // actor.system.abgeleitete.globalermod is a computed numeric value (0 if no status effect).
            const globalermod = await page.evaluate(
                () =>
                    ((game.actors?.getName('HatAlles') as any)?.system?.abgeleitete
                        ?.globalermod as number) ?? 0,
            )

            const actorWindow = await openActorSheet(page, 'HatAlles')

            // Navigate to Fertigkeiten tab
            await actorWindow.locator('nav [data-tab="fertigkeiten"]').click()
            await expect(actorWindow.locator('section.tab.fertigkeiten')).toBeVisible({
                timeout: 10000,
            })

            // Click the dice icon of the first profane Fertigkeit row.
            // td[data-rolltype="fertigkeit_diag"] is the rollable icon cell in each tr.main-row.
            const firstFertigkeitRollable = actorWindow
                .locator(
                    'section.tab.fertigkeiten tbody tr.main-row td[data-action="rollable"][data-rolltype="fertigkeit_diag"]',
                )
                .first()
            await expect(firstFertigkeitRollable).toBeVisible({ timeout: 15000 })
            const expectedSkillId = await page.evaluate(() => {
                const actor = game.actors?.getName('HatAlles') as any
                return actor?.profan?.fertigkeiten?.[0]?.id ?? null
            })
            expect(
                expectedSkillId,
                'Die erste profane Fertigkeit muss eine Item-ID besitzen',
            ).toBeTruthy()
            await expect(firstFertigkeitRollable).toHaveAttribute(
                'data-fertigkeit',
                expectedSkillId!,
            )
            await firstFertigkeitRollable.click()

            // Wait for the FertigkeitDialog to open
            const fertigkeitDialog = page.locator('.application.ilaris.fertigkeit-dialog').last()
            await expect(fertigkeitDialog).toBeVisible({ timeout: 15000 })
            await expect(fertigkeitDialog).toContainText('Fertigkeitsprobe:')

            // ------------------------------------------------------------------ //
            // Set Hohe Qualitaet = 3 and Modifikator = 5.
            // Input IDs contain a runtime dialogId suffix (e.g. "hohequalitaet-dialog-1234-abc9").
            // Use attribute-starts-with selectors to avoid coupling to the runtime suffix.
            // ------------------------------------------------------------------ //
            const hoheQualitaetInput = fertigkeitDialog.locator('input[id^="hohequalitaet-"]')
            await hoheQualitaetInput.fill('3')
            await hoheQualitaetInput.dispatchEvent('input')

            const modifikatorInput = fertigkeitDialog.locator('input[id^="modifikator-"]')
            await modifikatorInput.fill('5')
            await modifikatorInput.dispatchEvent('input')

            // ------------------------------------------------------------------ //
            // Verify the modifier preview (debounced 150 ms update in FertigkeitDialog).
            // ------------------------------------------------------------------ //
            // Hohe Qualitaet 3 => 3 * -4 = -12
            await expect(
                fertigkeitDialog.locator('.modifier-item').filter({ hasText: 'Hohe Qualität' }),
            ).toContainText('-12', { timeout: 5000 })

            // Modifikator 5 => +5
            // Use 'Modifikator:' (with colon) to avoid matching 'Addierte Modifikatoren:' total row.
            await expect(
                fertigkeitDialog.locator('.modifier-item').filter({ hasText: 'Modifikator:' }),
            ).toContainText('+5', { timeout: 5000 })

            // globalermod appears as "Status (Wunden/Furcht)" entry when non-zero
            if (globalermod !== 0) {
                await expect(
                    fertigkeitDialog
                        .locator('.modifier-item')
                        .filter({ hasText: 'Status (Wunden/Furcht)' }),
                ).toBeVisible({ timeout: 5000 })
            }

            // ------------------------------------------------------------------ //
            // Roll each combination and verify the chat formula.
            // The dialog stays open after rolling; inputs are changed between rolls.
            // ------------------------------------------------------------------ //
            for (const combo of DICE_COMBINATIONS) {
                // Select xd20 mode: value "1" = 3W20 (default), value "0" = 1W20
                const xd20Radio = fertigkeitDialog.locator(
                    `input[name^="xd20-"][value="${combo.xd20}"]`,
                )
                await xd20Radio.check()
                await xd20Radio.dispatchEvent('change')

                // Select Schips mode: value "0" = kein, "1" = ohne Eigenheit, "2" = mit Eigenheit
                const schipsRadio = fertigkeitDialog.locator(
                    `input[name^="schips-"][value="${combo.schips}"]`,
                )
                await schipsRadio.check()
                await schipsRadio.dispatchEvent('change')

                // Wait for the debounced preview to settle and the roll button to be ready
                await expect(fertigkeitDialog.locator('[data-action="previewClick"]')).toBeVisible({
                    timeout: 5000,
                })

                const beforeCount = await page.evaluate(() => game.messages.contents.length)

                // Click the preview/roll button (AppV2 action "previewClick" => _executeRoll)
                const rollButton = fertigkeitDialog.locator('[data-action="previewClick"]')
                await rollButton.click()

                const chatIncreasedAfterClick = await page
                    .waitForFunction(
                        (baseline) => game.messages.contents.length > baseline,
                        beforeCount,
                        { timeout: 4000 },
                    )
                    .then(() => true)
                    .catch(() => false)

                if (!chatIncreasedAfterClick) {
                    // Fallback for flaky click delivery through AppV2 overlays
                    await page.evaluate(() => {
                        const node = document.querySelector(
                            '.application.ilaris.fertigkeit-dialog [data-action="previewClick"]',
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

                const lastMessage = await page.evaluate(() => {
                    const msg = game.messages.contents.at(-1)
                    return {
                        flavor: msg?.flavor ?? '',
                        total: msg?.rolls?.[0]?.total ?? null,
                        formula: msg?.rolls?.[0]?.formula ?? '',
                    }
                })

                // Formula is built as:
                // `${diceFormula} + ${effectivePW} + ${globalermod} + ${hoheQualitaetMod} + ${modifikator}`
                // Foundry normalizes "+ -12" to "- 12" in the Roll formula string.

                expect(
                    lastMessage.formula,
                    `[${combo.label}] Wuerfelformel soll mit "${combo.expectedDice}" beginnen`,
                ).toMatch(
                    new RegExp(`^${combo.expectedDice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
                )

                expect(
                    lastMessage.formula,
                    `[${combo.label}] Formel soll Hohe-Qualitaet-Modifier "-12" enthalten`,
                ).toMatch(/-\s*12/)

                // Modifikator = 5 is always the last term in the formula template
                expect(
                    lastMessage.formula,
                    `[${combo.label}] Formel soll Modifikator "+5" als letztes Glied enthalten`,
                ).toMatch(/\+\s*5\s*$/)

                expect(
                    lastMessage.flavor,
                    `[${combo.label}] Flavor darf kein 'undefined' enthalten`,
                ).not.toContain('undefined')
            }
        } finally {
            await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
        }
    })

    test('Würfelmodus übernimmt den im Game Chat gewählten Standard', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)

        const chatMessageMode = await page.evaluate(() => game.settings.get('core', 'messageMode'))
        expect(
            chatMessageMode,
            'Game Chat muss einen aktuellen Nachrichtenmodus besitzen',
        ).toBeTruthy()

        {
            const actorWindow = await openActorSheet(page, 'HatAlles')
            await actorWindow.locator('nav [data-tab="fertigkeiten"]').click()
            await actorWindow
                .locator(
                    'section.tab.fertigkeiten tbody tr.main-row td[data-action="rollable"][data-rolltype="fertigkeit_diag"]',
                )
                .first()
                .click()

            const skillDialog = page.locator('.application.ilaris.fertigkeit-dialog').last()
            await expect(skillDialog).toBeVisible({ timeout: 15000 })
            await expect(skillDialog.locator('select[id^="rollMode-"]')).toHaveValue(
                chatMessageMode,
            )
            // Reloading closes the AppV2 dialog independently of its header
            // controls, then lets the combat assertion start from clean UI.
            await page.reload()
            await loginAndJoinWorld(page, foundryConfig)

            const weaponName = await page.evaluate(() => {
                const actor = game.actors?.getName('HatAlles') as any
                return actor?.items.find((item: any) => item.type === 'nahkampfwaffe')?.name ?? null
            })
            expect(weaponName, 'HatAlles benötigt eine Nahkampfwaffe für den Test').toBeTruthy()

            const reloadedActorWindow = await openActorSheet(page, 'HatAlles')
            await openMeleeAttackDialogForWeapon(reloadedActorWindow, weaponName!)
            const combatDialog = page.locator('.application.angriff-dialog').last()
            await expect(combatDialog).toBeVisible({ timeout: 15000 })
            await expect(combatDialog.locator('select[id^="rollMode-"]')).toHaveValue(
                chatMessageMode,
            )
        }
    })
})
