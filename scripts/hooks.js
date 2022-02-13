import { ILARIS } from './config.js';
import { IlarisActor } from './actors/actor.js';
import { initializeHandlebars } from './common/handlebars.js';
// import { IlarisActorSheet } from "./sheets/actor.js";
import { HeldenSheet } from './sheets/helden.js';
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

Hooks.once('init', () => {
    // CONFIG.debug.hooks = true;
    CONFIG.Actor.documentClass = IlarisActor;
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('Ilaris', HeldenSheet, { types: ['held'], makeDefault: true });
    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('Ilaris', RuestungSheet, { types: ['ruestung'], makeDefault: true });
    Items.registerSheet('Ilaris', NahkampfwaffeSheet, {
        types: ['nahkampfwaffe'],
        makeDefault: true,
    });
    Items.registerSheet('Ilaris', FernkampfwaffeSheet, {
        types: ['fernkampfwaffe'],
        makeDefault: true,
    });
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
            changes: [{ key: 'data.furcht.furchtstufe', mode: 5, priority: 1, value: 1 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-yellow.svg',
            // tint: "#ffcc00"
        },
        {
            id: 'Furcht2',
            label: 'Furcht II',
            duration: [],
            changes: [{ key: 'data.furcht.furchtstufe', mode: 4, priority: 2, value: 2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-orange.svg',
        },
        {
            id: 'Furcht3',
            label: 'Furcht III',
            duration: [],
            changes: [{ key: 'data.furcht.furchtstufe', mode: 4, priority: 3, value: 3 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-red.svg',
        },
        {
            id: 'Furcht4',
            label: 'Furcht IV',
            duration: [],
            changes: [{ key: 'data.furcht.furchtstufe', mode: 4, priority: 4, value: 4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/terror-purple.svg',
        },
        {
            id: 'schlechtesicht1',
            label: 'Schlechte Sicht (Dämmerung)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 4, value: -2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sight-disabled-yellow.svg',
        },
        {
            id: 'schlechtesicht2',
            label: 'Schlechte Sicht (Mondlicht)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 6, value: -4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sight-disabled-orange.svg',
        },
        {
            id: 'schlechtesicht3',
            label: 'Schlechte Sicht (Sternenlicht)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 7, value: -8 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sight-disabled-red.svg',
        },
        {
            id: 'schlechtesicht4',
            label: 'Schlechte Sicht (Blind)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 8, value: -16 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sight-disabled-purple.svg',
        },
        {
            id: 'untergrund1',
            label: 'Unsicherer Untergrund (knietiefes Wasser)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 4, value: -2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sticky-boot-yellow.svg',
        },
        {
            id: 'untergrund2',
            label: 'Unsicherer Untergrund (eisglatt, hüfttiefes Wasser)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 6, value: -4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sticky-boot-orange.svg',
        },
        {
            id: 'untergrund3',
            label: 'Unsicherer Untergrund (schultertiefes Wasser)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 7, value: -8 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sticky-boot-red.svg',
        },
        {
            id: 'untergrund4',
            label: 'Unsicherer Untergrund (Drahtseil)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 8, value: -16 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/sticky-boot-purple.svg',
        },
        {
            id: 'Position1',
            label: 'Sehr vorteilhafte Position',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 9, value: +4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/hill-fort-green.svg',
            // tint: "#CC00CC"
        },
        {
            id: 'Position2',
            label: 'Vorteilhafte Position',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 10, value: +2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/hill-conquest-light-green.svg',
        },
        {
            id: 'Position3',
            label: 'Schlechte Position (Kniend)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 12, value: -2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/kneeling-yellow.svg',
        },
        {
            id: 'Position4',
            label: 'Sehr schlechte Position (Liegend)',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 13, value: -4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/falling-orange.svg',
        },
        {
            id: 'Nahkampf1',
            label: 'Nahkampf +4',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 9, value: +4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/swordwoman-green.svg',
            // tint: "#CC00CC"
        },
        {
            id: 'Nahkampf2',
            label: 'Nahkampf +2',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 10, value: +2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/swordwoman-light-green.svg',
        },
        {
            id: 'Nahkampf3',
            label: 'Nahkampf -2',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 12, value: -2 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/swordwoman-yellow.svg',
        },
        {
            id: 'Nahkampf4',
            label: 'Nahkampf -4',
            duration: [],
            changes: [{ key: 'data.modifikatoren.nahkampfmod', mode: 2, priority: 13, value: -4 }],
            isTemporary: 0,
            icon: 'systems/Ilaris/assets/images/icon/swordwoman-orange.svg',
        },
    ];
});

// Hooks.on('preCreateActor', (createData) => {
//     mergeObject(createData, {
//         'token.bar1': { attribute: "gesundheit.hp" },
//         'token.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
//         'token.displayBars': CONST.TOKEN_DISPLAY_MODES.HOVER,
//         'token.disposition': CONST.TOKEN_DISPOSITIONS.FRIENDLY,
//         'token.name': createData.name,
//     });
//     if (!createData.img) {
//         createData.img = 'systems/Ilaris/assets/images/token/kreaturentypen/humanoid.jpg';
//     }
//     if (createData.type === 'held') {
//         createData.token.vision = true;
//         createData.token.actorLink = true;
//     }
// });

// Hooks.on("preUpdateToken", (scene, token, updateData) => {
//     const oldHP = token?.actorData?.data?.gesundheit?.hp.value;
//     // const oldHP = token?.actorData?.data?.attributes?.hp.value;
//     const newHP = updateData?.actorData?.data?.gesundheit?.hp.value;
//     console.log("preUpdateToken");
//     console.log(oldHP);
//     console.log(newHP);
//     // const newHP = updateData?.actorData?.data?.attributes?.hp.value;
//     // const maxHP = canvas.tokens.get(token._id).actor.data.data.attributes.hp.max;

//     // if (!isNaN(oldHP) && !isNaN(newHP) && oldHP != newHP) {
//     //     var newColor = getColorFromHPPercent(newHP / maxHP);

//     //     console.log("Hitpoints changed");
//     //     console.log(newColor);

//     //     scene.updateEmbeddedEntity(Token.embeddedName, {
//     //         tint: newColor,
//     //         _id: token._id,
//     //     });
//     // }
// });
