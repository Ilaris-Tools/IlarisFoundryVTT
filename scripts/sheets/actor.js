import {
    wuerfelwurf
} from "../common/wuerfel.js";

export class IlarisActorSheet extends ActorSheet {

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".ausklappen-trigger").click(ev => this._ausklappView(ev));
        html.find(".rollable").click(ev => this._onRollable(ev));
        html.find(".item-create").click(ev => this._onItemCreate(ev));
        html.find(".item-edit").click(ev => this._onItemEdit(ev));
        html.find(".item-delete").click(ev => this._onItemDelete(ev));
        // html.find('.item-toggle').click(this._onToggleItem.bind(this));
        html.find('.item-toggle').click(ev => this._onToggleItem(ev));
    };

    _ausklappView(event) {
        const targetkey = $(event.currentTarget).data("ausklappentarget");
        const targetId = "ausklappen-view-".concat(targetkey);
        var toggleView = document.getElementById(targetId);
        if (toggleView.style.display === "none") {
            toggleView.style.display = "block";
        } else {
            toggleView.style.display = "none";
        }
    };

    _onToggleItem(event) {
        const itemId = event.currentTarget.dataset.itemid;
        const item = this.actor.items.get(itemId);
        const toggletype = event.currentTarget.dataset.toggletype;
        let attr = '';
        if (toggletype == "hauptwaffe" || toggletype == "nebenwaffe") {
            // item.update(item.data.data[toggletype])
            attr = `data.${toggletype}`;
        }
        // const attr = item.data.type === "spell" ? "data.preparation.prepared" : "data.equipped";
        console.log(attr);
        console.log(!getProperty(item.data, attr));
        // return item.update({[attr]: !getProperty(item.data, attr)});
        // return item.update({[attr]: !getProperty(item, attr)});
        item.update({[attr]: !getProperty(item.data, attr)});
    };

    async _onRollable(event) {
        let data = this.actor.data.data;
        // console.log($(event.currentTarget));
        let rolltype = $(event.currentTarget).data("rolltype");
        let wundabzuege = data.gesundheit.wundabzuege;
        let pw = 0;
        let label = "Probe";
        if (rolltype == "profan_fertigkeit") {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == "attribut") {
            const attribut_name = $(event.currentTarget).data("attribut");
            label = data.attribute[attribut_name].label;
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
        } else if (rolltype == "magie_fertigkeit" || rolltype == "karma_fertigkeit") {
            label = $(event.currentTarget).data("fertigkeit");
            pw = $(event.currentTarget).data("pw");
        } else if (rolltype == "magie_talent" || rolltype == "karma_talent") {
            label = $(event.currentTarget).data("talent");
            pw = $(event.currentTarget).data("pw");
        }
        let formula = `${pw} + ${wundabzuege} + 3d20dl1dh1`;
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
            title: `${label}-Probe`,
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
                data: {
                    be: 1,
                    rs: 1
                }
            };
        } else if (itemclass == "profan_fertigkeit") {
            console.log("Neue Profanfertigkeit");
            itemData = {
                name: "Fertigkeit",
                type: "profan_fertigkeit",
                data: {}
            };
        } else if (itemclass == "profan_talent") {
            console.log("Neues Profantalent");
            itemData = {
                name: "Talent",
                type: "profan_talent",
                data: {}
            };
        } else if (itemclass == "freie_fertigkeit") {
            console.log("Neue freie Fertigkeit");
            itemData = {
                name: "freie Fertigkeit",
                type: "freie_fertigkeit",
                data: {
                    label: "Fertigkeit",
                    stufe: 1,
                    gruppe: 4
                }
            };
        } else if (itemclass == "magie_fertigkeit") {
            console.log("Neue Magiefertigkeit");
            itemData = {
                name: "Zauberfertigkeit",
                type: "magie_fertigkeit",
                data: {}
            };
        } else if (itemclass == "karma_fertigkeit") {
            console.log("Neue Karmafertigkeit");
            itemData = {
                name: "Karmafertigkeit",
                type: "karma_fertigkeit",
                data: {}
            };
        } else if (itemclass == "magie_talent") {
            console.log("Neues Magietalent");
            itemData = {
                name: "Magietalent",
                type: "magie_talent",
                data: {}
            };
        } else if (itemclass == "karma_talent") {
            console.log("Neues karmatalent");
            itemData = {
                name: "Karmatalent",
                type: "karma_talent",
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
