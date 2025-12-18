import { ManeuverPacksSettings } from './ManeuverPacksSettings.js'
import { VorteilePacksSettings } from './VorteilePacksSettings.js'
import { WaffeneigenschaftenPacksSettings } from './WaffeneigenschaftenPacksSettings.js'
import { AbgeleiteteWertePacksSettings } from './AbgeleiteteWertePacksSettings.js'
import { FertigkeitenPacksSettings } from './FertigkeitenPacksSettings.js'
import { WaffenPacksSettings } from './WaffenPacksSettings.js'
import { TalentePacksSettings } from './TalentePacksSettings.js'

import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
    IlarisAutomatisierungSettingNames,
    IlarisGameSettingsMenuNames,
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
            // Register real fumble crits setting
            settingsName: IlarisGameSettingNames.realFumbleCrits,
            name: 'Echte Patzer und Krits',
            hint: 'Die Worldsetting ist für alle gedacht, die es nicht mögen, dass eine 1 kein Patzer ist, weil die Probe mit einem Würfelwurf von 1 gelungen wäre oder es kein Krit mit 20 ist, weil die Probe mehr als eine 20 benötigen würde.',
            config: true,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
        },
        {
            // Rename Triumph with Crit
            settingsName: IlarisGameSettingNames.renameTriumphWithCrit,
            name: 'Umbenennen von Triumph in Crit im Text',
            hint: 'Die Worldsetting ist für alle gedacht, die lieber das Wort Crit verwenden anstelle von Triumph',
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
        {
            // Register default ranged dodge talent setting
            settingsName: IlarisGameSettingNames.defaultRangedDodgeTalent,
            name: 'Alternativ Fernkampf-Ausweichen Talent',
            hint: 'Das Alternativ-Talent, das zum Ausweichen von Fernkampfangriffen verwendet wird. Per Default wird Akrobatik verwendet.',
            config: true,
            type: String,
            scope: 'world',
            default: '',
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
        {
            // Register use target selection setting
            settingsName: IlarisAutomatisierungSettingNames.useTargetSelection,
            name: 'Zielauswahl-System verwenden',
            hint: 'Wenn aktiviert, werden in Kampfdialogen die Zielauswahl-Funktion und automatische Verteidigungsaufforderungen angezeigt.',
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

    // the heading for Kompendien gets added via hooks.js
    ;[
        {
            // Register fertigkeiten packs setting
            settingsName: IlarisGameSettingNames.fertigkeitenPacks,
            name: 'Fertigkeiten Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Fertigkeiten enthalten.',
            scope: 'world',
            config: false,
            type: String,
            default: '["Ilaris.fertigkeiten-und-talente"]',
            requiresReload: true,
            onChange: (value) => {
                Hooks.callAll('ilarisFertigkeitenPacksChanged', JSON.parse(value))
            },
        },
        {
            // Register waffen packs setting
            settingsName: IlarisGameSettingNames.waffenPacks,
            name: 'Waffen Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Waffen enthalten.',
            scope: 'world',
            config: false,
            type: String,
            default: '["Ilaris.waffen"]',
            requiresReload: true,
            onChange: (value) => {
                Hooks.callAll('ilarisWaffenPacksChanged', JSON.parse(value))
            },
        },
        {
            // Register talente packs setting
            settingsName: IlarisGameSettingNames.talentePacks,
            name: 'Talente Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Talente enthalten.',
            scope: 'world',
            config: false,
            type: String,
            default: '["Ilaris.fertigkeiten-und-talente"]',
            requiresReload: true,
            onChange: (value) => {
                Hooks.callAll('ilarisTalentePacksChanged', JSON.parse(value))
            },
        },
        {
            // Register maneuver packs setting
            settingsName: IlarisGameSettingNames.manoeverPacks,
            name: 'Manöver Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Manöver enthalten. Dadurch bestimmst du, welche Manöver du in Kampfdialogen sehen kannst.',
            scope: 'world',
            config: false,
            type: String,
            default: '["Ilaris.manover"]',
            requiresReload: true,
            onChange: (value) => {
                Hooks.callAll('ilarisManoeverPacksChanged', JSON.parse(value))
            },
        },
        {
            // Register vorteile packs setting
            settingsName: IlarisGameSettingNames.vorteilePacks,
            name: 'Vorteile Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Vorteile enthalten.',
            scope: 'world',
            config: false,
            type: String,
            default: '["Ilaris.vorteile"]',
            requiresReload: true,
            onChange: (value) => {
                Hooks.callAll('ilarisVorteilePacksChanged', JSON.parse(value))
            },
        },
        {
            // Register waffeneigenschaften packs setting
            settingsName: IlarisGameSettingNames.waffeneigenschaftenPacks,
            name: 'Waffeneigenschaften Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Waffeneigenschaften enthalten.',
            scope: 'world',
            config: false,
            type: String,
            default: '["Ilaris.waffeneigenschaften"]',
            requiresReload: true,
            onChange: (value) => {
                Hooks.callAll('ilarisWaffeneigenschaftenPacksChanged', JSON.parse(value))
            },
        },
        {
            // Register abgeleitete werte packs setting - NO DEFAULT VALUE
            settingsName: IlarisGameSettingNames.abgeleiteteWertePacks,
            name: 'Abgeleitete Werte Kompendien',
            hint: 'Hier kannst du die Kompendien auswählen, die Abgeleitete Werte enthalten. Wenn keine Kompendien ausgewählt sind, werden die Standard-Berechnungen verwendet.',
            scope: 'world',
            config: false,
            type: String,
            default: '[]',
            requiresReload: true,
            onChange: (value) => {
                Hooks.callAll('ilarisAbgeleiteteWertePacksChanged', JSON.parse(value))
            },
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

    // the heading for Kompendien gets added via hooks.js
    ;[
        {
            settingsName: IlarisGameSettingsMenuNames.fertigkeitenPacksMenu,
            name: 'Fertigkeiten Kompendien',
            label: 'Fertigkeiten Kompendien Konfigurieren',
            hint: 'Hier kannst du die Kompendien auswählen, die Fertigkeiten enthalten.',
            icon: 'fas fa-book',
            type: FertigkeitenPacksSettings,
            restricted: true,
        },
        {
            settingsName: IlarisGameSettingsMenuNames.waffenPacksMenu,
            name: 'Waffen Kompendien',
            label: 'Waffen Kompendien Konfigurieren',
            hint: 'Hier kannst du die Kompendien auswählen, die Waffen enthalten.',
            icon: 'fas fa-book',
            type: WaffenPacksSettings,
            restricted: true,
        },
        {
            settingsName: IlarisGameSettingsMenuNames.talentePacksMenu,
            name: 'Talente Kompendien',
            label: 'Talente Kompendien Konfigurieren',
            hint: 'Hier kannst du die Kompendien auswählen, die Talente enthalten.',
            icon: 'fas fa-book',
            type: TalentePacksSettings,
            restricted: true,
        },
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
        {
            settingsName: IlarisGameSettingsMenuNames.abgeleiteteWertePacksMenu,
            name: 'Abgeleitete Werte Kompendien',
            label: 'Abgeleitete Werte Kompendien Konfigurieren',
            hint: 'Hier kannst du die Kompendien auswählen, die Abgeleitete Werte enthalten. Wenn keine Kompendien ausgewählt sind, werden die Standard-Berechnungen verwendet.',
            icon: 'fas fa-calculator',
            type: AbgeleiteteWertePacksSettings,
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
