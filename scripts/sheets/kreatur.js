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


    async _onClickable(event) {
        super._onClickable(event);
        let data = this.actor.data.data;
        let clicktype = $(event.currentTarget).data('clicktype');
        if (clicktype == "addvorteilinfo"){
            game.packs.get("Ilaris.vorteile").render(true)
            Dialog.prompt({
                content: "Du kannst Vorteile direkt aus den Kompendium Packs auf den Statblock ziehen. Für eigene Vor/Nachteile zu erstellen, die nicht im Regelwerk enthalten sind, benutze die Eigenschaften.",
                callback: () => {
                },
              })
        } else if (clicktype == "addanyitem") {  // not used.. dropdown for itemcreate (actor) is used instead of another dialog
            const html = await renderTemplate('systems/Ilaris/templates/sheets/dialogs/addkreaturitem.html', {});
            let d = new Dialog({
                title: 'Item Hinzufügen:',
                content: html,
                buttons: {
                    one: {
                        label: 'Zauber',
                        callback: () => {
                            console.log("Klicked")
                            super._onItemCreate(event);
                        }
                    },
                }
            });
            d.render(true);
            //                 two: {
            //                     icon: '<i class="fas fa-times"></i>',
            //                     label: 'Abbrechen',
            //                     callback: () => console.log('Abbruch'),
            //                 },
            //             },
            //         },
            //         {
            //             jQuery: true,
            //         },
            //     );
            //     d.render(true);
        }
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
        super._onDropItemCreate(item);
        return this.actor.createEmbeddedDocuments('Item', [itemData]);
    }
}
