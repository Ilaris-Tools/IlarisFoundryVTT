export function usesSingleWeapon(hauptWaffe, nebenWaffe, type = 'nahkampfwaffe') {
    let hauptWaffeSelected = false
    let nebenWaffeSelected = false
    if (typeof hauptWaffe != 'undefined') hauptWaffeSelected = true
    if (typeof nebenWaffe != 'undefined') nebenWaffeSelected = true
    if (!hauptWaffeSelected && !nebenWaffeSelected) return null
    if (!hauptWaffeSelected) return null
    if (hauptWaffeSelected && nebenWaffeSelected) {
        if (hauptWaffe.id != nebenWaffe.id) {
            return null
        }
    }
    if (hauptWaffe.type != type) return null
    return hauptWaffe
}

export function usesTwoWeapons(hauptWaffe, nebenWaffe, type = 'nahkampfwaffe') {
    if (typeof hauptWaffe == 'undefined' || typeof nebenWaffe == 'undefined') return false
    if (hauptWaffe.id == nebenWaffe.id) return false
    if (hauptWaffe.type != type || nebenWaffe.type != type) return false
    if (
        hauptWaffe.system.eigenschaften.zweihaendig === true ||
        nebenWaffe.system.eigenschaften.zweihaendig === true
    )
        return false
    return true
}

export function usesOneWeaponOfType(hauptWaffe, nebenWaffe, type = 'nahkampfwaffe') {
    if (typeof hauptWaffe == 'undefined' && typeof nebenWaffe == 'undefined') return false
    if (hauptWaffe && hauptWaffe.type === type) return true
    if (nebenWaffe && nebenWaffe.type === type) return true
    return false
}

export function anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, requirement) {
    if (hauptWaffe && hauptWaffe.system && hauptWaffe.system.eigenschaften) {
        if (hauptWaffe.system.eigenschaften[requirement]) {
            return true
        }
    }
    if (nebenWaffe && nebenWaffe.system && nebenWaffe.system.eigenschaften) {
        if (nebenWaffe.system.eigenschaften[requirement]) {
            return true
        }
    }
    return false
}

export function ignoreSideWeaponMalus(
    hauptWaffe,
    nebenWaffe,
    ist_beritten,
    waffenEigenschaft = '',
) {
    if (!nebenWaffe) return
    if (nebenWaffe.system.eigenschaften.kein_malus_nebenwaffe) return
    if (waffenEigenschaft && !nebenWaffe.system.eigenschaften[waffenEigenschaft.toLowerCase()])
        return

    nebenWaffe.system.at += 4
    nebenWaffe.system.vt += 4
}

export function affectsRangedWeaponOnly(hauptWaffe, nebenWaffe, ist_beritten) {
    return 'ranged'
}

export function applyModifierToWeapons(
    hauptWaffe,
    nebenWaffe,
    belastung,
    modifiers,
    affectRanged = false,
) {
    let schaden = ''
    let bonusFromBeReduction = 0
    if (belastung > 0 && modifiers.be !== 0) {
        bonusFromBeReduction = Math.min(modifiers.be, belastung)
    }
    if (modifiers.damage !== 0) {
        schaden += modifiers.damage > 0 ? '+' + modifiers.damage : modifiers.damage
    }
    if (hauptWaffe) {
        if (affectRanged && hauptWaffe.type === 'fernkampfwaffe') {
            hauptWaffe.system.fk += modifiers.at
            hauptWaffe.system.rw += modifiers.rw
            hauptWaffe.system.schaden = hauptWaffe.system.schaden.concat(schaden)
        }
        if (!affectRanged && hauptWaffe.type === 'nahkampfwaffe') {
            hauptWaffe.system.at += modifiers.at
            hauptWaffe.system.vt += modifiers.vt
            hauptWaffe.system.rw += modifiers.rw
            hauptWaffe.system.schaden = hauptWaffe.system.schaden.concat(schaden)
        }
        if (hauptWaffe.system.fk) {
            hauptWaffe.system.fk += bonusFromBeReduction
        }
        if (hauptWaffe.system.at) {
            hauptWaffe.system.at += bonusFromBeReduction
        }
        if (hauptWaffe.system.vt) {
            hauptWaffe.system.vt += bonusFromBeReduction
        }
    }
    if (nebenWaffe && hauptWaffe && hauptWaffe.id != nebenWaffe.id) {
        if (affectRanged && nebenWaffe.type === 'fernkampfwaffe') {
            nebenWaffe.system.fk += modifiers.at
            nebenWaffe.system.rw += modifiers.rw
            nebenWaffe.system.schaden = nebenWaffe.system.schaden.concat(schaden)
        }
        if (!affectRanged && nebenWaffe.type === 'nahkampfwaffe') {
            nebenWaffe.system.at += modifiers.at
            nebenWaffe.system.vt += modifiers.vt
            nebenWaffe.system.rw += modifiers.rw
            nebenWaffe.system.schaden = nebenWaffe.system.schaden.concat(schaden)
        }
        if (nebenWaffe.system.fk) {
            nebenWaffe.system.fk += bonusFromBeReduction
        }
        if (nebenWaffe.system.at) {
            nebenWaffe.system.at += bonusFromBeReduction
        }
        if (nebenWaffe.system.vt) {
            nebenWaffe.system.vt += bonusFromBeReduction
        }
    }
}

