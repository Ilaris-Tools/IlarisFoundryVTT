import { IlarisActorSheet } from './actor.js';

export class KreaturSheet extends IlarisActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/kreatur.html',
        });
    }
    
    _onDropItemCreate(item) {
        console.log("Item gedroppt!");
        console.log(item);
        if (item.type == "talent" || item.type == "fertigkeit") {
            console.log("Item drop abgefangen. Erstelle Freies Talent..");
            item.type = "freiestalent";
            item.pw = 0;
            return super._onDropItemCreate(item);
            // let freiestalent = {
            //     name: item.name,
            //     pw: 0
            // }
        }

        // TODO: catch fertigkeiten und talente für kreaturen und konvertiere sie on the fly
        return super._onDropItemCreate(item);
    }
}
