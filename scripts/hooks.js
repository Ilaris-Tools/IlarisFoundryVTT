import { ILARIS } from './config.js'
import { IlarisActorProxy } from './actors/proxy.js'
import { IlarisItemProxy } from './items/proxy.js'
import { initializeHandlebars } from './common/handlebars.js'
import { preloadAllEigenschaften } from './items/utils/eigenschaft-cache.js'
import { runMigrationIfNeeded } from './migrations/migrate-waffen-eigenschaften.js'
// import { IlarisActorSheet } from "./sheets/actor.js";
import { HeldenSheet } from './sheets/helden.js'
import { KreaturSheet } from './sheets/kreatur.js'
import { RuestungSheet } from './sheets/items/ruestung.js'
import { UebernatuerlichFertigkeitSheet } from './sheets/items/uebernatuerlich_fertigkeit.js'
import { UebernatuerlichTalentSheet } from './sheets/items/uebernatuerlich_talent.js'
import { FertigkeitSheet } from './sheets/items/fertigkeit.js'
import { TalentSheet } from './sheets/items/talent.js'
// import { SephrastoImporter } from "./common/sephrasto_importer.js";
import { NahkampfwaffeSheet } from './sheets/items/nahkampfwaffe.js'
import { FernkampfwaffeSheet } from './sheets/items/fernkampfwaffe.js'
import { GegenstandSheet } from './sheets/items/gegenstand.js'
import { FreieFertigkeitSheet } from './sheets/items/freie_fertigkeit.js'
import { VorteilSheet } from './sheets/items/vorteil.js'
import { ManoeverSheet } from './sheets/items/manoever.js'
import { EigenheitSheet } from './sheets/items/eigenheit.js'
import { EigenschaftSheet } from './sheets/items/eigenschaft.js'
import { WaffeneigenschaftSheet } from './sheets/items/waffeneigenschaft.js'
import { InfoSheet } from './sheets/items/info.js'
import { AngriffSheet } from './sheets/items/angriff.js'
import { FreiesTalentSheet } from './sheets/items/freies_talent.js'
import { registerIlarisGameSettings } from './settings/configure-game-settings.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from './settings/configure-game-settings.model.js'
import { XmlCharacterImporter } from './common/xml_character_importer.js'
import { formatDiceFormula } from './common/utilities.js'

// Import hooks
import './hooks/changelog-notification.js'
import { registerDefenseButtonHook } from './sheets/dialogs/defense_button_hook.js'

// Status effect tint colors
const STATUS_EFFECT_COLORS = {
    YELLOW: '#FFFF00', // Light penalty/warning
    ORANGE: '#FF8000', // Medium penalty
    RED: '#FF0000', // Heavy penalty/danger
    VIOLET: '#8000FF', // Extreme penalty/maximum severity
    GREEN: '#00FF00', // Positive effect/bonus
}

