import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    enableTargetSelectionForTest,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openChatSidebar,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const CASTER_NAME = 'HatAlles'
const TARGET_NAME = 'Testlauf-Held'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'
const SPELL_NAME = 'Ignifaxius Flammenstrahl'

async function removeBallisticFixtures(page: import('@playwright/test').Page) {
    await page.evaluate(async () => {
        const scene = canvas.scene as any
        const tokenIds = Array.from(scene?.tokens ?? [])
            .filter((token: any) => token.flags?.Ilaris?.e2eBallistic)
            .map((token: any) => token.id)
        if (tokenIds.length) await scene.deleteEmbeddedDocuments('Token', tokenIds)
        for (const token of game.user.targets ?? [])
            token.setTarget(false, { releaseOthers: false })
    })
}

async function createTarget(page: import('@playwright/test').Page) {
    const targetTokenId = await page.evaluate(
        async ({ casterName, targetName }) => {
            const caster = game.actors.getName(casterName) as any
            const targetActor = game.actors.getName(targetName) as any
            const scene = canvas.scene as any
            const casterToken = canvas.tokens?.placeables?.find(
                (token: any) => token.actor?.id === caster?.id,
            )
            if (!caster || !targetActor || !scene || !casterToken)
                throw new Error('Ballistik-E2E fehlt.')

            const grid = canvas.grid.size
            const [targetDocument] = await scene.createEmbeddedDocuments('Token', [
                {
                    name: 'E2E Ballistik-Ziel',
                    actorId: targetActor.id,
                    actorLink: false,
                    x: casterToken.center.x + grid * 3 - grid / 2,
                    y: casterToken.center.y - grid / 2,
                    flags: { Ilaris: { e2eBallistic: true } },
                },
            ])
            return targetDocument.id
        },
        { casterName: CASTER_NAME, targetName: TARGET_NAME },
    )
    await page.waitForFunction((tokenId) => Boolean(canvas.tokens?.get(tokenId)), targetTokenId)
    await page.evaluate((tokenId) => {
        canvas.tokens?.get(tokenId)?.setTarget(true, { releaseOthers: true })
    }, targetTokenId)
    return { targetTokenId }
}

