export class IlarisActorSheet extends ActorSheet {

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".fertigkeit-view").click(ev => this._fertigkeitView(ev));
        html.find(".rollable").click(ev => this._onRollable(ev));
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
}
