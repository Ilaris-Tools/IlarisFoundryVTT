export function karmaUpdate(html, actor, item) {
    let checked = false;
    let updateData = { manoever: {} };

    // Kombinierta Aktion
    checked = html.find('#kbak')[0].checked;
    item.data.data.manoever.kbak.selected = checked;
    Object.assign(updateData, { manoever: { kbak: { selected: checked } } });
    // Modifikator
    checked = html.find('#modifikator')[0].value;
    item.data.data.manoever.mod.selected = checked;
    Object.assign(updateData, { manoever: { mod: { selected: checked } } });
    // RollMode
    checked = html.find('#rollMode')[0].value;
    item.data.data.manoever.rllm.selected = checked;
    Object.assign(updateData, { manoever: { rllm: { selected: checked } } });
    // Maechtige Magie lm_mali
    if (html.find('#lm_mali').length > 0) {
        checked = html.find('#lm_mali')[0].value;
        item.data.data.manoever.lm_mali.selected = checked;
        Object.assign(updateData, { manoever: { lm_mali: { selected: checked } } });
    }
    // Mehrere Ziele lm_mezi
    if (html.find('#lm_mezi').length > 0) {
        checked = html.find('#lm_mezi')[0].value;
        item.data.data.manoever.lm_mezi.selected = checked;
        Object.assign(updateData, { manoever: { lm_mezi: { selected: checked } } });
    }
    // Reichweite erhoehen lm_rwrh
    if (html.find('#lm_rwrh').length > 0) {
        checked = html.find('#lm_rwrh')[0].value;
        item.data.data.manoever.lm_rwrh.selected = checked;
        Object.assign(updateData, { manoever: { lm_rwrh: { selected: checked } } });
    }
    // Vorbereitung verkuerzen lm_vbvk
    if (html.find('#lm_vbvk').length > 0) {
        checked = html.find('#lm_vbvk')[0].value;
        item.data.data.manoever.lm_vbvk.selected = checked;
        Object.assign(updateData, { manoever: { lm_vbvk: { selected: checked } } });
    }    
    // Wirkungsdauer verlaengern lm_wkvl
    if (html.find('#lm_wkvl').length > 0) {
        checked = html.find('#lm_wkvl')[0].value;
        item.data.data.manoever.lm_wkvl.selected = checked;
        Object.assign(updateData, { manoever: { lm_wkvl: { selected: checked } } });
    }   
    // Zaubertechnik ignorieren lm_ltig
    if (html.find('#lm_ltig').length > 0) {
        checked = html.find('#lm_ltig')[0].value;
        item.data.data.manoever.lm_ltig.selected = checked;
        Object.assign(updateData, { manoever: { lm_ltig: { selected: checked } } });
    }   
    // Kosten sparen lm_kosp
    if (html.find('#lm_kosp').length > 0) {
        checked = html.find('#lm_kosp')[0].value;
        item.data.data.manoever.lm_kosp.selected = checked;
        Object.assign(updateData, { manoever: { lm_kosp: { selected: checked } } });
    } 
    // Zeremonie lm_zere
    if (html.find('#lm_zere').length > 0) {
        checked = html.find('#lm_zere')[0].value;
        console.log('Zeremonie ', checked);
        item.data.data.manoever.lm_zere.selected = checked;
        Object.assign(updateData, { manoever: { lm_zere: { selected: checked } } });
    } 
    // Opferung lm_opfe
    if (html.find('#lm_opfe').length > 0) {
        checked = html.find('#lm_opfe')[0].checked;
        item.data.data.manoever.lm_opfe.selected = checked;
        Object.assign(updateData, { manoever: { lm_opfe: { selected: checked } } });
    } 
}
