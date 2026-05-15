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

const ATTACKER_NAME = 'HatAlles'
const DEFENDER_NAME = 'Testlauf-Held'

async function clickSummaryWithFallback(
    page: import('@playwright/test').Page,
    dialogRootSelector: string,
    summarySelector: string,
) {
    const summary = page.locator(`${dialogRootSelector} ${summarySelector}`).last()
    await expect(summary).toBeVisible({ timeout: 10000 })
    const clickedNormally = await summary
        .click({ timeout: 2500 })
        .then(() => true)
        .catch(() => false)

    if (clickedNormally) return

    await page.evaluate(
        ({ dialogRootSelectorArg, summarySelectorArg }) => {
            const selector = `${dialogRootSelectorArg} ${summarySelectorArg}`
            const node = document
                .querySelectorAll(selector)
                .item(document.querySelectorAll(selector).length - 1) as HTMLElement | null
            if (!node) return
            node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        },
        {
            dialogRootSelectorArg: dialogRootSelector,
            summarySelectorArg: summarySelector,
        },
    )
}

async function waitForNewMessages(
    page: import('@playwright/test').Page,
    baseline: number,
    minIncrease: number,
) {
    await page.waitForFunction(
        ({ base, inc }) => game.messages.contents.length >= base + inc,
        { base: baseline, inc: minIncrease },
        { timeout: 20000 },
    )
}

