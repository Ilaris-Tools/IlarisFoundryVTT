import { expect, Locator, Page, test } from '@playwright/test'

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

const ACTOR_NAME = 'HatAlles'

const STYLE_CASES = [
    {
        styleName: 'Beidhändiger Kampf',
        expectedManeuver: 'Doppelangriff',
    },
    {
        styleName: 'Kraftvoller Kampf',
        expectedManeuver: 'Befreiungsschlag',
    },
    {
        styleName: 'Parierwaffenkampf',
        expectedManeuver: 'Riposte',
    },
    {
        styleName: 'Reiterkampf',
        expectedManeuver: 'Überrennen',
    },
    {
        styleName: 'Schildkampf',
        expectedManeuver: 'Schildwall',
    },
    {
        styleName: 'Schneller Kampf',
        expectedManeuver: 'Unterlaufen',
    },
] as const

const STYLE_MANEUVERS = STYLE_CASES.map((styleCase) => styleCase.expectedManeuver)

type StyleCase = (typeof STYLE_CASES)[number]

type PreparedStyleState = {
    mainWeaponName: string
    sideWeaponName: string | null
    mounted: boolean
}

async function prepareActorForStyle(
    page: Page,
    actorName: string,
    styleName: StyleCase['styleName'],
): Promise<PreparedStyleState> {
    const prepared = await page.evaluate(
        async ({ actorName: name, styleName: style }) => {
            const actor = game.actors?.getName(name)
            if (!actor) throw new Error(`Actor "${name}" not found`)

            const meleeWeapons = actor.items.filter((item: any) => item.type === 'nahkampfwaffe')
            if (meleeWeapons.length === 0) {
                throw new Error(`Actor "${name}" has no melee weapons`)
            }

            const getEigenschaftKeys = (weapon: any) => {
                const eigenschaften = weapon.system?.eigenschaften ?? []

                if (Array.isArray(eigenschaften)) {
                    return eigenschaften
                        .map((entry: any) => {
                            if (typeof entry === 'string') return entry
                            if (
                                entry &&
                                typeof entry === 'object' &&
                                typeof entry.key === 'string'
                            ) {
                                return entry.key
                            }
                            return ''
                        })
                        .filter((entry: string) => !!entry)
                        .map((entry: string) => entry.toLowerCase())
                }

                if (eigenschaften && typeof eigenschaften === 'object') {
                    return Object.entries(eigenschaften)
                        .filter(([, value]) => value === true)
                        .map(([key]) => key.toLowerCase())
                }

                return []
            }

            const hasEigenschaft = (weapon: any, key: string) =>
                getEigenschaftKeys(weapon).includes(key.toLowerCase())

            const isOneHanded = (weapon: any) => {
                const handsRequired =
                    weapon.system?.computed?.handsRequired ?? weapon.system?.handsRequired
                if (typeof handsRequired === 'number') return handsRequired <= 1
                return !hasEigenschaft(weapon, 'zweihändig')
            }

            const firstMatching = (
                predicate: (weapon: any) => boolean,
                excludeIds: string[] = [],
            ) => {
                return meleeWeapons.find(
                    (weapon: any) => predicate(weapon) && !excludeIds.includes(weapon.id),
                )
            }

            const genericOneHanded = () =>
                firstMatching(
                    (weapon) =>
                        isOneHanded(weapon) &&
                        !hasEigenschaft(weapon, 'schild') &&
                        !hasEigenschaft(weapon, 'parierwaffe') &&
                        !hasEigenschaft(weapon, 'reittier'),
                )

            const genericSingleWeapon = () =>
                firstMatching(
                    (weapon) =>
                        !hasEigenschaft(weapon, 'schild') &&
                        !hasEigenschaft(weapon, 'parierwaffe') &&
                        !hasEigenschaft(weapon, 'reittier'),
                ) ?? meleeWeapons[0]

            let mainWeapon: any | undefined
            let sideWeapon: any | undefined
            let mounted = false

            switch (style) {
                case 'Beidhändiger Kampf': {
                    mainWeapon =
                        genericOneHanded() ?? firstMatching((weapon) => isOneHanded(weapon))
                    if (!mainWeapon) {
                        throw new Error('No one-handed main weapon found for Beidhändiger Kampf')
                    }

                    sideWeapon =
                        firstMatching(
                            (weapon) => isOneHanded(weapon) && !hasEigenschaft(weapon, 'schild'),
                            [mainWeapon.id],
                        ) ?? firstMatching((weapon) => isOneHanded(weapon), [mainWeapon.id])

                    if (!sideWeapon) {
                        throw new Error('No side weapon found for Beidhändiger Kampf')
                    }
                    break
                }
                case 'Kraftvoller Kampf': {
                    mainWeapon = genericSingleWeapon()
                    break
                }
                case 'Parierwaffenkampf': {
                    sideWeapon = firstMatching((weapon) => hasEigenschaft(weapon, 'parierwaffe'))
                    if (!sideWeapon) {
                        throw new Error('No Parierwaffe found for Parierwaffenkampf')
                    }
                    mainWeapon =
                        genericOneHanded() ??
                        firstMatching((weapon) => isOneHanded(weapon), [sideWeapon.id]) ??
                        firstMatching(() => true, [sideWeapon.id])
                    if (!mainWeapon) {
                        throw new Error('No main weapon found for Parierwaffenkampf')
                    }
                    break
                }
                case 'Reiterkampf': {
                    mounted = true
                    mainWeapon =
                        firstMatching((weapon) => hasEigenschaft(weapon, 'reittier')) ??
                        genericSingleWeapon()
                    if (!mainWeapon) {
                        throw new Error('No main weapon found for Reiterkampf')
                    }
                    sideWeapon = firstMatching(
                        (weapon) => hasEigenschaft(weapon, 'reittier'),
                        [mainWeapon.id],
                    )
                    break
                }
                case 'Schildkampf': {
                    sideWeapon = firstMatching((weapon) => hasEigenschaft(weapon, 'schild'))
                    if (!sideWeapon) {
                        throw new Error('No shield weapon found for Schildkampf')
                    }
                    mainWeapon =
                        genericOneHanded() ??
                        firstMatching((weapon) => isOneHanded(weapon), [sideWeapon.id]) ??
                        firstMatching(() => true, [sideWeapon.id])
                    if (!mainWeapon) {
                        throw new Error('No main weapon found for Schildkampf')
                    }
                    break
                }
                case 'Schneller Kampf': {
                    mainWeapon = genericOneHanded() ?? genericSingleWeapon()
                    break
                }
                default:
                    throw new Error(`Unsupported style: ${style}`)
            }

            if (!mainWeapon) {
                throw new Error(`No main weapon selected for ${style}`)
            }

            await actor.update({
                'system.misc.selected_kampfstil': 'ohne',
                'system.misc.ist_beritten': mounted,
            })

            const weaponUpdates = meleeWeapons.map((weapon: any) => ({
                _id: weapon.id,
                system: {
                    hauptwaffe: weapon.id === mainWeapon.id,
                    nebenwaffe: !!sideWeapon && weapon.id === sideWeapon.id,
                },
            }))

            await actor.updateEmbeddedDocuments('Item', weaponUpdates)

            return {
                mainWeaponName: mainWeapon.name,
                sideWeaponName: sideWeapon?.name ?? null,
                mounted,
            }
        },
        { actorName, styleName },
    )

    await page.waitForFunction(
        ({ actorName: name, mainWeaponName, sideWeaponName, mounted }) => {
            const actor = game.actors?.getName(name)
            if (!actor) return false

            const meleeWeapons = actor.items.filter((item: any) => item.type === 'nahkampfwaffe')
            const mainWeapon = meleeWeapons.find((item: any) => item.name === mainWeaponName)
            const sideWeapon = sideWeaponName
                ? meleeWeapons.find((item: any) => item.name === sideWeaponName)
                : undefined

            const mainSelected = !!mainWeapon?.system?.hauptwaffe
            const sideSelected = sideWeaponName ? !!sideWeapon?.system?.nebenwaffe : true
            const noOtherSideWeapons = meleeWeapons.every(
                (item: any) => sideWeaponName || !item.system?.nebenwaffe,
            )

            return (
                actor.system?.misc?.selected_kampfstil === 'ohne' &&
                actor.system?.misc?.ist_beritten === mounted &&
                mainSelected &&
                sideSelected &&
                noOtherSideWeapons
            )
        },
        {
            actorName,
            mainWeaponName: prepared.mainWeaponName,
            sideWeaponName: prepared.sideWeaponName,
            mounted: prepared.mounted,
        },
        { timeout: 15000 },
    )

    return prepared as PreparedStyleState
}

