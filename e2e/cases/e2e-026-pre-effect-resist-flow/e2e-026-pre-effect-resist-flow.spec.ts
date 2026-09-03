/**
 * E2E-026 – Pre-Effect: Resist Flow End-to-End
 *
 * @spec openspec/changes/add-pre-effect-e2e-tests/specs/pre-effect-e2e-tests/spec.md
 * @scenario Resist whisper sent to target
 * @scenario Resist button click opens FertigkeitDialog
 * @scenario Resist dialog displays correct Erschwernis
 *
 * Verifies the complete resist chain:
 *   1. Cast a spell with avoidTest → whisper ChatMessage with .resist-button
 *   2. Click .resist-button → FertigkeitDialog opens
 *   3. Dialog title contains "Widerstandsprobe"
 *   4. Erschwernis is displayed in the dialog
 *
 * Uses Ignifaxius. Compendium data has avoidTest.enabled=false, so the test
 * enables avoidTest (attribute-based) on the actor's spell before casting.
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    clickResistButton,
    foundryConfig,
    enableTargetSelectionForTest,
    loginAndJoinWorld,
    openActorSheet,
    openChatSidebar,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Ignifaxius'
const RESIST_ATTRIBUT = 'KO'
const RESIST_DIFFICULTY = 12

async function openResistDialog(page: any) {
    const actorWindow = await openActorSheet(page, ACTOR_NAME)
    await openSpellDialog(actorWindow, SPELL_NAME)

    const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
    await expect(spellDialog).toBeVisible({ timeout: 15000 })
    await spellDialog.locator('button[data-action="showNearby"]').click()
    const targetDialog = page.locator('.target-selection-dialog').last()
    await expect(targetDialog).toBeVisible({ timeout: 5000 })
    await targetDialog.locator('.target-sel-row').filter({ hasText: ACTOR_NAME }).first().click()
    await targetDialog.locator('button.submit').click()

    const neutralMod = await page.evaluate(
        ({ name, spellName }: { name: string; spellName: string }) => {
            const actor = game.actors.getName(name)
            const spell = actor?.items.find((item: any) => item.name?.includes(spellName))
            return -(spell?.system?.pw ?? 0)
        },
        { name: ACTOR_NAME, spellName: SPELL_NAME },
    )
    const modInput = spellDialog.locator('input[id^="modifikator-"]')
    await modInput.fill(String(neutralMod))
    await modInput.dispatchEvent('change')
    await page.evaluate(() => {
        CONFIG.Dice.randomUniform = () => 0.01
    })

    const beforeCount = await page.evaluate(() => game.messages.contents.length)
    const rollButton = spellDialog.locator(
        '.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
    )
    await rollButton.click()
    const chatIncreased = await page
        .waitForFunction(
            (baseline: number) => game.messages.contents.length > baseline,
            beforeCount,
            {
                timeout: 4000,
            },
        )
        .then(() => true)
        .catch(() => false)
    if (!chatIncreased) {
        await page.evaluate(() => {
            document
                .querySelector(
                    '.application.uebernatuerlich-dialog .modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
                )
                ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        })
    }

    await openChatSidebar(page)
    await page.waitForFunction(() => document.querySelectorAll('.resist-button').length > 0, {
        timeout: 20000,
    })
    await clickResistButton(page)
    const fertigkeitDialog = page.locator('.application.fertigkeit-dialog').last()
    await expect(fertigkeitDialog).toBeVisible({ timeout: 15000 })
    return fertigkeitDialog
}

async function resolveResist(page: any, success: boolean) {
    await page.evaluate((resistSuccess: boolean) => {
        const dialog = Array.from((foundry.applications as any).instances?.values() ?? []).find(
            (app: any) => app._resistContext,
        ) as any
        if (!dialog) throw new Error('Resist dialog context not found')
        Hooks.callAll('Ilaris.postSkillRoll', dialog, { rollResult: { success: resistSuccess } })
    }, success)
    await page.waitForFunction(
        () =>
            !Array.from((foundry.applications as any).instances?.values() ?? []).some(
                (app: any) => app._resistContext,
            ),
        undefined,
        { timeout: 10000 },
    )
}

test.describe('E2E-026 · Pre-Effect Resist Flow', () => {
    let snapshot: ActorDefaultSnapshot
    let targetSelectionSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot
    let initialEffectIds: string[]

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        targetSelectionSetting = await enableTargetSelectionForTest(page)
        snapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)
        initialEffectIds = await page.evaluate(
            (name) =>
                Array.from(game.actors.getName(name)?.effects ?? []).map(
                    (effect: any) => effect.id,
                ),
            ACTOR_NAME,
        )

        await page.evaluate(
            async ({ name, spellName, attribut, difficulty }) => {
                const actor = game.actors.getName(name)
                if (!actor) throw new Error(`Actor not found: ${name}`)

                await actor.update({
                    'system.abgeleitete.asp_stern': 50,
                    'system.gesundheit.wunden': 0,
                    'system.gesundheit.erschoepfung': 0,
                })

                // Compendium Ignifaxius has avoidTest.enabled=false. Enable it for this test
                // using an attribute-based resist so we don't depend on a specific skill name.
                const spell = actor.items.find((i: any) => i.name?.includes(spellName))
                if (!spell) throw new Error(`Spell not found on actor: ${spellName}`)

                const preEffects = foundry.utils.deepClone(spell.system?.preEffects ?? [])
                const list = Array.isArray(preEffects)
                    ? preEffects
                    : Object.values(preEffects as Record<string, unknown>)

                if (list.length === 0) {
                    list.push({
                        baseDuration: 0,
                        instant: true,
                        changes: [
                            {
                                key: 'system.gesundheit.wunden',
                                type: 'add',
                                value: '4W6',
                                damageType: 'FEUER',
                            },
                        ],
                        avoidTest: {
                            enabled: true,
                            fertigkeit: '',
                            attribut,
                            diminishedOnly: false,
                            resistDifficulty: difficulty,
                        },
                    })
                } else {
                    for (const pe of list as any[]) {
                        pe.instant = false
                        pe.baseDuration = 1
                        pe.changes = [
                            {
                                key: 'system.attribute.KO.pw',
                                type: 'add',
                                value: '5',
                                diminishedValue: '2',
                            },
                        ]
                        pe.avoidTest = {
                            ...(pe.avoidTest ?? {}),
                            enabled: true,
                            fertigkeit: '',
                            attribut,
                            diminishedOnly: false,
                            resistDifficulty: difficulty,
                        }
                        pe.resistanceOutcomes = {
                            failure: {
                                enabled: true,
                                changes: [],
                                ilarisModifiers: [],
                                marker: {
                                    enabled: true,
                                    id: 'handlungsunfaehig',
                                    label: 'Handlungsunfähig',
                                },
                                condition: { enabled: false, statusId: '' },
                            },
                            success: {
                                enabled: true,
                                changes: [],
                                ilarisModifiers: [
                                    {
                                        phase: 'roll',
                                        target: 'probe',
                                        value: '-4',
                                        stacking: 'strongest-supernatural',
                                        selector: {},
                                    },
                                ],
                                marker: { enabled: false, id: '', label: '' },
                                condition: { enabled: false, statusId: '' },
                            },
                        }
                    }
                }

                await spell.update({ 'system.preEffects': list })
            },
            {
                name: ACTOR_NAME,
                spellName: SPELL_NAME,
                attribut: RESIST_ATTRIBUT,
                difficulty: RESIST_DIFFICULTY,
            },
        )

        await clearChatLog(page)
        await openChatSidebar(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(() => {
                delete CONFIG.Dice.randomUniform
            })
            .catch(() => {})
        await restoreActorFromDefaultSnapshot(page, snapshot).catch(() => {})
        await page
            .evaluate(
                async ({ name, effectIds }) => {
                    const actor = game.actors.getName(name)
                    const createdEffectIds = Array.from(actor?.effects ?? [])
                        .filter((effect: any) => !effectIds.includes(effect.id))
                        .map((effect: any) => effect.id)
                    if (createdEffectIds.length > 0) {
                        await actor?.deleteEmbeddedDocuments('ActiveEffect', createdEffectIds)
                    }
                },
                { name: ACTOR_NAME, effectIds: initialEffectIds },
            )
            .catch(() => {})
        await restoreFoundrySetting(page, targetSelectionSetting).catch(() => {})
        await clearChatLog(page).catch(() => {})
    })

    test('Resist whisper is sent and FertigkeitDialog opens with correct parameters', async ({
        page,
    }) => {
        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, SPELL_NAME)

        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        // Click "Andere Akteure" to select target
        await spellDialog.locator('button[data-action="showNearby"]').click()
        const targetDialog = page.locator('.target-selection-dialog').last()
        await expect(targetDialog).toBeVisible({ timeout: 5000 })
        const targetRow = targetDialog
            .locator('.target-sel-row')
            .filter({ hasText: ACTOR_NAME })
            .first()
        await targetRow.click()
        await targetDialog.locator('button.submit').click()

        // Set neutralMod = -PW for raw d20
        const neutralMod = await page.evaluate(
            ({ name, spellName }) => {
                const actor = game.actors.getName(name)
                const spell = actor?.items.find((i: any) => i.name?.includes(spellName))
                const pw = spell?.system?.pw ?? 0
                return -pw
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )

        const modInput = spellDialog.locator('input[id^="modifikator-"]')
        await modInput.fill(String(neutralMod))
        await modInput.dispatchEvent('change')

        // Force spell success (d20=20)
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.01
        })

        const beforeCount = await page.evaluate(() => game.messages.contents.length)

        // Click roll button
        const rollButton = spellDialog.locator(
            '.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
        )
        await rollButton.click()

        // Wait for chat message with fallback for flaky AppV2 clicks
        const chatIncreased = await page
            .waitForFunction((baseline) => game.messages.contents.length > baseline, beforeCount, {
                timeout: 4000,
            })
            .then(() => true)
            .catch(() => false)

        if (!chatIncreased) {
            await page.evaluate(() => {
                const node = document.querySelector(
                    '.application.uebernatuerlich-dialog .modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
                )
                node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
            })
        }

        // Resist prompt is fire-and-forget after the roll message — open chat and wait for the button.
        await openChatSidebar(page)
        await page.waitForFunction(() => document.querySelectorAll('.resist-button').length > 0, {
            timeout: 20000,
        })

        // Click resist button
        await clickResistButton(page)

        // FertigkeitDialog opens
        const fertigkeitDialog = page.locator('.application.fertigkeit-dialog').last()
        await expect(fertigkeitDialog).toBeVisible({ timeout: 15000 })
        const dialogTitle = await fertigkeitDialog.locator('.window-title').textContent()
        expect(dialogTitle).toContain('Widerstandsprobe')
        await expect(fertigkeitDialog).toContainText('Erschwernis')
        await expect(fertigkeitDialog).toContainText(String(RESIST_DIFFICULTY))
    })

    test('tied automatic casting rolls immediately without a Fertigkeit choice', async ({
        page,
    }) => {
        const tiedSkills = await page.evaluate(
            async ({ name, spellName }) => {
                const actor = game.actors.getName(name)
                const skills = Array.from(actor?.uebernatuerlich?.fertigkeiten ?? []) as any[]
                const groups = new Map<number, string[]>()
                for (const skill of skills) {
                    const pw = Number(skill.system?.pw ?? 0)
                    const group = groups.get(pw) ?? []
                    group.push(skill.name)
                    groups.set(pw, group)
                }
                const pair = Array.from(groups.values())
                    .find((group) => group.length >= 2)
                    ?.slice(0, 2)
                if (!pair) return []
                const spell = actor?.items.find((item: any) => item.name?.includes(spellName))
                await spell?.update({
                    'system.fertigkeit_ausgewaehlt': 'auto',
                    'system.fertigkeiten': pair.join(', '),
                })
                return pair
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )
        if (tiedSkills.length < 2) test.skip(true, 'No tied supernatural skills on the E2E actor')

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, SPELL_NAME)
        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog.locator('[name="ilaris-cast-skill"]')).toHaveCount(0)
        await expect(spellDialog.locator('[data-action="angreifen"]')).toBeVisible()
        await spellDialog.screenshot({ path: 'test-results/tied-cast-skill-resolved.png' })
    })

    test('failed resist visibly applies only the configured marker outcome', async ({ page }) => {
        await openResistDialog(page)
        // The player opened the real resistance dialog. This deterministic hook dispatch is
        // limited to choosing the branch without relying on random dice during E2E.
        await resolveResist(page, false)
        await expect
            .poll(() =>
                page.evaluate((name) => {
                    const effect = Array.from(game.actors.getName(name)?.effects ?? []).find(
                        (entry: any) => entry.flags.ilaris?.resistanceOutcome === 'failure',
                    ) as any
                    return effect?.name ?? ''
                }, ACTOR_NAME),
            )
            .toContain('Handlungsunfähig — Ignifaxius')

        const provenance = await page.evaluate((name) => {
            const effect = Array.from(game.actors.getName(name)?.effects ?? []).find(
                (entry: any) => entry.flags.ilaris?.resistanceOutcome === 'failure',
            ) as any
            return {
                changes: effect?.changes ?? [],
                sourceItemUuid: effect?.flags.ilaris?.sourceItemUuid,
                spellUuid: effect?.flags.ilaris?.spellUuid,
                castSkill: effect?.flags.ilaris?.castSkill,
                markerId: effect?.flags.ilaris?.markerId,
            }
        }, ACTOR_NAME)
        expect(provenance).toMatchObject({
            changes: [],
            markerId: 'handlungsunfaehig',
        })
        expect(provenance.sourceItemUuid).toBe(provenance.spellUuid)
        expect(provenance.castSkill).not.toBe('auto')

        // The spell and resistance dialogs completed their visible player flow above.
        // Close only those transient apps before inspecting the actor sheet behind them.
        await page.evaluate(async () => {
            const dialogs = Array.from(
                (foundry.applications as any).instances?.values() ?? [],
            ).filter(
                (app: any) =>
                    app.element?.classList?.contains('uebernatuerlich-dialog') ||
                    app.element?.classList?.contains('fertigkeit-dialog'),
            )
            await Promise.all(dialogs.map((app: any) => app.close()))
        })
        const effectId = await page.evaluate(
            (name) =>
                Array.from(game.actors.getName(name)?.effects ?? []).find(
                    (entry: any) => entry.flags.ilaris?.resistanceOutcome === 'failure',
                )?.id,
            ACTOR_NAME,
        )
        const actorWindow = page.locator('form.application.sheet.ilaris.actor').last()
        await expect(actorWindow).toBeVisible()
        await actorWindow.locator('nav [data-tab="effekte"]').click()
        const row = actorWindow.locator(
            `section.tab.effekte a[data-action="itemEdit"][data-itemid="${effectId}"]`,
        )
        await expect(row).toContainText('Handlungsunfähig — Ignifaxius')
        await actorWindow.screenshot({ path: 'test-results/resistance-outcome-effect-row.png' })
    })

    test('successful resist applies only the configured -4 outcome', async ({ page }) => {
        await openResistDialog(page)
        // See the failed branch above: the hook is a deterministic result selection only.
        await resolveResist(page, true)
        await expect
            .poll(() =>
                page.evaluate(
                    (name) =>
                        Array.from(game.actors.getName(name)?.effects ?? []).some(
                            (entry: any) => entry.flags.ilaris?.resistanceOutcome === 'success',
                        ),
                    ACTOR_NAME,
                ),
            )
            .toBe(true)
        const outcome = await page.evaluate((name) => {
            const effect = Array.from(game.actors.getName(name)?.effects ?? []).find(
                (entry: any) => entry.flags.ilaris?.resistanceOutcome === 'success',
            ) as any
            return {
                changes: effect?.changes,
                modifiers: effect?.system.ilarisModifiers,
                outcome: effect?.flags.ilaris?.resistanceOutcome,
            }
        }, ACTOR_NAME)
        expect(outcome).toMatchObject({
            changes: [],
            modifiers: [expect.objectContaining({ target: 'probe', value: '-4' })],
            outcome: 'success',
        })
    })

    test('preselects a configured profane talent owned by the target', async ({ page }) => {
        const configured = await page.evaluate(
            async ({ name, spellName, difficulty }) => {
                const actor = game.actors.getName(name)
                const skill = actor?.profan?.fertigkeiten?.find(
                    (entry: any) => entry.system.talente?.length,
                )
                const talent = skill?.system.talente?.[0]
                const spell = actor?.items.find((item: any) => item.name?.includes(spellName))
                if (!skill || !talent || !spell)
                    throw new Error('Missing profane skill, talent, or spell')
                const preEffects = foundry.utils.deepClone(spell.system.preEffects ?? [])
                for (const preEffect of Object.values(preEffects) as any[]) {
                    preEffect.avoidTest = {
                        ...(preEffect.avoidTest ?? {}),
                        enabled: true,
                        fertigkeit: skill.name,
                        talent: talent.name,
                        attribut: '',
                        diminishedOnly: false,
                        resistDifficulty: difficulty,
                    }
                }
                await spell.update({ 'system.preEffects': preEffects })
                return { skill: skill.name, talent: talent.name }
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME, difficulty: RESIST_DIFFICULTY },
        )

        const dialog = await openResistDialog(page)
        await expect(dialog.locator('select[id^="talent-"] option:checked')).toHaveText(
            configured.talent,
        )
        await expect(dialog).toContainText(configured.skill)
    })

    test('uses ohne Talent when the target lacks the configured talent', async ({ page }) => {
        await page.evaluate(
            async ({ name, spellName, difficulty }) => {
                const actor = game.actors.getName(name)
                const skill = actor?.profan?.fertigkeiten?.find(
                    (entry: any) => entry.system.talente?.length,
                )
                const spell = actor?.items.find((item: any) => item.name?.includes(spellName))
                if (!skill || !spell) throw new Error('Missing profane skill or spell')
                const preEffects = foundry.utils.deepClone(spell.system.preEffects ?? [])
                for (const preEffect of Object.values(preEffects) as any[]) {
                    preEffect.avoidTest = {
                        ...(preEffect.avoidTest ?? {}),
                        enabled: true,
                        fertigkeit: skill.name,
                        talent: 'Nicht vorhandenes Talent',
                        attribut: '',
                        diminishedOnly: false,
                        resistDifficulty: difficulty,
                    }
                }
                await spell.update({ 'system.preEffects': preEffects })
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME, difficulty: RESIST_DIFFICULTY },
        )

        const dialog = await openResistDialog(page)
        await expect(dialog.locator('select[id^="talent-"]')).toHaveValue('-2')
    })
})
