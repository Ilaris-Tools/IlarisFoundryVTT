import { IlarisActorSheet } from './actor.js';

export class KreaturSheet extends IlarisActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/kreatur.html',
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'profan',
                },
            ],
        });
    }
    
    _onDropItemCreate(item) {
        console.log("Item gedroppt!");
        console.log(item);

        let itemclass = item.type;
        let itemData = {};
        if (item.type == "talent" || item.type == "fertigkeit") {
            console.log("Item drop abgefangen. Erstelle Freies Talent..");
            itemData = {
                name: item.name,
                type: 'freiestalent',
                data: {
                    text: item.data.text,
                    pw: item.data.pw,
                    profan: true
                }
            }
        }
        if (item.type == "uebernatuerliche_fertigkeit") {
            console.log("Item drop abgefangen. Erstelle Uebernatuerliches Freies Talent..");
            itemData = {
                name: item.name,
                type: 'freiestalent',
                data: {
                    text: item.data.text,
                    pw: item.data.pw,
                    profan: false
                }
            }
        }
        // else if (item.type == "zauber" || item.type == 'liturgie') {
        //     console.log("Item drop abgefangen. Erstelle Zauber oder Liturgie..");
        //     itemData = {
        //         name: item.name,
        //         type: item.type,
        //         data: item.data,
        //     }
        // } 
        else {
            console.log("Item drop abgefangen. Erstelle Kopie..");
            itemData = {
                name: item.name,
                type: item.type,
                data: item.data,
            }
        } 
        return this.actor.createEmbeddedDocuments('Item', [itemData]);
    }
}