export function ignoreMountedRangePenalty(hauptWaffe, nebenWaffe, ist_beritten) {
    if (!ist_beritten) return
    if (hauptWaffe && hauptWaffe.type === 'fernkampfwaffe') {
        hauptWaffe.system.fk += 4
    }
    if (nebenWaffe && hauptWaffe.id != nebenWaffe.id && nebenWaffe.type === 'fernkampfwaffe') {
        nebenWaffe.system.fk += 4
    }
}

export function manoverAusgleich(
    hauptWaffe,
    nebenWaffe,
    ist_beritten,
    ausgleich,
    overcomplicated = true,
) {
    if (hauptWaffe) {
        hauptWaffe.system.manoverausgleich.value += ausgleich
        hauptWaffe.system.manoverausgleich.overcomplicated = overcomplicated
    }
    if (nebenWaffe && hauptWaffe.id != nebenWaffe.id) {
        nebenWaffe.system.manoverausgleich.value += ausgleich
        nebenWaffe.system.manoverausgleich.overcomplicated = overcomplicated
    }
}

export function checkCombatStyleConditions(
    bedingungen,
    hauptWaffe,
    nebenWaffe,
    actorBeritten,
    actor,
) {
    let conditionsMet = []
    if (!hauptWaffe) {
        actor.misc.selected_kampfstil_conditions_not_met += 'Keine Hauptwaffe ausgewählt.'
        return false
    }
    if (!bedingungen || bedingungen.trim() === '') {
        return true
    }

    const conditions = bedingungen.split(',').map((condition) => condition.trim())

    for (const condition of conditions) {
        const lowerCondition = condition.toLowerCase()

        // Check mounted status
        if (lowerCondition === 'beritten') {
            if (!actorBeritten) {
                actor.misc.selected_kampfstil_conditions_not_met +=
                    'Der Charakter ist nicht beritten.'
                conditionsMet.push(false)
            }
        }
        if (lowerCondition === 'nicht beritten') {
            if (actorBeritten) {
                actor.misc.selected_kampfstil_conditions_not_met += 'Der Charakter ist beritten.'
                conditionsMet.push(false)
            }
        }

        // Check weapon type/count
        if (lowerCondition === 'einzelne waffe' || lowerCondition === 'einzelne nahkampfwaffe') {
            if (!usesSingleWeapon(hauptWaffe, nebenWaffe)) {
                actor.misc.selected_kampfstil_conditions_not_met +=
                    'Es wird nicht eine einzelne Nahkampfwaffe verwendet.'
                conditionsMet.push(false)
            }
        }
        if (
            lowerCondition === 'zwei einhändige waffen' ||
            lowerCondition === 'zwei einhändige nahkampfwaffen'
        ) {
            if (!usesTwoWeapons(hauptWaffe, nebenWaffe)) {
                actor.misc.selected_kampfstil_conditions_not_met +=
                    'Es werden nicht zwei einhändige Nahkampfwaffen verwendet.'
                conditionsMet.push(false)
            }
        }
        if (lowerCondition === 'einzelne fernkampfwaffe') {
            // Check if using single ranged weapon
            if (!usesSingleWeapon(hauptWaffe, nebenWaffe, 'fernkampfwaffe')) {
                actor.misc.selected_kampfstil_conditions_not_met +=
                    'Es wird nicht eine einzelne Fernkampfwaffe verwendet.'
                conditionsMet.push(false)
            }
        }
        if (lowerCondition === 'zwei einhändige fernkampfwaffen') {
            if (!usesTwoWeapons(hauptWaffe, nebenWaffe, 'fernkampfwaffe')) {
                actor.misc.selected_kampfstil_conditions_not_met +=
                    'Es werden nicht zwei einhändige Fernkampfwaffen verwendet.'
                conditionsMet.push(false)
            }
        }
        if (lowerCondition === 'nahkampfwaffe') {
            if (!usesOneWeaponOfType(hauptWaffe, nebenWaffe)) {
                actor.misc.selected_kampfstil_conditions_not_met +=
                    'Es wird nicht mindestens eine Nahkampfwaffe verwendet.'
                conditionsMet.push(false)
            }
        }
        if (lowerCondition === 'fernkampfwaffe') {
            if (!usesOneWeaponOfType(hauptWaffe, nebenWaffe, 'fernkampfwaffe')) {
                actor.misc.selected_kampfstil_conditions_not_met +=
                    'Es wird nicht mindestens eine Fernkampfwaffe verwendet.'
                conditionsMet.push(false)
            }
        }

        // Check weapon skill (Fertigkeit)
        if (lowerCondition.startsWith('fertigkeit ')) {
            const fertigkeit = lowerCondition.substring(11).trim()
            let hasSkill = false
            if (
                hauptWaffe &&
                hauptWaffe.system &&
                typeof hauptWaffe.system.fertigkeit === 'string' &&
                hauptWaffe.system.fertigkeit.toLowerCase() === fertigkeit
            )
                hasSkill = true
            if (
                nebenWaffe &&
                nebenWaffe.system &&
                typeof nebenWaffe.system.fertigkeit === 'string' &&
                nebenWaffe.system.fertigkeit.toLowerCase() === fertigkeit
            )
                hasSkill = true
            if (!hasSkill) {
                actor.misc.selected_kampfstil_conditions_not_met += `Keine der Waffen verwendet die Fertigkeit "${fertigkeit}".`
                conditionsMet.push(false)
            }
        }

        // Check for negated weapon properties (kein <Waffeneigenschaft>)
        if (lowerCondition.startsWith('kein ')) {
            const eigenschaft = lowerCondition.substring(5).trim()
            if (anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, eigenschaft)) {
                actor.misc.selected_kampfstil_conditions_not_met += `Eine der Waffen verwendet die verbotene Waffeneigenschaft "${eigenschaft}".`
                conditionsMet.push(false)
            }
        }

        // Check weapon properties (direct <Waffeneigenschaft>)
        // Only check if it's not one of the special conditions we handled above
        if (
            !lowerCondition.startsWith('fertigkeit ') &&
            !lowerCondition.startsWith('kein ') &&
            lowerCondition !== 'beritten' &&
            lowerCondition !== 'nicht beritten' &&
            lowerCondition !== 'einzelne waffe' &&
            lowerCondition !== 'einzelne nahkampfwaffe' &&
            lowerCondition !== 'zwei einhändige waffen' &&
            lowerCondition !== 'zwei einhändige nahkampfwaffen' &&
            lowerCondition !== 'einzelne fernkampfwaffe' &&
            lowerCondition !== 'zwei einhändige fernkampfwaffen' &&
            lowerCondition !== 'nahkampfwaffe' &&
            lowerCondition !== 'fernkampfwaffe'
        ) {
            if (!anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, lowerCondition)) {
                actor.misc.selected_kampfstil_conditions_not_met += `Eine der Waffen verwendet die benötigte Waffeneigenschaft "${lowerCondition}".`
                conditionsMet.push(false)
            }
        }
    }
    console.log('Bedingungen geprüft. Ergebnis:', actor.misc.selected_kampfstil_conditions_not_met)
    return conditionsMet.length === 0 || conditionsMet.every((met) => met === true)
}
