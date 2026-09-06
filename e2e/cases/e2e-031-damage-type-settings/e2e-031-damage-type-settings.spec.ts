/**
 * E2E-031 – Damage Type Settings
 *
 * @spec openspec/changes/healing-damage-types/specs/configurable-damage-types/spec.md
 * @scenario Edit button opens DialogV2 popup
 * @scenario DialogV2 saves edited type
 */

import { expect, test, type Page } from '@playwright/test'
import {
    closeOpenApplications,
    createE2ESession,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

async function dismissReloadDialog(page: Page) {
    // The reload dialog can appear asynchronously after a settings save;
    // wait for it instead of racing an immediate visibility check.
    const dialog = page.locator('#reload-world-confirm')
    try {
        await dialog.waitFor({ state: 'visible', timeout: 5000 })
        await dialog.locator('button[data-action="no"]').click()
    } catch {
        // No reload dialog appeared — nothing to dismiss.
    }
}

const damageTypesSetting = { namespace: 'Ilaris', key: 'damageTypes' }
const weaponDamageRollSetting = { namespace: 'Ilaris', key: 'expandWeaponDamageMultipliers' }

test.describe('E2E-031 · Damage Type Settings', () => {
    let originalSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot
    let originalWeaponDamageRollSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot
    let session: Awaited<ReturnType<typeof createE2ESession>> | undefined

    test.beforeAll(async ({ browser }) => {
        session = await createE2ESession(browser)
    })

    test.afterAll(async () => {
        await session?.close()
    })

    test.beforeEach(async () => {
        const page = session!.page
        await closeOpenApplications(page).catch(() => {})
        await dismissReloadDialog(page).catch(() => {})
        originalSetting = await page.evaluate(({ namespace, key }) => {
            return { namespace, key, value: game.settings.get(namespace, key) }
        }, damageTypesSetting)
        originalWeaponDamageRollSetting = await page.evaluate(({ namespace, key }) => {
            return { namespace, key, value: game.settings.get(namespace, key) }
        }, weaponDamageRollSetting)
    })

    test.afterEach(async () => {
        const page = session!.page
        await restoreFoundrySetting(page, originalSetting).catch(() => {})
        await restoreFoundrySetting(page, originalWeaponDamageRollSetting).catch(() => {})
    })

    test('supports edit, add, delete, behavior persistence, and reopening', async () => {
        const page = session!.page
        await page.evaluate(() => {
            const menu = game.settings.menus.get('Ilaris.ilarisSettingsMenu')
            if (!menu?.type) throw new Error('Ilaris settings menu is not registered')
            new menu.type().render({ force: true })
        })

        const settingsDialog = page.locator('.settings-dialog').last()
        await expect(settingsDialog).toBeVisible({ timeout: 15000 })
        await settingsDialog.locator('nav [data-tab="GENERAL"]').click()

        const damageTypeRow = settingsDialog.locator('.damage-type-row').first()
        await expect(damageTypeRow).toBeVisible({ timeout: 10000 })
        await expect(damageTypeRow.locator('.damage-type-behavior')).toContainText('Schaden')

        await damageTypeRow.locator('.edit-damage-type').click()
        const editDialog = page
            .locator('.application, .window-app')
            .filter({ hasText: 'Schadenstyp bearbeiten' })
            .last()
        await expect(editDialog).toBeVisible({ timeout: 10000 })
        await editDialog.locator('input[name="label"]').fill('Profan (bearbeitet)')
        await editDialog.locator('input[name="elementalSideEffect"]').fill('nachbrennen')
        await editDialog.locator('button:has-text("Übernehmen")').click()

        await expect(settingsDialog.locator('.damage-type-row').first()).toContainText(
            'Profan (bearbeitet)',
        )

        await settingsDialog.locator('.add-damage-type').click()
        const addDialog = page
            .locator('.application, .window-app')
            .filter({ hasText: 'Neuer Schadenstyp' })
            .last()
        await expect(addDialog).toBeVisible({ timeout: 10000 })
        await addDialog.locator('input[name="value"]').fill('TEST_HEALING')
        await addDialog.locator('input[name="label"]').fill('Testheilung')
        await addDialog.locator('input[name="healing"]').check()
        await addDialog.locator('input[name="targetsErschoepfung"]').check()
        await addDialog.locator('button:has-text("Übernehmen")').click()
        await expect(
            settingsDialog.locator('.damage-type-row').filter({ hasText: 'Testheilung' }),
        ).toHaveCount(1)

        await settingsDialog.locator('button[data-action="saveSettings"]').click()
        await dismissReloadDialog(page)

        await page.waitForFunction(
            ({ namespace, key }) => {
                return JSON.parse(game.settings.get(namespace, key)).some(
                    (type: any) =>
                        type.label === 'Profan (bearbeitet)' &&
                        type.behavior?.elementalSideEffect === 'nachbrennen',
                )
            },
            damageTypesSetting,
            { timeout: 10000 },
        )

        await page.evaluate(() => {
            const menu = game.settings.menus.get('Ilaris.ilarisSettingsMenu')
            if (!menu?.type) throw new Error('Ilaris settings menu is not registered')
            new menu.type().render({ force: true })
        })
        const reopenedDialog = page.locator('.settings-dialog').last()
        await expect(reopenedDialog).toBeVisible({ timeout: 15000 })
        await reopenedDialog.locator('nav [data-tab="GENERAL"]').click()
        await expect(reopenedDialog.locator('.damage-type-row').first()).toContainText(
            'Profan (bearbeitet)',
        )
        const reopenedProfanRow = reopenedDialog
            .locator('.damage-type-row')
            .filter({ hasText: 'Profan (bearbeitet)' })
            .first()
        await reopenedProfanRow.locator('.edit-damage-type').click()
        const clearSideEffectDialog = page
            .locator('.application, .window-app')
            .filter({ hasText: 'Schadenstyp bearbeiten' })
            .last()
        await expect(
            clearSideEffectDialog.locator('input[name="elementalSideEffect"]'),
        ).toHaveValue('nachbrennen')
        await clearSideEffectDialog.locator('input[name="elementalSideEffect"]').fill('')
        await clearSideEffectDialog.locator('button:has-text("Übernehmen")').click()
        await reopenedDialog.locator('button[data-action="saveSettings"]').click()
        await dismissReloadDialog(page)
        await page.waitForFunction(
            () =>
                JSON.parse(game.settings.get('Ilaris', 'damageTypes')).find(
                    (type: any) => type.label === 'Profan (bearbeitet)',
                )?.behavior?.elementalSideEffect === null,
            undefined,
            { timeout: 10000 },
        )

        await page.evaluate(() => {
            const menu = game.settings.menus.get('Ilaris.ilarisSettingsMenu')
            if (!menu?.type) throw new Error('Ilaris settings menu is not registered')
            new menu.type().render({ force: true })
        })
        const finalDialog = page.locator('.settings-dialog').last()
        await expect(finalDialog).toBeVisible({ timeout: 15000 })
        await finalDialog.locator('nav [data-tab="GENERAL"]').click()
        const persistedCustom = await page.evaluate(() => {
            return JSON.parse(game.settings.get('Ilaris', 'damageTypes')).find(
                (type: any) => type.value === 'TEST_HEALING',
            )
        })
        expect(persistedCustom).toMatchObject({
            label: 'Testheilung',
            behavior: { healing: true, targetsErschoepfung: true },
        })

        const customRow = finalDialog
            .locator('.damage-type-row')
            .filter({ hasText: 'Testheilung' })
            .first()
        await customRow.locator('.delete-damage-type').click()
        await expect(
            reopenedDialog.locator('.damage-type-row').filter({ hasText: 'Testheilung' }),
        ).toHaveCount(0)
        await finalDialog.locator('button[data-action="saveSettings"]').click()
        await dismissReloadDialog(page)
        await page.waitForFunction(
            () =>
                !JSON.parse(game.settings.get('Ilaris', 'damageTypes')).some(
                    (type: any) => type.value === 'TEST_HEALING',
                ),
            undefined,
            { timeout: 10000 },
        )
    })

    test('GM enables and persists weapon damage roll expansion', async () => {
        const page = session!.page
        await page.evaluate(() => {
            const menu = game.settings.menus.get('Ilaris.ilarisSettingsMenu')
            if (!menu?.type) throw new Error('Ilaris settings menu is not registered')
            new menu.type().render({ force: true })
        })

        const settingsDialog = page.locator('.settings-dialog').last()
        await expect(settingsDialog).toBeVisible({ timeout: 15000 })
        await settingsDialog.locator('nav [data-tab="GENERAL"]').click()

        const settingInput = settingsDialog.locator(
            'input[name="general.expandWeaponDamageMultipliers"]',
        )
        await expect(settingInput).toBeVisible({ timeout: 10000 })
        await settingInput.check()
        await settingsDialog.locator('button[data-action="saveSettings"]').click()
        await dismissReloadDialog(page)

        await page.waitForFunction(
            ({ namespace, key }) => game.settings.get(namespace, key) === true,
            weaponDamageRollSetting,
            { timeout: 10000 },
        )
    })
})