Hooks.once('init', () => {
    // CONFIG.debug.hooks = true;
    // ACTORS
    CONFIG.Actor.documentClass = IlarisActorProxy // TODO: Proxy
    Actors.unregisterSheet('core', ActorSheet)
    Actors.registerSheet('Ilaris', HeldenSheet, { types: ['held'], makeDefault: true })
    Actors.registerSheet('Ilaris', KreaturSheet, { types: ['kreatur'], makeDefault: true })

    // ITEMS
    CONFIG.Item.documentClass = IlarisItemProxy
    Items.unregisterSheet('core', ItemSheet)
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
        types: ['uebernatuerliche_fertigkeit'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', UebernatuerlichTalentSheet, {
        types: ['zauber', 'liturgie'],
        makeDefault: true,
    })
    Items.registerSheet('Ilaris', FreieFertigkeitSheet, {
        types: ['freie_fertigkeit'],
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
    Items.registerSheet('Ilaris', FreiesTalentSheet, { types: ['freiestalent'], makeDefault: true })
    // Items.registerSheet("Ilaris", VorteilSheet, {types: ["allgemein_vorteil", "profan_vorteil", "kampf_vorteil", "kampfstil", "magie_vorteil", "magie_tradition", "karma_vorteil", "karma_tradition"], makeDefault: true});

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
    CONFIG.statusEffects = [
        {
            id: 'Furcht1',
            name: 'Furcht I',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 5, priority: 1, value: 1 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/terror.svg',
            tint: STATUS_EFFECT_COLORS.YELLOW,
        },
        {
            id: 'Furcht2',
            name: 'Furcht II',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 4, priority: 2, value: 2 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/terror.svg',
            tint: STATUS_EFFECT_COLORS.ORANGE,
        },
        {
            id: 'Furcht3',
            name: 'Furcht III',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 4, priority: 3, value: 3 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/terror.svg',
            tint: STATUS_EFFECT_COLORS.RED,
        },
        {
            id: 'Furcht4',
            name: 'Furcht IV',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 4, priority: 4, value: 4 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/terror.svg',
            tint: STATUS_EFFECT_COLORS.VIOLET,
        },
        {
            id: 'schlechtesicht1',
            name: 'Schlechte Sicht (Dämmerung)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 4, value: -2 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sight-disabled.svg',
            tint: STATUS_EFFECT_COLORS.YELLOW,
        },
        {
            id: 'schlechtesicht2',
            name: 'Schlechte Sicht (Mondlicht)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 6, value: -4 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sight-disabled.svg',
            tint: STATUS_EFFECT_COLORS.ORANGE,
        },
        {
            id: 'schlechtesicht3',
            name: 'Schlechte Sicht (Sternenlicht)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 7, value: -8 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sight-disabled.svg',
            tint: STATUS_EFFECT_COLORS.RED,
        },
        {
            id: 'schlechtesicht4',
            name: 'Schlechte Sicht (Blind)',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 8, value: -16 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sight-disabled.svg',
            tint: STATUS_EFFECT_COLORS.VIOLET,
        },
        {
            id: 'untergrund1',
            name: 'Unsicherer Untergrund (knietiefes Wasser)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 4, value: -2 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sticky-boot.svg',
            tint: STATUS_EFFECT_COLORS.YELLOW,
        },
        {
            id: 'untergrund2',
            name: 'Unsicherer Untergrund (eisglatt, hüfttiefes Wasser)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 6, value: -4 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sticky-boot.svg',
            tint: STATUS_EFFECT_COLORS.ORANGE,
        },
        {
            id: 'untergrund3',
            name: 'Unsicherer Untergrund (schultertiefes Wasser)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 7, value: -8 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sticky-boot.svg',
            tint: STATUS_EFFECT_COLORS.RED,
        },
        {
            id: 'untergrund4',
            name: 'Unsicherer Untergrund (Drahtseil)',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 8, value: -16 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/sticky-boot.svg',
            tint: STATUS_EFFECT_COLORS.VIOLET,
        },
        {
            id: 'Position1',
            name: 'Sehr vorteilhafte Position',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 9, value: +4 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/hill-fort-green.svg',
        },
        {
            id: 'Position2',
            name: 'Vorteilhafte Position',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 10, value: +2 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/hill-conquest-light-green.svg',
        },
        {
            id: 'Position3',
            name: 'Schlechte Position (Kniend)',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 12, value: -2 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/kneeling-yellow.svg',
        },
        {
            id: 'Position4',
            name: 'Sehr schlechte Position (Liegend)',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 13, value: -4 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/falling-orange.svg',
        },
        {
            id: 'Nahkampf1',
            name: 'Nahkampf +4',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 9, value: +4 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman.svg',
            tint: STATUS_EFFECT_COLORS.GREEN,
        },
        {
            id: 'Nahkampf2',
            name: 'Nahkampf +2',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 10, value: +2 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman.svg',
            tint: STATUS_EFFECT_COLORS.YELLOW,
        },
        {
            id: 'Nahkampf3',
            name: 'Nahkampf -2',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 12, value: -2 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman.svg',
            tint: STATUS_EFFECT_COLORS.ORANGE,
        },
        {
            id: 'Nahkampf4',
            name: 'Nahkampf -4',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 13, value: -4 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman.svg',
            tint: STATUS_EFFECT_COLORS.RED,
            //flags.core.overlay = true for overlay icon
        },
    ]

    registerIlarisGameSettings()
})

Hooks.on('getSceneControlButtons', (controls) => {
    // Add character import button to the notes/journal control
    const notesControl = controls.find((c) => c.name === 'notes')
    if (notesControl && game.user.can('ACTOR_CREATE') && game.user.can('FILES_UPLOAD')) {
        notesControl.tools.push({
            name: 'import-xml-character',
            title: 'XML Character Import',
            icon: 'fas fa-file-import',
            button: true,
            onClick: () => XmlCharacterImporter.showImportDialog(),
        })
    }
})

Hooks.on('renderActorDirectory', (app, html) => {
    // Add XML import button to the actors directory header (only if user can create actors and upload files)
    if (game.user.can('ACTOR_CREATE') && game.user.can('FILES_UPLOAD')) {
        const header = html.find('.directory-header')
        if (header.length > 0) {
            const importButton = $(`
                <button class="import-xml-character" title="Import Character from XML">
                    <i class="fas fa-file-import"></i> Import Charakter XML
                </button>
            `)

            importButton.click(() => XmlCharacterImporter.showImportDialog())
            header.append(importButton)
        }
    }

    // Add sync buttons to each actor entry (only if user owns the actor, can create actors, and can upload files)
    html.find('.directory-item.actor').each((i, element) => {
        const $element = $(element)
        const actorId = $element.data('document-id')
        const actor = game.actors.get(actorId)

        if (
            actor &&
            actor.type === 'held' &&
            actor.isOwner &&
            game.user.can('ACTOR_CREATE') &&
            game.user.can('FILES_UPLOAD')
        ) {
            // Only add sync button to character actors that the user owns and has create/upload permissions
            const syncButton = $(`
                <div class="sync-xml-character onhover" title="Sync Character with XML" data-actor-id="${actorId}">
                    <i class="fas fa-sync-alt onhover"></i>
                </div>
            `)

            syncButton.click(async (event) => {
                event.stopPropagation() // Prevent opening the actor sheet
                const targetActor = game.actors.get(actorId)
                if (targetActor) {
                    await XmlCharacterImporter.showSyncDialog(targetActor)
                }
            })

            // Insert the sync button before the existing controls
            const controls = $element.find('.directory-item-controls')
            if (controls.length > 0) {
                syncButton.prependTo(controls)
            } else {
                // If no controls exist, create them
                const newControls = $('<div class="directory-item-controls"></div>')
                newControls.append(syncButton)
                $element.append(newControls)
            }
        }
    })
})

// Force apply tint colors to status effect picker icons using direct CSS styling
Hooks.on('renderTokenHUD', (app, html, data) => {
    console.log('TokenHUD rendered, looking for status effects...')

    // Wait for DOM to be ready
    setTimeout(() => {
        // Look for the status effects container
        const statusEffectsContainer = html.find('.status-effects')
        console.log('Status effects container found:', statusEffectsContainer.length)

        if (statusEffectsContainer.length > 0) {
            // Find all effect controls within the status effects container
            const effectControls = statusEffectsContainer.find('.effect-control')
            console.log('Effect controls found:', effectControls.length)

            effectControls.each((index, control) => {
                const $control = $(control)
                const statusId = $control.data('status-id')

                console.log(`Processing control ${index}: statusId=${statusId}`)
                console.log($control[0]) // Log the actual DOM element

                // Find the matching status effect configuration
                const statusConfig = CONFIG.statusEffects.find((effect) => effect.id === statusId)

                if (statusConfig && statusConfig.tint) {
                    console.log(`Applying tint ${statusConfig.tint} to status ${statusId}`)

                    // Apply filter to change only the white SVG fill to the desired color
                    const filterValue = getFilterForColor(statusConfig.tint)
                    $control.css({
                        filter: filterValue,
                        '-webkit-filter': filterValue,
                    })

                    // Force override with !important using attr
                    $control.attr(
                        'style',
                        ($control.attr('style') || '') +
                            `; filter: ${filterValue} !important;` +
                            `; -webkit-filter: ${filterValue} !important;`,
                    )

                    $control.addClass('ilaris-tinted')
                } else if (statusConfig) {
                    console.log(`Status ${statusId} found but no tint:`, statusConfig)
                } else {
                    console.log(`No status config found for ${statusId}`)
                }
            })
        }
    }, 100)
})

// Helper function to create CSS filters that convert white SVG to specific colors
function getFilterForColor(hexColor) {
    switch (hexColor.toUpperCase()) {
        case STATUS_EFFECT_COLORS.RED: // Red
            return 'brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(7151%) hue-rotate(5deg) brightness(98%) contrast(118%)'
        case STATUS_EFFECT_COLORS.GREEN: // Green
            return 'brightness(0) saturate(100%) invert(50%) sepia(89%) saturate(1174%) hue-rotate(88deg) brightness(118%) contrast(119%)'
        case STATUS_EFFECT_COLORS.YELLOW: // Yellow
            return 'brightness(0) saturate(100%) invert(85%) sepia(89%) saturate(1629%) hue-rotate(357deg) brightness(102%) contrast(104%)'
        case STATUS_EFFECT_COLORS.ORANGE: // Orange
            return 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(15deg) brightness(119%) contrast(119%)'
        case STATUS_EFFECT_COLORS.VIOLET: // Violet
            return 'brightness(0) saturate(100%) invert(27%) sepia(93%) saturate(7395%) hue-rotate(270deg) brightness(96%) contrast(128%)'
        default:
            return 'none'
    }
}

Hooks.on('getSceneControlButtons', (controls) => {
    // Add character import button to the notes/journal control
    const notesControl = controls.find((c) => c.name === 'notes')
    if (notesControl && game.user.can('ACTOR_CREATE') && game.user.can('FILES_UPLOAD')) {
        notesControl.tools.push({
            name: 'import-xml-character',
            title: 'XML Character Import',
            icon: 'fas fa-file-import',
            button: true,
            onClick: () => XmlCharacterImporter.showImportDialog(),
        })
    }
})

// Extend Scene Config with environment settings in Basic tab
Hooks.on('renderSceneConfig', async (app, html, data) => {
    // Check if already injected (to avoid duplicates when dialog is re-opened)
    if (html.find('.ilaris-environment-setting').length > 0) {
        return
    }

    // Get existing environment settings from scene flags
    const environment = app.object.getFlag('Ilaris', 'sceneConditions') || {
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
    const environmentHTML = await renderTemplate(
        'systems/Ilaris/templates/settings/scene_environment_fields.hbs',
        templateData,
    )

    // Simply append to the basic tab (within ambience group)
    const basicTab = html.find('.tab[data-tab="basic"][data-group="ambience"]')
    basicTab.append(
        '<hr style="margin: 1.5em 0; border: none; border-top: 2px solid var(--color-border-light-primary);">',
    )
    basicTab.append(environmentHTML)
})

// (Removed: closeSceneConfig hook is unnecessary; rely on Foundry's native form handling)
Hooks.on('renderActorDirectory', (app, html) => {
    // Add XML import button to the actors directory header (only if user can create actors and upload files)
    if (game.user.can('ACTOR_CREATE') && game.user.can('FILES_UPLOAD')) {
        const header = html.find('.directory-header')
        if (header.length > 0) {
            const importButton = $(`
                <button class="import-xml-character" title="Import Character from XML">
                    <i class="fas fa-file-import"></i> Import Charakter XML
                </button>
            `)

            importButton.click(() => XmlCharacterImporter.showImportDialog())
            header.append(importButton)
        }
    }

    // Add sync buttons to each actor entry (only if user owns the actor, can create actors, and can upload files)
    html.find('.directory-item.actor').each((i, element) => {
        const $element = $(element)
        const actorId = $element.data('document-id')
        const actor = game.actors.get(actorId)

        if (
            actor &&
            actor.type === 'held' &&
            actor.isOwner &&
            game.user.can('ACTOR_CREATE') &&
            game.user.can('FILES_UPLOAD')
        ) {
            // Only add sync button to character actors that the user owns and has create/upload permissions
            const syncButton = $(`
                <div class="sync-xml-character onhover" title="Sync Character with XML" data-actor-id="${actorId}">
                    <i class="fas fa-sync-alt onhover"></i>
                </div>
            `)

            syncButton.click(async (event) => {
                event.stopPropagation() // Prevent opening the actor sheet
                const targetActor = game.actors.get(actorId)
                if (targetActor) {
                    await XmlCharacterImporter.showSyncDialog(targetActor)
                }
            })

            // Insert the sync button before the existing controls
            const controls = $element.find('.directory-item-controls')
            if (controls.length > 0) {
                syncButton.prependTo(controls)
            } else {
                // If no controls exist, create them
                const newControls = $('<div class="directory-item-controls"></div>')
                newControls.append(syncButton)
                $element.append(newControls)
            }
        }
    })
})

// Combined hook for chat message rendering
Hooks.on('renderChatMessage', (message, html, data) => {
    // Format dice formulas in chat messages
    const diceFormulaElements = html.find('.dice-formula')
    diceFormulaElements.each((index, element) => {
        const $element = $(element)
        const originalFormula = $element.text().trim()

        // Extract just the dice part (before any + or -)
        const diceFormulaMatch = originalFormula.match(/^(\d+d\d+(?:dl\d+)?(?:dh\d+)?)/)
        if (diceFormulaMatch) {
            const diceFormula = diceFormulaMatch[1]
            const formattedDice = formatDiceFormula(diceFormula)

            // Replace the dice part with the formatted version, keep the rest
            const remainder = originalFormula.substring(diceFormula.length)
            $element.text(formattedDice + remainder)
        }
    })

    // Handle defense prompt message visibility
    const isDefensePrompt = message.flags?.Ilaris?.defensePrompt
    if (isDefensePrompt) {
        // Skip if defense has already been handled
        if (html.hasClass('defense-handled')) {
            return
        }

        // Check if the current user should see the content
        const targetActorId = message.flags.Ilaris.targetActorId
        const currentUserCharacterId = game.user.character?.id
        const isTarget = currentUserCharacterId === targetActorId

        // If the user is not the target, hide the content
        if (!isTarget && !game.user.isGM) {
            const contentDiv = html.find('.message-content')
            if (contentDiv.length > 0) {
                contentDiv.html(
                    '<p style="font-style: italic; opacity: 0.6;">Deine Verteidigungsaufforderung an einen anderen Spieler</p>',
                )
            }
        }

        if (isTarget || game.user.isGM) {
            // Highlight the message for the target player
            html.addClass('ilaris-defense-prompt-highlight')
        }
    }
})

// Cache for hex token shapes setting
let hexTokenShapesEnabled = false

// Apply hexagonal token shapes when setting is enabled
Hooks.on('ready', async () => {
    registerDefenseButtonHook()
    applyHexTokenSetting()
    setupIlarisSocket()
    // Preload all waffeneigenschaften into cache
    await preloadAllEigenschaften()
    // Run world migration if needed (GM only, once per world)
    await runMigrationIfNeeded()
})

/**
 * Set up socket listeners for Ilaris system
 * This allows players to request the GM to perform actions they don't have permission for
 */
function setupIlarisSocket() {
    game.socket.on('system.Ilaris', async (data) => {
        // Only GM should handle these requests
        if (!game.user.isGM) return

        switch (data.type) {
            case 'applyDamage':
                await handleApplyDamageRequest(data.data)
                break
            default:
                console.warn(`Unknown Ilaris socket request type: ${data.type}`)
        }
    })
}

/**
 * Handle a damage application request from a player
 * Only called on GM's client
 */
async function handleApplyDamageRequest(data) {
    const { targetActorId, damage, damageType, trueDamage, speaker } = data

    const targetActor = game.actors.get(targetActorId)
    if (!targetActor) {
        console.error(`Target actor ${targetActorId} not found`)
        return
    }

    // Import the helper function
    const { _applyDamageDirectly } = await import('./sheets/dialogs/shared_dialog_helpers.js')

    // Apply damage as GM
    await _applyDamageDirectly(targetActor, damage, damageType, trueDamage, speaker)
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
 * Apply or remove the hex token setting visual indicator
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
// Add Automatisierung heading in settings, pretty scuffed solution but i did not manage to add a separate category to the settings without adding a new module
Hooks.on('renderSettingsConfig', (app, html) => {
    // Find the first Automatisierung setting
    const automationSetting = html
        .find('[name="Ilaris.useSceneEnvironment"]')
        .closest('.form-group')

    if (automationSetting.length > 0) {
        // Insert a heading before it
        automationSetting.before(
            '<h3 class="setting-header" style="border-bottom: 1px solid var(--color-border-light-primary); padding: 0.5em 0; margin-top: 1em;">Automatisierung</h3>',
        )
    }
})