test.describe('E2E-042 · Ballistische Zauberauflösung', () => {
    let casterSnapshot: ActorDefaultSnapshot
    let targetSelectionSetting: Awaited<ReturnType<typeof enableTargetSelectionForTest>>

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await removeBallisticFixtures(page)
        await clearChatLog(page)
        await openChatSidebar(page)
        targetSelectionSetting = await enableTargetSelectionForTest(page)
        casterSnapshot = await captureActorDefaultSnapshot(page, CASTER_NAME)
        await page.evaluate(
            async ({ casterName, packId, spellName }) => {
                const caster = game.actors.getName(casterName) as any
                const spell = caster?.items.find((item: any) => item.name === spellName)
                const pack = game.packs?.get(packId) as any
                const source = (await pack?.getDocuments?.())?.find(
                    (item: any) => item.name === spellName,
                )
                if (!spell || !source)
                    throw new Error('Ignifaxius fehlt in E2E-Akteur oder Kompendium.')
                await spell.update({
                    'system.ballistic': foundry.utils.deepClone(source.system.ballistic),
                    'system.preEffects': foundry.utils.deepClone(source.system.preEffects),
                })
            },
            { casterName: CASTER_NAME, packId: SPELL_PACK, spellName: SPELL_NAME },
        )
    })

    test.afterEach(async ({ page }) => {
        await removeBallisticFixtures(page).catch(() => {})
        await restoreActorFromDefaultSnapshot(page, casterSnapshot).catch(() => {})
        await restoreFoundrySetting(page, targetSelectionSetting).catch(() => {})
        await clearChatLog(page).catch(() => {})
        await page.evaluate(() => delete (CONFIG.Dice as any).randomUniform).catch(() => {})
    })

    test('visible target gets one Pre-Effect only after the rendered Nicht-verteidigen outcome', async ({
        page,
    }) => {
        const { targetTokenId } = await createTarget(page)
        const woundBefore = await page.evaluate((tokenId) => {
            return (canvas.tokens?.get(tokenId)?.actor as any)?.system?.gesundheit?.wunden ?? 0
        }, targetTokenId)
        const actorSheet = await openActorSheet(page, CASTER_NAME)
        await openSpellDialog(actorSheet, SPELL_NAME)
        const dialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(dialog).toBeVisible()
        await expect(dialog.locator('.selected-actors-list')).toBeVisible()
        await expect(dialog.locator('[data-action="angreifen"]')).toBeVisible()
        await dialog.screenshot({ path: 'test-results/e2e-042-ballistic-dialog.png' })
        await actorSheet.getByRole('button', { name: 'Close Window' }).click()
        await expect(actorSheet).not.toBeVisible()
        await expect(dialog).toBeVisible()

        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })
        await dialog.locator('[data-action="angreifen"]').click()
        await openChatSidebar(page)
        const decline = page.locator('.defend-button[data-weapon-id="no-defense"]').last()
        await expect(decline).toBeVisible({ timeout: 20000 })
        await decline.click()

        await expect
            .poll(() =>
                page.evaluate(
                    ({ tokenId, baseline }) =>
                        ((canvas.tokens?.get(tokenId)?.actor as any)?.system?.gesundheit?.wunden ??
                            0) > baseline,
                    { tokenId: targetTokenId, baseline: woundBefore },
                ),
            )
            .toBe(true)
        await expect(
            page
                .locator('.chat-message')
                .filter({ hasText: 'Ignifaxius Flammenstrahl trifft' })
                .last(),
        ).toBeVisible()
    })

    test('successful rendered Akrobatik defense prevents the target Pre-Effect', async ({
        page,
    }) => {
        const { targetTokenId } = await createTarget(page)
        const woundBefore = await page.evaluate((tokenId) => {
            return (canvas.tokens?.get(tokenId)?.actor as any)?.system?.gesundheit?.wunden ?? 0
        }, targetTokenId)
        const actorSheet = await openActorSheet(page, CASTER_NAME)
        const spell = await page.evaluate(
            ({ casterName, spellName }) => {
                return (game.actors.getName(casterName) as any)?.items.find(
                    (item: any) => item.name === spellName,
                )
            },
            { casterName: CASTER_NAME, spellName: SPELL_NAME },
        )
        await openSpellDialog(actorSheet, SPELL_NAME)
        const dialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(dialog).toBeVisible()
        await actorSheet.getByRole('button', { name: 'Close Window' }).click()
        await expect(actorSheet).not.toBeVisible()
        const modifier = dialog.locator('input[id^="modifikator-"]')
        await modifier.fill(String(2 - Number(spell.system.pw ?? 0)))
        await modifier.dispatchEvent('change')
        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.5
        })
        await dialog.locator('[data-action="angreifen"]').click()
        await openChatSidebar(page)

        const akrobatik = page.locator('.defend-button.defend-akrobatik').last()
        await expect(akrobatik).toBeVisible({ timeout: 20000 })
        await akrobatik.click()
        const defenseDialog = page
            .locator('.application, .dialog')
            .filter({ hasText: 'Ausweichen mit Akrobatik' })
            .last()
        await expect(defenseDialog).toBeVisible({ timeout: 15000 })
        await page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })
        await defenseDialog.getByRole('button', { name: 'OK' }).click()

        await expect(
            page
                .locator('.chat-message')
                .filter({ hasText: 'Ignifaxius Flammenstrahl wird erfolgreich abgewehrt' })
                .last(),
        ).toBeVisible()
        await expect
            .poll(() =>
                page.evaluate(
                    ({ tokenId }) =>
                        (canvas.tokens?.get(tokenId)?.actor as any)?.system?.gesundheit?.wunden ??
                        0,
                    { tokenId: targetTokenId },
                ),
            )
            .toBe(woundBefore)
    })
})
