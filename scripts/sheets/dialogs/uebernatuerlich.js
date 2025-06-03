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
        console.log('actor',this.actor)
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor });
        this.rollmode = game.settings.get("core", "rollMode");  // public, private.... 
        this.item.system.manoever.rllm.selected = game.settings.get("core", "rollMode");  // TODO: either manoever or dialog property.
        this.item.system.manoever.blutmagie = this.item.system.manoever.blutmagie || {};
        this.item.system.manoever.verbotene_pforten = this.item.system.manoever.verbotene_pforten || {};
        this.fumble_val = 1;
        this.aufbauendeManoeverAktivieren()
    }

    activateListeners(html) {
        super.activateListeners(html);

        const updateEstimate = () => {
            const wounds = Number(html.find('#verbotene_pforten')[0]?.value) || 0;
            const multiplier = Number(html.find('input[name="verbotene_pforten_toggle"]:checked')[0]?.value) || 4;
            const ws = this.actor.type === 'held' ? 
                this.actor.system.abgeleitete.ws :
                this.actor.system.kampfwerte.ws;
            
            const estimate = wounds * (ws + multiplier);
            html.find('#verbotene_pforten_estimate').text(`${estimate} AsP`);
        };
        
        // Add event listeners for both the radio buttons and number input
        html.find('input[name="verbotene_pforten_toggle"]').change(updateEstimate);
        html.find('#verbotene_pforten').on('input', updateEstimate);
        
        // Initial update
        updateEstimate();
    }

    async getData() { // damit wird das template gefüttert
        const hasBlutmagie = this.actor.vorteil.magie.some(v => v.name === "Blutmagie") && this.item.type === 'zauber';

        const hasVerbotenePforten = this.actor.vorteil.magie.some(v => v.name === "Verbotene Pforten") || 
            (this.actor.type === 'kreatur' ? 
                (this.actor.vorteil.allgemein.some(v => v.name.includes("Borbaradianer")) ||
                this.actor.vorteil.magie.some(v => v.name.includes("Borbaradianer")) ||
                this.actor.vorteil.zaubertraditionen.some(v => v.name.includes("Borbaradianer"))) :
                (hardcoded.getSelectedStil(this.actor, 'uebernatuerlich')?.name.includes("Borbaradianer"))
            ) && this.item.type === 'zauber';

        return {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_verbotene_pforten: {
                4: "1 Vorteil (WS+4)",
                8: "2 Vorteile (WS+8)"
            },
            hasBlutmagie,
            hasVerbotenePforten,
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

        // Parse difficulty from item's schwierigkeit
        let difficulty = null;
        let additionalText = '';
        const schwierigkeit = this.item.system.schwierigkeit;
        if (schwierigkeit) {
            const parsedDifficulty = parseInt(schwierigkeit);
            if (!isNaN(parsedDifficulty)) {
                difficulty = parsedDifficulty;
            } else {
                additionalText = `\n${schwierigkeit}`;
            }
        }

        // Show roll result
        let isSuccess = false;
        let is16OrHigher = false;
        [isSuccess,is16OrHigher] = await roll_crit_message(
            formula,
            label,
            this.text_at + '\n' + this.text_ressource + additionalText,
            this.speaker,
            this.rollmode,
            true,
            this.fumble_val,
            difficulty
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
            
        // Update resources and apply wounds if using Verbotene Pforten
        const updates = {
            [resourcePath]: currentResource - cost
        };

        // Apply wounds from Verbotene Pforten if any
        if (this.item.system.manoever.verbotene_pforten?.wounds) {
            const wounds = this.item.system.manoever.verbotene_pforten.wounds;
            updates['system.gesundheit.wunden'] = this.actor.system.gesundheit.wunden + wounds;
        }

        await this.actor.update(updates);
    }

    async manoeverAuswaehlen(html)  {
        let manoever = this.item.system.manoever;

        // allgemeine optionen
        manoever.kbak.selected = html.find('#kbak')[0]?.checked || false;  // Kombinierte Aktion
        
        // Get values from Blutmagie and Verbotene Pforten if they exist
        manoever.blutmagie.value = Number(html.find('#blutmagie')[0]?.value) || 0;
        manoever.verbotene_pforten = {
            multiplier: Number(html.find('input[name="verbotene_pforten_toggle"]:checked')[0]?.value) || 4,
            wounds: Number(html.find('#verbotene_pforten')[0]?.value) || 0
        };

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

        // Get the minimum available resource based on actor and item type
        let availableResource;
        if(this.actor.type == 'held') {
            if(this.item.type === 'zauber') {
                availableResource = this.actor.system.abgeleitete.asp_stern;
            } else {
                availableResource = this.actor.system.abgeleitete.kap_stern;
            }
        } else {
            if(this.item.type === 'zauber') {
                availableResource = this.actor.system.energien.asp.value;
            } else {
                availableResource = this.actor.system.energien.kap.value;
            }
        }

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

        // Handle Blutmagie and Verbotene Pforten
        if (manoever.blutmagie?.value || manoever.verbotene_pforten?.wounds) {
            // Handle Blutmagie
            if (manoever.blutmagie?.value) {
                const maxReduction = mod_ressource - availableResource;
                const blutmagieReduction = Math.min(maxReduction, manoever.blutmagie.value);
                if (blutmagieReduction > 0) {
                    mod_ressource -= blutmagieReduction;
                    text_ressource = text_ressource.concat(`Blutmagie: -${blutmagieReduction} AsP\n`);
                }
            }

            // Handle Verbotene Pforten
            if (manoever.verbotene_pforten?.wounds) {
                const ws = this.actor.type === 'held' ? 
                    this.actor.system.abgeleitete.ws :
                    this.actor.system.kampfwerte.ws;
                const multiplier = manoever.verbotene_pforten.multiplier;
                console.log('multiplier',multiplier)
                const wounds = manoever.verbotene_pforten.wounds;
                const verbotenePfortenReduction = (ws + multiplier) * wounds;
                
                const maxReduction = mod_ressource - availableResource;
                const actualReduction = Math.min(maxReduction, verbotenePfortenReduction);
                if (actualReduction > 0) {
                    mod_ressource -= actualReduction;
                    text_ressource = text_ressource.concat(`Verbotene Pforten (${wounds} Wunden): -${actualReduction} AsP (zeigt nur aufgebrauchte AsP an, Rest verfällt)\n`);
                }
            }
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