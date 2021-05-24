// import {
//     wuerfelwurf
// } from "../common/wuerfel.js";

// input in html: pattern="regex" <= damit Zahlen und - bei Kreaturen möglich

export class NahkampfDialog extends Dialog {
    // constructor(actor, item, dialogData = {}, options = {}) {
    //     super(dialogData, options);
    //     // this.html = html;
    //     console.log("In Contructor");
    //     /**
    //      * Store a reference to the Actor entity which is resting
    //      * @type {Actor}
    //      */
    //     this.actor = actor;
    //     this.item = item;

    //     /**
    //      * Track the most recently used HD denomination for re-rendering the form
    //      * @type {string}
    //      */
    //     // this._denom = null;
    // }

    // getData() {
    //     const data = super.getData();
    //     data.item = this.item;
    //     console.log(data);
    //     return data;
    // }

    activateListeners(html) {
        super.activateListeners(html);
        // html.find(".ausklappen-trigger").click(ev => this._ausklappView(ev));
        // html.find(".rollable").click(ev => this._onRollable(ev));
        // html.find(".item-create").click(ev => this._onItemCreate(ev));
        // html.find(".item-edit").click(ev => this._onItemEdit(ev));
        // html.find(".item-delete").click(ev => this._onItemDelete(ev));
        // // html.find('.item-toggle').click(this._onToggleItem.bind(this));
        // html.find('.item-toggle').click(ev => this._onToggleItem(ev));
        // html.find('.toggle-aktion').click(ev => this._onToggleAktion(ev, html));
        console.log("In Listeners");
    };

    _onToggleAktion(event, html) {
        const id = $(event.currentTarget).attr('id');
        console.log(html.getElementsByClassName("toggle-aktion"));
        console.log(id);
        console.log("hier wird ein item getoggled");
    }

    _ausklappView(event) {
        // Beachte Block: Ausklappen bei asp/kap sieht kacke aus -> inline
        const targetkey = $(event.currentTarget).data("ausklappentarget");
        const targetId = "ausklappen-view-".concat(targetkey);
        var toggleView = document.getElementById(targetId);
        if (toggleView.style.display === "none") {
            toggleView.style.display = "block";
        } else {
            toggleView.style.display = "none";
        }
    };

    async _onToggleItem(event) {
        const itemId = event.currentTarget.dataset.itemid;
        const item = this.actor.items.get(itemId);
        const toggletype = event.currentTarget.dataset.toggletype;
        let attr = `data.${toggletype}`;
        if (toggletype == "hauptwaffe" || toggletype == "nebenwaffe") {
            let item_status = getProperty(item.data, attr);
            // item.update({[attr]: !getProperty(item.data, attr)});
            if (item_status == false) {
                for (let nwaffe of this.actor.data.nahkampfwaffen) {
                    // console.log(nwaffe);
                    if (nwaffe.data[toggletype] == true) {
                        let change_itemId = nwaffe._id;
                        let change_item = this.actor.items.get(change_itemId);
                        await change_item.update({[attr]: false});
                    }
                }
                for (let item of this.actor.data.fernkampfwaffen) {
                    // console.log(item);
                    if (item.data[toggletype] == true) {
                        let change_itemId = item._id;
                        let change_item = this.actor.items.get(change_itemId);
                        await change_item.update({ [attr]: false });
                    }
                }
            }
            await item.update({[attr]: !item_status});
        }
        else {
            attr = `data.${toggletype}`;
            await item.update({[attr]: !getProperty(item.data, attr)});
        }
        // console.log(attr);
        // console.log(!getProperty(item.data, attr));
    };

    async _onRollable(event) {
        let data = this.actor.data.data;
        // console.log($(event.currentTarget));
        let rolltype = $(event.currentTarget).data("rolltype");
        let globalermod = data.abgeleitete.globalermod;
        let pw = 0;
        let label = "Probe";
        let dice = "3d20dl1dh1";
        if (rolltype == "profan_fertigkeit") {
            wuerfelwurf(event, this.actor);
            return 0;
        }
        else if (rolltype == "at") {
            wuerfelwurf(event, this.actor);
            return 0;
            // dice = "1d20";
            // label = $(event.currentTarget).data("item");
            // label = `Attacke (${label})`;
            // pw = $(event.currentTarget).data("pw");
        }
        else if (rolltype == "vt") {
            dice = "1d20";
            label = $(event.currentTarget).data("item");
            label = `Verteidigung (${label})`;
            pw = $(event.currentTarget).data("pw");
        }
        else if (rolltype == "fk") {
            dice = "1d20";
            label = $(event.currentTarget).data("item");
            label = `Fernkampf (${label})`;
            pw = $(event.currentTarget).data("pw");
        }
        else if (rolltype == "schaden") {
            label = $(event.currentTarget).data("item");
            label = `Schaden (${label})`;
            pw = $(event.currentTarget).data("pw");
        }
        else if (rolltype == "attribut") {
            const attribut_name = $(event.currentTarget).data("attribut");
            label = CONFIG.ILARIS.label[attribut_name];
            pw = data.attribute[attribut_name].pw;
        } else if (rolltype == "profan_fertigkeit_pw") {
            label = $(event.currentTarget).data("fertigkeit");
            pw = $(event.currentTarget).data("pw");
        } else if (rolltype == "profan_fertigkeit_pwt") {
            label = $(event.currentTarget).data("fertigkeit");
            label = label.concat("(Talent)");
            pw = $(event.currentTarget).data("pwt");
        } else if (rolltype == "profan_talent") {
            label = $(event.currentTarget).data("fertigkeit");
            label = label.concat("(", $(event.currentTarget).data("talent"), ")");
            pw = $(event.currentTarget).data("pw");
        } else if (rolltype == "freie_fertigkeit") {
            label = $(event.currentTarget).data("fertigkeit");
            // console.log($(event.currentTarget).data("pw"))
            pw = Number($(event.currentTarget).data("pw")) * 8 - 2;
        // } else if (rolltype == "magie_fertigkeit" || rolltype == "karma_fertigkeit") {
        } else if (rolltype == "uebernatuerliche_fertigkeit") {
            label = $(event.currentTarget).data("fertigkeit");
            pw = $(event.currentTarget).data("pw");
        } else if (rolltype == "zauber" || rolltype == "liturgie") {
            label = $(event.currentTarget).data("talent");
            pw = $(event.currentTarget).data("pw");
        }
        let formula = `${pw} + ${globalermod} + ${dice}`;
        if (rolltype == "schaden") {
            formula = pw;
        }
        // let formula = `${data.pw} + 3d20dhdl`;
        let roll = new Roll(formula);
        roll.roll();
        // console.log(roll);
        let critfumble = roll.result.split(" + ")[1];
        let fumble = false;
        let crit = false;
        if (critfumble == 20) {
            crit = true;
        } else if (critfumble == 1) {
            fumble = true;
        }
        let templateData = {
            // title: `${label}-Probe`,
            title: label,
            crit: crit,
            fumble: fumble
        };
        // console.log(templateData);
        let template = 'systems/Ilaris/templates/chat/dreid20.html';
        renderTemplate(template, templateData, roll).then(content => {
            if (formula != null) {
                roll.toMessage({
                    flavor: content
                });
            }
        });
    }