test.describe('E2E-010 Zielauswahl, Verteidigung und Schaden', () => {
    test.afterEach(async ({ page }) => {
        await page
            .evaluate(() => {
                delete CONFIG.Dice.randomUniform
            })
            .catch(() => {})
    })

    test('Angriff sendet Defense-Prompt, Ziel verteidigt, Ergebnis und Wundwert passen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        const attackerWeapon = await page.evaluate((attackerName: string) => {
            const actor = game.actors.getName(attackerName)
            if (!actor) return null

            const meleeWeapons = actor.items.filter((i: any) => i.type === 'nahkampfwaffe')
            if (meleeWeapons.length === 0) return null

            const preferred = meleeWeapons.find(
                (w: any) => (w.system?.schadenstyp ?? '').toUpperCase() !== 'STUMPF',
            )

            const chosen = preferred ?? meleeWeapons[0]
            return {
                name: chosen.name,
                damageType: (chosen.system?.schadenstyp ?? '').toUpperCase(),
            }
        }, ATTACKER_NAME)

        expect(attackerWeapon).not.toBeNull()
        expect(attackerWeapon?.name).toBeTruthy()

        const defenderBefore = await page.evaluate((defenderName: string) => {
            const actor = game.actors.getName(defenderName)
            if (!actor) return null

            const wsStern =
                actor.type === 'kreatur'
                    ? (actor.system?.kampfwerte?.ws_stern ?? actor.system?.kampfwerte?.ws ?? 0)
                    : (actor.system?.abgeleitete?.ws_stern ?? 0)

            return {
                actorId: actor.id,
                wsStern,
                useLepSystem: game.settings.get('Ilaris', 'lepSystem'),
                wunden: actor.system?.gesundheit?.wunden ?? 0,
                erschoepfung: actor.system?.gesundheit?.erschoepfung ?? 0,
            }
        }, DEFENDER_NAME)

        expect(defenderBefore).not.toBeNull()
        expect(defenderBefore?.actorId).toBeTruthy()

        let defenderDefaultSnapshot: ActorDefaultSnapshot | null = null

        try {
            defenderDefaultSnapshot = await captureActorDefaultSnapshot(page, DEFENDER_NAME)

            const actorWindow = await openActorSheet(page, ATTACKER_NAME)
            await openMeleeAttackDialogForWeapon(actorWindow, attackerWeapon!.name)

            const attackDialog = page.locator('.application.angriff-dialog').last()
            await expect(attackDialog).toBeVisible({ timeout: 15000 })
            await expect(attackDialog).toContainText('Kampf:')

            const showNearbyButton = attackDialog.locator('[data-action="showNearby"]').first()
            await expect(showNearbyButton).toBeVisible({ timeout: 10000 })
            await showNearbyButton.click()

            const targetDialogAppeared = await page
                .waitForFunction(
                    () =>
                        !!document.querySelector(
                            '.target-selection-dialog, .window-app.target-sel, .dialog.target-sel',
                        ),
                    undefined,
                    { timeout: 2500 },
                )
                .then(() => true)
                .catch(() => false)

            if (!targetDialogAppeared) {
                await page.evaluate(() => {
                    const node = document.querySelector(
                        '.application.angriff-dialog [data-action="showNearby"]',
                    ) as HTMLElement | null
                    node?.dispatchEvent(
                        new MouseEvent('click', { bubbles: true, cancelable: true }),
                    )
                })
            }

            const targetDialog = page
                .locator('.target-selection-dialog, .window-app.target-sel, .dialog.target-sel')
                .last()
            await expect(targetDialog).toBeVisible({ timeout: 10000 })

            const targetRow = targetDialog
                .locator('.target-sel-row')
                .filter({ hasText: DEFENDER_NAME })
                .first()

            await expect(targetRow).toBeVisible({ timeout: 10000 })
            await targetRow.click()
            await expect(targetRow).toHaveClass(/selected/)
            await expect(targetDialog.locator('#selection-list')).toContainText(DEFENDER_NAME)

            await targetDialog.locator('button.submit').click()
            await expect(targetDialog).toBeHidden({ timeout: 10000 })

            await expect(attackDialog.locator('.selected-actors-list')).toContainText(DEFENDER_NAME)

            await page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.01
            })

            const beforeAttackMessages = await page.evaluate(() => game.messages.contents.length)

            await clickSummaryWithFallback(
                page,
                '.application.angriff-dialog',
                '.modifier-summary.attack-summary.clickable-summary.angreifen',
            )

            await waitForNewMessages(page, beforeAttackMessages, 2)

            const defensePromptInfo = await page.evaluate(
                ({ defenderActorId, baseline }) => {
                    const newMessages = game.messages.contents.slice(baseline)
                    const defensePrompt = [...newMessages]
                        .reverse()
                        .find(
                            (m: any) =>
                                m.flags?.Ilaris?.defensePrompt &&
                                m.flags?.Ilaris?.targetActorId === defenderActorId,
                        )

                    if (!defensePrompt) return null

                    return {
                        messageId: defensePrompt.id,
                        content: defensePrompt.content ?? '',
                    }
                },
                {
                    defenderActorId: defenderBefore!.actorId,
                    baseline: beforeAttackMessages,
                },
            )

            expect(defensePromptInfo).not.toBeNull()
            expect(defensePromptInfo?.content).toContain('defense-prompt')

            const defenseButtonsMeta = await page.evaluate((messageId: string) => {
                const root = document.querySelector(`.chat-message[data-message-id="${messageId}"]`)
                if (!root) return null

                const allMeleeButtons = root.querySelectorAll(
                    '.defend-button[data-attack-type="melee"]',
                )
                const akrobatikButtons = root.querySelectorAll('.defend-button.defend-akrobatik')

                return {
                    meleeCount: allMeleeButtons.length,
                    akrobatikCount: akrobatikButtons.length,
                }
            }, defensePromptInfo!.messageId)

            expect(defenseButtonsMeta).not.toBeNull()
            expect(defenseButtonsMeta?.akrobatikCount).toBe(0)
            expect((defenseButtonsMeta?.meleeCount ?? 0) > 0).toBeTruthy()

            await page.evaluate((messageId: string) => {
                const root = document.querySelector(`.chat-message[data-message-id="${messageId}"]`)
                const button = root?.querySelector('.defend-button[data-attack-type="melee"]')
                ;(button as HTMLElement | null)?.dispatchEvent(
                    new MouseEvent('click', { bubbles: true, cancelable: true }),
                )
            }, defensePromptInfo!.messageId)

            const defenseDialog = page
                .locator('.application.angriff-dialog')
                .filter({ hasText: `Verteidigung gegen ${ATTACKER_NAME}` })
                .last()

            await expect(defenseDialog).toBeVisible({ timeout: 15000 })

            const defenseModeUiState = await defenseDialog.evaluate((node) => {
                const attackAction = node.querySelector(
                    '[data-action="angreifen"]',
                ) as HTMLButtonElement | null
                const showNearbyAction = node.querySelector(
                    '[data-action="showNearby"]',
                ) as HTMLButtonElement | null

                return {
                    attackActionMissingOrDisabled: !attackAction || attackAction.disabled,
                    showNearbyMissingOrDisabled: !showNearbyAction || showNearbyAction.disabled,
                }
            })

            expect(defenseModeUiState.attackActionMissingOrDisabled).toBeTruthy()
            expect(defenseModeUiState.showNearbyMissingOrDisabled).toBeTruthy()

            await page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.99
            })

            const beforeDefenseMessages = await page.evaluate(() => game.messages.contents.length)

            await clickSummaryWithFallback(
                page,
                '.application.angriff-dialog',
                '.modifier-summary.defense-summary.clickable-summary.verteidigen',
            )

            await waitForNewMessages(page, beforeDefenseMessages, 2)

            const resolutionContent = await page.evaluate((baseline: number) => {
                const newMessages = game.messages.contents.slice(baseline)
                const resolution = [...newMessages]
                    .reverse()
                    .find((m: any) => (m.content ?? '').includes('attack-resolution'))

                return resolution?.content ?? ''
            }, beforeDefenseMessages)

            expect(resolutionContent).toContain('Kampfergebnis')
            expect(resolutionContent).toContain('durchbricht die Verteidigung')

            await page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.01
            })

            const beforeDamageMessages = await page.evaluate(() => game.messages.contents.length)

            await clickSummaryWithFallback(
                page,
                '.application.angriff-dialog',
                '.modifier-summary.damage-summary.clickable-summary.schaden',
            )

            await waitForNewMessages(page, beforeDamageMessages, 2)

            const damageTotal = await page.evaluate((baseline: number) => {
                const newMessages = game.messages.contents.slice(baseline)
                const damageMsg = [...newMessages].reverse().find((m: any) => {
                    const flavor = m.flavor ?? ''
                    return flavor.includes('Schaden (') && m.rolls?.[0]?.total != null
                })
                return Number(damageMsg?.rolls?.[0]?.total ?? NaN)
            }, beforeDamageMessages)

            expect(Number.isNaN(damageTotal)).toBeFalsy()
            expect(damageTotal).toBeGreaterThan(0)

            const defenderAfter = await page.evaluate((defenderName: string) => {
                const actor = game.actors.getName(defenderName)
                if (!actor) return null

                return {
                    wunden: actor.system?.gesundheit?.wunden ?? 0,
                    erschoepfung: actor.system?.gesundheit?.erschoepfung ?? 0,
                }
            }, DEFENDER_NAME)

            expect(defenderAfter).not.toBeNull()

            const beforeWunden = defenderBefore!.wunden
            const beforeErschoepfung = defenderBefore!.erschoepfung
            const wsStern = Math.max(1, Number(defenderBefore!.wsStern))

            const expectedIncrement = defenderBefore!.useLepSystem
                ? Math.max(0, damageTotal - wsStern)
                : damageTotal > wsStern
                  ? Math.floor((damageTotal - 1) / wsStern)
                  : 0

            const deltaWunden = defenderAfter!.wunden - beforeWunden
            const deltaErschoepfung = defenderAfter!.erschoepfung - beforeErschoepfung

            if (attackerWeapon!.damageType === 'STUMPF' && !defenderBefore!.useLepSystem) {
                expect(deltaWunden).toBe(0)
                expect(deltaErschoepfung).toBe(expectedIncrement)
            } else {
                expect(deltaWunden).toBe(expectedIncrement)
            }
        } finally {
            if (defenderDefaultSnapshot) {
                await restoreActorFromDefaultSnapshot(page, defenderDefaultSnapshot).catch(() => {})
            }
        }
    })
})
