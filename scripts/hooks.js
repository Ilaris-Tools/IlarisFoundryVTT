import { ILARIS } from './config.js';
import { IlarisActorProxy } from './actors/proxy.js';
import { IlarisItemProxy } from './items/proxy.js';
import { initializeHandlebars } from './common/handlebars.js';
// import { IlarisActorSheet } from "./sheets/actor.js";
import { HeldenSheet } from './sheets/helden.js';
import { KreaturSheet } from './sheets/kreatur.js';
import { RuestungSheet } from './sheets/items/ruestung.js';
import { UebernatuerlichFertigkeitSheet } from './sheets/items/uebernatuerlich_fertigkeit.js';
import { UebernatuerlichTalentSheet } from './sheets/items/uebernatuerlich_talent.js';
import { FertigkeitSheet } from './sheets/items/fertigkeit.js';
import { TalentSheet } from './sheets/items/talent.js';
// import { SephrastoImporter } from "./common/sephrasto_importer.js";
import { NahkampfwaffeSheet } from './sheets/items/nahkampfwaffe.js';
import { FernkampfwaffeSheet } from './sheets/items/fernkampfwaffe.js';
import { GegenstandSheet } from './sheets/items/gegenstand.js';
import { FreieFertigkeitSheet } from './sheets/items/freie_fertigkeit.js';
import { VorteilSheet } from './sheets/items/vorteil.js';
import { ManoeverSheet } from './sheets/items/manoever.js';
import { EigenheitSheet } from './sheets/items/eigenheit.js';
import { EigenschaftSheet } from './sheets/items/eigenschaft.js';
import { InfoSheet } from './sheets/items/info.js';
import { AngriffSheet } from './sheets/items/angriff.js';
import { FreiesTalentSheet } from './sheets/items/freies_talent.js';
import { registerIlarisGameSettings } from './settings/configure-game-settings.js'
import { IlarisGameSettingNames, ConfigureGameSettingsCategories } from './settings/configure-game-settings.model.js'

Hooks.once('init', () => {
    // CONFIG.debug.hooks = true;
    // ACTORS
    CONFIG.Actor.documentClass = IlarisActorProxy;  // TODO: Proxy
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('Ilaris', HeldenSheet, { types: ['held'], makeDefault: true });
    Actors.registerSheet('Ilaris', KreaturSheet, { types: ['kreatur'], makeDefault: true });

    // ITEMS
    CONFIG.Item.documentClass = IlarisItemProxy;
    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('Ilaris', RuestungSheet, { types: ['ruestung'], makeDefault: true });
    Items.registerSheet('Ilaris', NahkampfwaffeSheet, {
        types: ['nahkampfwaffe'],
        makeDefault: true,
    });
    Items.registerSheet('Ilaris', FernkampfwaffeSheet, { types: ['fernkampfwaffe'], makeDefault: true });
    Items.registerSheet('Ilaris', GegenstandSheet, { types: ['gegenstand'], makeDefault: true });
    Items.registerSheet('Ilaris', FertigkeitSheet, { types: ['fertigkeit'], makeDefault: true });
    Items.registerSheet('Ilaris', TalentSheet, { types: ['talent'], makeDefault: true });
    Items.registerSheet('Ilaris', UebernatuerlichFertigkeitSheet, {
        types: ['uebernatuerliche_fertigkeit'],
        makeDefault: true,
    });
    Items.registerSheet('Ilaris', UebernatuerlichTalentSheet, {
        types: ['zauber', 'liturgie'],
        makeDefault: true,
    });
    Items.registerSheet('Ilaris', FreieFertigkeitSheet, {
        types: ['freie_fertigkeit'],
        makeDefault: true,
    });
    Items.registerSheet('Ilaris', VorteilSheet, { types: ['vorteil'], makeDefault: true });
    Items.registerSheet('Ilaris', ManoeverSheet, { types: ['manoever'], makeDefault: true });
    Items.registerSheet('Ilaris', EigenheitSheet, { types: ['eigenheit'], makeDefault: true });
    Items.registerSheet('Ilaris', EigenschaftSheet, { types: ['eigenschaft'], makeDefault: true });
    Items.registerSheet('Ilaris', AngriffSheet, { types: ['angriff'], makeDefault: true });
    Items.registerSheet('Ilaris', InfoSheet, { types: ['info'], makeDefault: true });
    Items.registerSheet('Ilaris', FreiesTalentSheet, { types: ['freiestalent'], makeDefault: true });
    // Items.registerSheet("Ilaris", VorteilSheet, {types: ["allgemein_vorteil", "profan_vorteil", "kampf_vorteil", "kampfstil", "magie_vorteil", "magie_tradition", "karma_vorteil", "karma_tradition"], makeDefault: true});
    initializeHandlebars();
    // game.sephrasto = new SephrastoImporter();
    CONFIG.ILARIS = ILARIS;
    CONFIG.Combat.initiative = { formula: '@initiative', decimals: 1 };
    CONFIG.statusEffects = [
        {
            id: 'Furcht1',
            label: 'Furcht I',
            duration: [],
            changes: [{ key: 'system.furcht.furchtstufe', mode: 5, priority: 1, value: 1 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-yellow.svg',
            // tint: "#ffcc00"
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
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 8, value: -16 }],
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
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 8, value: -16 }],
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
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 10, value: +2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/hill-conquest-light-green.svg',
        },
        {
            id: 'Position3',
            label: 'Schlechte Position (Kniend)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 12, value: -2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/kneeling-yellow.svg',
        },
        {
            id: 'Position4',
            label: 'Sehr schlechte Position (Liegend)',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 13, value: -4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/falling-orange.svg',
        },
        {
            id: 'Nahkampf1',
            label: 'Nahkampf +4',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 9, value: +4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/swordwoman-green.svg',
            // tint: "#CC00CC"
        },
        {
            id: 'Nahkampf2',
            label: 'Nahkampf +2',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 10, value: +2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/swordwoman-light-green.svg',
        },
        {
            id: 'Nahkampf3',
            label: 'Nahkampf -2',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 12, value: -2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/swordwoman-yellow.svg',
        },
        {
            id: 'Nahkampf4',
            label: 'Nahkampf -4',
            duration: [],
            changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, priority: 13, value: -4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/swordwoman-orange.svg',
        },
    ];
    
    registerIlarisGameSettings();
});

