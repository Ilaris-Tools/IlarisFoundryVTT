import { wuerfelwurf } from '../common/wuerfel.js';

export class IlarisActorSheet extends ActorSheet {
    /*
      data ist nicht actor. Ändern, so dass ich nicht mehr in Actor, sondern über data schreibe?
      Und welche Items soll ich nehmen? Actor, data, oder direkt?
      Ansehen, was references und was copys sind.
    */
    getData() {
        const data = super.getData();
        // console.log("**Ilaris** IlarisActorSheet");
        // console.log(data);
        // console.log(this.actor);
        // this.data = data;
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.ausklappen-trigger').click((ev) => this._ausklappView(ev));
        html.find('.rollable').click((ev) => this._onRollable(ev));
        html.find('.clickable').click((ev) => this._onClickable(ev));
        html.find('.item-create').click((ev) => this._onItemCreate(ev));
        html.find('.item-edit').click((ev) => this._onItemEdit(ev));
        html.find('.item-delete').click((ev) => this._onItemDelete(ev));
        // html.find('.item-toggle').click(this._onToggleItem.bind(this));
        html.find('.item-toggle').click((ev) => this._onToggleItem(ev));
        html.find('.toggle-bool').click((ev) => this._onToggleBool(ev));
        html.find('.hp-update').change((ev) => this._onHpUpdate(ev));
        // html.find('.selected-kampfstil').change(ev => this._onSelectedKampfstil(ev));
    }

    _ausklappView(event) {
        // Beachte Block: Ausklappen bei asp/kap sieht kacke aus -> inline
        const targetkey = $(event.currentTarget).data('ausklappentarget');
        const targetId = 'ausklappen-view-'.concat(targetkey);
        var toggleView = document.getElementById(targetId);
        if (toggleView.style.display === 'none') {
            toggleView.style.display = 'block';
        } else {
            toggleView.style.display = 'none';
        }
    }

    async _onToggleBool(event) {
        const togglevariable = event.currentTarget.dataset.togglevariable;
        let attr = `${togglevariable}`;
        let bool_status = getProperty(this.actor.data, attr);
        await this.actor.update({ [attr]: !bool_status });
    }


    async _onToggleItem(event) {
        const itemId = event.currentTarget.dataset.itemid;
        const item = this.actor.data.items.get(itemId);
        // console.log(this.data);
        // const item = this.data.items.get(itemId);
        const toggletype = event.currentTarget.dataset.toggletype;
        let attr = `data.${toggletype}`;
        if (toggletype == 'hauptwaffe' || toggletype == 'nebenwaffe') {
            let item_status = getProperty(item.data, attr);
            // item.update({[attr]: !getProperty(item.data, attr)});
            if (item_status == false) {
                for (let nwaffe of this.actor.data.data.nahkampfwaffen) {
                    // for (let nwaffe of this.actor.data.nahkampfwaffen) {
                    // console.log(nwaffe);
                    if (nwaffe.data.data[toggletype] == true) {
                        let change_itemId = nwaffe.id;
                        let change_item = this.actor.data.items.get(change_itemId);
                        await change_item.update({ [attr]: false });
                    }
                }
                for (let item of this.actor.data.data.fernkampfwaffen) {
                    // console.log(item);
                    if (item.data.data[toggletype] == true) {
                        let change_itemId = item.id;
                        let change_item = this.actor.data.items.get(change_itemId);
                        await change_item.update({ [attr]: false });
                    }
                }
            }
            // console.log(attr);
            // console.log(item_status);
            await item.update({ [attr]: !item_status });
        } else {
            attr = `data.${toggletype}`;
            await item.update({ [attr]: !getProperty(item.data, attr) });
        }
        // console.log(attr);
        // console.log(!getProperty(item.data, attr));
    }