async function expandManeuverSection(attackDialog: Locator) {
    const header = attackDialog.locator('.maneuver-header').first()
    const grid = attackDialog.locator('.maneuver-grid').first()

    await expect(header).toBeVisible({ timeout: 10000 })

    if (
        await grid.evaluate((element) => element.classList.contains('collapsed')).catch(() => true)
    ) {
        await header.click({ force: true })
    }

    const expanded = await grid
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(async () => {
            const className = await grid.getAttribute('class')
            return !className?.includes('collapsed')
        })
        .catch(() => false)

    if (!expanded) {
        await header.evaluate((element) => {
            element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        })
        await expect(grid).not.toHaveClass(/collapsed/, { timeout: 5000 })
        return
    }

    await expect(grid).not.toHaveClass(/collapsed/, { timeout: 5000 })
}

async function expectManeuverActive(attackDialog: Locator, maneuverName: string) {
    const maneuverItem = attackDialog
        .locator('.maneuver-item')
        .filter({ hasText: maneuverName })
        .first()
    await expect(maneuverItem).toBeVisible({ timeout: 10000 })

    const control = maneuverItem.locator('input, select').first()
    await expect(control).toBeEnabled({ timeout: 10000 })
}

async function expectManeuverUnavailableOrInactive(attackDialog: Locator, maneuverName: string) {
    const maneuverItems = attackDialog.locator('.maneuver-item').filter({ hasText: maneuverName })
    const count = await maneuverItems.count()
    if (count === 0) return

    const maneuverItem = maneuverItems.first()
    await expect(maneuverItem).toBeVisible({ timeout: 10000 })
    await expect(
        maneuverItem.locator('input, select').first(),
        `Manöver "${maneuverName}" sollte inaktiv sein, wenn es sichtbar ist`,
    ).toBeDisabled({ timeout: 10000 })
}

