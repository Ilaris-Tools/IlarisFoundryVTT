import {
    roll_crit_message,
    get_statuseffect_by_id,
} from '../../common/wuerfel/wuerfel_misc.js';
import {signed} from '../../common/wuerfel/chatutilities.js'
import { handleModifications } from './shared_dialog_helpers.js';


export class AngriffDialog extends Dialog {
    constructor(actor, item) {
        const dialog = {title: `Kampf: ${item.name}`};
        const options = {
            template: 'systems/Ilaris/templates/sheets/dialogs/angriff.html',
            width: 500,
            height: 'auto'
        };
        super(dialog, options);
        // this can be probendialog (more abstract)
        this.text_at = '';
        this.text_vt = '';
        this.text_dm = '';
        this.item = item;
        this.actor = actor;
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor });
        this.rollmode = game.settings.get("core", "rollMode");  // public, private.... 
        this.item.system.manoever.rllm.selected = game.settings.get("core", "rollMode");  // TODO: either manoever or dialog property.
        this.fumble_val = 1;
        if (this.item.system.eigenschaften.unberechenbar) {
            this.fumble_val = 2;
        }
        this.aufbauendeManoeverAktivieren()
    }

    async getData () { // damit wird das template gefüttert
        return {
            distance_choice: CONFIG.ILARIS.distance_choice,
            rollModes: CONFIG.Dice.rollModes,
            trefferzonen: CONFIG.ILARIS.trefferzonen,
            item: this.item,
            actor: this.actor,
            mod_at: this.mod_at,
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
        };
    }
    
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".angreifen").click(ev => this._angreifenKlick(html));
        html.find(".verteidigen").click(ev => this._verteidigenKlick(html));
        html.find(".schaden").click(ev => this._schadenKlick(html));
        
        // Add expand/collapse functionality
        html.find(".maneuver-header").click(ev => {
            const header = ev.currentTarget;
            const grid = header.nextElementSibling;
            const isCollapsed = header.classList.contains("collapsed");
            const text = header.querySelector("h4");
            
            header.classList.toggle("collapsed");
            grid.classList.toggle("collapsed");
            
            // Update text based on state
            text.textContent = isCollapsed ? "Einklappen" : "Ausklappen";
        });

        // Update has-value class when inputs change
        html.find(".maneuver-item input, .maneuver-item select").change(ev => {
            const item = ev.currentTarget.closest(".maneuver-item");
            const hasValue = Array.from(item.querySelectorAll("input, select")).some(input => {
                if (input.type === "checkbox") return input.checked;
                return input.value && input.value !== "0";
            });
            item.classList.toggle("has-value", hasValue);
        });
    }

    async _angreifenKlick(html) {
        // NOTE: var names not very descriptive: 
        // at_abzuege_mod kommen vom status/gesundheit, at_mod aus ansagen, nahkampfmod?
        let diceFormula = this.getDiceFormula(html);
        await this.manoeverAuswaehlen(html);
        await this.updateManoeverMods();  // durch manoever
        this.updateStatusMods();
        this.eigenschaftenText();

        let label = `Attacke (${this.item.name})`;
        let formula = 
            `${diceFormula} ${signed(this.item.system.at)} \
            ${signed(this.at_abzuege_mod)} \
            ${signed(this.item.actor.system.modifikatoren.nahkampfmod)} \
            ${signed(this.mod_at)}`;
        await roll_crit_message(
            formula,
            label,
            this.text_at,
            this.speaker,
            this.rollmode,
            true,
            this.fumble_val,
        );
    }

    async _verteidigenKlick(html) {
        await this.manoeverAuswaehlen(html);
        await this.updateManoeverMods();
        this.updateStatusMods();
        let label = `Verteidigung (${this.item.name})`;
        let diceFormula = this.getDiceFormula(html);
        let formula = `${diceFormula} ${signed(this.vt_abzuege_mod)} ${signed(this.item.actor.system.modifikatoren.nahkampfmod)} ${signed(this.mod_vt)}`;
        await roll_crit_message(formula, label, this.text_vt, this.speaker, this.rollmode, true, this.fumble_val);
    }

    async _schadenKlick(html){
        await this.manoeverAuswaehlen(html);
        await this.updateManoeverMods();
        // Rollmode
        let label = `Schaden (${this.item.name})`;
        let formula = `${this.schaden} ${signed(this.mod_dm)}`;
        await roll_crit_message(formula, label, this.text_dm, this.speaker, this.rollmode, false);
    }

    eigenschaftenText() {
        if (!this.item.system.eigenschaften.length > 0) {
            return;
        }
        this.text_at += "\nEigenschaften: ";
        this.text_at += this.item.system.eigenschaften.map(e => e.name).join(", ");
    }

    aufbauendeManoeverAktivieren() {
        let manoever = this.item.system.manoever;
        let vorteile = this.actor.vorteil.kampf.map(v => v.name);

        manoever.vlof.offensiver_kampfstil =vorteile.includes('Offensiver Kampfstil');
        manoever.kwut = vorteile.includes('Kalte Wut');
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
        manoever.vlof.selected = html.find('#vlof')[0]?.checked || false;  // Volle Offensive
        manoever.vldf.selected = html.find('#vldf')[0]?.checked || false;  // Volle Defensive
        manoever.pssl.selected = html.find('#pssl')[0]?.checked || false;  // Passierschlag pssl
        manoever.rwdf.selected = html.find('#rwdf')[0]?.value || false;  // Reichweitenunterschied
        manoever.rkaz.selected = html.find('#rkaz')[0]?.value || false;  // Reaktionsanzahl

        manoever.mod.selected = html.find('#modifikator')[0]?.value || false;  // Modifikator
        manoever.rllm.selected = html.find('#rollMode')[0]?.value || false;  // RollMode
        this.rollmode = this.item.system.manoever.rllm.selected;

        this.item.manoever.forEach(manoever => {
            if(manoever.inputValue.field == 'CHECKBOX') {
                manoever.inputValue.value = html.find(`#${manoever.id+manoever.inputValue.field}`)[0]?.checked || false;
            } else {
                console.log(manoever.inputValue.name,html.find(`#${manoever.id+manoever.inputValue.field}`)[0]?.value)
                manoever.inputValue.value = html.find(`#${manoever.id+manoever.inputValue.field}`)[0]?.value || false;
            }
        });
    }
    
    async updateManoeverMods() {
        let manoever = this.item.system.manoever;

        let mod_at = 0;
        let mod_vt = 0;
        let mod_dm = 0;
        let text_at = '';
        let text_vt = '';
        let text_dm = '';
        let nodmg = {name: '', value: false};
        let trefferzone = 0;
        let schaden = this.item.getTp();

        // Handle standard maneuvers first
        if (manoever.kbak.selected) {
            mod_at -= 4;
            text_at = text_at.concat('Kombinierte Aktion: -4\n');
        }
        // Volle Offensive vlof
        if (manoever.vlof.selected && !manoever.pssl.selected) {
            if (manoever.vlof.offensiver_kampfstil) {
                mod_vt -= 4;
                text_vt = text_vt.concat('Volle Offensive (Offensiver Kampfstil): -4\n');
            } else {
                mod_vt -= 8;
                text_vt = text_vt.concat('Volle Offensive: -8\n'); 
            }
            mod_at += 4;
            text_at = text_at.concat('Volle Offensive: +4\n');
        }
        // Volle Defensive vldf
        if (manoever.vldf.selected) {
            mod_vt += 4;
            text_vt = text_vt.concat('Volle Defensive +4\n');
        }
        // Reichweitenunterschiede rwdf
        let reichweite = Number(manoever.rwdf.selected);
        if (reichweite > 0) {
            let mod_rwdf = 2 * Number(reichweite);
            mod_at -= mod_rwdf;
            mod_vt -= mod_rwdf;
            text_at = text_at.concat(`Reichweitenunterschied: ${mod_rwdf}\n`);
            text_vt = text_vt.concat(`Reichweitenunterschied: ${mod_rwdf}\n`);
        }
        // Passierschlag pssl & Anzahl Reaktionen rkaz
        let reaktionen = Number(manoever.rkaz.selected);
        if (reaktionen > 0) {
            let mod_rkaz = 4 * reaktionen;
            mod_vt -= mod_rkaz;
            text_vt = text_vt.concat(`${reaktionen}. Reaktion: -${mod_rkaz}\n`);
            if (manoever.pssl.selected) {
                mod_at -= mod_rkaz;
                text_at = text_at.concat(`${reaktionen}. Passierschlag: -${mod_rkaz} \n`);
            }
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

            // Handle special cases
            if (manoever.kbak.selected) {
                if(dynamicManoever.name == 'Sturmangriff') {
                    mod_at += 4;
                    text_at = text_at.concat(`${dynamicManoever.name}: +4\n`);
                }
                if(dynamicManoever.name == 'Überrennen') {
                    mod_at += 4;
                    text_at = text_at.concat(`${dynamicManoever.name}: +4\n`);
                }
            }
            if (dynamicManoever.name == 'Riposte') {
                mod_vt += mod_at;
                text_vt = text_vt.concat(
                    `${dynamicManoever.name}: (\n${text_at})\n`,
                );
                text_dm = text_dm.concat(
                    `${dynamicManoever.name}: (\n${text_at})\n`,
                );
            }
        });

        // Process all modifications in order
        [
            mod_at,
            mod_vt,
            mod_dm,
            text_at,
            text_vt,
            text_dm,
            trefferzone,
            schaden,
            nodmg
        ] = handleModifications(allModifications, {mod_at,mod_vt,mod_dm,text_at,text_vt,text_dm,trefferzone,schaden,nodmg,context: this});

        // If ZERO_DAMAGE was found, override damage values
        if (nodmg.value) {
            mod_dm = 0;
            schaden = '0';
            // Add text explaining zero damage if not already present
            if (!text_dm.includes('Kein Schaden')) {
                text_dm = text_dm.concat(`${nodmg.name}: Kein Schaden\n`);
            }
        }

        // Trefferzone if not set by manoever
        if(trefferzone == 0){
            let zonenroll = new Roll('1d6');
            await zonenroll.evaluate();
            text_dm = text_dm.concat(
                `Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`,
            );
        }
        
        // Modifikator
        let modifikator = Number(manoever.mod.selected);
        if (modifikator != 0) {
            mod_vt += modifikator;
            mod_at += modifikator;
            text_vt = text_vt.concat(`Modifikator: ${modifikator}\n`);
            text_at = text_at.concat(`Modifikator: ${modifikator}\n`);
        }
        
        this.mod_at = mod_at;
        this.mod_vt = mod_vt;
        this.mod_dm = mod_dm;
        this.text_at = text_at;
        this.text_vt = text_vt;
        this.text_dm = text_dm;
        this.schaden = schaden;
    }

    updateStatusMods() {
        /* aus gesundheit und furcht wird at- und vt_abzuege_mod
        berechnet.
        */ 
        this.at_abzuege_mod = 0;
        this.vt_abzuege_mod = 0;

        if (this.item.actor.system.gesundheit.wundabzuege < 0 && this.item.system.manoever.kwut) {
            this.text_at = this.text_at.concat(`(Kalte Wut)\n`);
            this.at_abzuege_mod = this.item.actor.system.abgeleitete.furchtabzuege;
            this.text_vt = this.text_at.concat(`(Kalte Wut)\n`);
            this.vt_abzuege_mod = this.item.actor.system.abgeleitete.furchtabzuege;
        } else {
            this.at_abzuege_mod = this.item.actor.system.abgeleitete.globalermod;
            this.vt_abzuege_mod = this.item.actor.system.abgeleitete.globalermod;
        }
    }

    getDiceFormula(html) {
        let schipsOption = Number(html.find('input[name="schips"]:checked')[0]?.value) || 0;
        let text = '';
        let diceFormula = `1d20`;
        if(schipsOption == 0) {
            return diceFormula;
        }
        if (this.actor.system.schips.schips_stern == 0) {
            this.text_at = text.concat(`Keine Schips\n`);
            this.text_vt = text.concat(`Keine Schips\n`);
            return diceFormula;
        }

        this.actor.update({'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1});
        if (schipsOption == 1) {
            this.text_at = text.concat(`Schips ohne Eigenheit\n`);
            this.text_vt = text.concat(`Schips ohne Eigenheit\n`);
            diceFormula = `${2}d20dl${1}`;
        } 
        
        if (schipsOption == 2) {
            this.text_at = text.concat(`Schips mit Eigenschaft\n`);
            this.text_vt = text.concat(`Schips mit Eigenschaft\n`);
            diceFormula = `${3}d20dl${2}`;
        }
        return diceFormula;
    }
}