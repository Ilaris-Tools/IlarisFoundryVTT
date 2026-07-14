import { ILARIS } from './config.js'
import { IlarisActiveEffect } from '../effects/active-effect.js'
import { IlarisActiveEffectConfig } from '../effects/ilaris-effect-config.js'
import { IlarisActorProxy } from '../actors/data/proxy.js'
import { IlarisItemProxy } from '../items/data/proxy.js'
import { initializeHandlebars } from './handlebars.js'
import { registerIlarisTypeDataModels } from './model-data/type-data-models.js'
import { preloadAllEigenschaften } from '../waffe/properties/utils/eigenschaft-cache.js'
import { preloadAbgeleiteteWerteDefinitions } from '../actors/data/actor.js'
import { runMigrationIfNeeded } from '../waffe/migrations/migrate-waffen-eigenschaften.js'
import { runModelDataNormalizationMigrationIfNeeded } from './migrations/migrate-modeldata-normalization.js'
import { HeldenSheet } from '../actors/sheets/held.js'
import { KreaturSheet } from '../actors/sheets/kreatur.js'
import { RuestungSheet } from '../items/sheets/ruestung.js'
import { UebernatuerlichFertigkeitSheet } from '../items/sheets/uebernatuerlich-fertigkeit.js'
import { UebernatuerlichTalentSheet } from '../items/sheets/uebernatuerlich-talent.js'
import { FertigkeitSheet } from '../items/sheets/fertigkeit.js'
import { TalentSheet } from '../items/sheets/talent.js'
import { NahkampfwaffeSheet } from '../waffe/sheets/nahkampfwaffe.js'
import { FernkampfwaffeSheet } from '../waffe/sheets/fernkampfwaffe.js'
import { GegenstandSheet } from '../items/sheets/gegenstand.js'
import { FreieFertigkeitSheet } from '../items/sheets/freie-fertigkeit.js'
import { VorteilSheet } from '../items/sheets/vorteil.js'
import { ManoeverSheet } from '../items/sheets/manoever.js'
import { EigenheitSheet } from '../items/sheets/eigenheit.js'
import { EigenschaftSheet } from '../items/sheets/eigenschaft.js'
import { WaffeneigenschaftSheet } from '../waffe/sheets/waffeneigenschaft.js'
import { InfoSheet } from '../items/sheets/info.js'
import { AbgeleiteterWertSheet } from '../items/sheets/abgeleiteter-wert.js'
import { AngriffSheet } from '../items/sheets/angriff.js'
import { FreiesTalentSheet } from '../items/sheets/freies-talent.js'
import { registerIlarisGameSettings } from '../settings/configure-game-settings.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../settings/configure-game-settings.model.js'
import { registerDefenseButtonHook } from '../combat/dialogs/defense-button-hook.js'
import { XmlCharacterImporter } from '../importer/xml_character_importer.js'
import { XMLRuleImporter } from '../importer/xml_rule_importer/index.js'
import { formatDiceFormula } from './utilities.js'
import { initializeKeybinds } from './keybinds.js'

const Actors = foundry.documents.collections.Actors
const Items = foundry.documents.collections.Items

// Status effect tint colors
const STATUS_EFFECT_COLORS = {
    YELLOW: '#FFFF00', // Light penalty/warning
    ORANGE: '#FF8000', // Medium penalty
    RED: '#FF0000', // Heavy penalty/danger
    VIOLET: '#8000FF', // Extreme penalty/maximum severity
    GREEN: '#7ED321', // Positive effect/bonus
    LIGHT_GREEN: '#B8E986', // Light positive effect
}

