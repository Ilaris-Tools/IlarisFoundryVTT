import { ManeuverPacksSettings } from './ManeuverPacksSettings.js';
import { VorteilePacksSettings } from './VorteilePacksSettings.js';

import {IlarisGameSettingNames, ConfigureGameSettingsCategories, IlarisGameSettingsMenuNames} from './configure-game-settings.model.js';

export const registerIlarisGameSettings = () => {
    const Scope = {
        Client: "client",
        World: "world"
    };
    
    [{
        settingsName: IlarisGameSettingNames.acceptChangesV12_1,
        name: 'Update Informationen für v12.1 gelesen',
        hint: '......',
        scope: Scope.Client,
        type: new foundry.data.fields.BooleanField(),
        default: false,
        config: true,
    },{ 
        settingsName: IlarisGameSettingNames.weaponSpaceRequirement,
        name: 'Platzbedarf von Waffen anzeigen',
        hint: 'Der Platzbedarf der Waffe wird nun "0" sein',
        scope: Scope.World,
        type: Boolean,
        default: true,
        config: true,
    },{ 
        // Register maneuver packs setting
        settingsName: IlarisGameSettingNames.manoeverPacks,
        name: 'Manöver Kompendien',
        hint: 'Hier kannst du die Kompendien auswählen, die Manöver enthalten. Dadurch bestimmst du, welche Manöver du in Kampfdialogen sehen kannst.',
        scope: 'world',
        config: false, // Hide from settings menu since we use custom menu
        type: String,
        default: '["Ilaris.manover"]', // Default to Ilaris.manoever pack
        onChange: value => {
            // Notify that maneuver packs have changed
            Hooks.callAll('ilarisManoeverPacksChanged', JSON.parse(value));
        }
    }, {
        // Register vorteile packs setting
        settingsName: IlarisGameSettingNames.vorteilePacks,
        name: 'Vorteile Kompendien',
        hint: 'Hier kannst du die Kompendien auswählen, die Vorteile enthalten.',
        scope: 'world',
        config: false, // Hide from settings menu since we use custom menu
        type: String,
        default: '["Ilaris.vorteile"]', // Default to Ilaris.vorteile pack
        onChange: value => {
            // Notify that vorteile packs have changed
            Hooks.callAll('ilarisVorteilePacksChanged', JSON.parse(value));
        }
    }
].forEach((setting)=>{
        game.settings.register(ConfigureGameSettingsCategories.Ilaris, setting.settingsName, {
            name: setting.name,
            hint: setting.hint,
            config: setting.config,
            type: setting.type,
            scope: setting.scope,
            default: setting.default,
            onChange: setting.onChange
        })
    });


    [{
        // Register the settings menu for maneuvers
        settingsName: IlarisGameSettingsMenuNames.manoeverPacksMenu,
        name: 'Manöver Kompendien',
        label: 'Manöver Kompendien Konfigurieren',
        hint: 'Hier kannst du die Kompendien auswählen, die Manöver enthalten. Dadurch bestimmst du, welche Manöver du in Kampfdialogen sehen kannst.',
        icon: 'fas fa-book',
        type: ManeuverPacksSettings,
        restricted: true
    },{ 
        settingsName: IlarisGameSettingsMenuNames.vorteilePacksMenu,
        name: 'Vorteile Kompendien',
        label: 'Vorteile Kompendien Konfigurieren',
        hint: 'Hier kannst du die Kompendien auswählen, die Vorteile enthalten.',
        icon: 'fas fa-book',
        type: VorteilePacksSettings,
        restricted: true
    },
].forEach((setting)=>{
        game.settings.registerMenu(ConfigureGameSettingsCategories.Ilaris, setting.settingsName, {
            name: setting.name,
            label: setting.label,
            hint: setting.hint,
            icon: setting.icon,
            type: setting.type,
            restricted: setting.restricted,
        })
    });
}