async function dismissAttackDialogs(page: Page) {
    const closeAttackDialogs = async () => {
        await page.evaluate(() => {
            const windows = Object.values((globalThis as any).ui?.windows ?? {})
            for (const app of windows) {
                const element = app?.element?.[0]
                if (element?.classList?.contains('angriff-dialog')) {
                    app.close()
                }
            }
        })
    }

    await closeAttackDialogs()

    const closed = await page
        .waitForFunction(
            () => {
                const windows = Object.values((globalThis as any).ui?.windows ?? {})
                return !windows.some((app: any) =>
                    app?.element?.[0]?.classList?.contains('angriff-dialog'),
                )
            },
            undefined,
            { timeout: 5000 },
        )
        .then(() => true)
        .catch(() => false)

    if (!closed) {
        await closeAttackDialogs()
        await page.waitForFunction(
            () => {
                const windows = Object.values((globalThis as any).ui?.windows ?? {})
                return !windows.some((app: any) =>
                    app?.element?.[0]?.classList?.contains('angriff-dialog'),
                )
            },
            undefined,
            { timeout: 10000 },
        )
    }
}

function getActorSheet(page: Page, actorName: string) {
    return page
        .locator('.window-app, .application')
        .filter({ hasText: actorName })
        .filter({ has: page.locator('select[name="system.misc.selected_kampfstil"]') })
        .last()
}

async function ensureActorSheetOpen(page: Page, actorName: string) {
    const actorSheet = getActorSheet(page, actorName)
    const isVisible = await actorSheet.isVisible().catch(() => false)
    if (isVisible) return actorSheet

    await openActorSheet(page, actorName)
    return getActorSheet(page, actorName)
}

