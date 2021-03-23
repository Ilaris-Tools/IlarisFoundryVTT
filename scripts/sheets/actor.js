export class IlarisActorSheet extends ActorSheet {

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".fertigkeit-view").click(ev => this._fertigkeitView(ev));
        html.find(".rollable").click(ev => this._onRollable(ev));
        html.find(".item-create").click(ev => this._onItemCreate(ev));
        html.find(".item-edit").click(ev => this._onItemEdit(ev));
        html.find(".item-delete").click(ev => this._onItemDelete(ev));
    };

    _fertigkeitView(event) {
        const fertigkeitKey = $(event.currentTarget).data("fertigkeit");
        const fertigkeitId = "folding-fert-".concat(fertigkeitKey);
        var toggleFert = document.getElementById(fertigkeitId);
        if (toggleFert.style.display === "none") {
            toggleFert.style.display = "block";
        } else {
            toggleFert.style.display = "none";
        }
    };

    _onRollable(event){
        let data = this.actor.data.data;
        // console.log($(event.currentTarget));
        let rolltype = $(event.currentTarget).data("rolltype");
        let wundabzuege = data.gesundheit.wundabzuege;
        let pw = 0;
        let label = "Probe";
        if (rolltype == "attribut"){
            const attribut_name = $(event.currentTarget).data("attribut");
            label = data.attribute[attribut_name].label;
            pw = data.attribute[attribut_name].pw;
        }
        else if (rolltype == "fertigkeitpw"){
            const fertigkeit_name = $(event.currentTarget).data("fertigkeit");
            label = data.fertigkeiten[fertigkeit_name].label;
            pw = data.fertigkeiten[fertigkeit_name].pw;
        }
        else if (rolltype == "fertigkeitpwt"){
            const fertigkeit_name = $(event.currentTarget).data("fertigkeit");
            label = data.fertigkeiten[fertigkeit_name].label;
            label = label.concat("(Talent)");
            pw = data.fertigkeiten[fertigkeit_name].pwt;
        }
        let formula = `${pw} ${wundabzuege} + 3d20dl1dh1`;
        // let formula = `${data.pw} + 3d20dhdl`;
        let roll = new Roll(formula);
        roll.roll();
        console.log(roll);
        let critfumble = roll.result.split(" + ")[1];
        let fumble = false;
        let crit = false;
        if (critfumble == 20) {
            crit = true;
        }
        else if (critfumble == 1) {
            fumble = true;
        }
        let templateData = {
            title: `${label}-Probe`,
            crit: crit,
            fumble: fumble
        };
        console.log(templateData);
        let template = 'systems/Ilaris/templates/chat/dreid20.html';
        renderTemplate(template, templateData, roll).then(content => {
            if (formula != null) {
                roll.toMessage({ flavor: content });
            }
        });
    }

    _onItemCreate(event){
        console.log("ItemCreate");
        // console.log(event);
        // console.log($(event.currentTarget));
        let itemclass= $(event.currentTarget).data("itemclass");
        //ansehen: DomStringMap. Beide Varianten liefern das gleiche.
        //Welche ist besser und warum?
        console.log($(event.currentTarget).data("itemclass"));
        console.log(event.currentTarget.dataset.itemclass);
        let itemData = {};
        if (itemclass == "ruestung") {
            console.log("Rüstung");
            itemData = {
                name: "Neue Rüstung",
                type: "ruestung",
                data: {
                    be: 42
                }
            };
        }
        console.log(this.actor);
        console.log(this.actor.data);
        console.log(this.actor.data.data);

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

    _onItemEdit(event){
        console.log("ItemEdit");
        console.log(event);
        console.log(event.currentTarget);
        // const li = $(ev.currentTarget).parents(".item");
        // const item = this.actor.getOwnedItem(li.data("itemId"));
        // item.sheet.render(true);
        const itemID = event.currentTarget.dataset.itemid;
        const item = this.actor.getOwnedItem(itemID);
        item.sheet.render(true);
    }

    _onItemDelete(event){
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
