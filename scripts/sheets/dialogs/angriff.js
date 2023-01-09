
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
        if (!"manoever" in this.item) {
            this.item.manoever = [];
        }
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
        await this.manoeverAuswaehlen(html);
        this.manoeverAnwenden(this.actor, this.item);  // durch manoever
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
        
        manoeverIds = ['kbak', 'vlof', 'vldf', 'pssl']

        // allgemeine optionen
        manoever.kbak.selected = html.find('#kbak')[0].checked;  // Kombinierte Aktion
        manoever.vlof.selected = html.find('#vlof')[0].checked;  // Volle Offensive
        manoever.vldf.selected = html.find('#vldf')[0].checked;  // Volle Defensive
        manoever.pssl.selected = html.find('#pssl')[0].checked;  // Passierschlag pssl
        
        // kampf manoever (if checked before.. maybe fallback to null?)
        manoever.km_ausw.selected = html.find('#km_ausw')[0].checked;  // Ausweichen km_ausw
        manoever.km_rust.selected = html.find('#km_rust')[0].checked;  // Rüstungsbrecher km_rust
        manoever.km_shsp.selected = html.find('#km_shsp')[0].checked;  // Schildspalter km_shsp
        manoever.km_stsl.selected = html.find('#km_stsl')[0].checked;  // Stumpfer Schlag km_stsl
        manoever.km_ever.selected = html.find('#km_ever')[0].checked;  // Entfernung verändern km_ever


        

        manoever.rkaz.selected = html.find('#rkaz')[0].value;  // Reaktionsanzahl


        // Binden km_bind
        if (html.find('#km_bind').length > 0) {
            checked = html.find('#km_bind')[0].value;
            manoever.km_bind.selected = checked;
        }
        // Umreißen km_umre
        if (html.find('#km_umre').length > 0) {
            manoever.km_umre.selected = html.find('#km_umre')[0].checked;
        }

        

        // Entwaffen km_entw
        if (html.find('#km_entw_at').length > 0) {
            manoever.km_entw.selected_at = html.find('#km_entw_at')[0].checked;
        }
        if (html.find('#km_entw_vt').length > 0) {
            manoever.km_entw.selected_vt = html.find('#km_entw_vt')[0].checked;
        }
        // Gezielter Schlag km_gzsl
        if (html.find('#km_gzsl').length > 0) {
            manoever.km_gzsl.selected = html.find('#km_gzsl')[0].value;
        }
        // Wuchtschlag km_wusl
        if (html.find('#km_wusl').length > 0) {
            manoever.km_wusl.selected = html.find('#km_wusl')[0].value;
        }
        // Auflaufen lassen km_aufl
        if (html.find('#km_aufl').length > 0) {
            manoever.km_aufl.selected = html.find('#km_aufl')[0].checked;
            manoever.km_aufl.gs = html.find('#km_aufl_gs')[0].value;
        }
        // Umklammern km_umkl
        if (html.find('#km_umkl').length > 0) {
            manoever.km_umkl.selected = html.find('#km_umkl')[0].checked;
            manoever.km_umkl.mod = html.find('#km_umkl_mod')[0].value;
        }
        // Ausfall km_ausf
        if (html.find('#km_ausf').length > 0) {
            manoever.km_ausf.selected = html.find('#km_ausf')[0].checked;
        }
        // Befreiungsschlag km_befr
        if (html.find('#km_befr').length > 0) {
            manoever.km_befr.selected = html.find('#km_befr')[0].checked;
        }
        // Doppelangriff km_dppl
        if (html.find('#km_dppl').length > 0) {
            manoever.km_dppl.selected = html.find('#km_dppl')[0].checked;
        }
        // Hammerschlag km_hmsl
        if (html.find('#km_hmsl').length > 0) {
            manoever.km_hmsl.selected = html.find('#km_hmsl')[0].checked;
        }
        // Klingentanz km_kltz
        if (html.find('#km_kltz').length > 0) {
            manoever.km_kltz.selected = html.find('#km_kltz')[0].checked;
        }
        // Niederwerfen km_ndwf
        if (html.find('#km_ndwf').length > 0) {
            manoever.km_ndwf.selected = html.find('#km_ndwf')[0].checked;
        }
        // Riposte km_rpst
        if (html.find('#km_rpst').length > 0) {
            manoever.km_rpst.selected = html.find('#km_rpst')[0].checked;
        }
        // Schildwall km_shwl
        if (html.find('#km_shwl').length > 0) {
            manoever.km_shwl.selected = html.find('#km_shwl')[0].checked;
        }
        // Sturmangriff km_stag
        if (html.find('#km_stag').length > 0) {
            manoever.km_stag.selected = html.find('#km_stag')[0].checked;
            manoever.km_stag.gs = html.find('#km_stag_gs')[0].value;
        }
        // Todesstoß km_tdst
        if (html.find('#km_tdst').length > 0) {
            manoever.km_tdst.selected = html.find('#km_tdst')[0].checked;
        }
        // Überrennen km_uebr
        if (html.find('#km_uebr').length > 0) {
            manoever.km_uebr.selected = html.find('#km_uebr')[0].checked;
            manoever.km_uebr.gs = html.find('#km_uebr_gs')[0].value;
        }
        // Unterlaufen km_utlf
        if (html.find('#km_utlf').length > 0) {
            checked = html.find('#km_utlf')[0].checked;
            manoever.km_utlf.selected = checked;
        }



        let checked = false;
        // Reichweitenunterschied
        let rwdf_check = html.find("input[name='rwdf']");
        for (let i of rwdf_check) {
            if (i.checked) checked = i.value;
        }
        manoever.rwdf.selected = checked;
        
        manoever.mod.selected = html.find('#modifikator')[0].value;  // Modifikator
        manoever.rllm.selected = html.find('#rollMode')[0].value;  // RollMode
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
        if (manoeve.vlof.selected) {
            if (manoeve.vlof.offensiver_kampfstil) {
                mod_at += 8;
                text_at = text_at.concat('Volle Offensive (Offensiver Kampfstil)\n');
            } else {
                mod_at += 4;
                text_at = text_at.concat('Volle Offensive\n');
            }
        }
        // Reichweitenunterschiede rwdf
        // let reichweite = manoeve.rwdf.selected || 0;  // contains number
        // mod_at -= 2 * Number(reichweite);
        // text_at = text_at.concat(`Reichweitenunterschied: ${reichweite}\n`);
        // //Passierschlag pssl & Anzahl Reaktionen rkaz
        // if (manoeve.pssl.selected) {
        //     let reaktionen = Number(manoeve.rkaz.selected);
        //     if (reaktionen > 0) {
        //         mod_at -= 4 * reaktionen;
        //         text_at = text_at.concat(`Passierschlag: (${reaktionen})\n`);
        //     }
        // }
        // // Binden km_bind
        // let binden = Number(manoeve.km_bind.selected);
        // if (binden > 0) {
        //     mod_at += binden;
        //     text_at = text_at.concat(`Binden: ${binden}\n`);
        // }
        // // Entfernung verändern km_ever
        // if (manoeve.km_ever.selected) {
        //     mod_at -= data.abgeleitete.be || 0;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_ever']}\n`);
        // }
        // // Entwaffnen km_entw
        // if (manoeve.km_entw.selected_at) {
        //     mod_at -= 4;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_entw']}\n`);
        // }
        // // Gezielter Schlag km_gzsl
        // let trefferzone = Number(manoeve.km_gzsl.selected);
        // if (trefferzone) {
        //     mod_at -= 2;
        //     text_at = text_at.concat(
        //         `${CONFIG.ILARIS.label['km_gzsl']}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`,
        //     );
        // }
        // // Umreißen km_umre
        // if (manoeve.km_umre.selected) {
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_umre']}\n`);
        // }
        // // Wuchtschlag km_wusl
        // let wusl = Number(manoeve.km_wusl.selected);
        // if (wusl > 0) {
        //     mod_at -= wusl;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_wusl']}: ${wusl}\n`);
        // }
        // // Rüstungsbrecher km_rust
        // if (manoeve.km_rust.selected) {
        //     mod_at -= 4;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_rust']}\n`);
        // }
        // // Schildspalter km_shsp
        // if (manoeve.km_shsp.selected) {
        //     mod_at += 2;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_shsp']}\n`);
        // }
        // // Stumpfer Schlag km_stsl
        // if (manoeve.km_stsl.selected) {
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_stsl']}\n`);
        // }
        // // Umklammern km_umkl
        // if (manoeve.km_umkl.selected) {
        //     let umkl = Number(manoeve.km_umkl.mod);
        //     mod_at -= umkl;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_umkl']}: ${umkl}\n`);
        // }
        // // Ausfall km_ausf
        // if (manoeve.km_ausf.selected) {
        //     mod_at -= 2 + be;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_ausf']}\n`);
        // }
        // // Befreiungsschlag km_befr
        // if (manoeve.km_befr.selected) {
        //     mod_at -= 4;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_befr']}\n`);
        // }
        // // Doppelangriff km_dppl
        // if (manoeve.km_dppl.selected) {
        //     mod_at -= 4;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_dppl']}\n`);
        // }
        // // Hammerschlag km_hmsl
        // if (manoeve.km_hmsl.selected) {
        //     mod_at -= 8;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_hmsl']}\n`);
        // }
        // // Klingentanz km_kltz
        // if (manoeve.km_kltz.selected) {
        //     mod_at -= 4;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_kltz']}\n`);
        // }
        // // Niederwerfen km_ndwf
        // if (manoeve.km_ndwf.selected) {
        //     mod_at -= 4;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_ndwf']}\n`);
        // }
        // // Sturmangriff km_stag
        // if (manoeve.km_stag.selected) {
        //     if (manoeve.kbak.selected) mod_at += 4;
        //     let gs = Number(manoeve.km_stag.gs);
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_stag']}: ${gs}\n`);
        // }
        // // Todesstoß km_tdst
        // if (manoeve.km_tdst.selected) {
        //     mod_at -= 8;
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_tdst']}\n`);
        // }
        // // Überrennen km_uebr
        // if (manoeve.km_uebr.selected) {
        //     if (manoeve.kbak.selected) mod_at += 4;
        //     let gs = Number(manoeve.km_uebr.gs);
        //     text_at = text_at.concat(`${CONFIG.ILARIS.label['km_uebr']}: ${gs}\n`);
        // }
        this.text_at = text_at;
        this.mod_at = mod_at;
    }

}