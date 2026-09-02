import { expect, test } from '@playwright/test'

import {
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const TARGET_ACTOR_NAME = 'HatAlles'
const damageTypesSetting = { namespace: 'Ilaris', key: 'damageTypes' }

test.describe('E2E-036 · maneuver damage types', () => {
    let actorSnapshot: import('../../shared/fixtures/foundry').ActorDefaultSnapshot
    let damageTypesSnapshot: import('../../shared/fixtures/foundry').FoundrySettingSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        actorSnapshot = await captureActorDefaultSnapshot(page, TARGET_ACTOR_NAME)
        damageTypesSnapshot = await page.evaluate(({ namespace, key }) => {
            return { namespace, key, value: game.settings.get(namespace, key) }
        }, damageTypesSetting)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await restoreFoundrySetting(page, damageTypesSnapshot).catch(() => {})
        await restoreActorFromDefaultSnapshot(page, actorSnapshot).catch(() => {})
        await clearChatLog(page).catch(() => {})
    })

    test('Stumpfer Schlag applies STUMPF exhaustion through the maneuver modification path', async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const configured = JSON.parse(game.settings.get('Ilaris', 'damageTypes'))
            const requiredTypes = [
                { value: 'PROFAN', label: 'Profan', behavior: {} },
                {
                    value: 'STUMPF',
                    label: 'Stumpf',
                    behavior: { targetsErschoepfung: true },
                },
                {
                    value: 'TRUE_DAMAGE',
                    label: 'Rüstungsbrechend',
                    behavior: { bypassesArmor: true },
                },
            ]
            const existingTypes = configured.filter(
                (type: any) => !requiredTypes.some((required) => required.value === type.value),
            )
            await game.settings.set(
                'Ilaris',
                'damageTypes',
                JSON.stringify([...existingTypes, ...requiredTypes]),
            )
        })
        const result = await page.evaluate(
            async ({ actorName }) => {
                const actor = game.actors?.getName(actorName) as any
                const maneuvers = await game.packs?.get('Ilaris.manover')?.getDocuments()
                const maneuver = maneuvers?.find(
                    (item: any) => item.name === 'Stumpfer Schlag',
                ) as any
                if (!actor || !maneuver) throw new Error('Stumpfer Schlag-Testdaten fehlen.')

                await actor.update({
                    'system.gesundheit.wunden': 0,
                    'system.gesundheit.erschoepfung': 0,
                })
                const helpers =
                    await import('/systems/Ilaris/scripts/combat/dialogs/shared-dialog-helpers.js')
                const rollValues: any = {
                    mod_at: 0,
                    mod_vt: 0,
                    mod_dm: 0,
                    mod_energy: 0,
                    text_at: '',
                    text_vt: '',
                    text_dm: '',
                    text_energy: '',
                    schaden: '',
                    nodmg: { name: '', value: false },
                    damageType: 'PROFAN',
                }
                const [, , , , , , summary, , , , , damageType] = helpers.handleModifications(
                    Object.values(maneuver.system.modifications).map((modification: any) => ({
                        modification,
                        manoever: maneuver,
                        check: true,
                    })),
                    rollValues,
                )
                await helpers._applyDamageDirectly(
                    actor,
                    actor.system.abgeleitete.ws + 1,
                    damageType,
                    false,
                    {},
                )

                return {
                    damageType,
                    summary,
                    wunden: actor.system.gesundheit.wunden,
                    erschoepfung: actor.system.gesundheit.erschoepfung,
                }
            },
            { actorName: TARGET_ACTOR_NAME },
        )

        expect(result).toMatchObject({
            damageType: 'STUMPF',
            wunden: 0,
            erschoepfung: 1,
        })
        expect(result.summary).toContain('Schadenstyp zu Stumpf')
    })

    test('both Rüstungsbrecher maneuvers use TRUE_DAMAGE behavior and a removed key falls back safely', async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const configured = JSON.parse(game.settings.get('Ilaris', 'damageTypes'))
            const requiredTypes = [
                { value: 'PROFAN', label: 'Profan', behavior: {} },
                {
                    value: 'STUMPF',
                    label: 'Stumpf',
                    behavior: { targetsErschoepfung: true },
                },
                {
                    value: 'TRUE_DAMAGE',
                    label: 'Rüstungsbrechend',
                    behavior: { bypassesArmor: true },
                },
            ]
            const existingTypes = configured.filter(
                (type: any) => !requiredTypes.some((required) => required.value === type.value),
            )
            await game.settings.set(
                'Ilaris',
                'damageTypes',
                JSON.stringify([...existingTypes, ...requiredTypes]),
            )
        })
        const result = await page.evaluate(
            async ({ actorName }) => {
                const actor = game.actors?.getName(actorName) as any
                const maneuvers = await game.packs?.get('Ilaris.manover')?.getDocuments()
                const quickReferences = await game.packs
                    ?.get('Ilaris.kurzuebersichten')
                    ?.getDocuments()
                const melee = maneuvers?.find((item: any) => item.name === 'Rüstungsbrecher') as any
                const ranged = maneuvers?.find(
                    (item: any) => item.name === 'Rüstungsbrecher (FK)',
                ) as any
                const quickReferencePage = quickReferences
                    ?.flatMap((entry: any) => entry.pages?.contents || [])
                    .find((page: any) => page.text?.content?.includes('Schadenstyp'))
                if (!actor || !melee || !ranged || !quickReferencePage)
                    throw new Error('Rüstungsbrecher-Testdaten fehlen.')

                const helpers =
                    await import('/systems/Ilaris/scripts/combat/dialogs/shared-dialog-helpers.js')
                const target: any = {
                    name: 'Rüstungs-Testziel',
                    type: 'held',
                    system: {
                        gesundheit: { wunden: 0, erschoepfung: 0 },
                        abgeleitete: { ws: 5, ws_stern: 10 },
                    },
                    async update(changes: Record<string, number>) {
                        for (const [path, value] of Object.entries(changes)) {
                            const healthKey = path.replace('system.gesundheit.', '')
                            this.system.gesundheit[healthKey] = value
                        }
                    },
                }
                const resolveManeuver = (maneuver: any) => {
                    const rollValues: any = {
                        mod_at: 0,
                        mod_vt: 0,
                        mod_dm: 0,
                        mod_energy: 0,
                        text_at: '',
                        text_vt: '',
                        text_dm: '',
                        text_energy: '',
                        schaden: '',
                        nodmg: { name: '', value: false },
                        damageType: 'PROFAN',
                    }
                    return helpers.handleModifications(
                        Object.values(maneuver.system.modifications).map((modification: any) => ({
                            modification,
                            manoever: maneuver,
                            check: true,
                        })),
                        rollValues,
                    )
                }

                const meleeResolution = resolveManeuver(melee)
                const rangedResolution = resolveManeuver(ranged)
                await helpers._applyDamageDirectly(target, 6, meleeResolution[11], false, {})
                await helpers._applyDamageDirectly(target, 6, rangedResolution[11], false, {})

                const originalWarn = ui.notifications.warn
                const warnings: string[] = []
                ui.notifications.warn = ((message: string) =>
                    warnings.push(message)) as typeof ui.notifications.warn
                try {
                    const withoutTrueDamage = JSON.parse(
                        game.settings.get('Ilaris', 'damageTypes'),
                    ).filter((type: any) => type.value !== 'TRUE_DAMAGE')
                    await game.settings.set(
                        'Ilaris',
                        'damageTypes',
                        JSON.stringify(withoutTrueDamage),
                    )
                    const fallbackResolution = resolveManeuver(melee)
                    await helpers._applyDamageDirectly(target, 6, fallbackResolution[11], false, {})

                    return {
                        meleeDamageType: meleeResolution[11],
                        rangedDamageType: rangedResolution[11],
                        woundsAfterBoth: target.system.gesundheit.wunden,
                        fallbackDamageType: fallbackResolution[11],
                        woundsAfterFallback: target.system.gesundheit.wunden,
                        warnings,
                        quickReferenceContent: quickReferencePage.text.content,
                    }
                } finally {
                    ui.notifications.warn = originalWarn
                }
            },
            { actorName: TARGET_ACTOR_NAME },
        )

        expect(result).toMatchObject({
            meleeDamageType: 'TRUE_DAMAGE',
            rangedDamageType: 'TRUE_DAMAGE',
            woundsAfterBoth: 2,
            fallbackDamageType: 'PROFAN',
            woundsAfterFallback: 2,
        })
        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0]).toContain('TRUE_DAMAGE')
        expect(result.quickReferenceContent).toContain('Schadenstyp ändern')
        expect(result.quickReferenceContent).toContain('TRUE_DAMAGE')
    })
})
