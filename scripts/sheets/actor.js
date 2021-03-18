export class IlarisActorSheet extends ActorSheet {

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".fertigkeit-view").click(ev => this._fertigkeitView(ev));
        html.find(".roll-attribut").click(ev => this._rollAttribut(ev));
        html.find(".roll-fertigkeitpw").click(ev => this._rollFertigkeitPW(ev));
        html.find(".roll-fertigkeitpwt").click(ev => this._rollFertigkeitPWT(ev));
        // html.find(".rollable-attfert").click(ev => this._onRollable_old(ev));
        // html.find(".rollable-attfert").click(ev => this._rollable-attfert(ev));
        // html.find(".fertigkeit-view").click(async ev => this._fertigkeitViewa(ev));
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

    _rollAttribut(event) {
        // console.log(event);
        // console.log(event.currentTarget);
        // console.log(event.currentTarget.dataset);
        console.log(this.actor.name);
        const attribut_name = $(event.currentTarget).data("attribut");
        console.log(attribut_name);
        // console.log(this.actor.data);
        // console.log(this.actor.data.data.attribute[attribut_name]);
        // console.log(this.actor.data.data.attribute[attribut_name].pw);
        let pw = this.actor.data.data.attribute[attribut_name].pw;
        // console.log(pw);
        // const skillName = $(event.currentTarget).data("skill");
        let wundabzuege = this.actor.data.data.gesundheit.wundabzuege;
        let formula = `${pw} ${wundabzuege} + 3d20dl1dh1`;
        // let formula = `${data.pw} + 3d20dhdl`;
        let roll = new Roll(formula);
        roll.roll();
        console.log(roll);
        roll.toMessage();
    };

    _rollFertigkeitPW(event) {
        console.log(event.currentTarget);
        const fertigkeit_name = $(event.currentTarget).data("fertigkeit");
        console.log(fertigkeit_name);
        let pw = this.actor.data.data.fertigkeiten[fertigkeit_name].pw;
        let wundabzuege = this.actor.data.data.gesundheit.wundabzuege;
        let formula = `${pw} ${wundabzuege} + 3d20dl1dh1`;
        let roll = new Roll(formula);
        roll.roll();
        console.log(roll);
        roll.toMessage();
    };

    _rollFertigkeitPWT(event) {
        console.log(event.currentTarget);
        const fertigkeit_name = $(event.currentTarget).data("fertigkeit");
        console.log(fertigkeit_name);
        let pw = this.actor.data.data.fertigkeiten[fertigkeit_name].pwt;
        let wundabzuege = this.actor.data.data.gesundheit.wundabzuege;
        let formula = `${pw} ${wundabzuege} + 3d20dl1dh1`;
        let roll = new Roll(formula);
        roll.roll();
        console.log(roll);
        roll.toMessage();
    };

    //alter Versuch von mir. Passt nicht mehr, inkompatibles template. 
    async _onRollable_old(event) {
        console.log(event);
        // event.preventDefault();
        const target = event.currentTarget;
        console.log(target);
        const data = target.dataset; //die data-xxx die im html code festgelegt wurden. data-attribut (html) -> data.attribut hier
        const actorData = this.actor.data.data;

        if ($(target).hasClass('attribut') && data.attribut) {
            console.log('In Attribut')
            // let formula = `${data.pw} + 3d20dhdl + ${data.mod}`;
            let formula = `${data.pw} + 3d20dhdl`;
            let roll = new Roll(formula);
            roll.roll();
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
                title: `${data.label}-Probe`,
                crit: crit,
                fumble: fumble
            };
            console.log(templateData);
            let template = 'systems/ilaris/templates/chat/dreid20.html';
            renderTemplate(template, templateData, roll).then(content => {
                if (formula != null) {
                    roll.toMessage({ flavor: content });
                }
            });
        } else if ($(target).hasClass('fertigkeit-pw') && data.fertigkeit) {
            console.log('In Fertigkeit PW')
            // let formula = `${data.pw} + 3d20dhdl + ${data.mod}`;
            let formula = `${data.value} + 3d20dhdl`;
            let roll = new Roll(formula);
            roll.roll();
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
                title: `${data.label}-Probe (ohne Talent)`,
                crit: crit,
                fumble: fumble
            };
            console.log(templateData);
            let template = 'systems/ilaris/templates/chat/dreid20.html';
            renderTemplate(template, templateData, roll).then(content => {
                if (formula != null) {
                    roll.toMessage({ flavor: content });
                }
            });
        } else if ($(target).hasClass('fertigkeit-pwt') && data.fertigkeit) {
            console.log('In Fertigkeit PWT')
            // let formula = `${data.pw} + 3d20dhdl + ${data.mod}`;
            let formula = `${data.value} + 3d20dhdl`;
            let roll = new Roll(formula);
            roll.roll();
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
                title: `${data.label}-Probe (mit Talent)`,
                crit: crit,
                fumble: fumble
            };
            console.log(templateData);
            let template = 'systems/ilaris/templates/chat/dreid20.html';
            renderTemplate(template, templateData, roll).then(content => {
                if (formula != null) {
                    roll.toMessage({ flavor: content });
                }
            });
        };
    }
    // async _fertigkeitViewa(event) {
    //     const fertigkeitName = $(event.currentTarget).data("fertigkeit");
    //     const fertigkeit = this.actor.data.data.fertigkeiten[fertigkeitName];
    //     console.log(fertigkeitName);
    //     console.log(fertigkeit);
    //     console.log(fertigkeit.talente);
    //     const htmlview = await renderTemplate("systems/Ilaris/templates/sheets/tabs/fertigkeitview.html", fertigkeit);
    //     let dialog = new Dialog({
    //         content: htmlview
    //     });
    //     dialog.render(true);
    // };

}
