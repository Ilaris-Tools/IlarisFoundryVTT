export function fernkampfUpdate(html, actor, item) {
    // let itemId = item.id;
    // item = actor.items.get(itemId);
    let checked = false;
    let updateData = { manoever: {} };
    // Kombinierte Aktion
    // "kbak": {
    //     "selected": false
    // },
    if (html.find('#kbak').length > 0) {
        checked = html.find('#kbak')[0].checked;
        item.data.data.manoever.kbak.selected = checked;
        Object.assign(updateData, { manoever: { kabak: { selected: checked } } });
    }
    // Volle Defensive
    // "vldf": {
    //     "possible": false,
    //         "selected": false
    // },
    // if (html.find("#vldf").length > 0) {
    //     checked = html.find("#vldf")[0].checked;
    //     item.data.data.manoever.vldf.selected = checked;
    //     Object.assign(updateData, { "manoever": { "vldf": { "selected": checked } } });
    // }
    // Reichweite erhöhen
    // "rw": {
    //     "0": "1 Schritt",
    //         "1": "2 Schritt",
    //             "2": "3 Schritt",
    // },
    // "fm_rwrh": {
    //     "possible": true,
    //         "seleted": "0",
    // },
    if (html.find('#fm_rwrh').length > 0) {
        checked = html.find('#fm_rwrh')[0].value;
        item.data.data.manoever.fm_rwrh.selected = checked;
        Object.assign(updateData, { manoever: { fm_rwrh: { selected: checked } } });
    }
    // Größenklasse gzkl
    // "gzkl": {
    //     "selected": "0"
    // },
    if (html.find('#gzkl').length > 0) {
        checked = html.find('#gzkl')[0].value;
        item.data.data.manoever.gzkl.selected = checked;
        Object.assign(updateData, { manoever: { gzkl: { selected: checked } } });
    }
    // Bewegung bwng
    // "bwng": {
    //     "selected": "0"
    // },
    if (html.find('#bwng').length > 0) {
        checked = html.find('#bwng')[0].value;
        item.data.data.manoever.bwng.selected = checked;
        Object.assign(updateData, { manoever: { bwng: { selected: checked } } });
    }
    // Licht lcht
    // "lcht": {
    //     "selected": "0"
    // },
    if (html.find('#lcht').length > 0) {
        checked = html.find('#lcht')[0].value;
        item.data.data.manoever.lcht.selected = checked;
        Object.assign(updateData, { manoever: { lcht: { selected: checked } } });
    }
    // Wetter wttr
    // "wttr": {
    //     "selected": "0"
    // },
    if (html.find('#wttr').length > 0) {
        checked = html.find('#wttr')[0].value;
        item.data.data.manoever.wttr.selected = checked;
        Object.assign(updateData, { manoever: { wttr: { selected: checked } } });
    }
    // Deckung dckg
    // "dckg": {
    //     "selected": "0"
    // },
    if (html.find('#dckg').length > 0) {
        checked = html.find('#dckg')[0].value;
        item.data.data.manoever.dckg.selected = checked;
        Object.assign(updateData, { manoever: { dckg: { selected: checked } } });
    }
    // Kampfgetümmel kgtl
    // "kgtl": {
    //     "selected": "0"
    // },
    if (html.find('#kgtl').length > 0) {
        checked = html.find('#kgtl')[0].value;
        item.data.data.manoever.kgtl.selected = checked;
        Object.assign(updateData, { manoever: { kgtl: { selected: checked } } });
    }
    // Beritten brtn
    // "brtn": {
    //     "selected": false,
    //         "rtk": false
    // },
    if (html.find('#brtn').length > 0) {
        checked = html.find('#brtn')[0].checked;
        item.data.data.manoever.brtn.selected = checked;
        Object.assign(updateData, { manoever: { brtn: { selected: checked } } });
    }
    // Reflexschuss rflx
    // "rflx": false,
    // Gexielter Schuss fm_gzss
    //     "fm_gzss": {
    //     "possible": true,
    //         "selected": "0",
    // },
    if (html.find('#fm_gzss').length > 0) {
        checked = html.find('#fm_gzss')[0].value;
        item.data.data.manoever.fm_gzss.selected = checked;
        Object.assign(updateData, { manoever: { fm_gzss: { selected: checked } } });
    }
    // Scharfschuss fm_srfs
    // "fm_srfs": {
    //     "possible": true,
    //         "selected": "0",
    // },
    if (html.find('#fm_srfs').length > 0) {
        checked = html.find('#fm_srfs')[0].value;
        item.data.data.manoever.fm_srfs.selected = checked;
        Object.assign(updateData, { manoever: { fm_srfs: { selected: checked } } });
    }
    // Zielen fm_zlen
    // "fm_zlen": {
    //     "possible": true,
    //         "ruhige_hand": false,
    //             "selected": false,
    // },
    if (html.find('#fm_zlen').length > 0) {
        checked = html.find('#fm_zlen')[0].checked;
        item.data.data.manoever.fm_zlen.selected = checked;
        Object.assign(updateData, { manoever: { fm_zlen: { selected: checked } } });
    }
    // Meisterschuss fm_msts
    // "fm_msts": {
    //     "possible": false,
    //         "selected": false,
    // },
    if (html.find('#fm_msts').length > 0) {
        checked = html.find('#fm_msts')[0].checked;
        item.data.data.manoever.fm_msts.selected = checked;
        Object.assign(updateData, { manoever: { fm_msts: { selected: checked } } });
    }
    // Rüstungsbrecher fm_rust
    // "fm_rust": {
    //     "possible": false,
    //         "selected": false,
    // },
    if (html.find('#fm_rust').length > 0) {
        checked = html.find('#fm_rust')[0].checked;
        item.data.data.manoever.fm_rust.selected = checked;
        Object.assign(updateData, { manoever: { fm_rust: { selected: checked } } });
    }
    // Schnellschuss fm_snls
    // "fm_snls": {
    //     "possible": false,
    //         "selected": "0",
    // },
    let snls_check = html.find("input[name='fm_snls']");
    for (let i of snls_check) {
        if (i.checked) checked = i.value;
    }
    item.data.data.manoever.fm_snls.selected = checked;
    Object.assign(updateData, { manoever: { fm_snls: { selected: checked } } });
    // Modifikator
    checked = html.find('#modifikator')[0].value;
    item.data.data.manoever.mod.selected = checked;
    Object.assign(updateData, { manoever: { mod: { selected: checked } } });
    // RollMode
    checked = html.find('#rollMode')[0].value;
    // console.log(checked);
    item.data.data.manoever.rllm.selected = checked;
    Object.assign(updateData, { manoever: { rllm: { selected: checked } } });

    // item.update(updateData);
    // actor.updateEmbeddedDocuments("Item", [item]);
    // await item.update(updateData);
    // await actor.updateEmbeddedDocuments("Item", [item]);
}
