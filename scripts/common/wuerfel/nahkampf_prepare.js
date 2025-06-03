/*
  Warum muss in nahkampfUpdate:
  item.system.manoever.km_ever.selected = checked;
  item.update({"manoever.km_ever.selected": checked});
  beides da stehen? Gehirnbrand!
  .....
  Stimmt so nicht: ItemUpdates werden garnicht gespeichert und gehen bei jedem Update des Actors verloren.
  Daher item.update() entfernt. So sind sie konsintent bis zum nächsten Update.
  .....
  manoever werden in Actor.js nicht fest gespeichert!
  => Sobald ein ActorUpdate kommt werden sie überschrieben!
  Aber in templates schreiben ist kaka!
  .....
  Und nochmal ansehen, ob ich im html richtig speicher.
  Eigentlich sollte meine Zuweisung hier unnötig sein.
  .....
  Idee: Manöver ergeben den meisten sind nur mit Haupt-/Nebenwaffen:
  Im Actor zwei Manöverlisten für Haupt-/Nebenwaffe speichern?
  (Und dann die anderen ausblenden? Oder ein neues Array einführen, in welchem für alle Waffen die Manöverlisten gespeichert werden?)
*/

export function nahkampfUpdate(html, actor, item) {
    /* schreibt alle inputs aus dem nahkampf_angriff template in ein objekt
     */
    // async function nahkampfUpdate(html, actor, item) {
    // let itemId = item.id;
    // item = actor.items.get(itemId);
    let checked = false
    let updateData = { manoever: {} }
    // Kombinierte Aktion
    checked = html.find('#kbak')[0].checked
    item.system.manoever.kbak.selected = checked
    Object.assign(updateData, { manoever: { kabak: { selected: checked } } })
    // Volle Offensive
    checked = html.find('#vlof')[0].checked
    item.system.manoever.vlof.selected = checked
    Object.assign(updateData, { manoever: { vlof: { selected: checked } } })
    // Volle Defensive
    checked = html.find('#vldf')[0].checked
    item.system.manoever.vldf.selected = checked
    Object.assign(updateData, { manoever: { vldf: { selected: checked } } })
    // Reichweitenunterschied
    let rwdf_check = html.find("input[name='rwdf']")
    for (let i of rwdf_check) {
        if (i.checked) checked = i.value
    }
    item.system.manoever.rwdf.selected = checked
    Object.assign(updateData, { manoever: { rwdf: { selected: checked } } })
    // Reaktionsanzahl
    checked = html.find('#rkaz')[0].value
    item.system.manoever.rkaz.selected = checked
    Object.assign(updateData, { manoever: { rkaz: { selected: checked } } })
    // Passierschlag pssl
    checked = html.find('#pssl')[0].checked
    item.system.manoever.pssl.selected = checked
    Object.assign(updateData, { manoever: { pssl: { selected: checked } } })
    // Ausweichen km_ausw
    if (html.find('#km_ausw').length > 0) {
        checked = html.find('#km_ausw')[0].checked
        item.system.manoever.km_ausw.selected = checked
        Object.assign(updateData, { manoever: { km_ausw: { selected: checked } } })
    }
    // Binden km_bind
    if (html.find('#km_bind').length > 0) {
        checked = html.find('#km_bind')[0].value
        item.system.manoever.km_bind.selected = checked
        Object.assign(updateData, { manoever: { km_bind: { selected: checked } } })
    }
    // Entfernung verändern km_ever
    if (html.find('#km_ever').length > 0) {
        checked = html.find('#km_ever')[0].checked
        item.system.manoever.km_ever.selected = checked
        Object.assign(updateData, { manoever: { km_ever: { selected: checked } } })
    }
    // Entwaffen km_entw
    if (html.find('#km_entw_at').length > 0) {
        checked = html.find('#km_entw_at')[0].checked
        item.system.manoever.km_entw.selected_at = checked
        Object.assign(updateData, { manoever: { km_entw: { selected_at: checked } } })
    }
    if (html.find('#km_entw_vt').length > 0) {
        checked = html.find('#km_entw_vt')[0].checked
        item.system.manoever.km_entw.selected_vt = checked
        Object.assign(updateData, { manoever: { km_entw: { selected_vt: checked } } })
    }
    // Gezielter Schlag km_gzsl
    if (html.find('#km_gzsl').length > 0) {
        checked = html.find('#km_gzsl')[0].value
        item.system.manoever.km_gzsl.selected = checked
        Object.assign(updateData, { manoever: { km_gzsl: { selected: checked } } })
    }
    // Umreißen km_umre
    if (html.find('#km_umre').length > 0) {
        checked = html.find('#km_umre')[0].checked
        item.system.manoever.km_umre.selected = checked
        Object.assign(updateData, { manoever: { km_umre: { selected: checked } } })
    }
    // Wuchtschlag km_wusl
    if (html.find('#km_wusl').length > 0) {
        checked = html.find('#km_wusl')[0].value
        item.system.manoever.km_wusl.selected = checked
        Object.assign(updateData, { manoever: { km_wusl: { selected: checked } } })
    }
    // Auflaufen lassen km_aufl
    if (html.find('#km_aufl').length > 0) {
        checked = html.find('#km_aufl')[0].checked
        item.system.manoever.km_aufl.selected = checked
        Object.assign(updateData, { manoever: { km_aufl: { selected: checked } } })
        checked = html.find('#km_aufl_gs')[0].value
        item.system.manoever.km_aufl.gs = checked
        Object.assign(updateData, { manoever: { km_aufl: { gs: checked } } })
    }
    // Rüstungsbrecher km_rust
    if (html.find('#km_rust').length > 0) {
        checked = html.find('#km_rust')[0].checked
        item.system.manoever.km_rust.selected = checked
        Object.assign(updateData, { manoever: { km_rust: { selected: checked } } })
    }
    // Schildspalter km_shsp
    if (html.find('#km_shsp').length > 0) {
        checked = html.find('#km_shsp')[0].checked
        item.system.manoever.km_shsp.selected = checked
        Object.assign(updateData, { manoever: { km_shsp: { selected: checked } } })
    }
    // Stumpfer Schlag km_stsl
    if (html.find('#km_stsl').length > 0) {
        checked = html.find('#km_stsl')[0].checked
        item.system.manoever.km_stsl.selected = checked
        Object.assign(updateData, { manoever: { km_stsl: { selected: checked } } })
    }
    // Umklammern km_umkl
    if (html.find('#km_umkl').length > 0) {
        checked = html.find('#km_umkl')[0].checked
        item.system.manoever.km_umkl.selected = checked
        Object.assign(updateData, { manoever: { km_umkl: { selected: checked } } })
        checked = html.find('#km_umkl_mod')[0].value
        item.system.manoever.km_umkl.mod = checked
        Object.assign(updateData, { manoever: { km_umkl: { mod: checked } } })
    }
    // Ausfall km_ausf
    if (html.find('#km_ausf').length > 0) {
        checked = html.find('#km_ausf')[0].checked
        item.system.manoever.km_ausf.selected = checked
        Object.assign(updateData, { manoever: { km_ausf: { selected: checked } } })
    }
    // Befreiungsschlag km_befr
    if (html.find('#km_befr').length > 0) {
        checked = html.find('#km_befr')[0].checked
        item.system.manoever.km_befr.selected = checked
        Object.assign(updateData, { manoever: { km_befr: { selected: checked } } })
    }
    // Doppelangriff km_dppl
    if (html.find('#km_dppl').length > 0) {
        checked = html.find('#km_dppl')[0].checked
        item.system.manoever.km_dppl.selected = checked
        Object.assign(updateData, { manoever: { km_dppl: { selected: checked } } })
    }
    // Hammerschlag km_hmsl
    if (html.find('#km_hmsl').length > 0) {
        checked = html.find('#km_hmsl')[0].checked
        item.system.manoever.km_hmsl.selected = checked
        Object.assign(updateData, { manoever: { km_hmsl: { selected: checked } } })
    }
    // Klingentanz km_kltz
    if (html.find('#km_kltz').length > 0) {
        checked = html.find('#km_kltz')[0].checked
        item.system.manoever.km_kltz.selected = checked
        Object.assign(updateData, { manoever: { km_kltz: { selected: checked } } })
    }
    // Niederwerfen km_ndwf
    if (html.find('#km_ndwf').length > 0) {
        checked = html.find('#km_ndwf')[0].checked
        item.system.manoever.km_ndwf.selected = checked
        Object.assign(updateData, { manoever: { km_ndwf: { selected: checked } } })
    }
    // Riposte km_rpst
    if (html.find('#km_rpst').length > 0) {
        checked = html.find('#km_rpst')[0].checked
        item.system.manoever.km_rpst.selected = checked
        Object.assign(updateData, { manoever: { km_rpst: { selected: checked } } })
    }
    // Schildwall km_shwl
    if (html.find('#km_shwl').length > 0) {
        checked = html.find('#km_shwl')[0].checked
        item.system.manoever.km_shwl.selected = checked
        Object.assign(updateData, { manoever: { km_shwl: { selected: checked } } })
    }
    // Sturmangriff km_stag
    if (html.find('#km_stag').length > 0) {
        checked = html.find('#km_stag')[0].checked
        item.system.manoever.km_stag.selected = checked
        Object.assign(updateData, { manoever: { km_stag: { selected: checked } } })
        checked = html.find('#km_stag_gs')[0].value
        item.system.manoever.km_stag.gs = checked
        Object.assign(updateData, { manoever: { km_stag: { gs: checked } } })
    }
    // Todesstoß km_tdst
    if (html.find('#km_tdst').length > 0) {
        checked = html.find('#km_tdst')[0].checked
        item.system.manoever.km_tdst.selected = checked
        Object.assign(updateData, { manoever: { km_tdst: { selected: checked } } })
    }
    // Überrennen km_uebr
    if (html.find('#km_uebr').length > 0) {
        checked = html.find('#km_uebr')[0].checked
        item.system.manoever.km_uebr.selected = checked
        Object.assign(updateData, { manoever: { km_uebr: { selected: checked } } })
        checked = html.find('#km_uebr_gs')[0].value
        item.system.manoever.km_uebr.gs = checked
        Object.assign(updateData, { manoever: { km_uebr: { gs: checked } } })
    }
    // Unterlaufen km_utlf
    if (html.find('#km_utlf').length > 0) {
        checked = html.find('#km_utlf')[0].checked
        item.system.manoever.km_utlf.selected = checked
        Object.assign(updateData, { manoever: { km_utlf: { selected: checked } } })
    }
    // Modifikator
    checked = html.find('#modifikator')[0].value
    item.system.manoever.mod.selected = checked
    Object.assign(updateData, { manoever: { mod: { selected: checked } } })
    // RollMode
    checked = html.find('#rollMode')[0].value
    // console.log(checked);
    item.system.manoever.rllm.selected = checked
    Object.assign(updateData, { manoever: { rllm: { selected: checked } } })

    // item.update(updateData);
    // actor.updateEmbeddedDocuments("Item", [item]);
    // await item.update(updateData);
    // await actor.updateEmbeddedDocuments("Item", [item]);
}

