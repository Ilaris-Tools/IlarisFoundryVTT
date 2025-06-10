export class CombatDialog extends Dialog {
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

        manoever.kwut = vorteile.includes('Kalte Wut');
    }

    async manoeverAuswaehlen(html)  {
        /* TODO: könnte das nicht direkt via template passieren für einen großteil der werte? 
        sodass ne form direkt die werte vom item ändert und keine update funktion braucht?
        dann wäre die ganze funktion hier nicht nötig.
        TODO: alle simplen booleans könnten einfach in eine loop statt einzeln aufgeschrieben werden
        */
        this.rollmode = this.item.system.manoever.rllm.selected;

        this.item.manoever.forEach(manoever => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`;
            if(manoever.inputValue.field == 'CHECKBOX') {
                manoever.inputValue.value = html.find(`#${elementId}`)[0]?.checked || false;
            } else {
                console.log(manoever.inputValue.name,html.find(`#${elementId}`)[0]?.value)
                manoever.inputValue.value = html.find(`#${elementId}`)[0]?.value || false;
            }
        });
    }

    updateStatusMods() {
        /* aus gesundheit und furcht wird at- und vt_abzuege_mod
        berechnet.
        */ 
        this.at_abzuege_mod = 0;

        if (this.item.actor.system.gesundheit.wundabzuege < 0 && this.item.system.manoever.kwut) {
            this.text_at = this.text_at.concat(`(Kalte Wut)\n`);
            this.at_abzuege_mod = this.item.actor.system.abgeleitete.furchtabzuege;
        } else {
            this.at_abzuege_mod = this.item.actor.system.abgeleitete.globalermod;
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