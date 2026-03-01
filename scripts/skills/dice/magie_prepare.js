export function magieUpdate(html, actor, item, dialogId) {
    let checked = false
    let updateData = { manoever: {} }

    // Kombinierta Aktion
    checked = html.find(`#kbak-${dialogId}`)[0].checked
    item.system.manoever.kbak.selected = checked
    Object.assign(updateData, { manoever: { kbak: { selected: checked } } })
    // Modifikator
    checked = html.find(`#modifikator-${dialogId}`)[0].value
    item.system.manoever.mod.selected = checked
    Object.assign(updateData, { manoever: { mod: { selected: checked } } })
    // RollMode
    checked = html.find(`#rollMode-${dialogId}`)[0].value
    item.system.manoever.rllm.selected = checked
    Object.assign(updateData, { manoever: { rllm: { selected: checked } } })
    // Maechtige Magie mm_mama
    if (html.find(`#mm_mama-${dialogId}`).length > 0) {
        checked = html.find(`#mm_mama-${dialogId}`)[0].value
        item.system.manoever.mm_mama.selected = checked
        Object.assign(updateData, { manoever: { mm_mama: { selected: checked } } })
    }
    // Mehrere Ziele mm_mezi
    if (html.find(`#mm_mezi-${dialogId}`).length > 0) {
        checked = html.find(`#mm_mezi-${dialogId}`)[0].checked
        item.system.manoever.mm_mezi.selected = checked
        Object.assign(updateData, { manoever: { mm_mezi: { selected: checked } } })
    }
    // Reichweite erhoehen mm_rwrh
    if (html.find(`#mm_rwrh-${dialogId}`).length > 0) {
        checked = html.find(`#mm_rwrh-${dialogId}`)[0].value
        item.system.manoever.mm_rwrh.selected = checked
        Object.assign(updateData, { manoever: { mm_rwrh: { selected: checked } } })
    }
    // Vorbereitung verkuerzen mm_vbvk
    if (html.find(`#mm_vbvk-${dialogId}`).length > 0) {
        checked = html.find(`#mm_vbvk-${dialogId}`)[0].value
        item.system.manoever.mm_vbvk.selected = checked
        Object.assign(updateData, { manoever: { mm_vbvk: { selected: checked } } })
    }
    // Wirkungsdauer verlaengern mm_wkvl
    if (html.find(`#mm_wkvl-${dialogId}`).length > 0) {
        checked = html.find(`#mm_wkvl-${dialogId}`)[0].value
        item.system.manoever.mm_wkvl.selected = checked
        Object.assign(updateData, { manoever: { mm_wkvl: { selected: checked } } })
    }
    // Zaubertechnik ignorieren mm_ztig
    if (html.find(`#mm_ztig-${dialogId}`).length > 0) {
        checked = html.find(`#mm_ztig-${dialogId}`)[0].value
        item.system.manoever.mm_ztig.selected = checked
        Object.assign(updateData, { manoever: { mm_ztig: { selected: checked } } })
    }
    // Erzwingen mm_erzw
    if (html.find(`#mm_erzw-${dialogId}`).length > 0) {
        checked = html.find(`#mm_erzw-${dialogId}`)[0].checked
        item.system.manoever.mm_erzw.selected = checked
        Object.assign(updateData, { manoever: { mm_erzw: { selected: checked } } })
    }
    // Kosten sparen mm_kosp
    if (html.find(`#mm_kosp-${dialogId}`).length > 0) {
        checked = html.find(`#mm_kosp-${dialogId}`)[0].value
        item.system.manoever.mm_kosp.selected = checked
        Object.assign(updateData, { manoever: { mm_kosp: { selected: checked } } })
    }
    // Zeit lassen mm_ztls
    if (html.find(`#mm_ztls-${dialogId}`).length > 0) {
        checked = html.find(`#mm_ztls-${dialogId}`)[0].checked
        item.system.manoever.mm_ztls.selected = checked
        Object.assign(updateData, { manoever: { mm_ztls: { selected: checked } } })
    }
    // Zeremonie mm_zere
    if (html.find(`#mm_zere-${dialogId}`).length > 0) {
        checked = html.find(`#mm_zere-${dialogId}`)[0].value
        console.log('Zeremonie ', checked)
        item.system.manoever.mm_zere.selected = checked
        Object.assign(updateData, { manoever: { mm_zere: { selected: checked } } })
    }
    // Opferung mm_opfe
    if (html.find(`#mm_opfe-${dialogId}`).length > 0) {
        checked = html.find(`#mm_opfe-${dialogId}`)[0].checked
        item.system.manoever.mm_opfe.selected = checked
        Object.assign(updateData, { manoever: { mm_opfe: { selected: checked } } })
    }
}
