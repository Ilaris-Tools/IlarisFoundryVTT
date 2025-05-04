import { IlarisActorSheet } from './actor.js';

export class HeldenSheet extends IlarisActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/helden.html',
            // width: 720,
            // height: 800,
            // resizable: false,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'fertigkeiten',
                },
            ],
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.schips-button').click((ev) => this._schipsClick(ev));
    }

    async _schipsClick(ev) {
        console.log(ev);
        if (ev.currentTarget.className.includes('filled')) {
            await this.actor.update({ 'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1 });
        } else {
            await this.actor.update({ 'system.schips.schips_stern': this.actor.system.schips.schips_stern + 1 });
        }

        console.log(this.actor);
        this.render(); // Ensure the sheet is re-rendered to reflect the changes
    }
}
