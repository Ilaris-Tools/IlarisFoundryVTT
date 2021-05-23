import { ILARIS } from "./config.js";
import { IlarisActor } from "./actors/actor.js";
import { initializeHandlebars } from "./common/handlebars.js";
// import { IlarisActorSheet } from "./sheets/actor.js";
import { HeldenSheet } from "./sheets/helden.js";
import { RuestungSheet } from "./sheets/items/ruestung.js";
import { UebernatuerlichFertigkeitSheet } from "./sheets/items/uebernatuerlich_fertigkeit.js";
import { UebernatuerlichTalentSheet } from "./sheets/items/uebernatuerlich_talent.js";
import { FertigkeitSheet } from "./sheets/items/fertigkeit.js";
import { TalentSheet } from "./sheets/items/talent.js";
// import { SephrastoImporter } from "./common/sephrasto_importer.js";
import { NahkampfwaffeSheet } from "./sheets/items/nahkampfwaffe.js";
import { FernkampfwaffeSheet } from "./sheets/items/fernkampfwaffe.js";
import { FreieFertigkeitSheet } from "./sheets/items/freie_fertigkeit.js";
import { VorteilSheet } from "./sheets/items/vorteil.js";
import { ManoeverSheet } from "./sheets/items/manoever.js";
import { EigenheitSheet } from "./sheets/items/eigenheit.js";

Hooks.once("init", () => {
    // CONFIG.debug.hooks = true;
    CONFIG.Actor.documentClass = IlarisActor;
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("Ilaris", HeldenSheet, {types: ["held"], makeDefault: true});
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("Ilaris", RuestungSheet, {types: ["ruestung"], makeDefault: true});
    Items.registerSheet("Ilaris", NahkampfwaffeSheet, {types: ["nahkampfwaffe"], makeDefault: true});
    Items.registerSheet("Ilaris", FernkampfwaffeSheet, {types: ["fernkampfwaffe"], makeDefault: true});
    Items.registerSheet("Ilaris", FertigkeitSheet, {types: ["fertigkeit"], makeDefault: true });
    Items.registerSheet("Ilaris", TalentSheet, {types: ["talent"], makeDefault: true});
    Items.registerSheet("Ilaris", UebernatuerlichFertigkeitSheet, {types: ["uebernatuerliche_fertigkeit"], makeDefault: true});
    Items.registerSheet("Ilaris", UebernatuerlichTalentSheet, {types: ["zauber", "liturgie"], makeDefault: true});
    Items.registerSheet("Ilaris", FreieFertigkeitSheet, {types: ["freie_fertigkeit"], makeDefault: true});
    Items.registerSheet("Ilaris", VorteilSheet, { types: ["vorteil"], makeDefault: true });
    Items.registerSheet("Ilaris", ManoeverSheet, { types: ["manoever"], makeDefault: true });
    Items.registerSheet("Ilaris", EigenheitSheet, { types: ["eigenheit"], makeDefault: true });
    // Items.registerSheet("Ilaris", VorteilSheet, {types: ["allgemein_vorteil", "profan_vorteil", "kampf_vorteil", "kampfstil", "magie_vorteil", "magie_tradition", "karma_vorteil", "karma_tradition"], makeDefault: true});
    initializeHandlebars();
    // game.sephrasto = new SephrastoImporter();
    CONFIG.ILARIS = ILARIS;
    CONFIG.Combat.initiative = { formula: "@initiative", decimals: 1 };
    CONFIG.statusEffects.push(
        {"id": "furcht1",
         "label": "Furch I",
         "icon": 'systems/Ilaris/assets/game-icons.net/terror_1.png'},
        {
            "id": "furcht2",
            "label": "Furch II",
            "icon": 'systems/Ilaris/assets/game-icons.net/terror_2.png'
        },
        {
            "id": "furcht3",
            "label": "Furch III",
            "icon": 'systems/Ilaris/assets/game-icons.net/terror_3.png'
        },
        {
            "id": "furcht4",
            "label": "Furch IV",
            "icon": 'systems/Ilaris/assets/game-icons.net/terror_4.png'
        },
    );
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
