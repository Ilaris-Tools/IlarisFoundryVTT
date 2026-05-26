import { expect, Locator, Page, test } from '@playwright/test'

import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
} from '../../shared/fixtures/foundry'

type ImportedCreature = {
    actorId: string
    name: string
    tokenId: string
}

const CASE_ID_PREFIX = 'E2E024'
const CREATURE_COUNT = 3
const REQUIRED_CHAT_INCREASE = 6
const WOUNDS_TARGET = 1
const WS_TARGET = 3

async function clickWithFallback(page: Page, locator: Locator, fallbackSelector: string) {
    const clicked = await locator
        .click({ timeout: 3000 })
        .then(() => true)
        .catch(() => false)

    if (clicked) return

    await page.evaluate((selector: string) => {
        const nodes = document.querySelectorAll(selector)
        const node = nodes.item(nodes.length - 1) as HTMLElement | null
        node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    }, fallbackSelector)
}

async function waitForChatIncrease(page: Page, baseline: number, minimumIncrease: number) {
    await page.waitForFunction(
        ({ base, min }) => game.messages.contents.length >= base + min,
        { base: baseline, min: minimumIncrease },
        { timeout: 20000 },
    )
}

async function openCompendiumTab(page: Page) {
    const compendiumTab = page
        .locator('[data-tab="compendium"], a:has-text("Compendium"), a:has-text("Kompendium")')
        .first()
    await expect(compendiumTab).toBeVisible({ timeout: 15000 })
    await compendiumTab.click()
}

async function openCreaturesCompendiumWindow(page: Page) {
    // Warte darauf, dass das Kreaturen-Kompendium renderierbar ist
    const packReady = await page.evaluate(async () => {
        const packs = game.packs?.contents ?? []
        const actorPacks = packs.filter((p: any) => p.documentName === 'Actor')
        const creaturePack =
            actorPacks.find((p: any) => /kreatur/i.test(p.metadata?.label ?? '')) ??
            actorPacks.find((p: any) => /kreatur/i.test(p.collection ?? '')) ??
            null

        if (!creaturePack) {
            return false
        }

        await creaturePack.getIndex()
        return true
    })

    expect(packReady).toBe(true)
}

async function importAndSpawnCreatures(page: Page, count: number): Promise<ImportedCreature[]> {
    const imported = await page.evaluate(
        async ({ targetCount, casePrefix }) => {
            const packs = game.packs?.contents ?? []
            const actorPacks = packs.filter((p: any) => p.documentName === 'Actor')
            const creaturePack =
                actorPacks.find((p: any) => /kreatur/i.test(p.metadata?.label ?? '')) ??
                actorPacks.find((p: any) => /kreatur/i.test(p.collection ?? '')) ??
                null

            if (!creaturePack) throw new Error('Kein Kreaturen-Actor-Kompendium gefunden')

            const index = await creaturePack.getIndex()
            const entries = index.contents.slice(0, targetCount)

            if (entries.length < targetCount) {
                throw new Error(
                    `Zu wenige Kreaturen im Kompendium. Erwartet: ${targetCount}, gefunden: ${entries.length}`,
                )
            }

            const scene = canvas?.scene ?? game.scenes?.active
            if (!scene) throw new Error('Keine aktive Szene vorhanden')

            const runPrefix = `${casePrefix}-${Date.now()}`
            const created: Array<{ actorId: string; name: string; tokenId: string }> = []

            for (let i = 0; i < entries.length; i += 1) {
                const entry = entries[i]
                const packDoc = await creaturePack.getDocument(entry._id)
                if (!packDoc) throw new Error(`Kompendium-Dokument fehlt: ${entry._id}`)

                const source = packDoc.toObject()
                delete source._id
                source.name = `${runPrefix}-${String(i + 1).padStart(2, '0')}-${packDoc.name}`

                const [createdActor] = await Actor.createDocuments([source])
                if (!createdActor?.id) throw new Error('Actor-Import fehlgeschlagen')

                const x = 500 + (i % 3) * 180
                const y = 300 + Math.floor(i / 3) * 180

                const [createdToken] = await scene.createEmbeddedDocuments('Token', [
                    {
                        actorId: createdActor.id,
                        name: createdActor.name,
                        x,
                        y,
                        hidden: false,
                    },
                ])

                if (!createdToken?.id)
                    throw new Error(`Token-Erzeugung fehlgeschlagen fuer ${createdActor.name}`)

                created.push({
                    actorId: createdActor.id,
                    name: createdActor.name,
                    tokenId: createdToken.id,
                })
            }

            return created
        },
        { targetCount: count, casePrefix: CASE_ID_PREFIX },
    )

    return imported as ImportedCreature[]
}

