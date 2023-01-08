import { nahkampfUpdate, calculate_attacke } from '../../common/wuerfel/nahkampf_prepare.js';

export class AngriffDialog extends Dialog {
    constructor(actor, item) {
        const dialog = {title: `Angriff: ${item.name}`};
        const options = {template: 'systems/Ilaris/templates/sheets/dialogs/angriff.html'}
        super(dialog, options);
        // keep references for use in callback functions
        this.actor = actor;  
        this.item = item;
    }

    getData () { // damit wird das template gefüttert
        return {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '0',
            distance_choice: CONFIG.ILARIS.distance_choice,
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get("core", "rollMode"),
            manoever: [],
            item: this.item,
        };
    }
    
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".angreifen").click(ev => this._angreifenKlick(ev, html));
    }

    async _angreifenKlick(ev, html) {
        console.log("ANGREIFEN!");
        await nahkampfUpdate(html, this.actor, this.item);
        // TODO: manoever fehlen in angriff items, damit die funktion durchlaufen kann..
        this.close();
    }
    
}