/** Build the semantic context for a direct attribute probe. */
export function buildAttributeProbeDialogOptions(attribute, systemData, situation) {
    return {
        probeType: 'attribut',
        fertigkeitKey: attribute,
        fertigkeitName: CONFIG.ILARIS.label[attribute],
        pw: systemData.attribute[attribute].pw,
        attributeTargets: [attribute],
        situation: situation || undefined,
    }
}

/** Build the semantic context for a profane skill probe. */
export function buildFertigkeitProbeDialogOptions(fertigkeitKey, fertigkeitData, situation) {
    const talentList = {}
    for (const [index, talent] of (fertigkeitData.system.talente || []).entries()) {
        talentList[index] = talent.name
    }

    return {
        probeType: 'fertigkeit',
        fertigkeitKey,
        fertigkeitName: fertigkeitData.name,
        pw: fertigkeitData.system.pw,
        talentList,
        attributeTargets: [
            fertigkeitData.system.attribut_0,
            fertigkeitData.system.attribut_1,
            fertigkeitData.system.attribut_2,
        ].filter(Boolean),
        situation: situation || undefined,
    }
}