    async _onRollable(event) {
        let data = this.actor.data.data;
        // console.log($(event.currentTarget));
        let rolltype = $(event.currentTarget).data('rolltype');
        if (rolltype == 'basic') {
            // NOTE: als Einfaches Beispiel ohne weitere Dialoge und logische Verknüpfungen.
            let label = $(event.currentTarget).data('label');
            let formula = $(event.currentTarget).data('formula');
            let roll = new Roll(formula);
            console.log(formula);
            let speaker = ChatMessage.getSpeaker({ actor: this.actor });
            await roll.evaluate({ async: true });
            const html_roll = await renderTemplate(
                'systems/Ilaris/templates/chat/probenchat_profan.html', 
                {title: `${label}`}
            );
            // console.log(html_roll);
            roll.toMessage({
                speaker: speaker,
                flavor: html_roll,
            });
            return 0
        }
        let globalermod = data.abgeleitete.globalermod;
        let pw = 0;
        let label = 'Probe';
        let dice = '3d20dl1dh1';
        // TODO: simplify this: if rolltype in [...]
        // similar to rolltype based logic in wuerfelwurf.. DRY?
        if (rolltype == 'profan_fertigkeit_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'nahkampf_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'attribut_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'simpleprobe_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'simpleformula_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'fernkampf_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'freie_fertigkeit_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'magie_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'karma_diag') {
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'uefert_diag') {
            console.log(event);
            wuerfelwurf(event, this.actor);
            return 0;
        } else if (rolltype == 'at') { 
            // TODO: simplify this: if rolltype in [...]
            dice = '1d20';
            label = $(event.currentTarget).data('item');
            label = `Attacke (${label})`;
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'vt') {
            dice = '1d20';
            label = $(event.currentTarget).data('item');
            label = `Verteidigung (${label})`;
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'fk') {
            dice = '1d20';
            label = $(event.currentTarget).data('item');
            label = `Fernkampf (${label})`;
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'schaden') {
            label = $(event.currentTarget).data('item');
            label = `Schaden (${label})`;
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'attribut') {
            const attribut_name = $(event.currentTarget).data('attribut');
            label = CONFIG.ILARIS.label[attribut_name];
            pw = data.attribute[attribut_name].pw;
        } else if (rolltype == 'profan_fertigkeit_pw') {
            label = $(event.currentTarget).data('fertigkeit');
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'profan_fertigkeit_pwt') {
            label = $(event.currentTarget).data('fertigkeit');
            label = label.concat(' (Talent)');
            pw = $(event.currentTarget).data('pwt');
        } else if (rolltype == 'profan_talent') {
            label = $(event.currentTarget).data('fertigkeit');
            label = label.concat(' (', $(event.currentTarget).data('talent'), ')');
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'freie_fertigkeit') {
            label = $(event.currentTarget).data('fertigkeit');
            // console.log($(event.currentTarget).data("pw"))
            pw = Number($(event.currentTarget).data('pw')) * 8 - 2;
            // } else if (rolltype == "magie_fertigkeit" || rolltype == "karma_fertigkeit") {
        } else if (rolltype == 'uebernatuerliche_fertigkeit') {
            label = $(event.currentTarget).data('fertigkeit');
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'zauber' || rolltype == 'liturgie') {
            label = $(event.currentTarget).data('talent');
            pw = $(event.currentTarget).data('pw');
        }
        let formula = `${dice} + ${pw} + ${globalermod}`;
        if (rolltype == 'at' || rolltype == 'vt') {
            formula += ` + ${data.modifikatoren.nahkampfmod}`;
        }
        if (rolltype == 'schaden') {
            formula = pw;
        }
        // let formula = `${data.pw} + 3d20dhdl`;
        let roll = new Roll(formula);
        // roll.roll();
        await roll.evaluate({ async: true });
        // console.log(roll);
        // let critfumble = roll.result.split(" + ")[1];
        let critfumble = roll.dice[0].results.find((a) => a.active == true).result;
        let fumble = false;
        let crit = false;
        if (critfumble == 20) {
            crit = true;
        } else if (critfumble == 1) {
            fumble = true;
        }
        // let templateData = {
        //     // title: `${label}-Probe`,
        //     title: label,
        //     crit: crit,
        //     fumble: fumble
        // };
        // // console.log(templateData);
        // let template = 'systems/Ilaris/templates/chat/dreid20.html';
        // renderTemplate(template, templateData, roll).then(content => {
        //     if (formula != null) {
        //         roll.toMessage({
        //             flavor: content
        //         });
        //     }
        // });
        let speaker = ChatMessage.getSpeaker({ actor: this.actor });
        // console.log(speaker);
        // console.log(speaker.alias);
        // console.log(this.actor.id);
        const html_roll = await renderTemplate(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            {
                // user: speaker.alias,
                // user: this.actor.id,
                // speaker: speaker.alias,
                title: `${label}`,
                crit: crit,
                fumble: fumble //,wunden
            },
        );
        // console.log(html_roll);
        roll.toMessage({
            speaker: speaker,
            flavor: html_roll,
        });
    }

