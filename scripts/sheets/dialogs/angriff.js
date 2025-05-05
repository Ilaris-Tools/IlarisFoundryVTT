import {
    roll_crit_message,
    get_statuseffect_by_id,
} from '../../common/wuerfel/wuerfel_misc.js';
import {signed} from '../../common/wuerfel/chatutilities.js'


export class AngriffDialog extends Dialog {
    constructor(actor, item) {
        const dialog = {title: `Kampf: ${item.name}`};
        const options = {template: 'systems/Ilaris/templates/sheets/dialogs/angriff.html'}
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
    }

    async _angreifenKlick(html) {
        // NOTE: var names not very descriptive: 
        // at_abzuege_mod kommen vom status/gesundheit, at_mod aus ansagen, nahkampfmod?
        let diceFormula = await this.getDiceFormula(html);
        await this.manoeverAuswaehlen(html);
        this.updateManoeverMods();  // durch manoever
        this.updateStatusMods();
        this.eigenschaftenText();
        console.log(this.text_at);

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
        // this.close();
    }

    async _verteidigenKlick(html) {
        await this.manoeverAuswaehlen(html);
        this.updateManoeverMods(this.actor, this.item);  // durch manoever
        console.log(this.mod_vt);
        this.updateStatusMods();
        let label = `Verteidigung (${this.item.name})`;
        let formula = `1d20 + ${this.item.system.vt} ${signed(this.vt_abzuege_mod)} ${signed(this.item.actor.system.modifikatoren.nahkampfmod)} ${signed(this.mod_vt)}`;
        // console.log(formula);
        // console.log(this.vt_abzuege_mod);
        await roll_crit_message(formula, label, this.text_vt, this.speaker, this.rollmode, true, this.fumble_val);
        // TODO: wird unberechenbar auch auf VT gezählt?
        // this.close();
    }

    async _schadenKlick(html){
        await this.manoeverAuswaehlen(html);
        this.updateManoeverMods(html);
        // Rollmode
        let label = `Schaden (${this.item.name})`;
        let formula = `${this.schaden} ${signed(this.mod_dm)}`;
        console.log(formula);
        if (this.nodmg) {
            formula = "0";
        }
        await roll_crit_message(formula, label, this.text_dm, this.speaker, this.rollmode, false);
        // this.close()
    }

    eigenschaftenText() {
        console.log(this.item);
        if (!this.item.system.eigenschaften.length > 0) {
            return;
        }
        this.text_at += "\nEigenschaften: ";
        this.text_at += this.item.system.eigenschaften.map(e => e.name).join(", ");
    }

    aufbauendeManoeverAktivieren() {
        console.log(this.actor)
        let manoever = this.item.system.manoever;
        let eigenschaften = Object.values(this.item.system.eigenschaften).map(e => e.name);
        let vorteile = this.actor.vorteil.kampf.map(v => v.name);

        manoever.km_rust.possible = eigenschaften.includes("Rüstungsbrechend");
        manoever.km_stsl.possible = eigenschaften.includes("Stumpf");
        manoever.km_umkl.possible = true;
        manoever.km_ausf.possible = vorteile.includes("Ausfall");
        manoever.km_hmsl.possible = vorteile.includes('Hammerschlag');
        manoever.km_kltz.possible = vorteile.includes('Klingentanz');
        manoever.km_ndwf.possible = vorteile.includes('Niederwerfen');
        manoever.km_stag.possible = vorteile.includes('Sturmangriff');
        manoever.km_tdst.possible = vorteile.includes('Todesstoß');
        manoever.vlof.offensiver_kampfstil =vorteile.includes('Offensiver Kampfstil');
        manoever.kwut = vorteile.includes('Kalte Wut');
    }

