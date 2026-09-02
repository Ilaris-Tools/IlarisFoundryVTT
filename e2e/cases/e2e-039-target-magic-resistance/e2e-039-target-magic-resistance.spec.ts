import { expect, test } from '@playwright/test'

import {
    clearChatLog,
    enableTargetSelectionForTest,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'
import { E2E_BASELINE } from '../../shared/baseline'

const CASTER_NAME = E2E_BASELINE.actors.allCapabilities
const TARGET_NAME = E2E_BASELINE.actors.hero
const PLAYER_USERNAME = process.env.E2E_PLAYER_USER ?? E2E_BASELINE.users.player
const SPELL_NAME = 'Blitz dich find'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'

test.describe('E2E-039 · Target Magieresistenz', () => {
    test('the target owner rolls 1W20 and the caster receives MR + W20 as casting difficulty', async ({
        browser,
    }) => {
        const gmContext = await browser.newContext()
        const playerContext = await browser.newContext()
        const gmPage = await gmContext.newPage()
        const playerPage = await playerContext.newPage()
        const playerConfig = { ...foundryConfig, username: PLAYER_USERNAME }
        let targetSelectionSetting: Awaited<
            ReturnType<typeof enableTargetSelectionForTest>
        > | null = null
        let createdItemId = ''

        try {
            await loginAndJoinWorld(gmPage, foundryConfig)
            await loginAndJoinWorld(playerPage, playerConfig)
            targetSelectionSetting = await enableTargetSelectionForTest(gmPage)
            await clearChatLog(gmPage)
            await playerPage.waitForFunction(() => game.messages.contents.length === 0)

            createdItemId = await gmPage.evaluate(
                async ({ actorName, packId, spellName }) => {
                    const actor = game.actors?.getName(actorName) as any
                    const source = (await game.packs?.get(packId)?.getDocuments())?.find(
                        (entry: any) => entry.name === spellName,
                    ) as any
                    if (!actor || !source) throw new Error('Blitz dich find oder HatAlles fehlt.')
                    const [item] = await actor.createEmbeddedDocuments('Item', [source.toObject()])
                    return item.id as string
                },
                { actorName: CASTER_NAME, packId: SPELL_PACK, spellName: SPELL_NAME },
            )

            const actorSheet = await openActorSheet(gmPage, CASTER_NAME)
            await openSpellDialog(actorSheet, SPELL_NAME)
            const spellDialog = gmPage.locator('.application.uebernatuerlich-dialog').last()
            await expect(spellDialog).toBeVisible({ timeout: 15000 })

            await spellDialog.locator('[data-action="showNearby"]').click()
            const targetDialog = gmPage
                .locator('.target-selection-dialog, .window-app.target-sel, .dialog.target-sel')
                .last()
            await expect(targetDialog).toBeVisible({ timeout: 10000 })
            const targetRow = targetDialog
                .locator('.target-sel-row')
                .filter({ hasText: TARGET_NAME })
                .first()
            await targetRow.click()
            await targetDialog.locator('button.submit').click()
            await expect(spellDialog.locator('.selected-actors-list')).toContainText(TARGET_NAME)

            const requestButton = spellDialog.getByRole('button', { name: 'MR würfeln anfragen' })
            await expect(requestButton).toBeVisible()
            await requestButton.click()

            const remoteRollButton = playerPage.locator('.magic-resistance-roll-button').last()
            await expect(remoteRollButton).toBeVisible({ timeout: 20000 })
            // Foundry can render whispered chat below the collapsed sidebar viewport.
            // Invoke the visible card's native control without relying on the sidebar scroll position.
            await remoteRollButton.evaluate((button: HTMLButtonElement) => button.click())
            await expect(
                playerPage.locator('.ilaris-magic-resistance-result').last(),
            ).toContainText('Magieresistenz:')

            await expect(spellDialog.locator('.magic-resistance-section')).toContainText(
                'Magieresistenz:',
                { timeout: 20000 },
            )
            const challenge = await gmPage.evaluate(() => {
                const dialog = Array.from(
                    (foundry.applications as any).instances?.values() ?? [],
                ).find((app: any) => app.constructor?.name === 'UebernatuerlichDialog') as any
                return dialog?.magicResistanceChallenge
            })
            const targetMr = await gmPage.evaluate((actorName) => {
                const actor = game.actors?.getName(actorName) as any
                return Number(actor?.system?.abgeleitete?.mr)
            }, TARGET_NAME)
            expect(challenge).toMatchObject({
                magicResistance: targetMr,
                difficulty: targetMr + challenge.d20,
            })

            const firstDifficulty = challenge.difficulty
            await gmPage.evaluate(
                (result) => {
                    game.socket.emit('system.Ilaris', {
                        type: 'resolveMagicResistance',
                        data: result,
                    })
                },
                {
                    requestId: challenge.id,
                    dialogId: challenge.dialogId,
                    targetActorUuid: challenge.targetActorUuid,
                    d20: 1,
                },
            )
            await gmPage.waitForTimeout(250)
            const afterDuplicate = await gmPage.evaluate(() => {
                const dialog = Array.from(
                    (foundry.applications as any).instances?.values() ?? [],
                ).find((app: any) => app.constructor?.name === 'UebernatuerlichDialog') as any
                return dialog?.magicResistanceChallenge?.difficulty
            })
            expect(afterDuplicate).toBe(firstDifficulty)

            const savedUiConfig = await gmPage.evaluate(() =>
                foundry.utils.deepClone(game.settings.get('core', 'uiConfig')),
            )
            try {
                for (const theme of ['light', 'dark']) {
                    await gmPage.evaluate(
                        async ({ config, colorScheme }) => {
                            await game.settings.set('core', 'uiConfig', {
                                ...config,
                                colorScheme: {
                                    ...(config.colorScheme ?? {}),
                                    applications: colorScheme,
                                },
                            })
                        },
                        { config: savedUiConfig, colorScheme: theme },
                    )
                    await expect(gmPage.locator(`body.theme-${theme}`)).toBeVisible()
                    await expect(spellDialog.locator('.magic-resistance-section')).toBeVisible()
                    await spellDialog.screenshot({
                        path: `test-results/e2e-039-target-magic-resistance-${theme}.png`,
                    })
                }
            } finally {
                await gmPage
                    .evaluate(
                        (config) => game.settings.set('core', 'uiConfig', config),
                        savedUiConfig,
                    )
                    .catch(() => {})
            }
        } finally {
            await gmPage
                .evaluate(
                    async ({ actorName, itemId }) => {
                        const actor = game.actors?.getName(actorName) as any
                        if (actor && itemId) await actor.deleteEmbeddedDocuments('Item', [itemId])
                    },
                    { actorName: CASTER_NAME, itemId: createdItemId },
                )
                .catch(() => {})
            if (targetSelectionSetting) {
                await restoreFoundrySetting(gmPage, targetSelectionSetting).catch(() => {})
            }
            await clearChatLog(gmPage).catch(() => {})
            await playerContext.close()
            await gmContext.close()
        }
    })

    test('an unmarked Magieresistenz spell remains a manual cast', async ({ page }) => {
        let createdItemId = ''
        await loginAndJoinWorld(page, foundryConfig)
        try {
            createdItemId = await page.evaluate(
                async ({ actorName, packId, spellName }) => {
                    const actor = game.actors?.getName(actorName) as any
                    const source = (await game.packs?.get(packId)?.getDocuments())?.find(
                        (entry: any) => entry.name === spellName,
                    ) as any
                    if (!actor || !source) throw new Error('Manuelles Blitz-Setup fehlt.')
                    const itemSource = source.toObject()
                    delete itemSource._id
                    itemSource.name = 'E2E manueller Blitz'
                    delete itemSource.system.magicResistance
                    const [item] = await actor.createEmbeddedDocuments('Item', [itemSource])
                    return item.id as string
                },
                { actorName: CASTER_NAME, packId: SPELL_PACK, spellName: SPELL_NAME },
            )

            const actorSheet = await openActorSheet(page, CASTER_NAME)
            await openSpellDialog(actorSheet, 'E2E manueller Blitz')
            const dialog = page.locator('.application.uebernatuerlich-dialog').last()
            await expect(dialog).toBeVisible({ timeout: 15000 })
            await expect(dialog.locator('.magic-resistance-section')).toHaveCount(0)
            await expect(dialog.locator('.clickable-summary.energie-erfolg')).toBeVisible()
        } finally {
            await page
                .evaluate(
                    async ({ actorName, itemId }) => {
                        const actor = game.actors?.getName(actorName) as any
                        if (actor && itemId) await actor.deleteEmbeddedDocuments('Item', [itemId])
                    },
                    { actorName: CASTER_NAME, itemId: createdItemId },
                )
                .catch(() => {})
        }
    })

    test('a failed MR-gated Plumbumbarum cast creates no Pre-Effect', async ({ browser }) => {
        const gmContext = await browser.newContext()
        const playerContext = await browser.newContext()
        const gmPage = await gmContext.newPage()
        const playerPage = await playerContext.newPage()
        const playerConfig = { ...foundryConfig, username: PLAYER_USERNAME }
        let targetSelectionSetting: Awaited<
            ReturnType<typeof enableTargetSelectionForTest>
        > | null = null
        let createdItemId = ''

        try {
            await loginAndJoinWorld(gmPage, foundryConfig)
            await loginAndJoinWorld(playerPage, playerConfig)
            targetSelectionSetting = await enableTargetSelectionForTest(gmPage)
            await clearChatLog(gmPage)
            await playerPage.waitForFunction(() => game.messages.contents.length === 0)
            await gmPage.evaluate((actorName) => {
                const actor = game.actors?.getName(actorName) as any
                // A prepared-data override makes the controlled failure deterministic
                // without mutating the shared E2E actor document.
                actor.system.abgeleitete.mr = 99
            }, TARGET_NAME)
            createdItemId = await gmPage.evaluate(async (packId) => {
                const actor = game.actors?.getName('HatAlles') as any
                const source = (await game.packs?.get(packId)?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Plumbumbarum schwerer Arm',
                ) as any
                if (!actor || !source) throw new Error('Plumbumbarum-Setup fehlt.')
                const [item] = await actor.createEmbeddedDocuments('Item', [source.toObject()])
                return item.id as string
            }, SPELL_PACK)

            const actorSheet = await openActorSheet(gmPage, CASTER_NAME)
            await openSpellDialog(actorSheet, 'Plumbumbarum schwerer Arm')
            const dialog = gmPage.locator('.application.uebernatuerlich-dialog').last()
            await dialog.locator('[data-action="showNearby"]').click()
            const targetDialog = gmPage
                .locator('.target-selection-dialog, .window-app.target-sel, .dialog.target-sel')
                .last()
            const targetRow = targetDialog
                .locator('.target-sel-row')
                .filter({ hasText: TARGET_NAME })
                .first()
            await targetRow.click()
            await targetDialog.locator('button.submit').click()
            await dialog.getByRole('button', { name: 'MR würfeln anfragen' }).click()
            const remoteRollButton = playerPage.locator('.magic-resistance-roll-button').last()
            await expect(remoteRollButton).toBeVisible({ timeout: 20000 })
            await remoteRollButton.evaluate((button: HTMLButtonElement) => button.click())
            await expect(dialog.locator('.magic-resistance-section')).toContainText('99 +')

            const before = await gmPage.evaluate((actorName) => {
                const actor = game.actors?.getName(actorName) as any
                return { effects: actor.effects.size, messages: game.messages.contents.length }
            }, TARGET_NAME)
            await gmPage.evaluate(() => {
                ;(CONFIG.Dice as any).randomUniform = () => 0.99
                const app = Array.from(
                    (foundry.applications as any).instances?.values() ?? [],
                ).find((entry: any) => entry.constructor?.name === 'UebernatuerlichDialog') as any
                return app?._angreifenKlick?.()
            })
            await gmPage.waitForFunction(
                (messageCount) => game.messages.contents.length > messageCount,
                before.messages,
            )
            const afterEffects = await gmPage.evaluate((actorName) => {
                const actor = game.actors?.getName(actorName) as any
                return actor.effects.size
            }, TARGET_NAME)
            expect(afterEffects).toBe(before.effects)
        } finally {
            await gmPage
                .evaluate(
                    async ({ itemId, mr }) => {
                        delete (CONFIG.Dice as any).randomUniform
                        const caster = game.actors?.getName('HatAlles') as any
                        if (caster && itemId) await caster.deleteEmbeddedDocuments('Item', [itemId])
                    },
                    { itemId: createdItemId },
                )
                .catch(() => {})
            if (targetSelectionSetting) {
                await restoreFoundrySetting(gmPage, targetSelectionSetting).catch(() => {})
            }
            await clearChatLog(gmPage).catch(() => {})
            await playerContext.close()
            await gmContext.close()
        }
    })
})
