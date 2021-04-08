import { IlarisActor } from "./actors/actor.js";
import { initializeHandlebars } from "./common/handlebars.js";
import { IlarisActorSheet } from "./sheets/actor.js";
import { HeldenSheet } from "./sheets/helden.js";
import { RuestungSheet } from "./sheets/items/ruestung.js";
import { UebernatuerlichFertigkeitSheet } from "./sheets/items/uebernatuerlich_fertigkeit.js";
import { UebernatuerlichTalentSheet } from "./sheets/items/uebernatuerlich_talent.js";
import { ProfanFertigkeitSheet } from "./sheets/items/profan_fertigkeit.js";
import { ProfanTalentSheet } from "./sheets/items/profan_talent.js";
// import { SephrastoImporter } from "./common/sephrasto_importer.js";
import { NahkampfwaffeSheet } from "./sheets/items/nahkampfwaffe.js";
import { FernkampfwaffeSheet } from "./sheets/items/fernkampfwaffe.js";
import { FreieFertigkeitSheet } from "./sheets/items/freie_fertigkeit.js"

Hooks.once("init", () => {
    CONFIG.Actor.entityClass = IlarisActor;
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("Ilaris", HeldenSheet, {types: ["held"], makeDefault: true});
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("Ilaris", RuestungSheet, {types: ["ruestung"], makeDefault: true});
    Items.registerSheet("Ilaris", NahkampfwaffeSheet, {types: ["nahkampfwaffe"], makeDefault: true});
    Items.registerSheet("Ilaris", FernkampfwaffeSheet, {types: ["fernkampfwaffe"], makeDefault: true});
    Items.registerSheet("Ilaris", UebernatuerlichFertigkeitSheet, {types: ["magie_fertigkeit", "karma_fertigkeit"], makeDefault: true});
    Items.registerSheet("Ilaris", UebernatuerlichTalentSheet, {types: ["magie_talent", "karma_talent"], makeDefault: true});
    Items.registerSheet("Ilaris", ProfanFertigkeitSheet, {types: ["profan_fertigkeit"], makeDefault: true});
    Items.registerSheet("Ilaris", ProfanTalentSheet, {types: ["profan_talent"], makeDefault: true});
    Items.registerSheet("Ilaris", FreieFertigkeitSheet, {types: ["freie_fertigkeit"], makeDefault: true});
    initializeHandlebars();
    // game.sephrasto = new SephrastoImporter()
});
