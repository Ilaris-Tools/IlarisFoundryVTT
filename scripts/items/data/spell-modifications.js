/**
 * Pure, dialog-safe resolution for persisted supernatural spell forms.
 * Selections are intentionally never written back to the source Item.
 */

function toArray(value) {
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') return Object.values(value)
    return []
}

function clone(value) {
    if (value === undefined) return undefined
    if (globalThis.foundry?.utils?.deepClone) return foundry.utils.deepClone(value)
    return JSON.parse(JSON.stringify(value ?? null))
}

function asText(value) {
    return typeof value === 'string' ? value.trim() : ''
}

function numeric(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeProfile(profile) {
    const source = profile && typeof profile === 'object' ? profile : {}
    const cost = source.cost && typeof source.cost === 'object' ? source.cost : {}
    const costMode = cost.mode === 'set' || cost.mode === 'add' ? cost.mode : ''
    return {
        difficulty: numeric(source.difficulty),
        cost:
            costMode && Number.isFinite(Number(cost.value))
                ? { mode: costMode, value: Number(cost.value) }
                : null,
        permanentCost: asText(source.permanentCost),
        target: asText(source.target),
        range: asText(source.range),
        duration: asText(source.duration),
    }
}

const ANTIMAGIC_PRESET = Object.freeze({
    groups: [{ id: 'antiMagicForm', label: 'Antimagieform', required: true }],
    modifications: [
        {
            id: 'gegenzauber',
            name: 'Gegenzauber',
            description:
                'Konterprobe (12) gegen einen Zauber in Vorbereitung. Die weitere Abwicklung erfolgt durch Spielleitung und Spieler.',
            profile: {
                difficulty: 0,
                cost: { mode: 'set', value: 4 },
                target: 'Zauber in Vorbereitung',
                range: '16 Schritt',
                duration: 'augenblicklich',
            },
        },
        {
            id: 'magie-unterdruecken',
            name: 'Magie unterdrücken',
            description:
                'Unterdrückt zukünftige Zauber der Fertigkeit in einer Zone. Der Malus und die Zone werden durch Spielleitung und Spieler verwaltet.',
            profile: {
                difficulty: 0,
                cost: { mode: 'set', value: 8 },
                target: 'Zone',
                range: '8 Schritt',
                duration: '1 Stunde',
            },
        },
        {
            id: 'zauber-aufheben',
            name: 'Zauber aufheben',
            description:
                'Konterprobe (12) gegen einen bereits gewirkten Zauber ohne gAsP. Die Aufhebung wird durch Spielleitung und Spieler verwaltet.',
            profile: {
                difficulty: 0,
                target: 'Zauber',
                range: '8 Schritt',
                duration: 'augenblicklich',
            },
        },
        {
            id: 'wesenheit-bannen',
            name: 'Wesenheit bannen',
            description:
                'Bannung einer beschworenen Wesenheit ohne gAsP. Schwierigkeit und Ergebnis werden durch Spielleitung und Spieler verwaltet.',
            profile: {
                difficulty: 0,
                target: 'beschworenes Wesen',
                range: '8 Schritt',
                duration: 'augenblicklich',
            },
        },
    ],
})

const ANTIMAGIC_RULE_TEXT = Object.freeze({
    gegenzauber:
        'Vorbereitung 0 Aktionen. Konterprobe (12) gegen einen Zauber in Vorbereitung. Die weitere Abwicklung erfolgt durch Spielleitung und Spieler.',
    'magie-unterdruecken':
        'Vorbereitung 16 Aktionen. Unterdr\u00fcckt zuk\u00fcnftige Zauber der Fertigkeit in einer Zone. Der Malus und die Zone werden durch Spielleitung und Spieler verwaltet.',
    'zauber-aufheben':
        'Vorbereitung 16 Aktionen. Konterprobe (12) gegen einen bereits gewirkten Zauber. Die Aufhebung wird durch Spielleitung und Spieler verwaltet.',
    'wesenheit-bannen':
        'Vorbereitung 16 Aktionen. Bannung einer beschworenen Wesenheit. Schwierigkeit und Ergebnis werden durch Spielleitung und Spieler verwaltet.',
})

const ANTIMAGIC_PROFILE_EXTRAS = Object.freeze({
    'zauber-aufheben': { permanentCost: 'Halbe Basiskosten des Zielzaubers' },
    'wesenheit-bannen': { permanentCost: 'Halbe Basiskosten der Beschw\u00f6rung' },
})

/** Normalize Foundry ObjectField values to structurally safe form data. */
export function normalizeSpellModifications(system = {}) {
    const preset = system.spellModificationPreset === 'antiMagic' ? ANTIMAGIC_PRESET : null
    const groups = toArray(preset?.groups || system.spellModificationGroups)
        .filter((group) => group && typeof group === 'object' && asText(group.id))
        .map((group) => ({
            id: asText(group.id),
            label: asText(group.label) || asText(group.id),
            required: Boolean(group.required),
        }))

    const knownGroupIds = new Set(groups.map((group) => group.id))
    const ids = new Set()
    const modifications = toArray(preset?.modifications || system.spellModifications)
        .filter((modification) => modification && typeof modification === 'object')
        .map((modification) => ({
            id: asText(modification.id),
            name: asText(modification.name),
            description: asText(
                preset === ANTIMAGIC_PRESET
                    ? ANTIMAGIC_RULE_TEXT[modification.id] || modification.description
                    : modification.description,
            ),
            group: preset === ANTIMAGIC_PRESET ? 'antiMagicForm' : asText(modification.group),
            effectMode: ['inherit', 'extend', 'replace'].includes(modification.effectMode)
                ? modification.effectMode
                : preset === ANTIMAGIC_PRESET
                  ? 'replace'
                  : 'inherit',
            profile: normalizeProfile({
                ...modification.profile,
                ...(preset === ANTIMAGIC_PRESET ? ANTIMAGIC_PROFILE_EXTRAS[modification.id] : {}),
            }),
            preEffects: toArray(clone(modification.preEffects)),
        }))
        .filter((modification) => {
            if (!modification.id || ids.has(modification.id)) return false
            ids.add(modification.id)
            return !modification.group || knownGroupIds.has(modification.group)
        })

    return { groups, modifications }
}

function baseProfile(system = {}) {
    return {
        difficulty: numeric(system.schwierigkeit),
        cost: numeric(system.kosten),
        permanentCost: '',
        target: asText(system.ziel),
        range: asText(system.reichweite),
        duration: asText(system.wirkungsdauer),
    }
}

function addError(errors, message) {
    if (!errors.includes(message)) errors.push(message)
}

/**
 * Resolve selected form ids against an Item without mutating it.
 * @returns {{valid: boolean, errors: string[], selectedForms: object[], profile: object, preEffects: object[]}}
 */
export function resolveSpellModificationContext(item, selectedIds = []) {
    const system = item?.system || {}
    const { groups, modifications } = normalizeSpellModifications(system)
    const errors = []
    const uniqueIds = [...new Set(toArray(selectedIds).map(asText).filter(Boolean))]
    const byId = new Map(modifications.map((modification) => [modification.id, modification]))
    const selectedForms = []
    for (const id of uniqueIds) {
        const form = byId.get(id)
        if (!form) addError(errors, `Unbekannte Zaubermodifikation: ${id}`)
        else selectedForms.push(form)
    }

    for (const group of groups) {
        const selectedInGroup = selectedForms.filter((form) => form.group === group.id)
        if (selectedInGroup.length > 1)
            addError(errors, `Für ${group.label} darf nur eine Modifikation gewählt werden.`)
        if (group.required && selectedInGroup.length !== 1)
            addError(errors, `Für ${group.label} muss genau eine Modifikation gewählt werden.`)
    }

    const profile = baseProfile(system)
    const overrideOwners = new Map()
    let preEffects = toArray(clone(system.preEffects))
    for (const form of modifications.filter((candidate) => uniqueIds.includes(candidate.id))) {
        profile.difficulty += form.profile.difficulty
        if (form.profile.cost) {
            if (form.profile.cost.mode === 'add') profile.cost += form.profile.cost.value
            else if (overrideOwners.has('cost') && profile.cost !== form.profile.cost.value) {
                addError(errors, 'Mehrere Zaubermodifikationen setzen unterschiedliche Kosten.')
            } else {
                profile.cost = form.profile.cost.value
                overrideOwners.set('cost', form.id)
            }
        }
        for (const [key, value] of Object.entries({
            permanentCost: form.profile.permanentCost,
            target: form.profile.target,
            range: form.profile.range,
            duration: form.profile.duration,
        })) {
            if (!value) continue
            if (overrideOwners.has(key) && profile[key] !== value) {
                addError(
                    errors,
                    'Mehrere Zaubermodifikationen überschreiben dieselbe Profilangabe.',
                )
                continue
            }
            profile[key] = value
            overrideOwners.set(key, form.id)
        }
        if (form.effectMode === 'extend') preEffects.push(...clone(form.preEffects))
        if (form.effectMode === 'replace') preEffects = clone(form.preEffects)
    }

    return { valid: errors.length === 0, errors, selectedForms, profile, preEffects }
}