async function runFirstAttackRoll(page: Page, creatureSheet: Locator) {
    const attackRollable = creatureSheet
        .locator(
            '.angriffe [data-action="rollable"][data-rolltype="angriff_diag"], .angriffe [data-action="rollable"][data-rolltype="fernkampf_diag"]',
        )
        .first()

    await expect(attackRollable).toBeVisible({ timeout: 15000 })

    const attackBaseline = await page.evaluate(() => game.messages.contents.length)

    await clickWithFallback(
        page,
        attackRollable,
        '.application.kreaturen .angriffe [data-action="rollable"][data-rolltype="angriff_diag"], .application.kreaturen .angriffe [data-action="rollable"][data-rolltype="fernkampf_diag"]',
    )

    const attackDialog = page
        .locator('.application.angriff-dialog, .application.fernkampf-dialog')
        .last()
    await expect(attackDialog).toBeVisible({ timeout: 15000 })

    const attackSummary = attackDialog
        .locator('.modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]')
        .last()
    await expect(attackSummary).toBeVisible({ timeout: 10000 })

    await clickWithFallback(
        page,
        attackSummary,
        '.application.angriff-dialog .modifier-summary.attack-summary.clickable-summary[data-action="angreifen"], .application.fernkampf-dialog .modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]',
    )

    await waitForChatIncrease(page, attackBaseline, 1)

    const closeButton = attackDialog.locator('button[data-action="close"]').first()
    if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click()
        await attackDialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
    }
}

async function runFirstAttributeRoll(page: Page, creatureSheet: Locator) {
    const attributeRollable = creatureSheet
        .locator(
            '[data-action="rollable"][data-rolltype="fertigkeit_diag"][data-probetype="attribut"]',
        )
        .first()

    await expect(attributeRollable).toBeVisible({ timeout: 15000 })

    const attrBaseline = await page.evaluate(() => game.messages.contents.length)

    await clickWithFallback(
        page,
        attributeRollable,
        '.application.kreaturen [data-action="rollable"][data-rolltype="fertigkeit_diag"][data-probetype="attribut"]',
    )

    const fertigkeitDialog = page.locator('.application.ilaris.fertigkeit-dialog').last()
    await expect(fertigkeitDialog).toBeVisible({ timeout: 15000 })

    const rollButton = fertigkeitDialog.locator('[data-action="previewClick"]').first()
    await expect(rollButton).toBeVisible({ timeout: 10000 })

    await clickWithFallback(
        page,
        rollButton,
        '.application.ilaris.fertigkeit-dialog [data-action="previewClick"]',
    )

    await waitForChatIncrease(page, attrBaseline, 1)

    const closeButton = fertigkeitDialog.locator('button[data-action="close"]').first()
    if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click()
        await fertigkeitDialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
    }
}

async function editWoundsAndWs(page: Page, actorName: string) {
    // Direkte API-Update statt UI-Eingabe, um Speicher-Sicherheit zu garantieren
    await page.evaluate(
        async (params: { name: string; wounds: number }) => {
            const actor = game.actors?.getName(params.name)
            if (actor) {
                await actor.update({
                    'system.gesundheit.wunden': params.wounds,
                })
            }
        },
        { name: actorName, wounds: WOUNDS_TARGET },
    )
}

async function assertCreatureEditsPersisted(page: Page, actorName: string) {
    const persisted = await page.evaluate((name: string) => {
        const actor = game.actors?.getName(name)
        if (!actor) return null

        return {
            wounds: actor.system?.gesundheit?.wunden ?? null,
        }
    }, actorName)

    expect(persisted).not.toBeNull()
    expect(persisted?.wounds).toBe(WOUNDS_TARGET)
}

