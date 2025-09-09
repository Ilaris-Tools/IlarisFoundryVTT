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

export function ignoreSideWeaponMalus(nebenwaffe, waffenEigenschaft = '') {
    if (!nebenwaffe) return
    if (nebenwaffe.system.eigenschaften.kein_malus_nebenwaffe) return
    if (waffenEigenschaft && !nebenwaffe.system.eigenschaften[waffenEigenschaft]) return

    nebenwaffe.system.at += 4
    nebenwaffe.system.vt += 4
}

export function affectsRangedWeaponOnly() {
    return 'ranged'
}

export function applyModifierToWeapons(hauptWaffe, nebenWaffe, modifiers, affectRanged = false) {
    let schaden = ''
    if (modifiers.schaden > 0) {
        schaden += '+' + modifiers.schaden
    }
    if (hauptWaffe) {
        if (affectRanged && hauptWaffe.type === 'fernkampfwaffe') {
            hauptWaffe.system.fk += modifiers.at
            hauptWaffe.system.schaden = hauptWaffe.system.schaden.concat(schaden)
        } else {
            hauptWaffe.system.at += modifiers.at
            hauptWaffe.system.vt += modifiers.vt
            hauptWaffe.system.schaden = hauptWaffe.system.schaden.concat(schaden)
        }
    }
    if (nebenWaffe && hauptWaffe.id != nebenWaffe.id) {
        if (affectRanged && nebenWaffe.type === 'fernkampfwaffe') {
            nebenWaffe.system.fk += modifiers.at
            nebenWaffe.system.schaden = nebenWaffe.system.schaden.concat(schaden)
        } else {
            nebenWaffe.system.at += modifiers.at
            nebenWaffe.system.vt += modifiers.vt
            nebenWaffe.system.schaden = nebenWaffe.system.schaden.concat(schaden)
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

export function checkCombatStyleConditions(bedingungen, hauptWaffe, nebenWaffe, actorBeritten) {
    if (!hauptWaffe) return false
    if (!bedingungen || bedingungen.trim() === '') return true

    const conditions = bedingungen.split(',').map((condition) => condition.trim())

    for (const condition of conditions) {
        const lowerCondition = condition.toLowerCase()

        // Check mounted status
        if (lowerCondition === 'beritten') {
            if (!actorBeritten) return false
            continue
        }
        if (lowerCondition === 'nicht beritten') {
            if (actorBeritten) return false
            continue
        }

        // Check weapon type/count
        if (lowerCondition === 'einzelne waffe' || lowerCondition === 'einzelne nahkampfwaffe') {
            if (!usesSingleWeapon(hauptWaffe, nebenWaffe)) return false
            continue
        }
        if (
            lowerCondition === 'zwei einhändige waffen' ||
            lowerCondition === 'zwei einhändige nahkampfwaffen'
        ) {
            if (!usesTwoWeapons(hauptWaffe, nebenWaffe)) return false
            continue
        }
        if (lowerCondition === 'einzelne fernkampfwaffe') {
            // Check if using single ranged weapon
            if (!usesSingleWeapon(hauptWaffe, nebenWaffe, 'fernkampfwaffe')) return false
            continue
        }
        if (lowerCondition === 'zwei einhändige fernkampfwaffen') {
            if (!usesTwoWeapons(hauptWaffe, nebenWaffe, 'fernkampfwaffe')) return false
            continue
        }
        if (lowerCondition === 'nahkampfwaffe') {
            if (!usesOneWeaponOfType(hauptWaffe, nebenWaffe)) return false
            continue
        }
        if (lowerCondition === 'fernkampfwaffe') {
            if (!usesOneWeaponOfType(hauptWaffe, nebenWaffe, 'fernkampfwaffe')) return false
            continue
        }

        // Check weapon skill (Fertigkeit)
        if (lowerCondition.startsWith('fertigkeit ')) {
            const fertigkeit = condition.substring(11).trim().toLowerCase()
            let hasSkill = false
            if (hauptWaffe && hauptWaffe.system && hauptWaffe.system.fertigkeit === fertigkeit)
                hasSkill = true
            if (nebenWaffe && nebenWaffe.system && nebenWaffe.system.fertigkeit === fertigkeit)
                hasSkill = true
            if (!hasSkill) return false
            continue
        }

        // Check for negated weapon properties (kein <Waffeneigenschaft>)
        if (lowerCondition.startsWith('kein ')) {
            const eigenschaft = condition.substring(5).trim().toLowerCase()
            if (anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, eigenschaft)) return false
            continue
        }

        // Check weapon properties (direct <Waffeneigenschaft>)
        if (!anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, lowerCondition)) return false
    }

    return true
}