    _onItemCreate(event) {
        console.log("ItemCreate");
        // console.log(event);
        // console.log($(event.currentTarget));
        let itemclass = $(event.currentTarget).data("itemclass");
        //ansehen: DomStringMap. Beide Varianten liefern das gleiche.
        //Welche ist besser und warum?
        // console.log($(event.currentTarget).data("itemclass"));
        // console.log(event.currentTarget.dataset.itemclass);
        let itemData = {};
        if (itemclass == "ruestung") {
            console.log("Neue Rüstung");
            itemData = {
                name: "Neue Rüstung",
                type: "ruestung",
                data: {}
            };
        } else if (itemclass == "nahkampfwaffe") {
            console.log("Neue Nahkampfwaffe");
            itemData = {
                name: "Waffe",
                type: itemclass,
                data: {}
            };
        } else if (itemclass == "fernkampfwaffe") {
            console.log("Neue Fernkampfwaffe");
            itemData = {
                name: "Waffe",
                type: itemclass,
                data: {}
            };
        } else if (itemclass == "fertigkeit") {
            console.log("Neue Fertigkeit");
            itemData = {
                name: "Fertigkeit",
                type: "fertigkeit",
                data: {}
            };
        } else if (itemclass == "talent") {
            console.log("Neues Talent");
            itemData = {
                name: "Talent",
                type: "talent",
                data: {}
            };
        } else if (itemclass == "freie_fertigkeit") {
            console.log("Neue freie Fertigkeit");
            itemData = {
                name: "freie Fertigkeit",
                type: "freie_fertigkeit",
                data: {
                    stufe: 1,
                    gruppe: 4
                }
            };
        } else if (itemclass == "uebernatuerliche_fertigkeit") {
            console.log("Neue übernatürliche Fertigkeit");
            itemData = {
                name: "Fertigkeit",
                type: "uebernatuerliche_fertigkeit",
                data: {}
            };
        } else if (itemclass == "zauber") {
            console.log("Neuer Zauber");
            itemData = {
                name: "Zauber",
                type: "zauber",
                data: {}
            };
        } else if (itemclass == "liturgie") {
            console.log("Neue Liturgie");
            itemData = {
                name: "Liturgie",
                type: "liturgie",
                data: {}
            };
        } else if (itemclass == "eigenheit") {
            console.log("Neue Eigenheit");
            itemData = {
                name: "eigenheit",
                type: "eigenheit",
                data: {}
            };
        }
        // console.log(this.actor);
        // console.log(this.actor.data);
        // console.log(this.actor.data.data);

        return this.actor.createOwnedItem(itemData);

        // // event.preventDefault();
        // const header = event.currentTarget;
        // // Get the type of item to create.
        // const type = header.dataset.type;
        // // Grab any data associated with this control.
        // const data = duplicate(header.dataset);
        // // Initialize a default name.
        // const name = `New ${type.capitalize()}`;
        // // Prepare the item object.
        // const itemData = {
        //     name: name,
        //     type: type,
        //     data: data
        // };
        // // Remove the type from the dataset since it's in the itemData.type prop.
        // delete itemData.data["type"];

        // // Finally, create the item!
        // return this.actor.createOwnedItem(itemData);   }
    }

    _onItemEdit(event) {
        console.log("ItemEdit");
        // console.log(event);
        // console.log(event.currentTarget);
        // const li = $(ev.currentTarget).parents(".item");
        // const item = this.actor.getOwnedItem(li.data("itemId"));
        // item.sheet.render(true);
        const itemID = event.currentTarget.dataset.itemid;
        const item = this.actor.getOwnedItem(itemID);
        item.sheet.render(true);
    }

    _onItemDelete(event) {
        console.log("ItemDelete");
        const itemID = event.currentTarget.dataset.itemid;
        // const li = $(event.currentTarget).parents(".item");
        // console.log(event.currentTarget);
        // console.log($(event.currentTarget));
        // console.log(li);
        // console.log(li.data);
        // console.log(event.currentTarget.dataset.itemclass);
        // console.log(event.currentTarget.dataset.itemid);
        // this.actor.deleteOwnedItem(li.data("itemId"));
        this.actor.deleteOwnedItem(itemID);
        // li.slideUp(200, () => this.render(false)); 
    }
}