async function runStyleCase(page: Page, styleCase: StyleCase) {
    await ensureActorSheetOpen(page, ACTOR_NAME)
    await dismissAttackDialogs(page)

    const preparedState = await prepareActorForStyle(page, ACTOR_NAME, styleCase.styleName)

    const currentActorWindow = getActorSheet(page, ACTOR_NAME)
    const kampfstilSelect = currentActorWindow.locator(
        'select[name="system.misc.selected_kampfstil"]',
    )
    const warningBanner = currentActorWindow.locator('.hero-kampf-alert-warning')

    await currentActorWindow.locator('nav [data-tab="kampf"]').click()
    await expect(kampfstilSelect).toBeVisible({ timeout: 10000 })
    await kampfstilSelect.selectOption(styleCase.styleName)

    await page.waitForFunction(
        ({ actorName: name, styleName }) => {
            const actor = game.actors?.getName(name)
            return actor?.system?.misc?.selected_kampfstil === styleName
        },
        { actorName: ACTOR_NAME, styleName: styleCase.styleName },
        { timeout: 15000 },
    )

    await expect(warningBanner).toHaveCount(0)

    await openMeleeAttackDialogForWeapon(currentActorWindow, preparedState.mainWeaponName)

    const attackDialog = page.locator('.application.angriff-dialog').last()
    await expect(attackDialog).toBeVisible({ timeout: 15000 })

    await expandManeuverSection(attackDialog)
    await expectManeuverActive(attackDialog, styleCase.expectedManeuver)

    const inactiveManeuvers = STYLE_MANEUVERS.filter(
        (maneuverName) => maneuverName !== styleCase.expectedManeuver,
    )

    for (const maneuverName of inactiveManeuvers) {
        await expectManeuverUnavailableOrInactive(attackDialog, maneuverName)
    }

    await dismissAttackDialogs(page)
}

test.describe('E2E-017 Kampfstile und Stil-Manöver im Kampfdialog', () => {
    let actorDefaultSnapshot: ActorDefaultSnapshot | null = null

    test.afterEach(async ({ page }) => {
        if (!actorDefaultSnapshot) return

        try {
            await restoreActorFromDefaultSnapshot(page, actorDefaultSnapshot)
        } finally {
            actorDefaultSnapshot = null
        }
    })

    for (const styleCase of STYLE_CASES) {
        test(`${styleCase.styleName}: ${styleCase.expectedManeuver} ist aktiv, andere Stil-Manöver sind inaktiv`, async ({
            page,
        }) => {
            await loginAndJoinWorld(page, foundryConfig)
            await clearChatLog(page)

            actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

            await runStyleCase(page, styleCase)
        })
    }

    test('Dropdown enthält alle erwarteten Kampfstile', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        const actorWindow = await ensureActorSheetOpen(page, ACTOR_NAME)
        await actorWindow.locator('nav [data-tab="kampf"]').click()

        const kampfstilSelect = actorWindow.locator('select[name="system.misc.selected_kampfstil"]')
        await expect(kampfstilSelect).toBeVisible({ timeout: 10000 })

        const optionTexts = await kampfstilSelect.locator('option').allTextContents()
        for (const styleCase of STYLE_CASES) {
            expect(optionTexts.map((text) => text.trim())).toContain(styleCase.styleName)
        }
    })

    test('Kompendium-Synchronisierung erhält die humanoide Zielauswahl für Parierwaffenkampf', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)
        actorDefaultSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        const originalHideSyncButton = await page.evaluate(() =>
            game.settings.get('Ilaris', 'hideSyncKampfstileButton'),
        )
        await page.evaluate(async () => {
            await game.settings.set('Ilaris', 'hideSyncKampfstileButton', false)
            game.actors?.getName('HatAlles')?.sheet?.render(true)
        })

        try {
            const preparedState = await prepareActorForStyle(page, ACTOR_NAME, 'Parierwaffenkampf')
            const actorWindow = await ensureActorSheetOpen(page, ACTOR_NAME)
            await actorWindow.locator('nav [data-tab="kampf"]').click()
            await actorWindow
                .locator('select[name="system.misc.selected_kampfstil"]')
                .selectOption('Parierwaffenkampf')

            await page.locator('.hero-sync-button-wrapper [data-action="syncItems"]').click()
            await page.waitForTimeout(500)

            await openMeleeAttackDialogForWeapon(actorWindow, preparedState.mainWeaponName)
            const attackDialog = page.locator('.application.angriff-dialog').last()
            await expect(attackDialog).toBeVisible({ timeout: 15000 })
            await expect(attackDialog.locator('input[id^="isHumanoid-"]')).toBeVisible()
        } finally {
            await page.evaluate(
                (value) => game.settings.set('Ilaris', 'hideSyncKampfstileButton', value),
                originalHideSyncButton,
            )
        }
    })
})
