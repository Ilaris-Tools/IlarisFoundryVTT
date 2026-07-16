import { IlarisSettingsDialog } from './ilaris-settings.dialog.js'

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
            config: false,
            requiresReload: true,
        },
        {
            // Register real fumble crits setting
            settingsName: IlarisGameSettingNames.realFumbleCrits,
            name: 'Echte Patzer und Krits',
            hint: 'Die Worldsetting ist für alle gedacht, die es nicht mögen, dass eine 1 kein Patzer ist, weil die Probe mit einem Würfelwurf von 1 gelungen wäre oder es kein Krit mit 20 ist, weil die Probe mehr als eine 20 benötigen würde.',
            config: false,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
        },
        {
            // Rename Triumph with Crit
            settingsName: IlarisGameSettingNames.renameTriumphWithCrit,
            name: 'Umbenennen von Triumph in Crit im Text',
            hint: 'Die Worldsetting ist für alle gedacht, die lieber das Wort Crit verwenden anstelle von Triumph',
            config: false,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
        },
        {
            // Register restrict energy cost setting
            settingsName: IlarisGameSettingNames.restrictEnergyCostSetting,
            name: 'Energiekosten-Einstellung einschränken',
            hint: 'Wenn aktiviert, können Energiekosten nur bei Unitatio-Vorteil oder nicht-numerischen Kosten gesetzt werden. Wenn deaktiviert, können Energiekosten immer manuell gesetzt werden.',
            config: false,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
            default: false,
        },
        {
            // Register hide sync kampfstile button setting
            settingsName: IlarisGameSettingNames.hideSyncKampfstileButton,
            name: 'Charakter-Synchronisation Button ausblenden',
            hint: 'Wenn aktiviert, wird der Button "Charakter mit Kompendium-Vorteilen Synchronisieren" auf dem Heldensheet ausgeblendet.',
            config: false,
            type: new foundry.data.fields.BooleanField(),
            scope: 'client',
            default: true,
        },
        {
            // Register enable tabbing functionality in character sheet
            settingsName: IlarisGameSettingNames.enableTabbingCharacterSheet,
            name: 'Heldensheet Reiter Rotation mit Tab aktivieren',
            hint: 'Wenn aktiviert, kann auf dem Heldensheet mit Tab zwischen den Reitern rotiert werden.',
            config: false,
            type: new foundry.data.fields.BooleanField(),
            scope: 'client',
            default: false,
            requiresReload: true,
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
            config: false,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
            default: false,
        },
        {
            // Register default ranged dodge talent setting
            settingsName: IlarisGameSettingNames.defaultRangedDodgeTalent,
            name: 'Alternativ Fernkampf-Ausweichen Talent',
            hint: 'Das Alternativ-Talent, das zum Ausweichen von Fernkampfangriffen verwendet wird. Per Default wird Akrobatik verwendet.',
            config: false,
            type: String,
            scope: 'world',
            default: '',
        },
        {
            // Register LEP system setting
            settingsName: IlarisGameSettingNames.lepSystem,
            name: 'LEP-System verwenden',
            hint: 'Wenn aktiviert, wird das Wundensystem durch ein direktes Lebenspunkte (LEP) System ersetzt. Schaden reduziert direkt die HP anstatt Wunden zu verursachen. Änderung dieser Einstellung benötigt einen Neustart von Foundry.',
            config: false,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
            default: false,
            requiresReload: true,
        },
        {
            // Register damage types setting
            settingsName: IlarisGameSettingNames.damageTypes,
            name: 'Schadenstypen',
            hint: 'Definiert die verfügbaren Schadenstypen für Pre-Effects und zukünftige Systemfunktionen. Jeder Typ hat einen Wert (Key) und einen Anzeigenamen (Label).',
            config: false,
            type: String,
            scope: 'world',
            default:
                '[{"value":"PROFAN","label":"Profan (Wunden)"},{"value":"STUMPF","label":"Stumpf (Erschöpfung)"},{"value":"MAGISCH","label":"Magisch"},{"value":"GEWEIHT","label":"Geweiht"},{"value":"DAEMONISCH","label":"Dämonisch"},{"value":"FEUER","label":"Feuer"},{"value":"EIS","label":"Eis"},{"value":"ERZ","label":"Erz"},{"value":"HUMUS","label":"Humus"},{"value":"LUFT","label":"Luft"},{"value":"WASSER","label":"Wasser"}]',
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
            config: false,
            type: new foundry.data.fields.BooleanField(),
            scope: 'world',
            default: true,
        },
        {
            // Register use target selection setting
            settingsName: IlarisAutomatisierungSettingNames.useTargetSelection,
            name: 'Zielauswahl-System verwenden',
            hint: 'Wenn aktiviert, werden in Kampfdialogen die Zielauswahl-Funktion und automatische Verteidigungsaufforderungen angezeigt.',
            config: false,
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
            default:
                '["Ilaris.fertigkeiten-und-talente","Ilaris.fertigkeiten-und-talente-advanced","Ilaris.ubernaturliche-fertigkeiten"]',
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
            default:
                '["Ilaris.fertigkeiten-und-talente","Ilaris.fertigkeiten-und-talente-advanced","Ilaris.liturgien-und-mirakel","Ilaris.zauberspruche-und-rituale","Ilaris.zaubertricks-advanced"]',
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

    game.settings.registerMenu(
        ConfigureGameSettingsCategories.Ilaris,
        IlarisGameSettingsMenuNames.ilarisSettingsMenu,
        {
            name: 'Ilaris Einstellungen',
            label: 'Ilaris Einstellungen öffnen',
            hint: 'Konfiguriere alle Ilaris-Systemeinstellungen.',
            icon: 'fas fa-cog',
            type: IlarisSettingsDialog,
            restricted: false,
        },
    )
}
