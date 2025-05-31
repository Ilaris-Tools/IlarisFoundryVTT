import {
    roll_crit_message,
} from '../../common/wuerfel/wuerfel_misc.js';
import {signed} from '../../common/wuerfel/chatutilities.js'
import { handleModifications } from './shared_dialog_helpers.js';
import { CombatDialog } from './combat_dialog.js';
import * as hardcoded from '../../actors/hardcodedvorteile.js';

export class UebernatuerlichDialog extends CombatDialog {
    constructor(actor,item) {
        const dialog = {title: `Übernatürliche Fertigkeit: ${item.name}`};
        const options = {
            template: 'systems/Ilaris/templates/sheets/dialogs/uebernatuerlich.html',
            width: 500,
            height: 'auto'
        };
        super(dialog, options);
        // this can be probendialog (more abstract)
        this.text_at = '';
        this.text_dm = '';
        this.text_ressource = '';
        this.item = item;
        this.actor = actor;
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor });
        this.rollmode = game.settings.get("core", "rollMode");  // public, private.... 
        this.item.system.manoever.rllm.selected = game.settings.get("core", "rollMode");  // TODO: either manoever or dialog property.
        this.fumble_val = 1;
        this.aufbauendeManoeverAktivieren()
    }

    async getData () { // damit wird das template gefüttert
        return {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            ...(await super.getData()),
        };
    }

    async _angreifenKlick(html) {
        // NOTE: var names not very descriptive: 
        // at_abzuege_mod kommen vom status/gesundheit, at_mod aus ansagen, nahkampfmod?
        let xd20_choice = Number(html.find('input[name="xd20"]:checked')[0]?.value) || 0;
        xd20_choice = xd20_choice == 0 ? '1d20' : '3d20dl1dh1';
        let diceFormula = this.getDiceFormula(html,xd20_choice);
        await this.manoeverAuswaehlen(html);
        await this.updateManoeverMods();  // durch manoever
        this.updateStatusMods();

        // Check if we have enough resources
        let currentResource;
        let resourcePath;
        if(this.actor.type == 'held') {
            if(this.item.type === 'zauber') {
                currentResource = this.actor.system.abgeleitete.asp_stern;
                resourcePath = 'system.abgeleitete.asp_stern';
            } else {
                currentResource = this.actor.system.abgeleitete.kap_stern;
                resourcePath = 'system.abgeleitete.kap_stern';
            }
        } else {
            if(this.item.type === 'zauber') {
                currentResource = this.actor.system.energien.asp.value;
                resourcePath = 'system.energien.asp.value';
            } else {
                currentResource = this.actor.system.energien.kap.value;
                resourcePath = 'system.energien.kap.value';
            }
        }

        // If not enough resources, show error and return
        if (currentResource < this.mod_ressource) {
            ui.notifications.error(`Nicht genug Ressourcen! Benötigt: ${this.mod_ressource}, Vorhanden: ${currentResource}`);
            return;
        }

        let label = `${this.item.name} (GesamtKosten: ${this.mod_ressource} Energie)`;
        let formula = 
            `${diceFormula} ${signed(this.item.system.pw)} \
            ${signed(this.at_abzuege_mod)} \
            ${signed(this.mod_at)}`;

        // Show roll result
        let isSuccess = false;
        let is16OrHigher = false;
        [isSuccess,is16OrHigher] = await roll_crit_message(
            formula,
            label,
            this.text_at + '\n' + this.text_ressource,
            this.speaker,
            this.rollmode,
            true,
            this.fumble_val,
            12
        );

        let costModifier = 2;
        // hardcoded failed liturgie cost
        if(this.actor.type == 'held' && this.item.type == 'liturgie' && this.actor.vorteil.karma.some(v => v.name == 'Liturgische Sorgfalt')) {
            costModifier = 4;
        }
        // Calculate cost based on success
        let cost = isSuccess ? this.mod_ressource : Math.ceil(this.item.system.kosten / costModifier);
        
        // Apply all cost modifications from advantages and styles
        cost = hardcoded.calculateModifiedCost(this.actor, this.item, isSuccess, is16OrHigher, cost);
            
        // Update resources
        await this.actor.update({
            [resourcePath]: currentResource - cost
        });
    }

    async manoeverAuswaehlen(html)  {
        /* parsed den angriff dialog und schreibt entsprechende werte 
        in die waffen items. Ersetzt ehemalige angriffUpdate aus angriff_prepare.js
        TODO: kann ggf. mit manoeverAnwenden zusammengelegt werden?
        TODO: kann evt in ein abstraktes waffen item verschoben werden oder
        in einn abstrakten angriffsdialog für allgemeine manöver wunden etc, und spezifisch
        überschrieben werden.. 
        TODO: könnte das nicht direkt via template passieren für einen großteil der werte? 
        sodass ne form direkt die werte vom item ändert und keine update funktion braucht?
        dann wäre die ganze funktion hier nicht nötig.
        TODO: alle simplen booleans könnten einfach in eine loop statt einzeln aufgeschrieben werden
        */
        let manoever = this.item.system.manoever;

        // allgemeine optionen
        manoever.kbak.selected = html.find('#kbak')[0]?.checked || false;  // Kombinierte Aktion

        manoever.mod.selected = html.find('#modifikator')[0]?.value || false;  // Modifikator
        manoever.rllm.selected = html.find('#rollMode')[0]?.value || false;  // RollMode
        await super.manoeverAuswaehlen(html);
    }
    
    async updateManoeverMods() {
        let manoever = this.item.system.manoever;

        let mod_at = 0;
        let mod_vt = 0;
        let mod_dm = 0;
        let mod_ressource = parseInt(this.item.system.kosten.match(/\d+/)?.[0] || '0', 10);
        let text_at = '';
        let text_vt = '';
        let text_dm = '';
        let text_ressource = '';
        let schaden = null;
        let nodmg = {name: '', value: false};
        let trefferzone = 0;
        let fumble_val = 1;

        // Kombinierte Aktion kbak
        if (manoever.kbak.selected) {
            mod_at -= 4;
            text_at = text_at.concat('Kombinierte Aktion\n');
        }

        // Collect all modifications from all maneuvers
        const allModifications = [];
        this.item.manoever.forEach(dynamicManoever => {
            let check = undefined;
            let number = undefined;
            let trefferZoneInput = undefined;
            if(dynamicManoever.inputValue.value) {
                if(dynamicManoever.inputValue.field == 'CHECKBOX') {
                    check = dynamicManoever.inputValue.value;
                } else if(dynamicManoever.inputValue.field == 'NUMBER') {
                    number = dynamicManoever.inputValue.value;
                } else {
                    trefferZoneInput = dynamicManoever.inputValue.value;
                }
            }
            if(check == undefined && (number == undefined || number == 0) && (trefferZoneInput == undefined || trefferZoneInput == 0)) return;

            // Add valid modifications to the collection
            Object.values(dynamicManoever.system.modifications).forEach(modification => {
                allModifications.push({
                    modification,
                    manoever: dynamicManoever,
                    number,
                    check,
                    trefferZoneInput
                });
            });
        });

        // Process all modifications in order
        [
            mod_at,
            mod_vt,
            mod_dm,
            mod_ressource,
            text_at,
            text_vt,
            text_dm,
            text_ressource,
            trefferzone,
            schaden,
            nodmg
        ] = handleModifications(allModifications, {mod_at,mod_vt,mod_dm,mod_ressource,text_at,text_vt,text_dm,text_ressource,trefferzone,schaden:null,nodmg:null,context: this});
        
        // Modifikator
        let modifikator = Number(manoever.mod.selected);
        if (modifikator != 0) {
            mod_vt += modifikator;
            mod_at += modifikator;
            text_vt = text_vt.concat(`Modifikator: ${modifikator}\n`);
            text_at = text_at.concat(`Modifikator: ${modifikator}\n`);
        }
        console.log('mod_ressource',mod_ressource)
        this.mod_at = mod_at;
        this.mod_vt = mod_vt;
        this.mod_dm = mod_dm;
        this.mod_ressource = mod_ressource;
        this.text_at = text_at;
        this.text_vt = text_vt;
        this.text_dm = text_dm;
        this.text_ressource = text_ressource;
        this.schaden = schaden;
        this.fumble_val = fumble_val;
    }
}