
import {
    roll_crit_message,
    get_statuseffect_by_id,
} from '../../common/wuerfel/wuerfel_misc.js';

export class AngriffDialog extends Dialog {
    constructor(actor, item) {
        const dialog = {title: `Angriff: ${item.name}`};
        const options = {template: 'systems/Ilaris/templates/sheets/dialogs/angriff.html'}
        super(dialog, options);
        // keep references for use in callback functions
        this.actor = actor;  // wird eig. garnicht gebraucht, sollte auch in item.actor stecken
        this.item = item;
    }

    getData () { // damit wird das template gefüttert
        return {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '0',
            distance_choice: CONFIG.ILARIS.distance_choice,
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get("core", "rollMode"),
            item: this.item,
        };
    }
    
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".angreifen").click(ev => this._angreifenKlick(ev, html));
    }

    async _angreifenKlick(ev, html) {
        console.log("ANGREIFEN!");
        console.log(this.item);
        await this.manoeverAuswaehlen(html);
        this.manoeverAnwenden(this.actor, this.item);  // durch manoever
        console.log("nach updates");
        console.log(this.item);
        // let item = this.item;
        let data = this.item.actor.data.data;
        let speaker = ChatMessage.getSpeaker({ actor: this.actor });

        let dice_number = 1;  // todo use from item or func return
        let dice_form = `${dice_number}d20`;
        let wundabzuegemod = data.gesundheit.wundabzuege; // TODO: ist nicht geschrieben?
        let at_abzuege_mod = 0;
        let furchtmod = data.furcht.furchtabzuege;
        let nahkampfmod = data.modifikatoren.nahkampfmod;
        let globalermod = data.abgeleitete.globalermod;
        let pw_at = this.item.data.data.at;
        let pw_vt = this.item.data.data.vt;
        let rollmode = this.item.data.data.manoever.rllm.selected;  // saved in manoever? maybe extra var?

        if (wundabzuegemod < 0 && this.item.data.data.manoever.kwut) {
            this.text_at = text_at.concat(`(Kalte Wut)\n`);
            at_abzuege_mod = furchtmod;
        } else {
            at_abzuege_mod = globalermod;
        }
        function signed(i) {if (i < 0) { return `${i}`} else {return `+${i}`}};
        let formula = `${dice_form} ${signed(pw_at)} ${signed(at_abzuege_mod)} ${signed(nahkampfmod)} ${signed(this.mod_at)}`;
        // Critfumble & Message
        let label = `Attacke (${this.item.name})`;
        let fumble_val = 1;
        if (this.item.data.data.eigenschaften.unberechenbar) {
            fumble_val = 2;
        }
        await roll_crit_message(
            formula,
            label,
            this.text_at,
            speaker,
            rollmode,
            true,
            fumble_val,
        );
        this.close();
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
        let manoever = this.item.data.data.manoever;
        
        // manoeverIds = ['kbak', 'vlof', 'vldf', 'pssl']

        // allgemeine optionen
        manoever.kbak.selected = html.find('#kbak')[0]?.checked || false;  // Kombinierte Aktion
        manoever.vlof.selected = html.find('#vlof')[0]?.checked || false;  // Volle Offensive
        manoever.vldf.selected = html.find('#vldf')[0]?.checked || false;  // Volle Defensive
        manoever.pssl.selected = html.find('#pssl')[0]?.checked || false;  // Passierschlag pssl
        manoever.rwdf.selected = html.find('#rwdf')[0]?.value || false;  // Reichweitenunterschied
        
        // kampf manoever
        manoever.km_ausw.selected = html.find('#km_ausw')[0]?.checked || false;  // Ausweichen km_ausw
        manoever.km_rust.selected = html.find('#km_rust')[0]?.checked || false;  // Rüstungsbrecher km_rust
        manoever.km_shsp.selected = html.find('#km_shsp')[0]?.checked || false;  // Schildspalter km_shsp
        manoever.km_stsl.selected = html.find('#km_stsl')[0]?.checked || false;  // Stumpfer Schlag km_stsl
        manoever.km_ever.selected = html.find('#km_ever')[0]?.checked || false;  // Entfernung verändern km_ever
        manoever.km_umre.selected = html.find('#km_umre')[0]?.checked || false;  // Umreißen km_umre
        manoever.km_ausf.selected = html.find('#km_ausf')[0]?.checked || false;  // Ausfall km_ausf
        manoever.km_befr.selected = html.find('#km_befr')[0]?.checked || false;
        manoever.km_dppl.selected = html.find('#km_dppl')[0]?.checked || false;
        manoever.km_hmsl.selected = html.find('#km_hmsl')[0]?.checked || false;
        manoever.km_kltz.selected = html.find('#km_kltz')[0]?.checked || false;
        manoever.km_ndwf.selected = html.find('#km_ndwf')[0]?.checked || false;
        manoever.km_rpst.selected = html.find('#km_rpst')[0]?.checked || false;
        manoever.km_shwl.selected = html.find('#km_shwl')[0]?.checked || false;
        manoever.km_stag.selected = html.find('#km_stag')[0]?.checked || false;
        manoever.km_tdst.selected = html.find('#km_tdst')[0]?.checked || false;
        manoever.km_uebr.selected = html.find('#km_uebr')[0]?.checked || false;
        manoever.km_utlf.selected = html.find('#km_utlf')[0]?.checked || false;
        manoever.km_entw.selected_at = html.find('#km_entw_at')[0]?.checked || false;  // Entwaffen km_entw
        manoever.km_entw.selected_vt = html.find('#km_entw_vt')[0]?.checked || false;  // Entwaffnen VT
        manoever.km_umkl.selected = html.find('#km_umkl')[0]?.checked || false; // Umklammern km_umkl

        manoever.rkaz.selected = html.find('#rkaz')[0]?.value || false;  // Reaktionsanzahl
        manoever.km_bind.selected = html.find('#km_bind')[0]?.value || false;  // Binden km_bind
        manoever.km_gzsl.selected = html.find('#km_gzsl')[0]?.value || false; // Gezielter Schlag km_gzsl
        this.item.data.data.manoever.km_wusl.selected = html.find('#km_wusl')[0]?.value || false;  // Wuchtschlag km_wusl
        console.log("WUSL");
        console.log(manoever.km_wusl.selected);
        console.log(html.find('#km_wusl')[0]?.value);
        console.log(this.item.data.data.manoever.km_wusl.selected);
        manoever.km_umkl.mod = html.find('#km_umkl_mod')[0]?.value || false;
        manoever.km_uebr.gs = html.find('#km_uebr_gs')[0]?.value || false;
        manoever.km_stag.gs = html.find('#km_stag_gs')[0]?.value || false;
        manoever.km_aufl.gs = html.find('#km_aufl_gs')[0]?.value || false; // Auflaufen lassen km_aufl

        if (manoever.km_aufl.gs > 0) { // && possible?
            manoever.km_aufl.selected = true;
        }

        
        manoever.mod.selected = html.find('#modifikator')[0]?.value || false;  // Modifikator
        manoever.rllm.selected = html.find('#rollMode')[0]?.value || false;  // RollMode
    }
    
    manoeverAnwenden() {
        /* geht ausgewählte manöver durch und schreibt summe in 
        this.mod_at und this.text_at
        ersetzt teile der callback funktion aus wuerfel.js und calculate_attacke aus attacke_prepare.js

        // TODO: das wäre vlt. ne gute item.manoeverAnwenden() die dann 
        // item.at_mod, item.vt_mod, item.at_text item.vt_text schreibt oder sowas?
        // #31
        */
        let data = this.item.actor.data.data;
        let item = this.item;
        let manoever = this.item.data.data.manoever;

        let mod_at = 0;
        let mod_vt = 0;
        let text_at = '';
        let text_vt = '';

        if (manoever.kbak.selected) {
            mod_at -= 4;
            text_at = text_at.concat('Kombinierte Aktion\n');
        }
        // Volle Offensive vlof
        if (manoever.vlof.selected) {
            if (manoever.vlof.offensiver_kampfstil) {
                mod_at += 8;
                text_at = text_at.concat('Volle Offensive (Offensiver Kampfstil)\n');
            } else {
                mod_at += 4;
                text_at = text_at.concat('Volle Offensive\n');
            }
        }
        // Reichweitenunterschiede rwdf
        if (manoever.rwdf.selected) {
            mod_at -= 2 * Number(reichweite);
            text_at = text_at.concat(`Reichweitenunterschied: ${reichweite}\n`);
        }
        //Passierschlag pssl & Anzahl Reaktionen rkaz
        if (manoever.pssl.selected) {
            let reaktionen = Number(manoever.rkaz.selected);
            if (reaktionen > 0) {
                mod_at -= 4 * reaktionen;
                text_at = text_at.concat(`Passierschlag: (${reaktionen})\n`);
            }
        }
        // Binden km_bind
        let binden = Number(manoever.km_bind.selected);
        if (binden > 0) {
            mod_at += binden;
            text_at = text_at.concat(`Binden: ${binden}\n`);
        }
        // Entfernung verändern km_ever
        if (manoever.km_ever.selected) {
            mod_at -= data.abgeleitete.be || 0;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_ever']}\n`);
        }
        // Entwaffnen km_entw
        if (manoever.km_entw.selected_at) {
            mod_at -= 4;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_entw']}\n`);
        }
        // Gezielter Schlag km_gzsl
        let trefferzone = Number(manoever.km_gzsl.selected);
        if (trefferzone) {
            mod_at -= 2;
            text_at = text_at.concat(
                `${CONFIG.ILARIS.label['km_gzsl']}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`,
            );
        }
        // Umreißen km_umre
        if (manoever.km_umre.selected) {
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_umre']}\n`);
        }
        // Wuchtschlag km_wusl
        let wusl = Number(manoever.km_wusl.selected);
        if (wusl > 0) {
            mod_at -= wusl;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_wusl']}: ${wusl}\n`);
        }
        // Rüstungsbrecher km_rust
        if (manoever.km_rust.selected) {
            mod_at -= 4;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_rust']}\n`);
        }
        // Schildspalter km_shsp
        if (manoever.km_shsp.selected) {
            mod_at += 2;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_shsp']}\n`);
        }
        // Stumpfer Schlag km_stsl
        if (manoever.km_stsl.selected) {
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_stsl']}\n`);
        }
        // Umklammern km_umkl
        if (manoever.km_umkl.selected) {
            let umkl = Number(manoever.km_umkl.mod);
            mod_at -= umkl;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_umkl']}: ${umkl}\n`);
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
        }
        // Sturmangriff km_stag
        if (manoever.km_stag.selected) {
            if (manoever.kbak.selected) mod_at += 4;
            let gs = Number(manoever.km_stag.gs);
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_stag']}: ${gs}\n`);
        }
        // Todesstoß km_tdst
        if (manoever.km_tdst.selected) {
            mod_at -= 8;
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_tdst']}\n`);
        }
        // Überrennen km_uebr
        if (manoever.km_uebr.selected) {
            if (manoever.kbak.selected) mod_at += 4;
            let gs = Number(manoever.km_uebr.gs);
            text_at = text_at.concat(`${CONFIG.ILARIS.label['km_uebr']}: ${gs}\n`);
        }
        this.text_at = text_at;
        this.mod_at = mod_at;
    }

}