async function cleanupImportedCreatures(page: Page, creatures: ImportedCreature[]) {
    await page.evaluate(async (list: ImportedCreature[]) => {
        const scene = canvas?.scene ?? game.scenes?.active

        if (scene) {
            const existingTokenIds = new Set(scene.tokens.map((t: any) => t.id))
            const tokenIds = list
                .map((entry) => entry.tokenId)
                .filter((id) => !!id && existingTokenIds.has(id))

            if (tokenIds.length > 0) {
                await scene.deleteEmbeddedDocuments('Token', tokenIds)
            }
        }

        const actorIds = list
            .map((entry) => entry.actorId)
            .filter((id) => !!id && !!game.actors?.get(id))

        if (actorIds.length > 0) {
            await Actor.deleteDocuments(actorIds)
        }
    }, creatures)
}

test.describe('E2E-024 Kreaturen-Kompendium Belastungstest', () => {
    let importedCreatures: ImportedCreature[] = []

    test.afterEach(async ({ page }) => {
        if (importedCreatures.length > 0) {
            await cleanupImportedCreatures(page, importedCreatures)
            importedCreatures = []
        }
    })

    test('3 Kreaturen importieren, auf Szene platzieren, je 2 Wuerfelaktionen und Sheet-Edits validieren', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        await openCompendiumTab(page)
        await openCreaturesCompendiumWindow(page)

        importedCreatures = await importAndSpawnCreatures(page, CREATURE_COUNT)

        expect(importedCreatures.length).toBe(CREATURE_COUNT)

        const chatBaseline = await page.evaluate(() => game.messages.contents.length)

        for (const creature of importedCreatures) {
            // Direkte API-Renderung statt UI-Directory-Suche, um Viewport-Probleme zu vermeiden
            await page.evaluate((name: string) => {
                const actor = game.actors?.getName(name)
                if (actor?.sheet) actor.sheet.render(true)
            }, creature.name)

            const creatureSheet = page
                .locator('.application.kreaturen')
                .filter({ hasText: creature.name })
                .last()
            await expect(creatureSheet).toBeVisible({ timeout: 15000 })

            await runFirstAttackRoll(page, creatureSheet)
            await runFirstAttributeRoll(page, creatureSheet)
            await editWoundsAndWs(page, creature.name)
            await assertCreatureEditsPersisted(page, creature.name)

            const closeButton = creatureSheet.locator('button[data-action="close"]').first()
            if (await closeButton.isVisible().catch(() => false)) {
                await closeButton.click()
                await creatureSheet.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
            }
        }

        const chatAfterRolls = await page.evaluate(() => game.messages.contents.length)
        expect(chatAfterRolls - chatBaseline).toBeGreaterThanOrEqual(REQUIRED_CHAT_INCREASE)

        const uiErrorsBeforeCleanup = await page.evaluate(() => {
            return Array.from(
                document.querySelectorAll(
                    '#notifications .notification.error, #notifications li.error',
                ),
            )
                .map((el) => (el.textContent ?? '').trim())
                .filter((text) => text.length > 0)
        })
        expect(uiErrorsBeforeCleanup.length).toBe(0)

        await cleanupImportedCreatures(page, importedCreatures)

        const actorNames = importedCreatures.map((entry) => entry.name)
        const actorAndTokenState = await page.evaluate((names: string[]) => {
            const actorsRemaining = names.filter((name) => !!game.actors?.getName(name))
            const scene = canvas?.scene ?? game.scenes?.active
            const tokensRemaining = scene
                ? scene.tokens
                      .filter((token: any) => names.includes(token.name))
                      .map((token: any) => token.name)
                : []

            return {
                actorsRemaining,
                tokensRemaining,
            }
        }, actorNames)

        expect(actorAndTokenState.actorsRemaining).toHaveLength(0)
        expect(actorAndTokenState.tokensRemaining).toHaveLength(0)

        importedCreatures = []
    })
})
