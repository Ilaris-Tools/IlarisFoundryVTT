import { ManeuverPacksSettings } from './ManeuverPacksSettings.js'
import { VorteilePacksSettings } from './VorteilePacksSettings.js'
import { WaffeneigenschaftenPacksSettings } from './WaffeneigenschaftenPacksSettings.js'

import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
    IlarisGameSettingsMenuNames,
    IlarisAutomatisierungSettingNames,
} from './configure-game-settings.model.js'

export const registerIlarisGameSettings = () => {
    const Scope = {
        Client: 'client',
        World: 'world',
    }

    ;[
        {
            settingsName: IlarisGameSettingNames.weaponSpaceRequirement,
            name: 'Platzbedarf berücksichtigen',
            hint: 'Platzbedarf ist eine Hausregel aus Ilaris Advanced. Ohne Haken wird der Platzbedarf nicht angezeigt und in Berechnungen als 0 angenommen. Änderung dieser Einstellungen benötigt einen Neustart von Foundry',
            scope: Scope.World,
            type: Boolean,
            default: false,
            config: true,
            requiresReload: true,
        },
        {
            // Register maneuver packs setting
            settingsName: IlarisGameSettingNames.manoeverPacks,
            name: 'Manöver Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Manöver enthalten. Dadurch bestimmst du, welche Manöver du in Kampfdialogen sehen kannst.',
            scope: 'world',
            config: false, // Hide from settings menu since we use custom menu
            type: String,
            default: '["Ilaris.manover"]', // Default to Ilaris.manoever pack
            onChange: (value) => {
                // Notify that maneuver packs have changed
                Hooks.callAll('ilarisManoeverPacksChanged', JSON.parse(value))
            },
        },
        {
            // Register vorteile packs setting
            settingsName: IlarisGameSettingNames.vorteilePacks,
            name: 'Vorteile Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Vorteile enthalten.',
            scope: 'world',
            config: false, // Hide from settings menu since we use custom menu
            type: String,
            default: '["Ilaris.vorteile"]', // Default to Ilaris.vorteile pack
            onChange: (value) => {
                // Notify that vorteile packs have changed
                Hooks.callAll('ilarisVorteilePacksChanged', JSON.parse(value))
            },
        },
        {
            // Register waffeneigenschaften packs setting
            settingsName: IlarisGameSettingNames.waffeneigenschaftenPacks,
            name: 'Waffeneigenschaften Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Waffeneigenschaften enthalten.',
            scope: 'world',
            config: false, // Hide from settings menu since we use custom menu
            type: String,
            default: '["Ilaris.waffeneigenschaften"]', // Default to Ilaris.waffeneigenschaften pack
            onChange: (value) => {
                // Notify that waffeneigenschaften packs have changed
                Hooks.callAll('ilarisWaffeneigenschaftenPacksChanged', JSON.parse(value))
            },
        },
        {
            // Register real fumble crits setting
            settingsName: IlarisGameSettingNames.realFumbleCrits,
            name: 'Echte Patzer und Krits',
            hint: 'Die Worldsetting ist für alle gedacht, die es nicht mögen, dass eine 1 kein Patzer ist, weil die Probe mit einem Würfelwurf von 1 gelungen wäre oder es kein Krit mit 20 ist, weil die Probe mehr als eine 20 benötigen würde.',
            config: true,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
        },
        {
            // Register restrict energy cost setting
            settingsName: IlarisGameSettingNames.restrictEnergyCostSetting,
            name: 'Energiekosten-Einstellung einschränken',
            hint: 'Wenn aktiviert, können Energiekosten nur bei Unitatio-Vorteil oder nicht-numerischen Kosten gesetzt werden. Wenn deaktiviert, können Energiekosten immer manuell gesetzt werden.',
            config: true,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
            default: false,
        },
        {
            // Register hide sync kampfstile button setting
            settingsName: IlarisGameSettingNames.hideSyncKampfstileButton,
            name: 'Charakter-Synchronisation Button ausblenden',
            hint: 'Wenn aktiviert, wird der Button "Charakter mit Kompendium-Vorteilen Synchronisieren" auf dem Heldensheet ausgeblendet.',
            config: true,
            type: new foundry.data.fields.BooleanField(),
            scope: 'client',
            default: true,
        },
        {
            // Register last seen breaking changes version setting
            settingsName: IlarisGameSettingNames.lastSeenBreakingChangesVersion,
            name: 'Zuletzt gesehene Breaking Changes Version',
            hint: 'Interne Einstellung zur Verfolgung der zuletzt angezeigten Breaking Changes Benachrichtigung.',
            config: false, // Hidden from settings menu
            type: String,
            scope: 'client', // Each user tracks their own
            default: '',
        },
        {
            // Register hex token shapes setting
            settingsName: IlarisGameSettingNames.hexTokenShapes,
            name: 'Hexagonale Token-Bilder',
            hint: 'Wenn aktiviert, werden Charakterbilder auf Hexfeld-Karten als Hexagone zugeschnitten.',
            config: true,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
            default: false,
        },
    ].forEach((setting) => {
        game.settings.register(ConfigureGameSettingsCategories.Ilaris, setting.settingsName, {
            name: setting.name,
            hint: setting.hint,
            config: setting.config,
            type: setting.type,
            scope: setting.scope,
            default: setting.default,
            onChange: setting.onChange,
            requiresReload: setting.requiresReload,
        })
    })

    // the heading for Automatisierung gets added via hooks.js
    ;[
        {
            // Register use scene environment setting
            settingsName: IlarisAutomatisierungSettingNames.useSceneEnvironment,
            name: 'Scene-Umgebungseinstellungen verwenden',
            hint: 'Wenn aktiviert, werden Licht und Wetter aus den Scene-Einstellungen automatisch in Fernkampf-Dialogen vorausgewählt.',
            config: true,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
            default: true,
        },
    ].forEach((setting) => {
        game.settings.register(ConfigureGameSettingsCategories.Ilaris, setting.settingsName, {
            name: setting.name,
            hint: setting.hint,
            config: setting.config,
            type: setting.type,
            scope: setting.scope,
            default: setting.default,
            onChange: setting.onChange,
            requiresReload: setting.requiresReload,
        })
    })

    // the heading for Automatisierung gets added via hooks.js
    ;[
        {
            // Register use scene environment setting
            settingsName: IlarisAutomatisierungSettingNames.useSceneEnvironment,
            name: 'Scene-Umgebungseinstellungen verwenden',
            hint: 'Wenn aktiviert, werden Licht und Wetter aus den Scene-Einstellungen automatisch in Fernkampf-Dialogen vorausgewählt.',
            config: true,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
            default: true,
        },
    ].forEach((setting) => {
        game.settings.register(ConfigureGameSettingsCategories.Ilaris, setting.settingsName, {
            name: setting.name,
            hint: setting.hint,
            config: setting.config,
            type: setting.type,
            scope: setting.scope,
            default: setting.default,
            onChange: setting.onChange,
            requiresReload: setting.requiresReload,
        })
    })
    ;[
        {
            // Register the settings menu for maneuvers
            settingsName: IlarisGameSettingsMenuNames.manoeverPacksMenu,
            name: 'Manöver Kompendien',
            label: 'Manöver Kompendien Konfigurieren',
            hint: 'Hier kannst du die Kompendien auswählen, die Manöver enthalten. Dadurch bestimmst du, welche Manöver du in Kampfdialogen sehen kannst.',
            icon: 'fas fa-book',
            type: ManeuverPacksSettings,
            restricted: true,
        },
        {
            settingsName: IlarisGameSettingsMenuNames.vorteilePacksMenu,
            name: 'Vorteile Kompendien',
            label: 'Vorteile Kompendien Konfigurieren',
            hint: 'Hier kannst du die Kompendien auswählen, die Vorteile enthalten.',
            icon: 'fas fa-book',
            type: VorteilePacksSettings,
            restricted: true,
        },
        {
            settingsName: IlarisGameSettingsMenuNames.waffeneigenschaftenPacksMenu,
            name: 'Waffeneigenschaften Kompendien',
            label: 'Waffeneigenschaften Kompendien Konfigurieren',
            hint: 'Hier kannst du die Kompendien auswählen, die Waffeneigenschaften enthalten.',
            icon: 'fas fa-book',
            type: WaffeneigenschaftenPacksSettings,
            restricted: true,
        },
    ].forEach((setting) => {
        game.settings.registerMenu(ConfigureGameSettingsCategories.Ilaris, setting.settingsName, {
            name: setting.name,
            label: setting.label,
            hint: setting.hint,
            icon: setting.icon,
            type: setting.type,
            restricted: setting.restricted,
        })
    })
}
