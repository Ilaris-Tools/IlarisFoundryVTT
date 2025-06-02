export function magieUpdate(html, actor, item) {
    let checked = false
    let updateData = { manoever: {} }

    // Kombinierta Aktion
    checked = html.find('#kbak')[0].checked
    item.system.manoever.kbak.selected = checked
    Object.assign(updateData, { manoever: { kbak: { selected: checked } } })
    // Modifikator
    checked = html.find('#modifikator')[0].value
    item.system.manoever.mod.selected = checked
    Object.assign(updateData, { manoever: { mod: { selected: checked } } })
    // RollMode
    checked = html.find('#rollMode')[0].value
    item.system.manoever.rllm.selected = checked
    Object.assign(updateData, { manoever: { rllm: { selected: checked } } })
    // Maechtige Magie mm_mama
    if (html.find('#mm_mama').length > 0) {
        checked = html.find('#mm_mama')[0].value
        item.system.manoever.mm_mama.selected = checked
        Object.assign(updateData, { manoever: { mm_mama: { selected: checked } } })
    }
    // Mehrere Ziele mm_mezi
    if (html.find('#mm_mezi').length > 0) {
        checked = html.find('#mm_mezi')[0].checked
        item.system.manoever.mm_mezi.selected = checked
        Object.assign(updateData, { manoever: { mm_mezi: { selected: checked } } })
    }
    // Reichweite erhoehen mm_rwrh
    if (html.find('#mm_rwrh').length > 0) {
        checked = html.find('#mm_rwrh')[0].value
        item.system.manoever.mm_rwrh.selected = checked
        Object.assign(updateData, { manoever: { mm_rwrh: { selected: checked } } })
    }
    // Vorbereitung verkuerzen mm_vbvk
    if (html.find('#mm_vbvk').length > 0) {
        checked = html.find('#mm_vbvk')[0].value
        item.system.manoever.mm_vbvk.selected = checked
        Object.assign(updateData, { manoever: { mm_vbvk: { selected: checked } } })
    }
    // Wirkungsdauer verlaengern mm_wkvl
    if (html.find('#mm_wkvl').length > 0) {
        checked = html.find('#mm_wkvl')[0].value
        item.system.manoever.mm_wkvl.selected = checked
        Object.assign(updateData, { manoever: { mm_wkvl: { selected: checked } } })
    }
    // Zaubertechnik ignorieren mm_ztig
    if (html.find('#mm_ztig').length > 0) {
        checked = html.find('#mm_ztig')[0].value
        item.system.manoever.mm_ztig.selected = checked
        Object.assign(updateData, { manoever: { mm_ztig: { selected: checked } } })
    }
    // Erzwingen mm_erzw
    if (html.find('#mm_erzw').length > 0) {
        checked = html.find('#mm_erzw')[0].checked
        item.system.manoever.mm_erzw.selected = checked
        Object.assign(updateData, { manoever: { mm_erzw: { selected: checked } } })
    }
    // Kosten sparen mm_kosp
    if (html.find('#mm_kosp').length > 0) {
        checked = html.find('#mm_kosp')[0].value
        item.system.manoever.mm_kosp.selected = checked
        Object.assign(updateData, { manoever: { mm_kosp: { selected: checked } } })
    }
    // Zeit lassen mm_ztls
    if (html.find('#mm_ztls').length > 0) {
        checked = html.find('#mm_ztls')[0].checked
        item.system.manoever.mm_ztls.selected = checked
        Object.assign(updateData, { manoever: { mm_ztls: { selected: checked } } })
    }
    // Zeremonie mm_zere
    if (html.find('#mm_zere').length > 0) {
        checked = html.find('#mm_zere')[0].value
        console.log('Zeremonie ', checked)
        item.system.manoever.mm_zere.selected = checked
        Object.assign(updateData, { manoever: { mm_zere: { selected: checked } } })
    }
    // Opferung mm_opfe
    if (html.find('#mm_opfe').length > 0) {
        checked = html.find('#mm_opfe')[0].checked
        item.system.manoever.mm_opfe.selected = checked
        Object.assign(updateData, { manoever: { mm_opfe: { selected: checked } } })
    }
}
