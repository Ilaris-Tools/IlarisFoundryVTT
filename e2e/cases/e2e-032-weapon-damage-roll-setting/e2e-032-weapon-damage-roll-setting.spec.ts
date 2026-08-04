/**
 * E2E-032 - Weapon Damage Roll Setting
 *
 * @spec openspec/changes/add-weapon-damage-roll-setting/specs/combat/spec.md
 * @scenario Default result multiplication
 * @scenario Opt-in formula expansion
 */

import { expect, test } from '@playwright/test'
import {
    foundryConfig,
    loginAndJoinWorld,
    restoreFoundrySetting,
    setFoundrySettingForTest,
} from '../../shared/fixtures/foundry'

const weaponDamageRollSetting = { namespace: 'Ilaris', key: 'expandWeaponDamageMultipliers' }
const hammerschlagId = '90GXiYXQQTvML5gA'

test.describe('E2E-032 · Weapon Damage Roll Setting', () => {
    let originalSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        originalSetting = await setFoundrySettingForTest(
            page,
            weaponDamageRollSetting.namespace,
            weaponDamageRollSetting.key,
            false,
        )
    })

    test.afterEach(async ({ page }) => {
        await restoreFoundrySetting(page, originalSetting).catch(() => {})
    })

    async function getHammerschlagDamageRoll(page: import('@playwright/test').Page) {
        return page.evaluate(async (maneuverId) => {
            const maneuverPack = game.packs.get('Ilaris.manover')
            if (!maneuverPack) throw new Error('Hammerschlag maneuver compendium was not found')

            const hammerschlag = await maneuverPack.getDocument(maneuverId)
            if (!hammerschlag) throw new Error('Hammerschlag maneuver was not found')

            const modification = Object.values(hammerschlag.system.modifications).find(
                (entry: any) => entry.type === 'WEAPON_DAMAGE' && entry.operator === 'MULTIPLY',
            )
            if (!modification)
                throw new Error('Hammerschlag weapon damage multiplier was not found')

            const { processModification } =
                await import('/systems/Ilaris/scripts/combat/dialogs/shared-dialog-helpers.js')
            const rollValues = {
                mod_at: 0,
                mod_vt: 0,
                mod_dm: 0,
                mod_energy: 0,
                text_at: '',
                text_vt: '',
                text_dm: '',
                text_energy: '',
                schaden: '2d6 + 3',
                nodmg: { name: '', value: false },
            }

            processModification(modification, 1, hammerschlag.name, null, rollValues)
            const damageRoll = await new Roll(rollValues.schaden).evaluate()
            return {
                formula: damageRoll.formula.replace(/\s/g, ''),
                dice: damageRoll.dice.map((die) => ({ faces: die.faces, number: die.number })),
                total: damageRoll.total,
            }
        }, hammerschlagId)
    }

    test('keeps default Hammerschlag damage as a result multiplier', async ({ page }) => {
        const result = await getHammerschlagDamageRoll(page)

        expect(result.formula).toBe('(2d6+3)*2')
        expect(result.dice).toEqual([{ faces: 6, number: 2 }])
        expect(Number.isFinite(result.total)).toBe(true)
    })

    test('expands opt-in Hammerschlag damage before rolling', async ({ page }) => {
        await setFoundrySettingForTest(
            page,
            weaponDamageRollSetting.namespace,
            weaponDamageRollSetting.key,
            true,
        )

        const result = await getHammerschlagDamageRoll(page)

        expect(result.formula).toBe('4d6+6')
        expect(result.dice).toEqual([{ faces: 6, number: 4 }])
        expect(Number.isFinite(result.total)).toBe(true)
    })
})
