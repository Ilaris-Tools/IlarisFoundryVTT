import { IlarisActor } from "./actors/actor.js";
import { initializeHandlebars } from "./common/handlebars.js";
import { IlarisActorSheet } from "./sheets/actor.js";
import { HeldenSheet } from "./sheets/helden.js";
import { RuestungSheet } from "./sheets/items/ruestung.js";
import { UebernatuerlichFertigkeitSheet } from "./sheets/items/uebernatuerlich_fertigkeit.js";
import { UebernatuerlichTalentSheet } from "./sheets/items/uebernatuerlich_talent.js";

Hooks.once("init", () => {
    CONFIG.Actor.entityClass = IlarisActor;
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("Ilaris", HeldenSheet, {types: ["held"], makeDefault: true});
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("Ilaris", RuestungSheet, {types: ["ruestung"], makeDefault: true});
    Items.registerSheet("Ilaris", UebernatuerlichFertigkeitSheet, {types: ["magie_fertigkeit", "karma_fertigkeit"], makeDefault: true});
    Items.registerSheet("Ilaris", UebernatuerlichTalentSheet, {types: ["magie_talent", "karma_talent"], makeDefault: true});
    initializeHandlebars();
});
