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
import { E2E_BASELINE } from '../../shared/baseline'

const ATTACKER_NAME = E2E_BASELINE.actors.allCapabilities
const DEFENDER_NAME = E2E_BASELINE.actors.hero
const COUNTER_WEAPON_NAME = E2E_BASELINE.weapons.shortSword
const WUCHTSCHLAG_VALUE = 8

const PLAYER3_USERNAME = process.env.E2E_PLAYER_USER ?? E2E_BASELINE.users.player

// ── Helpers ──────────────────────────────────────────────────────────────────

async function clickSummaryWithFallback(
    page: import('@playwright/test').Page,
    dialogRootSelector: string,
    summarySelector: string,
) {
    const summary = page.locator(`${dialogRootSelector} ${summarySelector}`).last()
    await expect(summary).toBeVisible({ timeout: 10000 })
    const ok = await summary
        .click({ timeout: 2500 })
        .then(() => true)
        .catch(() => false)
    if (ok) return
    await page.evaluate(
        ({ d, s }) => {
            const node = document
                .querySelectorAll(`${d} ${s}`)
                .item(document.querySelectorAll(`${d} ${s}`).length - 1) as HTMLElement | null
            node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        },
        { d: dialogRootSelector, s: summarySelector },
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
        { timeout: 25000 },
    )
}

async function clickDefenseButton(page: import('@playwright/test').Page, messageId: string) {
    await page.evaluate((msgId: string) => {
        const root = document.querySelector(`.chat-message[data-message-id="${msgId}"]`)
        const button = root?.querySelector('.defend-button[data-attack-type="melee"]')
        ;(button as HTMLElement | null)?.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true }),
        )
    }, messageId)
}

async function waitForDefensePromptMessage(
    page: import('@playwright/test').Page,
    targetActorId: string,
    baseline: number,
): Promise<string | null> {
    await page.waitForFunction(
        ({ actorId, base }) => {
            const msgs = game.messages.contents.slice(base)
            return msgs.some(
                (m: any) =>
                    m.flags?.Ilaris?.defensePrompt && m.flags?.Ilaris?.targetActorId === actorId,
            )
        },
        { actorId: targetActorId, base: baseline },
        { timeout: 20000 },
    )
    return page.evaluate(
        ({ actorId, base }) => {
            const msgs = game.messages.contents.slice(base)
            const found = [...msgs]
                .reverse()
                .find(
                    (m: any) =>
                        m.flags?.Ilaris?.defensePrompt &&
                        m.flags?.Ilaris?.targetActorId === actorId,
                )
            return found?.id ?? null
        },
        { actorId: targetActorId, base: baseline },
    )
}

// ── Test ─────────────────────────────────────────────────────────────────────