    manoeverAuswaehlen(html)  {
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
        
        // manoeverIds = ['kbak', 'vlof', 'vldf', 'pssl']

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
            manoever.selectorValues.forEach(selector => {
                if(selector.key == 'CHECKBOX') {
                    selector.value = html.find(`#${manoever.id+selector.key}`)[0]?.checked || false;
                } else {
                    selector.value = html.find(`#${manoever.id+selector.key}`)[0]?.value || false;
                }
            });
        });
    }
    
    updateManoeverMods() {
        /* geht ausgewählte manöver durch und schreibt summe in 
        this.mod_at und this.text_at
        ersetzt teile der callback funktion aus wuerfel.js und calculate_attacke aus attacke_prepare.js

        // TODO: das wäre vlt. ne gute item.manoeverAnwenden() die dann 
        // item.at_mod, item.vt_mod, item.at_text item.vt_text schreibt oder sowas?
        // #31
        */
        let systemData = this.item.actor.system;
        let item = this.item;
        let manoever = this.item.system.manoever;
        let be = systemData.abgeleitete.be || 0;

        let mod_at = 0;
        let mod_vt = 0;
        let mod_dm = 0;
        let text_at = '';
        let text_vt = '';
        let text_dm = '';
        let nodmg = false;
        // TDOO: this differ between angriff and nk/fk waffen, define get_tp() in both?
        // let schaden = item.data.data.schaden;
        let schaden = item.system.tp.replace(/[Ww]/g, "d");
        if(this.actor.type == "held") {
            schaden = item.system.schaden.replace(/[Ww]/g, "d");
        }

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

        this.item.manoever.forEach(manoever => {
            manoever.selectorValues.forEach(selector => {
                if(selector.key == 'CHECKBOX') {
                    console.log(manoever.name);
                } else {
                    console.log(manoever.name, selector.value);
                }
            });
        });
        // Ausweichen km_ausw
        if (manoever.km_ausw.selected) {
            mod_vt -= 2+be;
            text_vt = text_vt.concat(`Ausweichen: -${2+be}\n`);
        }
        // Auflaufen lassen km_aufl
        if (manoever.km_aufl.selected) {
            let gs = Number(item.system.manoever.km_aufl.gs);
            mod_vt -= 4;
            text_vt = text_vt.concat(`${CONFIG.ILARIS.label['km_aufl']} (${gs}): -4\n`);
            mod_dm += gs;
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_aufl']}: ${gs}\n`)
        }
        // Binden km_bind
        let binden = Number(manoever.km_bind.selected);
        if (binden > 0) {
            mod_vt -= binden;
            text_vt = text_vt.concat(`Binden: -${binden}\n`);
        }
        // Entfernung verändern km_ever
        if (manoever.km_ever.selected) {
            let be = systemData.abgeleitete.be || 0
            mod_at -= be;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_ever']}: -${be}\n`);
        }
        // Entwaffnen km_entw
        if (manoever.km_entw.selected) {
            mod_at -= 4;
            mod_vt -= 4;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_entw']}: -4\n`);
            text_vt = text_vt.concat(`${CONFIG.ILARIS.label['km_entw']}: -4\n`);
        }
        // Gezielter Schlag km_gzsl
        let trefferzone = Number(manoever.km_gzsl.selected);
        if (trefferzone) {
            mod_at -= 2;
            let txt = `${CONFIG.ILARIS.label['km_gzsl']} (${CONFIG.ILARIS.trefferzonen[trefferzone]}): -2\n`;
            text_at = text_at.concat(txt);
            text_dm = text_dm.concat(txt)
        } else {
            let zonenroll = new Roll('1d6');
            zonenroll.evaluate();
            text_dm = text_dm.concat(
                `Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`,
            );
        }
        // Umreißen km_umre
        if (manoever.km_umre.selected) {
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_umre']}: Kein Schaden\n`);
            nodmg = true;
        }
        // Unterlaufen km_utlf
        if (manoever.km_utlf.selected) {
            mod_vt -= 4;
            text_vt = text_vt.concat(`${CONFIG.ILARIS.label['km_utlf']}: -4\n`);
        }
        // Wuchtschlag km_wusl
        let wusl = Number(manoever.km_wusl.selected);
        if (wusl > 0) {
            mod_dm += wusl;
            mod_at -= wusl;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_wusl']}: -${wusl}\n`);
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_wusl']}: +${wusl}\n`);
        }
        // Rüstungsbrecher km_rust
        if (manoever.km_rust.selected) {
            mod_at -= 4;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_rust']}: -4\n`);
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_rust']}\n`);
        }
        // Schildspalter km_shsp
        if (manoever.km_shsp.selected) {
            mod_at += 2;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_shsp']}: +2\n`);
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_shsp']}\n`);
        }
        // Schildwall km_shwl
        if (manoever.km_shwl.selected) {
            mod_vt -= 4;
            text_vt = text_vt.concat(`${CONFIG.ILARIS.label['km_shwl']}: -4\n`);
        }
        // Stumpfer Schlag km_stsl
        if (manoever.km_stsl.selected) {
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_stsl']}: Erschöpfung statt Wunde\n`);
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_stsl']}\n`);
        }
        // Umklammern km_umkl
        if (manoever.km_umkl.selected) {
            let umkl = Number(manoever.km_umkl.mod);
            mod_at -= umkl;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_umkl']}: -${umkl}\n`);
        }
        // Ausfall km_ausf
        if (manoever.km_ausf.selected) {
            mod_at -= 2 + be;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_ausf']}\n`);
        }
        // Befreiungsschlag km_befr
        if (manoever.km_befr.selected) {
            mod_at -= 4;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_befr']}\n`);
        }
        // Doppelangriff km_dppl
        if (manoever.km_dppl.selected) {
            mod_at -= 4;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_dppl']}\n`);
        }
        // Hammerschlag km_hmsl
        if (manoever.km_hmsl.selected) {
            mod_at -= 8;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_hmsl']}\n`);
            schaden = schaden.concat(` * 2`);
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_hmsl']}\n`);
        }
        // Klingentanz km_kltz
        if (manoever.km_kltz.selected) {
            mod_at -= 4;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_kltz']}\n`);
        }
        // Niederwerfen km_ndwf
        if (manoever.km_ndwf.selected) {
            mod_at -= 4;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_ndwf']}\n`);
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_ndwf']}\n`)
            nodmg = true; // TODO: error message if already true?
        }
        // Sturmangriff km_stag
        if (manoever.km_stag.selected) {
            if (manoever.kbak.selected) {
                mod_at += 4;
                text_at = text_at.concat(`${CONFIG.ILARIS.label['km_stag']}: +4\n`);
            }
            let gs = Number(manoever.km_stag.gs);
            mod_dm += gs;
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_stag']}: ${gs}\n`);
        }
        // Todesstoß km_tdst
        if (manoever.km_tdst.selected) {
            mod_at -= 8;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_tdst']}\n`);
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_tdst_dm']}\n`);
        }
        // Überrennen km_uebr
        if (manoever.km_uebr.selected) {
            if (manoever.kbak.selected) mod_at += 4;
            let gs = Number(manoever.km_uebr.gs);
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_uebr']} (${gs})\n`);
            mod_dm += gs;
            text_dm = text_dm.concat(`${CONFIG.ILARIS.label['km_uebr']}: ${gs}\n`);
        }

        // Modifikator
        let modifikator = Number(manoever.mod.selected);
        if (modifikator != 0) {
            mod_vt += modifikator;
            mod_at += modifikator;
            text_vt = text_vt.concat(`Modifikator: ${modifikator}\n`);
            text_at = text_at.concat(`Modifikator: ${modifikator}\n`);
        }
        
        if (item.system.manoever.km_rpst.selected) {
            mod_vt += -4 + mod_at;
            text_vt = text_vt.concat(
                `${CONFIG.ILARIS.label['km_rpst']}: (\n${text_at})\n`,
            );
        }
        this.mod_at = mod_at;
        this.mod_vt = mod_vt;
        this.mod_dm = mod_dm;
        this.text_at = this.text_at.concat(text_at);
        this.text_vt = this.text_vt.concat(text_vt);
        this.text_dm = this.text_dm.concat(text_dm);
        this.nodmg = nodmg;
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