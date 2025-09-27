import { ILARIS } from './config.js'
import { IlarisActorProxy } from './actors/proxy.js'
import { IlarisItemProxy } from './items/proxy.js'
import { initializeHandlebars } from './common/handlebars.js'
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
import { InfoSheet } from './sheets/items/info.js'
import { AngriffSheet } from './sheets/items/angriff.js'
import { FreiesTalentSheet } from './sheets/items/freies_talent.js'
import { registerIlarisGameSettings } from './settings/configure-game-settings.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from './settings/configure-game-settings.model.js'
import { XmlCharacterImporter } from './common/xml_character_importer.js'

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
    Items.registerSheet('Ilaris', AngriffSheet, { types: ['angriff'], makeDefault: true })
    Items.registerSheet('Ilaris', InfoSheet, { types: ['info'], makeDefault: true })
    Items.registerSheet('Ilaris', FreiesTalentSheet, { types: ['freiestalent'], makeDefault: true })
    // Items.registerSheet("Ilaris", VorteilSheet, {types: ["allgemein_vorteil", "profan_vorteil", "kampf_vorteil", "kampfstil", "magie_vorteil", "magie_tradition", "karma_vorteil", "karma_tradition"], makeDefault: true});
    initializeHandlebars()
    // game.sephrasto = new SephrastoImporter();
    CONFIG.ILARIS = ILARIS
    CONFIG.Combat.initiative = { formula: '@initiative', decimals: 1 }
    CONFIG.statusEffects = [
        {
            id: 'Furcht1',
            label: 'Furcht I',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 5, priority: 1, value: 1 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-yellow.svg',
        },
        {
            id: 'Furcht2',
            label: 'Furcht II',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 4, priority: 2, value: 2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-orange.svg',
        },
        {
            id: 'Furcht3',
            label: 'Furcht III',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 4, priority: 3, value: 3 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-red.svg',
        },
        {
            id: 'Furcht4',
            label: 'Furcht IV',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 4, priority: 4, value: 4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-purple.svg',
        },
        {
            id: 'schlechtesicht1',
            label: 'Schlechte Sicht (Dämmerung)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 4, value: -2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sight-disabled-yellow.svg',
        },
        {
            id: 'schlechtesicht2',
            label: 'Schlechte Sicht (Mondlicht)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 6, value: -4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sight-disabled-orange.svg',
        },
        {
            id: 'schlechtesicht3',
            label: 'Schlechte Sicht (Sternenlicht)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 7, value: -8 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sight-disabled-red.svg',
        },
        {
            id: 'schlechtesicht4',
            label: 'Schlechte Sicht (Blind)',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 8, value: -16 },
            ],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sight-disabled-purple.svg',
        },
        {
            id: 'untergrund1',
            label: 'Unsicherer Untergrund (knietiefes Wasser)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 4, value: -2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sticky-boot-yellow.svg',
        },
        {
            id: 'untergrund2',
            label: 'Unsicherer Untergrund (eisglatt, hüfttiefes Wasser)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 6, value: -4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sticky-boot-orange.svg',
        },
        {
            id: 'untergrund3',
            label: 'Unsicherer Untergrund (schultertiefes Wasser)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 7, value: -8 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sticky-boot-red.svg',
        },
        {
            id: 'untergrund4',
            label: 'Unsicherer Untergrund (Drahtseil)',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 8, value: -16 },
            ],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sticky-boot-purple.svg',
        },
        {
            id: 'Position1',
            label: 'Sehr vorteilhafte Position',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 9, value: +4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/hill-fort-green.svg',
            // tint: "#CC00CC"
        },
        {
            id: 'Position2',
            label: 'Vorteilhafte Position',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 10, value: +2 },
            ],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/hill-conquest-light-green.svg',
        },
        {
            id: 'Position3',
            label: 'Schlechte Position (Kniend)',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 12, value: -2 },
            ],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/kneeling-yellow.svg',
        },
        {
            id: 'Position4',
            label: 'Sehr schlechte Position (Liegend)',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 13, value: -4 },
            ],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/falling-orange.svg',
        },
        {
            id: 'Nahkampf1',
            label: 'Nahkampf +4',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 9, value: +4 }],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman1.svg',
            flags: { Ilaris: { cssClass: 'status-effect-red' } },
        },
        {
            id: 'Nahkampf2',
            label: 'Nahkampf +2',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 10, value: +2 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman1.svg',
            flags: { Ilaris: { cssClass: 'status-effect-green' } },
        },
        {
            id: 'Nahkampf3',
            label: 'Nahkampf -2',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 12, value: -2 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman1.svg',
            flags: { Ilaris: { cssClass: 'status-effect-yellow' } },
        },
        {
            id: 'Nahkampf4',
            label: 'Nahkampf -4',
            duration: [],
            changes: [
                { key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 13, value: -4 },
            ],
            isTemporary: 0,
            img: 'systems/Ilaris/assets/images/icon/swordwoman1.svg',
            flags: { Ilaris: { cssClass: 'status-effect-orange' } },
        },
    ]

    registerIlarisGameSettings()
})

Hooks.on('applyActiveEffect', (actor, data, options, userId) => {
    console.log(data)
    console.log(actor)
    console.log('EFFECT!!! ')
    data.changes = []
    console.log(actor)
    console.log(options)
    return userId
})

// Hook to apply CSS classes to status effect icons
Hooks.on('renderTokenHUD', (app, html, data) => {
    const statusEffects = html.find('.status-effects .effect-control')
    statusEffects.each(function () {
        const img = $(this)
        const effectId = img.data('status-id')

        // Find the effect configuration
        const effect = CONFIG.statusEffects.find((e) => e.id === effectId)
        if (effect && effect.flags?.Ilaris?.cssClass) {
            img.addClass(effect.flags.Ilaris.cssClass)
        }
    })
})

// Hook to apply CSS classes to status effects in actor sheets
Hooks.on('renderActorSheet', (app, html, data) => {
    const statusEffects = html.find('.status-effects .effect-control')
    statusEffects.each(function () {
        const img = $(this)
        const effectId = img.data('status-id')

        // Find the effect configuration
        const effect = CONFIG.statusEffects.find((e) => e.id === effectId)
        if (effect && effect.flags?.Ilaris?.cssClass) {
            img.addClass(effect.flags.Ilaris.cssClass)
        }
    })
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