test.describe('E2E-011 Multiplayer: Verteidigung und Gegenangriff', () => {
    // Note: afterEach uses the default Playwright page fixture which is unrelated
    // to gmPage/player3Page (those are created inside the test). Dice cleanup for
    // those contexts happens inside the test's finally block via context.close().
    test.afterEach(async ({ page }) => {
        await page
            .evaluate(() => {
                delete CONFIG.Dice.randomUniform
            })
            .catch(() => {})
    })

    test('GM greift an → Player3 verteidigt und greift zurück → beide Wundwerte korrekt', async ({
        browser,
    }) => {
        // ── Setup: two independent browser contexts ───────────────────────
        const gmContext = await browser.newContext()
        const player3Context = await browser.newContext()
        const gmPage = await gmContext.newPage()
        const player3Page = await player3Context.newPage()

        const player3Config = { ...foundryConfig, username: PLAYER3_USERNAME }

        // Track cleanup state
        let defenderDefaultSnapshot: ActorDefaultSnapshot | null = null
        let attackerDefaultSnapshot: ActorDefaultSnapshot | null = null

        try {
            // ── Login both users ──────────────────────────────────────────
            await loginAndJoinWorld(gmPage, foundryConfig)
            await loginAndJoinWorld(player3Page, player3Config)

            // Verify the E2E player is logged in with the expected baseline account.
            const player3ActualName = await player3Page.evaluate(
                () => (game.user as any)?.name ?? game.user?.id ?? null,
            )
            expect(
                player3ActualName,
                `E2E-Spieler-Login fehlgeschlagen: game.user.name ist "${player3ActualName}", erwartet "${PLAYER3_USERNAME}". ` +
                    `Setze E2E_PLAYER_USER auf den korrekten E2E-Benutzernamen.`,
            ).toBe(PLAYER3_USERNAME)

            await clearChatLog(gmPage)

            // Wait for Player3's chat to sync after clear
            await player3Page.waitForFunction(
                () => game.messages.contents.length === 0,
                undefined,
                { timeout: 15000 },
            )

            // ── Snapshot both actors ──────────────────────────────────────
            defenderDefaultSnapshot = await captureActorDefaultSnapshot(gmPage, DEFENDER_NAME)
            attackerDefaultSnapshot = await captureActorDefaultSnapshot(gmPage, ATTACKER_NAME)

            const defenderBefore = await gmPage.evaluate((name: string) => {
                const actor = game.actors.getName(name)
                if (!actor) return null
                const wsStern =
                    actor.type === 'kreatur'
                        ? (actor.system?.kampfwerte?.ws_stern ?? actor.system?.kampfwerte?.ws ?? 0)
                        : (actor.system?.abgeleitete?.ws_stern ?? 0)
                return {
                    actorId: actor.id as string,
                    wsStern: Number(wsStern),
                    useLepSystem: game.settings.get('Ilaris', 'lepSystem') as boolean,
                    wunden: (actor.system?.gesundheit?.wunden ?? 0) as number,
                }
            }, DEFENDER_NAME)
            expect(defenderBefore).not.toBeNull()

            const attackerBefore = await gmPage.evaluate((name: string) => {
                const actor = game.actors.getName(name)
                if (!actor) return null
                const wsStern =
                    actor.type === 'kreatur'
                        ? (actor.system?.kampfwerte?.ws_stern ?? actor.system?.kampfwerte?.ws ?? 0)
                        : (actor.system?.abgeleitete?.ws_stern ?? 0)
                return {
                    actorId: actor.id as string,
                    wsStern: Number(wsStern),
                    useLepSystem: game.settings.get('Ilaris', 'lepSystem') as boolean,
                    wunden: (actor.system?.gesundheit?.wunden ?? 0) as number,
                }
            }, ATTACKER_NAME)
            expect(attackerBefore).not.toBeNull()

            // ── Choose attack weapon for HatAlles ─────────────────────────
            const attackerWeapon = await gmPage.evaluate((name: string) => {
                const actor = game.actors.getName(name)
                if (!actor) return null
                const weapons = actor.items.filter((i: any) => i.type === 'nahkampfwaffe')
                if (!weapons.length) return null
                const preferred = weapons.find(
                    (w: any) => (w.system?.schadenstyp ?? '').toUpperCase() !== 'STUMPF',
                )
                const chosen = preferred ?? weapons[0]
                return {
                    name: chosen.name as string,
                    damageType: (chosen.system?.schadenstyp ?? '').toUpperCase() as string,
                }
            }, ATTACKER_NAME)
            expect(attackerWeapon).not.toBeNull()

            // ════════════════════════════════════════════════════════════
            // PHASE 1 – GM attacks with HatAlles
            // ════════════════════════════════════════════════════════════
            const attackerActorWindow = await openActorSheet(gmPage, ATTACKER_NAME)
            await openMeleeAttackDialogForWeapon(attackerActorWindow, attackerWeapon!.name)

            const attackDialog = gmPage.locator('.application.angriff-dialog').last()
            await expect(attackDialog).toBeVisible({ timeout: 15000 })

            // Open target selection
            const showNearbyBtn = attackDialog.locator('[data-action="showNearby"]').first()
            await expect(showNearbyBtn).toBeVisible({ timeout: 10000 })
            await showNearbyBtn.click().catch(() => {})

            const targetDialog = gmPage
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
            await targetDialog.locator('button.submit').click()
            await expect(targetDialog).toBeHidden({ timeout: 10000 })
            await expect(attackDialog.locator('.selected-actors-list')).toContainText(DEFENDER_NAME)

            // Rig dice: low → attack succeeds
            await gmPage.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.01
            })

            const baselineGm1 = await gmPage.evaluate(() => game.messages.contents.length)
            await clickSummaryWithFallback(
                gmPage,
                '.application.angriff-dialog',
                '.modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]',
            )
            await waitForNewMessages(gmPage, baselineGm1, 2)

            // ════════════════════════════════════════════════════════════
            // PHASE 2 – Player3 receives defense prompt and defends
            // ════════════════════════════════════════════════════════════
            const baselineP3 = await player3Page.evaluate(() => game.messages.contents.length)
            await player3Page.waitForFunction(
                ({ actorId, base }) => {
                    const msgs = game.messages.contents.slice(base)
                    return msgs.some(
                        (m: any) =>
                            m.flags?.Ilaris?.defensePrompt &&
                            m.flags?.Ilaris?.targetActorId === actorId,
                    )
                },
                { actorId: defenderBefore!.actorId, base: 0 },
                { timeout: 20000 },
            )

            // Verify prompt content & buttons on Player3's side
            const defPromptMsgId = await waitForDefensePromptMessage(
                player3Page,
                defenderBefore!.actorId,
                0,
            )
            expect(defPromptMsgId).not.toBeNull()

            const promptMeta = await player3Page.evaluate((msgId: string) => {
                const root = document.querySelector(`.chat-message[data-message-id="${msgId}"]`)
                if (!root) return null
                return {
                    hasDefensePromptClass: root.innerHTML.includes('defense-prompt'),
                    meleeCount: root.querySelectorAll('.defend-button[data-attack-type="melee"]')
                        .length,
                    akrobatikCount: root.querySelectorAll('.defend-button.defend-akrobatik').length,
                }
            }, defPromptMsgId!)
            expect(promptMeta).not.toBeNull()
            expect(promptMeta!.hasDefensePromptClass).toBeTruthy()
            expect(promptMeta!.akrobatikCount).toBe(0)
            expect(promptMeta!.meleeCount).toBeGreaterThan(0)

            // Player3 clicks Verteidigen
            await clickDefenseButton(player3Page, defPromptMsgId!)

            const defenseDialog = player3Page
                .locator('.application.angriff-dialog')
                .filter({ hasText: `Verteidigung gegen ${ATTACKER_NAME}` })
                .last()
            await expect(defenseDialog).toBeVisible({ timeout: 15000 })

            // Check defense-mode UI
            const defModeUi = await defenseDialog.evaluate((node) => {
                const atk = node.querySelector(
                    '[data-action="angreifen"]',
                ) as HTMLButtonElement | null
                const nearby = node.querySelector(
                    '[data-action="showNearby"]',
                ) as HTMLButtonElement | null
                return {
                    atkDisabled: !atk || atk.disabled,
                    nearbyDisabled: !nearby || nearby.disabled,
                }
            })
            expect(defModeUi.atkDisabled).toBeTruthy()
            expect(defModeUi.nearbyDisabled).toBeTruthy()

            // Rig dice high → defense fails → attacker wins
            await player3Page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.99
            })

            const baselineP3Def = await player3Page.evaluate(() => game.messages.contents.length)
            await clickSummaryWithFallback(
                player3Page,
                '.application.angriff-dialog',
                '.modifier-summary.defense-summary.clickable-summary[data-action="verteidigen"]',
            )
            await waitForNewMessages(player3Page, baselineP3Def, 2)

            const resolutionContent = await player3Page.evaluate((base: number) => {
                const msgs = game.messages.contents.slice(base)
                return (
                    [...msgs]
                        .reverse()
                        .find((m: any) => (m.content ?? '').includes('attack-resolution'))
                        ?.content ?? ''
                )
            }, baselineP3Def)
            expect(resolutionContent).toContain('Kampfergebnis')
            expect(resolutionContent).toContain('durchbricht die Verteidigung')

            // ════════════════════════════════════════════════════════════
            // PHASE 3 – GM clicks Schaden → damage routed to Player3
            // ════════════════════════════════════════════════════════════
            await gmPage.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.01
            })

            const baselineGm3 = await gmPage.evaluate(() => game.messages.contents.length)
            await clickSummaryWithFallback(
                gmPage,
                '.application.angriff-dialog',
                '.modifier-summary.damage-summary.clickable-summary[data-action="schaden"]',
            )
            await waitForNewMessages(gmPage, baselineGm3, 2)

            const damage1 = await gmPage.evaluate((base: number) => {
                const msgs = game.messages.contents.slice(base)
                const dmgMsg = [...msgs].reverse().find((m: any) => {
                    const fl = m.flavor ?? ''
                    return fl.includes('Schaden (') && m.rolls?.[0]?.total != null
                })
                return Number(dmgMsg?.rolls?.[0]?.total ?? NaN)
            }, baselineGm3)
            expect(Number.isNaN(damage1)).toBeFalsy()
            expect(damage1).toBeGreaterThan(0)

            // Wait for Player3's actor to be updated (Owner-routing via socket)
            const wsStern1 = Math.max(1, defenderBefore!.wsStern)
            const expectedIncrement1 = defenderBefore!.useLepSystem
                ? Math.max(0, damage1 - wsStern1)
                : damage1 > wsStern1
                  ? Math.floor((damage1 - 1) / wsStern1)
                  : 0

            await player3Page.waitForFunction(
                ({ actorId, expectedWunden, originalWunden }) => {
                    const actor = game.actors.get(actorId)
                    if (!actor) return false
                    return (
                        (actor.system?.gesundheit?.wunden ?? 0) >= originalWunden + expectedWunden
                    )
                },
                {
                    actorId: defenderBefore!.actorId,
                    expectedWunden: expectedIncrement1,
                    originalWunden: defenderBefore!.wunden,
                },
                { timeout: 15000 },
            )

            const defenderAfter1 = await gmPage.evaluate((name: string) => {
                const actor = game.actors.getName(name)
                return { wunden: (actor?.system?.gesundheit?.wunden ?? 0) as number }
            }, DEFENDER_NAME)

            const deltaWunden1 = defenderAfter1.wunden - defenderBefore!.wunden
            expect(deltaWunden1).toBe(expectedIncrement1)

            // ════════════════════════════════════════════════════════════
            // PHASE 4 – Player3 counter-attacks with Kurzschwert + Wuchtschlag 8
            // ════════════════════════════════════════════════════════════
            const defenderActorWindow = await openActorSheet(player3Page, DEFENDER_NAME)

            // Navigate to Kampf tab
            await defenderActorWindow.locator('nav [data-tab="kampf"]').click()

            // Open attack dialog for Kurzschwert specifically
            const kurzschwertBtn = defenderActorWindow
                .locator(
                    'section.tab.kampf tbody tr [data-action="rollable"][data-rolltype="angriff_diag"]',
                )
                .filter({ hasText: COUNTER_WEAPON_NAME })
                .first()

            const hasDedicatedBtn = await kurzschwertBtn
                .isVisible({ timeout: 3000 })
                .catch(() => false)
            if (hasDedicatedBtn) {
                await kurzschwertBtn.click()
            } else {
                // Fallback: open via openMeleeAttackDialogForWeapon
                await openMeleeAttackDialogForWeapon(defenderActorWindow, COUNTER_WEAPON_NAME)
            }

            const counterDialog = player3Page.locator('.application.angriff-dialog').last()
            await expect(counterDialog).toBeVisible({ timeout: 15000 })

            // Expand Manöver section and set Wuchtschlag
            const maneuverHeader = counterDialog.locator('.maneuver-header').first()
            await expect(maneuverHeader).toBeVisible({ timeout: 8000 })
            // Use force:true because the inner <h3> intercepts pointer events
            await maneuverHeader.click({ force: true })
            await expect(counterDialog.locator('.maneuver-grid')).not.toHaveClass(/collapsed/, {
                timeout: 5000,
            })

            const wuchtschlagInput = counterDialog
                .locator('.maneuver-item')
                .filter({ hasText: 'Wuchtschlag' })
                .locator('input[type="number"]')
            await expect(wuchtschlagInput).toBeVisible({ timeout: 8000 })
            await wuchtschlagInput.fill(String(WUCHTSCHLAG_VALUE))
            await wuchtschlagInput.dispatchEvent('change')

            // Select HatAlles as target
            const showNearbyBtn2 = counterDialog.locator('[data-action="showNearby"]').first()
            await expect(showNearbyBtn2).toBeVisible({ timeout: 10000 })
            await showNearbyBtn2.click().catch(() => {})

            const targetDialog2 = player3Page
                .locator('.target-selection-dialog, .window-app.target-sel, .dialog.target-sel')
                .last()
            await expect(targetDialog2).toBeVisible({ timeout: 10000 })

            const targetRow2 = targetDialog2
                .locator('.target-sel-row')
                .filter({ hasText: ATTACKER_NAME })
                .first()
            await expect(targetRow2).toBeVisible({ timeout: 10000 })
            await targetRow2.click()
            await expect(targetRow2).toHaveClass(/selected/)
            await targetDialog2.locator('button.submit').click()
            await expect(targetDialog2).toBeHidden({ timeout: 10000 })
            await expect(counterDialog.locator('.selected-actors-list')).toContainText(
                ATTACKER_NAME,
            )

            // Rig dice low → counter-attack succeeds
            await player3Page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.01
            })

            const baselineP3Counter = await player3Page.evaluate(
                () => game.messages.contents.length,
            )
            await clickSummaryWithFallback(
                player3Page,
                '.application.angriff-dialog',
                '.modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]',
            )
            await waitForNewMessages(player3Page, baselineP3Counter, 2)

            // ════════════════════════════════════════════════════════════
            // PHASE 5 – GM receives defense prompt for HatAlles and defends
            // ════════════════════════════════════════════════════════════
            const baselineGm5 = await gmPage.evaluate(() => game.messages.contents.length)
            const defPrompt2MsgId = await waitForDefensePromptMessage(
                gmPage,
                attackerBefore!.actorId,
                baselineGm5 - 5 < 0 ? 0 : baselineGm5 - 5,
            )
            expect(defPrompt2MsgId).not.toBeNull()

            const prompt2Meta = await gmPage.evaluate((msgId: string) => {
                const root = document.querySelector(`.chat-message[data-message-id="${msgId}"]`)
                if (!root) return null
                return {
                    hasDefensePromptClass: root.innerHTML.includes('defense-prompt'),
                    meleeCount: root.querySelectorAll('.defend-button[data-attack-type="melee"]')
                        .length,
                }
            }, defPrompt2MsgId!)
            expect(prompt2Meta).not.toBeNull()
            expect(prompt2Meta!.hasDefensePromptClass).toBeTruthy()
            expect(prompt2Meta!.meleeCount).toBeGreaterThan(0)

            // GM clicks Verteidigen for HatAlles
            await clickDefenseButton(gmPage, defPrompt2MsgId!)

            const defenseDialog2 = gmPage
                .locator('.application.angriff-dialog')
                .filter({ hasText: `Verteidigung gegen ${DEFENDER_NAME}` })
                .last()
            await expect(defenseDialog2).toBeVisible({ timeout: 15000 })

            // Check defense-mode UI for GM
            const defModeUi2 = await defenseDialog2.evaluate((node) => {
                const atk = node.querySelector(
                    '[data-action="angreifen"]',
                ) as HTMLButtonElement | null
                const nearby = node.querySelector(
                    '[data-action="showNearby"]',
                ) as HTMLButtonElement | null
                return {
                    atkDisabled: !atk || atk.disabled,
                    nearbyDisabled: !nearby || nearby.disabled,
                }
            })
            expect(defModeUi2.atkDisabled).toBeTruthy()
            expect(defModeUi2.nearbyDisabled).toBeTruthy()

            // Rig dice high → GM defense fails → Player3 wins
            await gmPage.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.99
            })

            const baselineGm5Def = await gmPage.evaluate(() => game.messages.contents.length)
            await clickSummaryWithFallback(
                gmPage,
                '.application.angriff-dialog',
                '.modifier-summary.defense-summary.clickable-summary[data-action="verteidigen"]',
            )
            await waitForNewMessages(gmPage, baselineGm5Def, 2)

            const resolutionContent2 = await gmPage.evaluate((base: number) => {
                const msgs = game.messages.contents.slice(base)
                return (
                    [...msgs]
                        .reverse()
                        .find((m: any) => (m.content ?? '').includes('attack-resolution'))
                        ?.content ?? ''
                )
            }, baselineGm5Def)
            expect(resolutionContent2).toContain('Kampfergebnis')
            expect(resolutionContent2).toContain('durchbricht die Verteidigung')

            // ════════════════════════════════════════════════════════════
            // PHASE 6 – Player3 clicks Schaden → damage routed to GM for HatAlles
            // ════════════════════════════════════════════════════════════
            await player3Page.evaluate(() => {
                CONFIG.Dice.randomUniform = () => 0.01
            })

            const baselineP3Dmg = await player3Page.evaluate(() => game.messages.contents.length)
            await clickSummaryWithFallback(
                player3Page,
                '.application.angriff-dialog',
                '.modifier-summary.damage-summary.clickable-summary[data-action="schaden"]',
            )
            await waitForNewMessages(player3Page, baselineP3Dmg, 2)

            const damage2 = await player3Page.evaluate((base: number) => {
                const msgs = game.messages.contents.slice(base)
                const dmgMsg = [...msgs].reverse().find((m: any) => {
                    const fl = m.flavor ?? ''
                    return fl.includes('Schaden (') && m.rolls?.[0]?.total != null
                })
                return Number(dmgMsg?.rolls?.[0]?.total ?? NaN)
            }, baselineP3Dmg)
            expect(Number.isNaN(damage2)).toBeFalsy()
            expect(damage2).toBeGreaterThan(0)

            // Wait for HatAlles to be updated (Owner = GM → GM-client applies)
            const wsStern2 = Math.max(1, attackerBefore!.wsStern)
            const expectedIncrement2 = attackerBefore!.useLepSystem
                ? Math.max(0, damage2 - wsStern2)
                : damage2 > wsStern2
                  ? Math.floor((damage2 - 1) / wsStern2)
                  : 0

            await gmPage.waitForFunction(
                ({ actorId, expectedWunden, originalWunden }) => {
                    const actor = game.actors.get(actorId)
                    if (!actor) return false
                    return (
                        (actor.system?.gesundheit?.wunden ?? 0) >= originalWunden + expectedWunden
                    )
                },
                {
                    actorId: attackerBefore!.actorId,
                    expectedWunden: expectedIncrement2,
                    originalWunden: attackerBefore!.wunden,
                },
                { timeout: 15000 },
            )

            const attackerAfter = await gmPage.evaluate((name: string) => {
                const actor = game.actors.getName(name)
                return { wunden: (actor?.system?.gesundheit?.wunden ?? 0) as number }
            }, ATTACKER_NAME)

            const deltaWunden2 = attackerAfter.wunden - attackerBefore!.wunden
            expect(deltaWunden2).toBe(expectedIncrement2)
        } finally {
            // ── Cleanup: remove dice overrides from both contexts ─────────
            await gmPage
                .evaluate(() => {
                    delete CONFIG.Dice.randomUniform
                })
                .catch(() => {})
            await player3Page
                .evaluate(() => {
                    delete CONFIG.Dice.randomUniform
                })
                .catch(() => {})

            // ── Cleanup: reset both actors ────────────────────────────────
            if (defenderDefaultSnapshot) {
                await restoreActorFromDefaultSnapshot(gmPage, defenderDefaultSnapshot).catch(
                    () => {},
                )
            }
            if (attackerDefaultSnapshot) {
                await restoreActorFromDefaultSnapshot(gmPage, attackerDefaultSnapshot).catch(
                    () => {},
                )
            }
            await gmContext.close().catch(() => {})
            await player3Context.close().catch(() => {})
        }
    })
})
