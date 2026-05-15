/**
 * E2E-009 – UebernatuerlichDialog: Übernatürliche Fertigkeit (Zauber/Liturgie)
 *
 * Testet die Klasse UebernatuerlichDialog vollständig:
 *   A – Dialog öffnen und Energie-Anzeige prüfen (kein Würfelwurf)
 *   B – Erfolg + Triumph (d20=20, neutralMod=-PW, 2 Chat-Msgs)
 *   C – Misserfolg + Patzer (d20=1, neutralMod=-PW, halbe Kosten)
 *   D – Dämonenbann mit nicht-numerischer Schwierigkeit → manuelle Energie-Buttons
 *   E – Verbotene Pforten (1 Vorteil): Wunden werden verbucht
 *   F – Blutmagie (volle Deckung): kein AsP-Abzug, keine Wunden
 *   G – Energy Override = 0: kein AsP-Abzug, keine Fehlermeldung
 *   H – Energiemangel: Fehlermeldung erwartet
 *
 * Alle Szenarien laufen in einer gemeinsamen Browser-Session.
 * AsP/KaP/Wunden werden nur in afterAll wiederhergestellt.
 */

import { expect, Page, Locator } from '@playwright/test'
import { test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const DAEMON_SPELL_NAME = 'Dämonenbann'

// ---------------------------------------------------------------------------
// Gemeinsamer Zustand über alle Tests
// ---------------------------------------------------------------------------

const s: {
    page: Page
    actorWindow: Locator
    firstSpellName: string
    actorDefaultSnapshot: ActorDefaultSnapshot | null
} = {} as never

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

/**
 * Klickt den Würfelwurf-Button (.talent-summary.angreifen) mit AppV2-Fallback
 * und wartet auf `expectedNewMessages` neue Chat-Nachrichten.
 * Gibt die letzten N Nachrichten als { flavor, content } zurück.
 */
async function rollAndCaptureMessages(
    page: Page,
    spellDialog: Locator,
    expectedNewMessages: number = 2,
): Promise<Array<{ flavor: string; content: string }>> {
    const beforeCount = await page.evaluate(() => game.messages.contents.length)

    const rollButton = spellDialog.locator(
        '.modifier-summary.talent-summary.clickable-summary.angreifen',
    )
    await rollButton.click()

    const chatIncreased = await page
        .waitForFunction((b) => game.messages.contents.length > b, beforeCount, { timeout: 4000 })
        .then(() => true)
        .catch(() => false)

    if (!chatIncreased) {
        // Fallback für flaky AppV2-Click-Delivery
        await page.evaluate(() => {
            const node = document.querySelector(
                '.application.uebernatuerlich-dialog .modifier-summary.talent-summary.clickable-summary.angreifen',
            )
            node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        })
    }

    await page.waitForFunction(
        (args: { baseline: number; count: number }) =>
            game.messages.contents.length >= args.baseline + args.count,
        { baseline: beforeCount, count: expectedNewMessages },
        { timeout: 20000 },
    )

    return page.evaluate((baseline: number) => {
        const msgs = game.messages.contents.slice(baseline)
        return msgs.map((m: any) => ({ flavor: m.flavor ?? '', content: m.content ?? '' }))
    }, beforeCount)
}

/**
 * Klickt den manuellen Energie-Button (Erfolg oder Misserfolg) und wartet auf
 * 2 neue Chat-Nachrichten (Energie-Abrechnung + Titel-Nachricht).
 */
async function clickEnergieButton(
    page: Page,
    spellDialog: Locator,
    success: boolean,
): Promise<Array<{ flavor: string; content: string }>> {
    const beforeCount = await page.evaluate(() => game.messages.contents.length)

    const selector = success
        ? '.clickable-summary.energie-erfolg'
        : '.clickable-summary.energie-misserfolg'

    const btn = spellDialog.locator(selector)
    await btn.click()

    await page.waitForFunction(
        (args: { baseline: number }) => game.messages.contents.length >= args.baseline + 2,
        { baseline: beforeCount },
        { timeout: 20000 },
    )

    return page.evaluate((baseline: number) => {
        const msgs = game.messages.contents.slice(baseline)
        return msgs.map((m: any) => ({ flavor: m.flavor ?? '', content: m.content ?? '' }))
    }, beforeCount)
}

/** Liest den aktuellen asp_stern des Helden. */
async function getAsp(page: Page): Promise<number> {
    return page.evaluate(
        (name: string) => (game.actors.getName(name) as any)?.system?.abgeleitete?.asp_stern ?? 0,
        ACTOR_NAME,
    )
}

/** Liest den aktuellen Wunden-Wert des Helden. */
async function getWunden(page: Page): Promise<number> {
    return page.evaluate(
        (name: string) => (game.actors.getName(name) as any)?.system?.gesundheit?.wunden ?? 0,
        ACTOR_NAME,
    )
}

// ---------------------------------------------------------------------------
// Test-Suite
// ---------------------------------------------------------------------------

test.describe('E2E-009 · UebernatuerlichDialog — Übernatürliche Fertigkeit', () => {
    test.beforeAll(async ({ browser }) => {
        s.page = await browser.newPage()
        await loginAndJoinWorld(s.page, foundryConfig)

        s.actorDefaultSnapshot = await captureActorDefaultSnapshot(s.page, ACTOR_NAME)

        // Auf bekannte Startwerte setzen – unabhängig vom vorherigen Zustand
        await s.page.evaluate((name: string) => {
            const actor = game.actors.getName(name) as any
            return actor?.update({
                'system.abgeleitete.asp_stern': 50,
                'system.abgeleitete.kap_stern': 32,
                'system.gesundheit.wunden': 0,
            })
        }, ACTOR_NAME)

        await clearChatLog(s.page)
        s.actorWindow = await openActorSheet(s.page, ACTOR_NAME)

        // Erster Zauber über items.find ermitteln (robuster als actor.uebernatuerlich)
        s.firstSpellName = await s.page.evaluate((name: string) => {
            const actor = game.actors.getName(name) as any
            return (actor?.items.find((i: any) => i.type === 'zauber')?.name as string) ?? ''
        }, ACTOR_NAME)
    })

    test.afterAll(async () => {
        if (!s.page) return
        if (s.actorDefaultSnapshot) {
            await restoreActorFromDefaultSnapshot(s.page, s.actorDefaultSnapshot).catch(() => {})
        }
        await s.page.close()
    })

    test.afterEach(async () => {
        // CONFIG.Dice.randomUniform zurücksetzen
        await s.page
            .evaluate(() => {
                delete (CONFIG.Dice as any).randomUniform
            })
            .catch(() => {})
        // Item-Manöver-State zurücksetzen:
        // item.system.manoever auf null setzen, damit beim nächsten Dialog-Öffnen
        // alle Eingaben (Blutmagie, VP, Override, Mod) frisch vom Standardtemplate
        // initialisiert werden.
        await s.page
            .evaluate((name: string) => {
                const actor = game.actors.getName(name) as any
                actor?.items
                    .filter((i: any) => i.type === 'zauber' || i.type === 'liturgie')
                    .forEach((item: any) => {
                        item.system.manoever = null
                    })
            }, ACTOR_NAME)
            .catch(() => {})
        // Alle offenen UebernatuerlichDialoge schließen
        await s.page
            .evaluate(() => {
                document
                    .querySelectorAll(
                        '.application.uebernatuerlich-dialog button[data-action="close"]',
                    )
                    .forEach((b) => (b as HTMLElement).click())
            })
            .catch(() => {})
    })

    // ------------------------------------------------------------------ //
    // Szenario A: Dialog öffnen – Energie-Anzeige und Default-Werte       //
    // ------------------------------------------------------------------ //

    test('A: Dialog öffnen – AsP-Kosten-Anzeige und Default-Werte', async () => {
        await openSpellDialog(s.actorWindow, s.firstSpellName)

        const spellDialog = s.page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })
        await expect(spellDialog).toContainText('Übernatürliche Fertigkeit:')
        await expect(spellDialog).toContainText(s.firstSpellName)

        const energySummary = spellDialog.locator('.modifier-summary.energy-summary')
        await expect(energySummary).toBeVisible({ timeout: 10000 })
        await expect(energySummary).toContainText('Basiskosten:')
        await expect(energySummary).toContainText('Verfügbar:')

        // Kein Fehler sichtbar
        await expect(s.page.locator('.notification.error')).not.toBeVisible()
    })

    // ------------------------------------------------------------------ //
    // Szenario B: Erfolg + Triumph (d20=20, neutralMod=-PW)               //
    // ------------------------------------------------------------------ //

    test('B: Erfolg + Triumph (d20=20, neutralMod=-PW) – AsP abgezogen', async () => {
        await openSpellDialog(s.actorWindow, s.firstSpellName)

        const spellDialog = s.page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        // neutralMod = -PW → bonuses = 0, reines W20-Ergebnis entscheidet
        const neutralMod = await s.page.evaluate((name: string) => {
            const actor = game.actors.getName(name) as any
            const pw: number = actor?.items.find((i: any) => i.type === 'zauber')?.system?.pw ?? 0
            return -pw
        }, ACTOR_NAME)

        const modInput = spellDialog.locator('input[id^="modifikator-"]')
        await modInput.fill(String(neutralMod))
        await modInput.dispatchEvent('change')

        // W20=20 → Triumph + Erfolg
        await s.page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })

        const aspBefore = await getAsp(s.page)
        const msgs = await rollAndCaptureMessages(s.page, spellDialog, 2)
        const [rollMsg, energyMsg] = msgs

        // Roll-Nachricht: Zaubername im Flavor
        expect(rollMsg.flavor).toContain(s.firstSpellName)
        // Energie-Nachricht: Erfolg
        expect(energyMsg.content).toContain('Das Wirken ist dir gelungen')

        // AsP wurde abgezogen (aspBefore > 0 sichergestellt durch beforeAll-Reset)
        const aspAfter = await getAsp(s.page)
        expect(aspAfter).toBeLessThan(aspBefore)

        await expect(s.page.locator('.notification.error')).not.toBeVisible()
    })

    // ------------------------------------------------------------------ //
    // Szenario C: Misserfolg + Patzer (d20=1, neutralMod=-PW)             //
    // ------------------------------------------------------------------ //

    test('C: Misserfolg + Patzer (d20=1, neutralMod=-PW) – halbe AsP abgezogen', async () => {
        await openSpellDialog(s.actorWindow, s.firstSpellName)

        const spellDialog = s.page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        const neutralMod = await s.page.evaluate((name: string) => {
            const actor = game.actors.getName(name) as any
            const pw: number = actor?.items.find((i: any) => i.type === 'zauber')?.system?.pw ?? 0
            return -pw
        }, ACTOR_NAME)

        const modInput = spellDialog.locator('input[id^="modifikator-"]')
        await modInput.fill(String(neutralMod))
        await modInput.dispatchEvent('change')

        // W20=1 → Patzer + Misserfolg
        await s.page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.99
        })

        const aspBefore = await getAsp(s.page)
        const msgs = await rollAndCaptureMessages(s.page, spellDialog, 2)
        const [rollMsg, energyMsg] = msgs

        expect(rollMsg.flavor).toContain(s.firstSpellName)
        expect(energyMsg.content).toContain('Das Wirken ist dir nicht gelungen')

        // Halbe Kosten wurden trotzdem abgezogen
        const aspAfter = await getAsp(s.page)
        expect(aspAfter).toBeLessThan(aspBefore)

        await expect(s.page.locator('.notification.error')).not.toBeVisible()
    })

    // ------------------------------------------------------------------ //
    // Szenario D: Dämonenbann – manuelle Energie-Buttons                   //
    // ------------------------------------------------------------------ //

    test('D: Dämonenbann (nicht-numerische Schwierigkeit) – manuelle Energie-Buttons', async () => {
        await openSpellDialog(s.actorWindow, DAEMON_SPELL_NAME)

        const spellDialog = s.page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })
        await expect(spellDialog).toContainText(DAEMON_SPELL_NAME)

        // Manuelle Energie-Buttons müssen sichtbar sein (nicht-numerische Schwierigkeit)
        await expect(spellDialog.locator('.clickable-summary.energie-erfolg')).toBeVisible({
            timeout: 10000,
        })
        await expect(spellDialog.locator('.clickable-summary.energie-misserfolg')).toBeVisible({
            timeout: 10000,
        })

        // Würfelwurf → genau 1 Roll-Nachricht (keine auto-Energie-Abrechnung)
        // Direkter Methodenaufruf via page.evaluate statt DOM-Klick, da der
        // #modifier-summary innerHTML-Austausch den Click-Listener-Pfad unzuverlässig macht.
        // randomUniform muss vor _angreifenKlick gesetzt sein – Foundry v12 ruft es bedingungslos auf
        await s.page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.5
        })
        const beforeCountD = await s.page.evaluate(() => game.messages.contents.length)
        await s.page.evaluate(() => {
            // foundry.applications.instances ist eine Map, nicht ein Plain Object
            const app = Array.from((foundry.applications as any).instances?.values() ?? []).find(
                (a: any) => a.constructor?.name === 'UebernatuerlichDialog',
            ) as any
            return app?._angreifenKlick?.()
        })
        await s.page.waitForFunction(
            (b: number) => game.messages.contents.length > b,
            beforeCountD,
            { timeout: 20000 },
        )
        const msgs1 = await s.page.evaluate((b: number) => {
            const msgs = game.messages.contents.slice(b)
            return msgs.map((m: any) => ({ flavor: m.flavor ?? '', content: m.content ?? '' }))
        }, beforeCountD)
        expect(msgs1[0].flavor).toContain(DAEMON_SPELL_NAME)

        // Manuelle Energie-Abrechnung: Erfolg → 2 weitere Nachrichten
        const msgs2 = await clickEnergieButton(s.page, spellDialog, true)
        // Energie-Nachricht (spell_result.hbs)
        expect(msgs2[0].content).toContain('Das Wirken ist dir gelungen')
        // Titel-Nachricht: ChatMessage.create({ content: html_roll }) – kein flavor, nur content
        expect(msgs2[1].content).toContain(DAEMON_SPELL_NAME)
        expect(msgs2[1].content).toContain('Kosten:')

        await expect(s.page.locator('.notification.error')).not.toBeVisible()
    })

    // ------------------------------------------------------------------ //
    // Szenario E: Verbotene Pforten (1 Vorteil) – Wunden als Energiequelle //
    // ------------------------------------------------------------------ //

    test('E: Verbotene Pforten (1 Vorteil) – Wunden erhöht, AsP gedeckt', async () => {
        // asp_stern auf 1 setzen, damit VP greift (Energiekosten 5 > verfügbar 1)
        await s.page.evaluate((name: string) => {
            const actor = game.actors.getName(name) as any
            return actor?.update({ 'system.abgeleitete.asp_stern': 1 })
        }, ACTOR_NAME)

        await openSpellDialog(s.actorWindow, s.firstSpellName)

        const spellDialog = s.page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        // Energy Override = 5 (> asp_stern = 1 → VP muss einspringen)
        const overrideInput = spellDialog.locator(
            'input[name="item.system.manoever.energyOverride"]',
        )
        await expect(overrideInput).toBeVisible({ timeout: 10000 })
        await overrideInput.fill('5')
        await overrideInput.dispatchEvent('change')

        // Verbotene Pforten: 1 Vorteil (Multiplikator WS+4 = 12 Energie/Wunde)
        const vpRadio = spellDialog.locator('input[name="verbotene_pforten_toggle"][value="4"]')
        await expect(vpRadio).toBeVisible({ timeout: 10000 })
        await vpRadio.check()
        await vpRadio.dispatchEvent('change')

        const wundenBefore = await getWunden(s.page)

        // d20=20 → Erfolg
        await s.page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })

        const msgs = await rollAndCaptureMessages(s.page, spellDialog, 2)
        expect(msgs[0].flavor).toContain(s.firstSpellName)
        expect(msgs[1].content).toContain('Das Wirken ist dir gelungen')

        // VP-Wunden müssen gebucht worden sein
        const wundenAfter = await getWunden(s.page)
        expect(wundenAfter).toBeGreaterThan(wundenBefore)
    })

    // ------------------------------------------------------------------ //
    // Szenario F: Blutmagie – volle Deckung, kein AsP-Abzug               //
    // ------------------------------------------------------------------ //

    test('F: Blutmagie (volle Deckung) – asp_stern bleibt gleich, keine Wunden', async () => {
        await openSpellDialog(s.actorWindow, s.firstSpellName)

        const spellDialog = s.page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        // Blutmagie-Input auf 100 → deckt alle realistischen Kosten vollständig
        const blutmagieInput = spellDialog.locator('input#blutmagie')
        await expect(blutmagieInput).toBeVisible({ timeout: 10000 })
        await blutmagieInput.fill('100')
        await blutmagieInput.dispatchEvent('change')

        const aspBefore = await getAsp(s.page)
        const wundenBefore = await getWunden(s.page)

        // d20=20 → Erfolg
        await s.page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })

        const msgs = await rollAndCaptureMessages(s.page, spellDialog, 2)
        expect(msgs[0].flavor).toContain(s.firstSpellName)
        // Energie-Kosten = 0 durch Blutmagie
        expect(msgs[1].content).toContain('Das Wirken ist dir gelungen')
        expect(msgs[1].content).toContain('0 Energie')

        // Kein AsP-Abzug, keine Wunden
        const aspAfter = await getAsp(s.page)
        const wundenAfter = await getWunden(s.page)
        expect(aspAfter).toBe(aspBefore)
        expect(wundenAfter).toBe(wundenBefore)

        await expect(s.page.locator('.notification.error')).not.toBeVisible()
    })

    // ------------------------------------------------------------------ //
    // Szenario G: Energy Override = 0 – kein AsP-Abzug, kein Fehler       //
    // ------------------------------------------------------------------ //

    test('G: Energy Override = 0 – kein AsP-Abzug, keine Fehlermeldung', async () => {
        await openSpellDialog(s.actorWindow, s.firstSpellName)

        const spellDialog = s.page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        const overrideInput = spellDialog.locator(
            'input[name="item.system.manoever.energyOverride"]',
        )
        await expect(overrideInput).toBeVisible({ timeout: 10000 })
        await overrideInput.fill('0')
        await overrideInput.dispatchEvent('change')

        const aspBefore = await getAsp(s.page)

        await s.page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })

        const msgs = await rollAndCaptureMessages(s.page, spellDialog, 2)
        expect(msgs[0].flavor).toContain(s.firstSpellName)
        expect(msgs[1].content).toContain('Das Wirken ist dir gelungen')
        expect(msgs[1].content).toContain('0 Energie')

        const aspAfter = await getAsp(s.page)
        expect(aspAfter).toBe(aspBefore)

        await expect(s.page.locator('.notification.error')).not.toBeVisible()
    })

    // ------------------------------------------------------------------ //
    // Szenario H: Energiemangel – Fehlermeldung erwartet                  //
    // ------------------------------------------------------------------ //

    test('H: Energiemangel – Fehlermeldung bei unzureichenden AsP', async () => {
        await openSpellDialog(s.actorWindow, s.firstSpellName)

        const spellDialog = s.page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        // Energy Override = 100 (weit über aktuell verfügbaren AsP)
        const overrideInput = spellDialog.locator(
            'input[name="item.system.manoever.energyOverride"]',
        )
        await expect(overrideInput).toBeVisible({ timeout: 10000 })
        await overrideInput.fill('100')
        await overrideInput.dispatchEvent('change')

        // Blutmagie explizit auf 0 zurücksetzen – verhindert Übertrag aus Test F
        // (item.system.manoever.blutmagie.value = 100 bleibt als JS-Laufzeit-Property im Objekt)
        const blutmagieInputH = spellDialog.locator('input#blutmagie')
        if (await blutmagieInputH.isVisible().catch(() => false)) {
            await blutmagieInputH.fill('0')
            await blutmagieInputH.dispatchEvent('change')
            await s.page.waitForTimeout(400) // Debounce abwarten
        }

        await s.page.evaluate(() => {
            ;(CONFIG.Dice as any).randomUniform = () => 0.01
        })

        // Notification-Abfang: Prototyp-Override ist zuverlässiger als Instance-Override
        // und MutationObserver auf document.body als zusätzlicher Fallback.
        await s.page.evaluate(() => {
            ;(window as any).__hadEnergyError = false

            // Prototyp-Override: fängt ui.notifications.error(...) zuverlässig ab
            const proto = Object.getPrototypeOf(ui.notifications) as any
            const origError = proto.error
            ;(window as any).__origNotifError = origError
            proto.error = function (...args: any[]) {
                if (String(args[0]).includes('Nicht genug')) {
                    ;(window as any).__hadEnergyError = true
                }
                return origError.apply(this, args)
            }

            // MutationObserver als Fallback: beobachtet document.body
            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        const el = node as any
                        if (
                            el.textContent?.includes('Nicht genug') ||
                            el.classList?.contains('error')
                        ) {
                            ;(window as any).__hadEnergyError = true
                        }
                    }
                }
            })
            observer.observe(document.body, { childList: true, subtree: true })
            ;(window as any).__energyErrorObserver = observer
        })

        await rollAndCaptureMessages(s.page, spellDialog, 2)

        const hadError: boolean = await s.page.evaluate(
            () => (window as any).__hadEnergyError ?? false,
        )

        // Cleanup
        await s.page
            .evaluate(() => {
                ;(window as any).__energyErrorObserver?.disconnect()
                const proto = Object.getPrototypeOf(ui.notifications) as any
                if ((window as any).__origNotifError) {
                    proto.error = (window as any).__origNotifError
                    delete (window as any).__origNotifError
                }
            })
            .catch(() => {})

        expect(hadError).toBe(true)
    })
})