Hooks.once('init', () => {
    // CONFIG.debug.hooks = true;
    registerIlarisTypeDataModels()

    // ACTORS
    CONFIG.Actor.documentClass = IlarisActorProxy // TODO: Proxy

    // ACTIVE EFFECTS
    CONFIG.ActiveEffect.documentClass = IlarisActiveEffect

    // Register the Ilaris "dot" change type for Damage/Erschöpfung over Time.
    // DoTs use ilarisTiming (durationType: "ownerTurns", expiresOn: "turnEnd")
    // and modify system.gesundheit.wunden or system.gesundheit.erschoepfungen.
    // The handler skips normal application — damage is applied via combat hooks.
    CONFIG.ActiveEffect.changeTypes.dot = {
        label: 'DOT',
        defaultPriority: 0,
        handler() {
            // DOT effects are applied via combat-turn-hooks.js, not here.
            // Return null — no normal application.
            return null
        },
    }

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
        ActiveEffect,
        'Ilaris',
        IlarisActiveEffectConfig,
        { makeDefault: true, label: 'Ilaris' },
    )

    Actors.unregisterSheet('core', foundry.applications.sheets.ActorSheetV2)
    Actors.registerSheet('Ilaris', HeldenSheet, { types: ['held'], makeDefault: true })
    Actors.registerSheet('Ilaris', KreaturSheet, { types: ['kreatur'], makeDefault: true })

    // ITEMS
    CONFIG.Item.documentClass = IlarisItemProxy
    Items.unregisterSheet('core', foundry.applications.sheets.ItemSheetV2)
    Items.registerSheet('Ilaris', RuestungSheet, { types: ['ruestung'], makeDefault: true })
    Items.registerSheet('Ilaris', NahkampfwaffeSheet, {
        types: ['nahkampfwaffe'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', FernkampfwaffeSheet, {
        types: ['fernkampfwaffe'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', GegenstandSheet, { types: ['gegenstand'], makeDefault: true })
    Items.registerSheet('Ilaris', FertigkeitSheet, { types: ['fertigkeit'], makeDefault: true })
    Items.registerSheet('Ilaris', TalentSheet, { types: ['talent'], makeDefault: true })
    Items.registerSheet('Ilaris', UebernatuerlichFertigkeitSheet, {
        types: ['uebernatuerlicheFertigkeit'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', UebernatuerlichTalentSheet, {
        types: ['zauber', 'liturgie'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', FreieFertigkeitSheet, {
        types: ['freieFertigkeit'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', VorteilSheet, { types: ['vorteil'], makeDefault: true })
    Items.registerSheet('Ilaris', ManoeverSheet, { types: ['manoever'], makeDefault: true })
    Items.registerSheet('Ilaris', EigenheitSheet, { types: ['eigenheit'], makeDefault: true })
    Items.registerSheet('Ilaris', EigenschaftSheet, { types: ['eigenschaft'], makeDefault: true })
    Items.registerSheet('Ilaris', WaffeneigenschaftSheet, {
        types: ['waffeneigenschaft'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', AngriffSheet, { types: ['angriff'], makeDefault: true })
    Items.registerSheet('Ilaris', InfoSheet, { types: ['info'], makeDefault: true })
    Items.registerSheet('Ilaris', AbgeleiteterWertSheet, {
        types: ['abgeleiteterWert'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', FreiesTalentSheet, {
        types: ['freiesTalent'],
        makeDefault: true,
    })

    // Register world schema version for migrations
    game.settings.register('Ilaris', 'worldSchemaVersion', {
        name: 'World Schema Version',
        scope: 'world',
        config: false,
        type: String,
        default: '0.0.0',
    })

    initializeHandlebars()
    // game.sephrasto = new SephrastoImporter();
    CONFIG.ILARIS = ILARIS
    CONFIG.Combat.initiative = { formula: '@initiative', decimals: 1 }
    // Status effects as v14 object (keyed by id) with order for grouped display.
    // Groups: Furcht (100-103), Schlechte Sicht (200-203), Unsicherer Untergrund (300-303),
    //         Position (400-403), Nahkampf (500-503).
    CONFIG.statusEffects = {
        // ── Furcht ──────────────────────────────────────────────────────────────
        Furcht1: {
            id: 'Furcht1',
            name: 'Furcht I',
            order: 100,
            duration: [],
            changes: [
                { key: 'system.furcht.furchtstufe', type: 'override', priority: 1, value: 1 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/terror.svg',
            tint: STATUS_EFFECT_COLORS.YELLOW,
        },
        Furcht2: {
            id: 'Furcht2',
            name: 'Furcht II',
            order: 101,
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', type: 'upgrade', priority: 2, value: 2 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/terror.svg',
            tint: STATUS_EFFECT_COLORS.ORANGE,
        },
        Furcht3: {
            id: 'Furcht3',
            name: 'Furcht III',
            order: 102,
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', type: 'upgrade', priority: 3, value: 3 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/terror.svg',
            tint: STATUS_EFFECT_COLORS.RED,
        },
        Furcht4: {
            id: 'Furcht4',
            name: 'Furcht IV',
            order: 103,
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', type: 'upgrade', priority: 4, value: 4 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/terror.svg',
            tint: STATUS_EFFECT_COLORS.VIOLET,
        },

        // ── Schlechte Sicht ────────────────────────────────────────────────────
        schlechtesicht1: {
            id: 'schlechtesicht1',
            name: 'Schlechte Sicht (Dämmerung)',
            order: 200,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 4, value: -2 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 4,
                    value: -2,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sight-disabled.svg',
            tint: STATUS_EFFECT_COLORS.YELLOW,
        },
        schlechtesicht2: {
            id: 'schlechtesicht2',
            name: 'Schlechte Sicht (Mondlicht)',
            order: 201,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 6, value: -4 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 6,
                    value: -4,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sight-disabled.svg',
            tint: STATUS_EFFECT_COLORS.ORANGE,
        },
        schlechtesicht3: {
            id: 'schlechtesicht3',
            name: 'Schlechte Sicht (Sternenlicht)',
            order: 202,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 7, value: -8 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 7,
                    value: -8,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sight-disabled.svg',
            tint: STATUS_EFFECT_COLORS.RED,
        },
        schlechtesicht4: {
            id: 'schlechtesicht4',
            name: 'Schlechte Sicht (Blind)',
            order: 203,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 8, value: -16 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 8,
                    value: -16,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sight-disabled.svg',
            tint: STATUS_EFFECT_COLORS.VIOLET,
        },

        // ── Unsicherer Untergrund ──────────────────────────────────────────────
        untergrund1: {
            id: 'untergrund1',
            name: 'Unsicherer Untergrund (knietiefes Wasser)',
            order: 300,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 4, value: -2 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 4,
                    value: -2,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sticky-boot.svg',
            tint: STATUS_EFFECT_COLORS.YELLOW,
        },
        untergrund2: {
            id: 'untergrund2',
            name: 'Unsicherer Untergrund (eisglatt, hüfttiefes Wasser)',
            order: 301,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 6, value: -4 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 6,
                    value: -4,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sticky-boot.svg',
            tint: STATUS_EFFECT_COLORS.ORANGE,
        },
        untergrund3: {
            id: 'untergrund3',
            name: 'Unsicherer Untergrund (schultertiefes Wasser)',
            order: 302,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 7, value: -8 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 7,
                    value: -8,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sticky-boot.svg',
            tint: STATUS_EFFECT_COLORS.RED,
        },
        untergrund4: {
            id: 'untergrund4',
            name: 'Unsicherer Untergrund (Drahtseil)',
            order: 303,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 8, value: -16 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 8,
                    value: -16,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sticky-boot.svg',
            tint: STATUS_EFFECT_COLORS.VIOLET,
        },

        // ── Position ───────────────────────────────────────────────────────────
        Position1: {
            id: 'Position1',
            name: 'Sehr vorteilhafte Position',
            order: 400,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 9, value: +4 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 9,
                    value: +4,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/hill-fort-green.svg',
        },
        Position2: {
            id: 'Position2',
            name: 'Vorteilhafte Position',
            order: 401,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 10, value: +2 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 10,
                    value: +2,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/hill-conquest-light-green.svg',
        },
        Position3: {
            id: 'Position3',
            name: 'Schlechte Position (Kniend)',
            order: 402,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 12, value: -2 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 12,
                    value: -2,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/kneeling-yellow.svg',
        },
        Position4: {
            id: 'Position4',
            name: 'Sehr schlechte Position (Liegend)',
            order: 403,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 13, value: -4 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 13,
                    value: -4,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/falling-orange.svg',
        },

        // ── Nahkampf ───────────────────────────────────────────────────────────
        Nahkampf1: {
            id: 'Nahkampf1',
            name: 'Nahkampf +4',
            order: 500,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 9, value: +4 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 9,
                    value: +4,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman.svg',
            tint: STATUS_EFFECT_COLORS.GREEN,
        },
        Nahkampf2: {
            id: 'Nahkampf2',
            name: 'Nahkampf +2',
            order: 501,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 10, value: +2 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 10,
                    value: +2,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman.svg',
            tint: STATUS_EFFECT_COLORS.LIGHT_GREEN,
        },
        Nahkampf3: {
            id: 'Nahkampf3',
            name: 'Nahkampf -2',
            order: 502,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 12, value: -2 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 12,
                    value: -2,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman.svg',
            tint: STATUS_EFFECT_COLORS.YELLOW,
        },
        Nahkampf4: {
            id: 'Nahkampf4',
            name: 'Nahkampf -4',
            order: 503,
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', type: 'add', priority: 13, value: -4 },
                {
                    key: 'system.modifikatoren.verteidigungmod',
                    type: 'add',
                    priority: 13,
                    value: -4,
                },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman.svg',
            tint: STATUS_EFFECT_COLORS.ORANGE,
        },
    }

    // Block creation of legacy item types while still allowing existing
    // items to load for the ready-hook migration to rename them.
    const LEGACY_ITEM_TYPES = new Set([
        'freiestalent',
        'freie_fertigkeit',
        'uebernatuerliche_fertigkeit',
        'abgeleiteter-wert',
    ])
    Hooks.on('preCreateItem', (item, data, options, userId) => {
        if (LEGACY_ITEM_TYPES.has(item.type)) {
            ui.notifications.warn(
                `Der Item-Typ "${item.type}" ist veraltet und kann nicht mehr erstellt werden.`,
            )
            return false
        }
    })

    registerIlarisGameSettings()
    initializeKeybinds()
})

Hooks.on('ready', async () => {
    registerDefenseButtonHook()
    // TODO Phase 2.8: replace with tokensReady() from tokens/hooks.js
    applyHexTokenSetting()
    // TODO Phase 2.5: replace with combatReady() from combat/hooks.js (for setupIlarisSocket)
    setupIlarisSocket()
    // TODO Phase 2.9: replace with importerReady() from importer/hooks.js (if needed)

    // Preload all waffeneigenschaften into cache
    await preloadAllEigenschaften()
    // Preload abgeleitete werte definitions into cache
    await preloadAbgeleiteteWerteDefinitions()

    // Force actors to recalculate now that cache is loaded
    for (const actor of game.actors) {
        console.log(`Preparing data for actor ${actor.name} to recalculate derived values`)
        actor.prepareData()
    }

    // Run world migration if needed (GM only, once per world)
    await runMigrationIfNeeded()
    await runModelDataNormalizationMigrationIfNeeded()
})

/**
 * Set up socket listeners for Ilaris system
 * This allows players to request the GM to perform actions they don't have permission for
 * TODO Phase 2.5: move to combat/hooks.js as part of combatReady()
 */
function setupIlarisSocket() {
    game.socket.on('system.Ilaris', async (data) => {
        switch (data.type) {
            case 'applyDamage':
                // Legacy path: GM executes request.
                if (!game.user.isGM) return
                await handleApplyDamageRequest(data.data)
                break
            case 'applyDamageByOwner':
                await handleApplyDamageByOwnerRequest(data.data)
                break
            case 'createDefensePromptByOwner':
                await handleCreateDefensePromptByOwnerRequest(data.data)
                break
            case 'createResistPromptByOwner':
                await handleCreateResistPromptByOwnerRequest(data.data)
                break
            case 'broadcastCombatHook':
                await handleBroadcastCombatHookRequest(data.data)
                break
            default:
                console.warn(`Unknown Ilaris socket request type: ${data.type}`)
        }
    })
}

/**
 * Handle a damage application request from a player
 * Only called on GM's client
 * TODO Phase 2.5: move to combat/hooks.js
 */
async function handleApplyDamageRequest(data) {
    const { targetActorId, damage, damageType, trueDamage, speaker } = data

    const targetActor = game.actors.get(targetActorId)
    if (!targetActor) {
        console.error(`Target actor ${targetActorId} not found`)
        return
    }

    // Import the helper function
    const { _applyDamageDirectly } = await import('../combat/dialogs/shared-dialog-helpers.js')

    // Apply damage as GM
    await _applyDamageDirectly(targetActor, damage, damageType, trueDamage, speaker)
}

/**
 * Handle owner-routed damage request.
 * The designated owner client applies damage exactly once.
 *
 * @param {Object} data - Socket payload
 */
async function handleApplyDamageByOwnerRequest(data) {
    const { eventId, executorUserId, target, damage, damageType, trueDamage, speaker } = data || {}

    if (!eventId || !executorUserId || !target) return

    if (!window._ilarisProcessedDamageEvents) {
        window._ilarisProcessedDamageEvents = new Set()
    }
    if (window._ilarisProcessedDamageEvents.has(eventId)) return

    if (executorUserId !== game.user.id) return

    const { _applyDamageDirectly, resolveTargetActorForDamage } =
        await import('../combat/dialogs/shared-dialog-helpers.js')

    const { targetActor } = resolveTargetActorForDamage(target)
    if (!targetActor) {
        console.error(`[Ilaris] Damage target actor not found for event ${eventId}`)
        return
    }

    if (!targetActor.canUserModify(game.user, 'update')) {
        console.warn(`[Ilaris] Designated owner cannot update actor for event ${eventId}`)
        return
    }

    window._ilarisProcessedDamageEvents.add(eventId)
    if (window._ilarisProcessedDamageEvents.size > 1000) {
        const iterator = window._ilarisProcessedDamageEvents.values()
        const first = iterator.next().value
        window._ilarisProcessedDamageEvents.delete(first)
    }

    await _applyDamageDirectly(targetActor, damage, damageType, trueDamage, speaker)
}

/**
 * Handle owner-routed defense prompt creation.
 *
 * @param {Object} data - Socket payload
 */
async function handleCreateDefensePromptByOwnerRequest(data) {
    const { handleDefensePromptSocketEvent } =
        await import('../combat/hooks/combat_dialog_handlers.js')
    await handleDefensePromptSocketEvent(data)
}

/**
 * Handle resist prompt socket event — delegates to resist-handler.js.
 * @param {Object} data - Socket payload with resist prompt data
 */
async function handleCreateResistPromptByOwnerRequest(data) {
    const { sendResistPrompt } = await import('../effects/pre-effects/resist-handler.js')
    const targetActor = game.actors.get(data.targetActorId)
    if (!targetActor) return

    await sendResistPrompt(targetActor, data.preEffect, data.spellName, ChatMessage.getSpeaker())
}

/**
 * Handle mirrored combat hook broadcasts from remote clients.
 *
 * @param {Object} data - Socket payload
 */
async function handleBroadcastCombatHookRequest(data) {
    const { handleBroadcastCombatHookRequest: handleGlobalCombatHookBroadcast } =
        await import('../combat/hooks/global_combat_hooks.js')
    await handleGlobalCombatHookBroadcast(data)
}

// Cache for hex token shapes setting
// TODO Phase 2.8: move to tokens/hooks.js
let hexTokenShapesEnabled = false

/**
 * Apply or remove the hex token setting visual indicator
 * TODO Phase 2.8: move to tokens/hooks.js as tokensReady()
 */
function applyHexTokenSetting() {
    hexTokenShapesEnabled = game.settings.get(
        ConfigureGameSettingsCategories.Ilaris,
        IlarisGameSettingNames.hexTokenShapes,
    )

    if (hexTokenShapesEnabled) {
        document.body.classList.add('ilaris-hex-tokens-enabled')
    } else {
        document.body.classList.remove('ilaris-hex-tokens-enabled')
    }
}

// ============================================================================
// IMPORTER HOOKS
// TODO Phase 2.9: move to importer/hooks.js
// ============================================================================

Hooks.on('renderActorDirectory', (app, htmlDOM) => {
    // Add XML import button to the actors directory header (only if user can create actors and upload files)
    if (game.user.can('ACTOR_CREATE') && game.user.can('FILES_UPLOAD')) {
        const header = htmlDOM.querySelector('.directory-header')
        const headerActions = header?.querySelector('.header-actions')
        if (headerActions) {
            const importButton = document.createElement('button')
            importButton.className = 'import-xml-character'
            importButton.title = 'Import Character from XML'
            importButton.innerHTML = `<i class="fas fa-file-import"></i> Import Charakter XML`

            importButton.addEventListener('click', () => XmlCharacterImporter.showImportDialog())
            headerActions.appendChild(importButton)
        }

        // Add sync buttons to each actor entry (only if user owns the actor, can create actors, and can upload files)
        htmlDOM.querySelectorAll('.directory-item.actor').forEach((element, i) => {
            const actorId = element.dataset.entryId
            const actor = game.actors.get(actorId)

            if (actor && actor.type === 'held' && actor.isOwner) {
                // Only add sync button to character actors that the user owns and has create/upload permissions
                const syncButton = document.createElement('div')
                syncButton.className = 'sync-xml-character onhover'
                syncButton.title = 'Sync Character with XML'
                syncButton.dataset.actorId = actorId
                syncButton.innerHTML = `<i class="fas fa-sync-alt onhover"></i>`

                syncButton.addEventListener('click', async (event) => {
                    event.stopPropagation() // Prevent opening the actor sheet
                    const targetActor = game.actors.get(actorId)
                    if (targetActor) {
                        await XmlCharacterImporter.showSyncDialog(targetActor)
                    }
                })

                // Insert the sync button before the existing controls
                const controls = element.querySelector('.directory-item-controls')
                if (controls) {
                    controls.insertBefore(syncButton, controls.firstChild)
                } else {
                    const newControls = document.createElement('div')
                    newControls.className = 'directory-item-controls'
                    newControls.appendChild(syncButton)
                    element.appendChild(newControls)
                }
            }
        })
    }
})

// Add XML rule import button to the Compendium Directory
Hooks.on('renderCompendiumDirectory', (app, htmlDOM) => {
    // Add XML import button to the compendium directory header (only if GM)
    if (game.user.isGM) {
        const header = htmlDOM.querySelector('.directory-header')
        const headerActions = header?.querySelector('.header-actions')
        if (headerActions) {
            // Create import button
            const importButton = document.createElement('button')
            importButton.className = 'import-xml-rules rule-button'
            importButton.title = 'Import Rules from XML'
            importButton.innerHTML = '<i class="fas fa-file-import"></i> Import Regeln XML'
            importButton.addEventListener('click', () => XMLRuleImporter.showRuleImportDialog())

            // Create update button
            const updateButton = document.createElement('button')
            updateButton.className = 'update-xml-rules rule-button'
            updateButton.title = 'Update Rules from XML'
            updateButton.innerHTML = '<i class="fas fa-sync-alt"></i> Update Regeln XML'
            updateButton.addEventListener('click', () => XMLRuleImporter.showRuleUpdateDialog())

            headerActions.appendChild(importButton)
            headerActions.appendChild(updateButton)
        }
    }
})

// ============================================================================
// TOKEN HOOKS
// TODO Phase 2.8: move to tokens/hooks.js
// ============================================================================

// Force apply tint colors to status effect picker icons using direct CSS styling
Hooks.on('renderTokenHUD', (app, htmlDOM, data) => {
    // Wait for DOM to be ready
    setTimeout(() => {
        // Look for the status effects container
        const statusEffectsContainer = htmlDOM.querySelector('.status-effects')

        if (statusEffectsContainer) {
            // Find all effect controls within the status effects container
            const effectControls = statusEffectsContainer.querySelectorAll('.effect-control')

            effectControls.forEach((control) => {
                const statusId = control.dataset.statusId

                // Find the matching status effect configuration
                const statusConfig = CONFIG.statusEffects[statusId]

                if (statusConfig && statusConfig.tint) {
                    // Apply filter to change only the white SVG fill to the desired color
                    const filterValue = getFilterForColor(statusConfig.tint)
                    control.style.filter = filterValue
                    control.style.webkitFilter = filterValue

                    // Force override with !important using setAttribute
                    const existingStyle = control.getAttribute('style') || ''
                    control.setAttribute(
                        'style',
                        existingStyle +
                            `; filter: ${filterValue} !important;` +
                            `; -webkit-filter: ${filterValue} !important;`,
                    )

                    control.classList.add('ilaris-tinted')
                }
            })
        }
    }, 100)
})

// Helper function to create CSS filters that convert white SVG to specific colors
function getFilterForColor(hexColor) {
    switch (hexColor.toUpperCase()) {
        case STATUS_EFFECT_COLORS.RED: // #FF0000
            return 'brightness(0) saturate(100%) invert(13%) sepia(96%) saturate(7484%) hue-rotate(3deg) brightness(96%) contrast(114%)'
        case STATUS_EFFECT_COLORS.GREEN: // #7ED321
            return 'brightness(0) saturate(100%) invert(61%) sepia(80%) saturate(449%) hue-rotate(46deg) brightness(103%) contrast(89%)'
        case STATUS_EFFECT_COLORS.LIGHT_GREEN: // #B8E986
            return 'brightness(0) saturate(100%) invert(97%) sepia(9%) saturate(2042%) hue-rotate(29deg) brightness(97%) contrast(88%)'
        case STATUS_EFFECT_COLORS.YELLOW: // #FFFF00
            return 'brightness(0) saturate(100%) invert(93%) sepia(58%) saturate(2379%) hue-rotate(357deg) brightness(104%) contrast(104%)'
        case STATUS_EFFECT_COLORS.ORANGE: // #FF8000
            return 'brightness(0) saturate(100%) invert(64%) sepia(42%) saturate(5677%) hue-rotate(358deg) brightness(100%) contrast(109%)'
        case STATUS_EFFECT_COLORS.VIOLET: // #8000FF
            return 'brightness(0) saturate(100%) invert(11%) sepia(83%) saturate(6118%) hue-rotate(269deg) brightness(106%) contrast(129%)'
        default:
            return 'none'
    }
}

// Update when setting changes
Hooks.on('updateSetting', (setting) => {
    if (
        setting.key ===
        `${ConfigureGameSettingsCategories.Ilaris}.${IlarisGameSettingNames.hexTokenShapes}`
    ) {
        applyHexTokenSetting()
        // Refresh all tokens to apply the mask
        if (canvas.ready && canvas.tokens) {
            canvas.tokens.placeables.forEach((token) =>
                token.renderFlags.set({ refreshMesh: true }),
            )
        }
    }
})

// Apply hex mask to tokens when they're drawn
Hooks.on('drawToken', (token) => {
    if (hexTokenShapesEnabled) {
        applyHexMaskToToken(token)
        applyTokenBorderColor(token)
    }
})

// Apply hex mask to tokens when they're refreshed
Hooks.on('refreshToken', (token) => {
    if (hexTokenShapesEnabled) {
        applyHexMaskToToken(token)
        applyTokenBorderColor(token)
    }
})

/**
 * Apply custom border color to token based on Foundry's disposition system
 * @param {Token} token - The token to apply border color to
 */
function applyTokenBorderColor(token) {
    if (!token.border) return

    // Use Foundry's built-in method to determine border color based on disposition
    // This respects the token's disposition (FRIENDLY, NEUTRAL, HOSTILE) and ownership
    const borderColor = token._getBorderColor()

    // Apply the color to the token border
    if (borderColor !== null) {
        token.border.color = borderColor
    }
}

/**
 * Remove and cleanup an existing mask and border from a token mesh
 * @param {Token} token - The token to remove the mask from
 */
function removeTokenMask(token) {
    if (token.mesh && token.mesh.mask) {
        token.mesh.mask.destroy()
        token.mesh.mask = null
    }
    if (token._ilarisHexBorder) {
        token.removeChild(token._ilarisHexBorder)
        token._ilarisHexBorder.destroy()
        token._ilarisHexBorder = null
    }
}

/**
 * Apply a hexagonal mask and border to a token to clip its appearance to a hexagon shape.
 * The function creates a PIXI.Graphics hexagon and applies it as a mask to the token mesh,
 * and adds a border around the hexagonal shape.
 *
 * @param {Token} token - The token to apply the mask and border to
 * @returns {void} Returns early if token mesh or texture is not available (e.g., token not yet rendered)
 *
 * @description
 * The mask and border are cached and reused if the token dimensions haven't changed, to avoid unnecessary
 * recreation. The mask stores internal properties for tracking:
 * - _ilarisHexMask: Boolean flag to identify Ilaris hex masks
 * - _maskWidth: Stored token width to detect dimension changes
 * - _maskHeight: Stored token height to detect dimension changes
 * - _ilarisHexBorder: Reference to the hexagonal border graphic
 */
function applyHexMaskToToken(token) {
    // Return early if token is not ready for masking (mesh or texture not yet initialized)
    if (!token.mesh || !token.mesh.texture) return

    const w = token.w
    const h = token.h

    // Check if token already has a hex mask and border with matching dimensions
    if (
        token.mesh.mask &&
        token.mesh.mask._ilarisHexMask &&
        token.mesh.mask._maskWidth === w &&
        token.mesh.mask._maskHeight === h &&
        token._ilarisHexBorder
    ) {
        return // Already has hex mask and border with correct dimensions, no need to recreate
    }

    // Remove existing mask if any
    removeTokenMask(token)

    // Create hexagon mask
    const size = Math.min(w, h) / 2

    // Draw hexagon (flat-top orientation)
    const centerX = w / 2
    const centerY = h / 2
    const angle = (Math.PI * 2) / 6
    const startAngle = -Math.PI / 2 // Start at top for flat-top orientation

    // Create hexagon mask
    const hexMask = new PIXI.Graphics()
    hexMask.beginFill(0xffffff)

    hexMask.moveTo(centerX + size * Math.cos(startAngle), centerY + size * Math.sin(startAngle))

    for (let i = 1; i <= 6; i++) {
        const x = centerX + size * Math.cos(startAngle + angle * i)
        const y = centerY + size * Math.sin(startAngle + angle * i)
        hexMask.lineTo(x, y)
    }

    hexMask.endFill()

    // Mark this as an Ilaris hex mask for future checks
    hexMask._ilarisHexMask = true
    hexMask._maskWidth = w
    hexMask._maskHeight = h

    // Apply mask to token mesh
    token.mesh.mask = hexMask
    token.addChild(hexMask)

    // Determine border colors using Foundry's built-in disposition system
    const outerColor = 0x000000 // Black outer border
    const innerColor = token._getBorderColor() || 0xff5500 // Use Foundry's border color, fallback to orange

    // Create hexagonal border (double border)
    const hexBorder = new PIXI.Graphics()

    // Draw outer border (thicker, black)
    hexBorder.lineStyle(6, outerColor, 1)
    hexBorder.moveTo(centerX + size * Math.cos(startAngle), centerY + size * Math.sin(startAngle))
    for (let i = 1; i <= 6; i++) {
        const x = centerX + size * Math.cos(startAngle + angle * i)
        const y = centerY + size * Math.sin(startAngle + angle * i)
        hexBorder.lineTo(x, y)
    }
    hexBorder.closePath()

    // Draw colored inner border (thinner, using Foundry's disposition colors)
    hexBorder.lineStyle(3, innerColor, 1)
    hexBorder.moveTo(centerX + size * Math.cos(startAngle), centerY + size * Math.sin(startAngle))
    for (let i = 1; i <= 6; i++) {
        const x = centerX + size * Math.cos(startAngle + angle * i)
        const y = centerY + size * Math.sin(startAngle + angle * i)
        hexBorder.lineTo(x, y)
    }
    hexBorder.closePath()

    // Add border on top of the token
    token.addChild(hexBorder)
    token._ilarisHexBorder = hexBorder
}

// ============================================================================
// DICE / COMBAT HOOKS
// TODO Phase 2.4: formatDiceFormula hook → dice/hooks.js
// TODO Phase 2.5: defense prompt hook → combat/hooks.js
// ============================================================================

// Combined hook for chat message rendering
Hooks.on('renderChatMessageHTML', (message, htmlDOM, data) => {
    // Format dice formulas in chat messages
    const diceFormulaElements = htmlDOM.querySelectorAll('.dice-formula')
    diceFormulaElements.forEach((element) => {
        const originalFormula = element.textContent.trim()

        // Extract just the dice part (before any + or -)
        const diceFormulaMatch = originalFormula.match(/^(\d+d\d+(?:dl\d+)?(?:dh\d+)?)/)
        if (diceFormulaMatch) {
            const diceFormula = diceFormulaMatch[1]
            const formattedDice = formatDiceFormula(diceFormula)

            // Replace the dice part with the formatted version, keep the rest
            const remainder = originalFormula.substring(diceFormula.length)
            element.textContent = formattedDice + remainder
        }
    })

    // Handle defense prompt message visibility
    const isDefensePrompt = message.flags?.Ilaris?.defensePrompt
    if (isDefensePrompt) {
        // Skip if defense has already been handled
        if (htmlDOM.classList.contains('defense-handled')) {
            return
        }

        // Check if the current user should see the content
        const targetActorId = message.flags.Ilaris.targetActorId
        const targetActor = game.actors.get(targetActorId)
        const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        const isTargetOwner = !!targetActor?.testUserPermission(game.user, ownerLevel, {
            exact: false,
        })

        // If the user is not the target, hide the content
        if (!isTargetOwner && !game.user.isGM) {
            const contentDiv = htmlDOM.querySelector('.message-content')
            if (contentDiv) {
                contentDiv.innerHTML =
                    '<p style="font-style: italic; opacity: 0.6;">Deine Verteidigungsaufforderung an einen anderen Spieler</p>'
            }
        }

        if (isTargetOwner || game.user.isGM) {
            // Highlight the message for the target player
            htmlDOM.classList.add('ilaris-defense-prompt-highlight')
        }
    }
})

// ============================================================================
// SETTINGS HOOKS
// TODO Phase 2.10: move to settings/hooks.js
// ============================================================================

// Extend Scene Config with environment settings in Basic tab
Hooks.on('renderSceneConfig', async (app, htmlDOM, data) => {
    // Check if already injected (to avoid duplicates when dialog is re-opened)
    if (htmlDOM.querySelector('.ilaris-environment-setting')) {
        return
    }

    // Get existing environment settings from scene flags
    const scene = app.document || app.object
    const environment = scene.getFlag('Ilaris', 'sceneConditions') || {
        lcht: '0', // Lichtverhältnisse
        wttr: '0', // Wetter
    }

    // Prepare template data
    const templateData = {
        environment: environment,
        lcht_choice: CONFIG.ILARIS.lcht_choice,
        wttr_choice: CONFIG.ILARIS.wttr_choice,
    }

    // Render the template
    const environmentHTML = await foundry.applications.handlebars.renderTemplate(
        'systems/Ilaris/scripts/settings/templates/scene_environment_fields.hbs',
        templateData,
    )

    // Append to the environment part (AppV2 uses data-application-part, not legacy tab/group selectors)
    const environmentPart = htmlDOM.querySelector('[data-application-part="environment"]')
    if (!environmentPart) return
    environmentPart.insertAdjacentHTML(
        'beforeend',
        '<hr style="margin: 1.5em 0; border: none; border-top: 2px solid var(--color-border-light-primary);">',
    )
    environmentPart.insertAdjacentHTML('beforeend', environmentHTML)
})

// Add Automatisierung heading in settings, pretty scuffed solution but i did not manage to add a separate category to the settings without adding a new module
Hooks.on('renderSettingsConfig', (app, htmlDOM) => {
    // Find the first Automatisierung setting
    const automationInput = htmlDOM.querySelector('[name="Ilaris.useSceneEnvironment"]')
    const automationSetting = automationInput?.closest('.form-group')

    if (automationSetting) {
        // Insert a heading before it
        automationSetting.insertAdjacentHTML(
            'beforebegin',
            '<h3 class="setting-header" style="border-bottom: 1px solid var(--color-border-light-primary); padding: 0.5em 0; margin-top: 1em;">Automatisierung</h3>',
        )
    }

    // Find the first Kompendien setting (fertigkeitenPacksMenu)
    const kompendienElement = htmlDOM.querySelector('[data-key="Ilaris.fertigkeitenPacksMenu"]')
    const kompendienSetting = kompendienElement?.closest('.form-group')

    if (kompendienSetting) {
        // Insert a heading before it
        kompendienSetting.insertAdjacentHTML(
            'beforebegin',
            '<h3 class="setting-header" style="border-bottom: 1px solid var(--color-border-light-primary); padding: 0.5em 0; margin-top: 1em;">Benutzte Kompendien</h3>',
        )
    }

    // Find the first Kompendien setting (fertigkeitenPacksMenu)
    const normalElement = htmlDOM.querySelector('[data-setting-id="Ilaris.weaponSpaceRequirement"]')
    const normalSetting = normalElement?.closest('.form-group')

    if (normalSetting) {
        // Insert a heading before it
        normalSetting.insertAdjacentHTML(
            'beforebegin',
            '<h3 class="setting-header" style="border-bottom: 1px solid var(--color-border-light-primary); padding: 0.5em 0; margin-top: 1em;">Andere Einstellungen</h3>',
        )
    }

    // Replace the default ranged dodge talent text input with a dropdown
    const dodgeTalentInput = htmlDOM.querySelector('[name="Ilaris.defaultRangedDodgeTalent"]')
    if (dodgeTalentInput) {
        const currentValue = dodgeTalentInput.value

        // Get all talents from selected fertigkeiten compendiums
        const talentePacks = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.talentePacks,
            ),
        )

        const talents = new Map()
        for (const packId of talentePacks) {
            const pack = game.packs.get(packId)
            if (!pack) continue

            for (const indexEntry of pack.index) {
                if (indexEntry.type === 'talent') {
                    // Use UUID as key for uniqueness
                    const uuid = `Compendium.${packId}.${indexEntry._id}`
                    talents.set(uuid, indexEntry.name)
                }
            }
        }

        // Create dropdown
        let selectHtml = '<select name="Ilaris.defaultRangedDodgeTalent">'
        selectHtml += '<option value="">-- Kein Alternativ-Talent --</option>'

        for (const [uuid, name] of talents) {
            const selected = uuid === currentValue ? ' selected' : ''
            selectHtml += `<option value="${uuid}"${selected}>${name}</option>`
        }
        selectHtml += '</select>'

        dodgeTalentInput.insertAdjacentHTML('afterend', selectHtml)
        dodgeTalentInput.remove()
    }
})