    async _onClickable(event) {
        let data = this.actor.data.data;
        // console.log($(event.currentTarget));
        let clicktype = $(event.currentTarget).data('clicktype');
        if (clicktype == 'shorten_money') {
            let kreuzer = data.geld.kreuzer;
            let heller = data.geld.heller;
            let silbertaler = data.geld.silbertaler;
            let dukaten = data.geld.dukaten;
            if (kreuzer > 10) {
                let div = Math.floor(kreuzer / 10);
                heller += div;
                kreuzer -= div * 10;
            }
            if (heller > 10) {
                let div = Math.floor(heller / 10);
                silbertaler += div;
                heller -= div * 10;
            }
            if (silbertaler > 10) {
                let div = Math.floor(silbertaler / 10);
                dukaten += div;
                silbertaler -= div * 10;
            }
            this.actor.update({ 'data.geld.kreuzer': kreuzer });
            this.actor.update({ 'data.geld.heller': heller });
            this.actor.update({ 'data.geld.silbertaler': silbertaler });
            this.actor.update({ 'data.geld.dukaten': dukaten });
        } else if (clicktype == "addvorteilinfo"){
            game.packs.get("Ilaris.vorteile").render(true)
            Dialog.prompt({
                content: "Du kannst Vorteile direkt aus den Kompendium Packs auf den Statblock ziehen. Für eigene Vor/Nachteile zu erstellen, die nicht im Regelwerk enthalten sind, benutze die Eigenschaften.",
                callback: () => {
                },
              })
        } /* else if (clicktype == "togglewundenignorieren") {
            data.gesundheit.wundenignorieren = !data.gesundheit.wundenignorieren;
        } */
    }

    _onHpUpdate(event) {
        // console.log("HpUpdate");
        // this.actor.token.refresh();
        // console.log(event);
        let einschraenkungen =
            Math.floor(this.actor.data.data.gesundheit.wunden + this.actor.data.data.gesundheit.erschoepfung);
        // let old_hp = this.actor.data.data.gesundheit.hp.value;
        let new_hp = this.actor.data.data.gesundheit.hp.max - einschraenkungen;
        // this.actor.data.data.gesundheit.hp.value = new_hp;
        this.actor.update({ 'data.gesundheit.hp.value': new_hp });
        // this.actor.token.actor.data.data.gesundheit.hp.value = new_hp;
        // this.actor.token?.refresh();
        console.log(this.actor);
        // let token = this.actor.token;
        // console.log(token);
        // this.actor.token.update();
        // token.refresh();
        // console.log(token);
        // console.log(this.actor.token);
        // if (old_hp != new_hp) {
        //     // this.actor.data.data.gesundheit.hp.value = new_hp;
        //     // // console.log(data);
        //     // let actor = game.actors.get(data._id);
        //     // // console.log(actor);
        //     // // eigentlich async:
        //     // if (actor) {
        //     //     actor.update({ "data.gesundheit.hp.value": new_hp });
        //     // }
        //     this.actor.update({ "data.gesundheit.hp.value": new_hp });
        // }
    }

    _onSelectedKampfstil(event) {
        console.log('_onSelectedKampfstil');
        // console.log(event);
        // var selectElement = event.target;
        // console.log(selectElement);
        // var value = selectElement.value;
        let selected_kampfstil = event.target.value;
        console.log(selected_kampfstil);
        this.actor.data.data.misc.selected_kampfstil = selected_kampfstil;
        this.actor.update({ 'data.misc.selected_kampfstil': selected_kampfstil });
    }