export function calculate_attacke(actor, item) {
    let systemData = actor.system
    let be = systemData.abgeleitete.be
    let mod_at = 0
    let text = ''
    // Entfernung verändern km_ever
    if (item.system.manoever.km_ever.selected) {
        mod_at -= be
        text = text.concat(`${CONFIG.ILARIS.label['km_ever']}\n`)
    }
    // Entwaffnen km_entw
    if (item.system.manoever.km_entw.selected_at) {
        mod_at -= 4
        text = text.concat(`${CONFIG.ILARIS.label['km_entw']}\n`)
    }
    // Gezielter Schlag km_gzsl
    let trefferzone = Number(item.system.manoever.km_gzsl.selected)
    if (trefferzone) {
        mod_at -= 2
        text = text.concat(
            `${CONFIG.ILARIS.label['km_gzsl']}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`,
        )
    }
    // else {
    //     let r = new Roll("1d6");
    //     r = r.evaluate({ "async": false }).total;
    //     text = text.concat(`Trefferzone: ${CONFIG.ILARIS.trefferzonen[r]}\n`);
    // }
    // Umreißen km_umre
    if (item.system.manoever.km_umre.selected) {
        text = text.concat(`${CONFIG.ILARIS.label['km_umre']}\n`)
    }
    // Wuchtschlag km_wusl
    let wusl = Number(item.system.manoever.km_wusl.selected)
    if (wusl > 0) {
        mod_at -= wusl
        text = text.concat(`${CONFIG.ILARIS.label['km_wusl']}: ${wusl}\n`)
    }
    // Rüstungsbrecher km_rust
    if (item.system.manoever.km_rust.selected) {
        mod_at -= 4
        text = text.concat(`${CONFIG.ILARIS.label['km_rust']}\n`)
    }
    // Schildspalter km_shsp
    if (item.system.manoever.km_shsp.selected) {
        mod_at += 2
        text = text.concat(`${CONFIG.ILARIS.label['km_shsp']}\n`)
    }
    // Stumpfer Schlag km_stsl
    if (item.system.manoever.km_stsl.selected) {
        text = text.concat(`${CONFIG.ILARIS.label['km_stsl']}\n`)
    }
    // Umklammern km_umkl
    if (item.system.manoever.km_umkl.selected) {
        let umkl = Number(item.system.manoever.km_umkl.mod)
        mod_at -= umkl
        text = text.concat(`${CONFIG.ILARIS.label['km_umkl']}: ${umkl}\n`)
    }
    // Ausfall km_ausf
    if (item.system.manoever.km_ausf.selected) {
        mod_at -= 2 + be
        text = text.concat(`${CONFIG.ILARIS.label['km_ausf']}\n`)
    }
    // Befreiungsschlag km_befr
    if (item.system.manoever.km_befr.selected) {
        mod_at -= 4
        text = text.concat(`${CONFIG.ILARIS.label['km_befr']}\n`)
    }
    // Doppelangriff km_dppl
    if (item.system.manoever.km_dppl.selected) {
        mod_at -= 4
        text = text.concat(`${CONFIG.ILARIS.label['km_dppl']}\n`)
    }
    // Hammerschlag km_hmsl
    if (item.system.manoever.km_hmsl.selected) {
        mod_at -= 8
        text = text.concat(`${CONFIG.ILARIS.label['km_hmsl']}\n`)
    }
    // Klingentanz km_kltz
    if (item.system.manoever.km_kltz.selected) {
        mod_at -= 4
        text = text.concat(`${CONFIG.ILARIS.label['km_kltz']}\n`)
    }
    // Niederwerfen km_ndwf
    if (item.system.manoever.km_ndwf.selected) {
        mod_at -= 4
        text = text.concat(`${CONFIG.ILARIS.label['km_ndwf']}\n`)
    }
    // Sturmangriff km_stag
    if (item.system.manoever.km_stag.selected) {
        if (item.system.manoever.kbak.selected) mod_at += 4
        let gs = Number(item.system.manoever.km_stag.gs)
        text = text.concat(`${CONFIG.ILARIS.label['km_stag']}: ${gs}\n`)
    }
    // Todesstoß km_tdst
    if (item.system.manoever.km_tdst.selected) {
        mod_at -= 8
        text = text.concat(`${CONFIG.ILARIS.label['km_tdst']}\n`)
    }
    // Überrennen km_uebr
    if (item.system.manoever.km_uebr.selected) {
        if (item.system.manoever.kbak.selected) mod_at += 4
        let gs = Number(item.system.manoever.km_uebr.gs)
        text = text.concat(`${CONFIG.ILARIS.label['km_uebr']}: ${gs}\n`)
    }
    // console.log(mod_at);
    return [mod_at, text]
}