Hooks.on('applyActiveEffect', (actor, data, options, userId) => {
    console.log(data)
    console.log(actor)
    console.log("EFFECT!!! ");
    data.changes = [];
    console.log(actor);
    console.log(options);
    return userId;
});

Hooks.once('setup', async function () {
    if (!game.settings.get(ConfigureGameSettingsCategories.Ilaris, IlarisGameSettingNames.acceptChangesV12_1)) {
        showStartupDialog();
    }
});

class MigrationMessageDialog extends foundry.applications.api.DialogV2 {
  }

const showStartupDialog = () => {
    let content = `<p>Da es einige Änderungen gab, ist stark zu empfehlen deinen Spielercharakter, falls du einen besitzt neu von Sephrasto zu importieren. Hier ist es auch stark zu empfehlen das Sephrasto Plugin für den Foundry Export zu updaten.</p><p>Es kann sein, dass du schon einmal darauf hingewiesen wurdest, wenn du dich gerade von einem anderen Gerät anmeldest.</p>`;
    let buttons = [
        {
            label: 'Verstanden',
            callback: async () => {
                game.settings.set('Ilaris', 'acceptChangesV12_1', true);
            },
        }
    ];
    if (game.user.isGM) {
        content += `<p>Bist du die Spielleitung oder verwaltest diese Welt, gibt dir der Button unten die Möglichkeit deine eigenen Kreaturen und NSCs automatisch updaten zu lassen.</p>`;
        buttons.push({
            icon: 'fa fa-check',
            label: 'Kreaturen migrieren',
            callback: async () => {
                await creatureMigration();
            },
        });
    }
    console.log("Migration Dialog",buttons);
    new MigrationMessageDialog({
        window: {
        title: 'Update Information',
        },
        content: content,
        buttons: buttons,
    }).render(true);
};

async function creatureMigration() {
    game.settings.set(ConfigureGameSettingsCategories.Ilaris, IlarisGameSettingNames.acceptChangesV12_1, true);
    const vorteileItems = [];
    for await (const pack of game.packs) {
        if(pack.metadata.type == "Item") {
            if(pack.index.contents.length > 0 && pack.index.contents[0].type == 'vorteil') {
                vorteileItems.push(...(await pack.getDocuments()));
            }
        }
    }
    game.items.forEach(item => {
        if(item.type == 'vorteil') {
            vorteileItems.push(item);
        }
    });
    let vorteileMap = {};
    vorteileItems.forEach((vorteil) => {
        vorteileMap[vorteil.name] = vorteil;
    });
    game.actors.forEach((actor) => {
        if(actor.type == "kreatur" || (actor.ownership[game.userId] && Object.keys(actor.ownership).length == 2)) {
            actor.items.forEach((item) => {
                if(item.type == "vorteil") {
                    if(vorteileMap[item.name]) {
                        item._stats.compendiumSource = `Compendium.Ilaris.vorteil.Item.${vorteileMap[item.name]._id}`;
                    }
                }
            });
        }
    });
}