    _onItemCreate(event) {
        console.log('ItemCreate');
        // console.log(event);
        // console.log($(event.currentTarget));
        let itemclass = $(event.currentTarget).data('itemclass');
        //ansehen: DomStringMap. Beide Varianten liefern das gleiche.
        //Welche ist besser und warum?
        // console.log($(event.currentTarget).data("itemclass"));
        // console.log(event.currentTarget.dataset.itemclass);

        // Das koennte extrem verkuerzt werden, wenn man einfach die namen (ggf. data) als
        // dict schreibt und itemData = {name: names[type], data: datas[type], type: type} 
        // statt den ganzen ifs benutzt.. 
        let itemData = {};
        if (itemclass == 'ruestung') {
            console.log('Neue Rüstung');
            itemData = {
                name: 'Neue Rüstung',
                type: 'ruestung',
                data: {},
            };
        } else if (itemclass == 'nahkampfwaffe') {
            console.log('Neue Nahkampfwaffe');
            itemData = {
                name: 'Waffe',
                type: itemclass,
                data: {},
            };
        } else if (itemclass == 'fernkampfwaffe') {
            console.log('Neue Fernkampfwaffe');
            itemData = {
                name: 'Waffe',
                type: itemclass,
                data: {},
            };
        } else if (itemclass == 'fertigkeit') {
            console.log('Neue Fertigkeit');
            itemData = {
                name: 'Fertigkeit',
                type: 'fertigkeit',
                data: {},
            };
        } else if (itemclass == 'talent') {
            console.log('Neues Talent');
            itemData = {
                name: 'Talent',
                type: 'talent',
                data: {},
            };
        } else if (itemclass == 'freie_fertigkeit') {
            console.log('Neue freie Fertigkeit');
            itemData = {
                name: 'freie Fertigkeit',
                type: 'freie_fertigkeit',
                data: {
                    stufe: 1,
                    gruppe: 4,
                },
            };
        } else if (itemclass == 'uebernatuerliche_fertigkeit') {
            console.log('Neue übernatürliche Fertigkeit');
            itemData = {
                name: 'Fertigkeit',
                type: 'uebernatuerliche_fertigkeit',
                data: {},
            };
        } else if (itemclass == 'zauber') {
            console.log('Neuer Zauber');
            itemData = {
                name: 'Zauber',
                type: 'zauber',
                data: {},
            };
        } else if (itemclass == 'liturgie') {
            console.log('Neue Liturgie');
            itemData = {
                name: 'Liturgie',
                type: 'liturgie',
                data: {},
            };
        } else if (itemclass == 'eigenheit') {
            console.log('Neue Eigenheit');
            itemData = {
                name: 'eigenheit',
                type: 'eigenheit',
                data: {},
            };
        } else if (itemclass == 'gegenstand') {
            console.log('Neuer Gegenstand');
            itemData = {
                name: 'gegenstand',
                type: 'gegenstand',
                data: {},
            };
        } else  {
            console.log('Neues generisches Item');
            console.log(itemclass);
            itemData = {
                name: itemclass.replace(itemclass[0], itemclass[0].toUpperCase()),
                type: itemclass,
                data: {},
            };
            console.log(itemData);
        }
        // console.log(this.actor);
        // console.log(this.actor.data);
        // console.log(this.actor.data.data);

        // Actor#createEmbeddedDocuments
        this.actor.createEmbeddedDocuments('Item', [itemData]);
        // await this.actor.createOwnedItem(itemData);
        // return this.actor.createOwnedItem(itemData);

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
        console.log('ItemEdit');
        // console.log(event);
        // console.log(event.currentTarget);
        // const li = $(ev.currentTarget).parents(".item");
        // const item = this.actor.getOwnedItem(li.data("itemId"));
        // item.sheet.render(true);
        const itemID = event.currentTarget.dataset.itemid;
        // const item = this.actor.getOwnedItem(itemID);
        const item = this.actor.items.get(itemID);
        // console.log(itemID);
        // console.log(this.actor.items);
        // TODO: update actor from here? always? only for kreatur? NO initialize wird schon getriggert
        item.sheet.render(true);
    }

    _onItemDelete(event) {
        console.log('ItemDelete');
        const itemID = event.currentTarget.dataset.itemid;
        // const li = $(event.currentTarget).parents(".item");
        // console.log(event.currentTarget);
        // console.log($(event.currentTarget));
        // console.log(li);
        // console.log(li.data);
        // console.log(event.currentTarget.dataset.itemclass);
        // console.log(event.currentTarget.dataset.itemid);
        // this.actor.deleteOwnedItem(li.data("itemId"));
        // this.actor.deleteOwnedItem(itemID);
        this.actor.deleteEmbeddedDocuments('Item', [itemID]);
        // li.slideUp(200, () => this.render(false));
    }
}
