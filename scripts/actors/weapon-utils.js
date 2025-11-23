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

    // Check if either weapon requires two hands
    const hauptZweihaendig = hauptWaffe.system.computed?.handsRequired === 2
    const nebenZweihaendig = nebenWaffe.system.computed?.handsRequired === 2

    if (hauptZweihaendig || nebenZweihaendig) return false
    return true
}

export function usesOneWeaponOfType(hauptWaffe, nebenWaffe, type = 'nahkampfwaffe') {
    if (typeof hauptWaffe == 'undefined' && typeof nebenWaffe == 'undefined') return false
    if (hauptWaffe && hauptWaffe.type === type) return true
    if (nebenWaffe && nebenWaffe.type === type) return true
    return false
}

export function anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, requirement) {
    const requirementLower = requirement.toLowerCase()

    if (hauptWaffe && hauptWaffe.system && hauptWaffe.system.eigenschaften) {
        if (hauptWaffe.system.eigenschaften.some((e) => e.toLowerCase() === requirementLower)) {
            return true
        }
    }
    if (nebenWaffe && nebenWaffe.system && nebenWaffe.system.eigenschaften) {
        if (nebenWaffe.system.eigenschaften.some((e) => e.toLowerCase() === requirementLower)) {
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

    // Check if weapon ignores nebenwaffe malus (from eigenschaft data)
    if (nebenWaffe.system.computed?.ignoreNebenMalus) return

    if (waffenEigenschaft) {
        // Check if weapon has the specified eigenschaft (case-insensitive)
        const hasEigenschaft = nebenWaffe.system.eigenschaften.some(
            (e) => e.toLowerCase() === waffenEigenschaft.toLowerCase(),
        )

        if (!hasEigenschaft) return
    }

    nebenWaffe.system.computed.at += 4
    nebenWaffe.system.computed.vt += 4

    nebenWaffe.system.computed.modifiers.at.push('Nebenwaffe Malus ignoriert: +4 AT')
    nebenWaffe.system.computed.modifiers.vt.push('Nebenwaffe Malus ignoriert: +4 VT')
}

export function affectsRangedWeaponOnly(hauptWaffe, nebenWaffe, ist_beritten) {
    return 'ranged'
}

export function applyModifierToWeapons(
    hauptWaffe,
    nebenWaffe,
    belastung,
    selected_kampfstil,
    affectRanged = false,
) {
    let schaden = 0
    let bonusFromBeReduction = 0
    const modifiers = selected_kampfstil.modifiers
    if (belastung > 0 && modifiers.be !== 0) {
        bonusFromBeReduction = Math.min(modifiers.be, belastung)
    }
    if (modifiers.damage !== 0) {
        schaden += modifiers.damage
    }
    if (hauptWaffe) {
        if (affectRanged && hauptWaffe.type === 'fernkampfwaffe') {
            hauptWaffe.system.computed.fk += modifiers.at
            hauptWaffe.system.computed.rw += modifiers.rw
            hauptWaffe.system.computed.schadenBonus += schaden

            if (modifiers.at) {
                hauptWaffe.system.computed.modifiers.at.push(
                    `${selected_kampfstil.name}: ${modifiers.at}`,
                )
            }
            if (modifiers.damage) {
                hauptWaffe.system.computed.modifiers.dmg.push(
                    `${selected_kampfstil.name}: ${modifiers.damage}`,
                )
            }
        }
        if (!affectRanged && hauptWaffe.type === 'nahkampfwaffe') {
            hauptWaffe.system.computed.at += modifiers.at
            hauptWaffe.system.computed.vt += modifiers.vt
            hauptWaffe.system.computed.rw += modifiers.rw
            hauptWaffe.system.computed.schadenBonus += schaden

            if (modifiers.at) {
                hauptWaffe.system.computed.modifiers.at.push(
                    `${selected_kampfstil.name}: ${modifiers.at}`,
                )
            }
            if (modifiers.damage) {
                hauptWaffe.system.computed.modifiers.dmg.push(
                    `${selected_kampfstil.name}: ${modifiers.damage}`,
                )
            }
            if (modifiers.vt) {
                hauptWaffe.system.computed.modifiers.vt.push(
                    `${selected_kampfstil.name}: ${modifiers.vt}`,
                )
            }
        }
        if (hauptWaffe.system.computed.fk) {
            hauptWaffe.system.computed.fk += bonusFromBeReduction
        }
        if (hauptWaffe.system.computed.at) {
            hauptWaffe.system.computed.at += bonusFromBeReduction
        }
        if (hauptWaffe.system.computed.vt) {
            hauptWaffe.system.computed.vt += bonusFromBeReduction
        }
        if (bonusFromBeReduction) {
            hauptWaffe.system.computed.modifiers.at.push(
                `${selected_kampfstil.name}: ${bonusFromBeReduction} BE Bonus`,
            )
            hauptWaffe.system.computed.modifiers.vt.push(
                `${selected_kampfstil.name}: ${bonusFromBeReduction} BE Bonus`,
            )
        }
    }
    if (nebenWaffe && hauptWaffe && hauptWaffe.id != nebenWaffe.id) {
        if (affectRanged && nebenWaffe.type === 'fernkampfwaffe') {
            nebenWaffe.system.computed.fk += modifiers.at
            nebenWaffe.system.computed.rw += modifiers.rw
            nebenWaffe.system.computed.schadenBonus += schaden

            if (modifiers.at) {
                nebenWaffe.system.computed.modifiers.at.push(
                    `${selected_kampfstil.name}: ${modifiers.at}`,
                )
            }
            if (modifiers.damage) {
                nebenWaffe.system.computed.modifiers.dmg.push(
                    `${selected_kampfstil.name}: ${modifiers.damage}`,
                )
            }
        }
        if (!affectRanged && nebenWaffe.type === 'nahkampfwaffe') {
            nebenWaffe.system.computed.at += modifiers.at
            nebenWaffe.system.computed.vt += modifiers.vt
            nebenWaffe.system.computed.rw += modifiers.rw
            nebenWaffe.system.computed.schadenBonus += schaden

            if (modifiers.at) {
                nebenWaffe.system.computed.modifiers.at.push(
                    `${selected_kampfstil.name}: ${modifiers.at}`,
                )
            }
            if (modifiers.damage) {
                nebenWaffe.system.computed.modifiers.dmg.push(
                    `${selected_kampfstil.name}: ${modifiers.damage}`,
                )
            }
            if (modifiers.vt) {
                nebenWaffe.system.computed.modifiers.vt.push(
                    `${selected_kampfstil.name}: ${modifiers.vt}`,
                )
            }
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
        if (bonusFromBeReduction) {
            nebenWaffe.system.computed.modifiers.at.push(
                `${selected_kampfstil.name}: ${bonusFromBeReduction} BE Bonus`,
            )
            nebenWaffe.system.computed.modifiers.vt.push(
                `${selected_kampfstil.name}: ${bonusFromBeReduction} BE Bonus`,
            )
        }
    }
}

export function ignoreMountedRangePenalty(hauptWaffe, nebenWaffe, ist_beritten) {
    if (!ist_beritten) return
    if (hauptWaffe && hauptWaffe.type === 'fernkampfwaffe') {
        hauptWaffe.system.computed.fk += 4
        hauptWaffe.system.computed.modifiers.at.push('Beritten: +4 FK')
    }
    if (nebenWaffe && hauptWaffe.id != nebenWaffe.id && nebenWaffe.type === 'fernkampfwaffe') {
        nebenWaffe.system.computed.fk += 4
        nebenWaffe.system.computed.modifiers.at.push('Beritten: +4 FK')
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
    kampfstil,
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
    if (!kampfstil || kampfstil.key === 'ohne') {
        return false
    }

    if (!kampfstil?.stilBedingungen || kampfstil.stilBedingungen.trim() === '') {
        return true
    }

    const conditions = kampfstil.stilBedingungen.split(',').map((condition) => condition.trim())
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

/**
 * Execute kampfstil foundryScript methods and apply modifiers to weapons
 * @param {Object} selected_kampfstil - The selected kampfstil object
 * @param {Object} HW - Hauptwaffe
 * @param {Object} NW - Nebenwaffe
 * @param {number} be - BE value
 */
export function _executeKampfstilMethodsAndApplyModifiers(selected_kampfstil, HW, NW, be, actor) {
    let methodResults = []
    let ist_beritten = actor.system.misc.ist_beritten
    if (
        selected_kampfstil.foundryScriptMethods &&
        selected_kampfstil.foundryScriptMethods.length > 0
    ) {
        for (const methodCall of selected_kampfstil.foundryScriptMethods) {
            try {
                const methodMatch = methodCall.match(/^(\w+)\((.*)\)$/)
                if (!methodMatch) {
                    console.warn(
                        `Invalid method format: ${methodCall}. Expected format: methodName(userParams)`,
                    )
                    continue
                }
                const methodName = methodMatch[1]
                const userParams = methodMatch[2].trim()
                let fullMethodCall
                if (userParams) {
                    fullMethodCall = `${methodName}(HW, NW, ist_beritten, ${userParams})`
                } else {
                    fullMethodCall = `${methodName}(HW, NW, ist_beritten)`
                }
                const executeMethod = new Function(
                    'weaponUtils',
                    'HW',
                    'NW',
                    'selected_kampfstil',
                    'ist_beritten',
                    `return weaponUtils.${fullMethodCall}`,
                )
                const result = executeMethod(weaponUtils, HW, NW, selected_kampfstil, ist_beritten)
                console.log(`Executing kampfstil method: ${fullMethodCall}`)
                console.log('Result:', result)
                methodResults.push(result)
                console.log(`Kampfstil method ${methodCall} -> ${fullMethodCall} returned:`, result)
            } catch (error) {
                console.warn(`Failed to execute kampfstil method: ${methodCall}`, error)
            }
        }
    }
    if (methodResults && methodResults.length > 0 && methodResults.includes('ranged')) {
        applyModifierToWeapons(HW, NW, be, selected_kampfstil, true)
    } else {
        applyModifierToWeapons(HW, NW, be, selected_kampfstil)
    }
    if (be > 0) {
        be -= selected_kampfstil.modifiers.be
    }
    return methodResults
}
