export function usesSingleMeleeWeapon(hauptWaffe, nebenWaffe, ridingAllowed = false) {
    let waffe = null
    let hauptWaffeSelected = false
    let nebenWaffeSelected = false
    if (typeof hauptWaffe != 'undefined') hauptWaffeSelected = true
    if (typeof nebenWaffe != 'undefined') nebenWaffeSelected = true
    if (!hauptWaffeSelected && !nebenWaffeSelected) return null
    if (hauptWaffeSelected && nebenWaffeSelected) {
        if (hauptWaffe.id != nebenWaffe.id) {
            return null
        }
        waffe = hauptWaffe
    }
    if (hauptWaffeSelected && !nebenWaffeSelected) {
        waffe = hauptWaffe
    }
    if (!hauptWaffeSelected && nebenWaffeSelected) {
        waffe = nebenWaffe
    }
    if (!ridingAllowed && anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, 'reittier'))
        return null
    return waffe
}

export function usesTwoMeleeWeapons(
    hauptWaffe,
    nebenWaffe,
    ridingAllowed = false,
    shieldAllowed = false,
) {
    if (typeof hauptWaffe == 'undefined' || typeof nebenWaffe == 'undefined') return false
    if (hauptWaffe.id == nebenWaffe.id) return false
    if (hauptWaffe.type != 'nahkampfwaffe' || nebenWaffe.type != 'nahkampfwaffe') return false
    if (!ridingAllowed && anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, 'reittier'))
        return false
    if (!shieldAllowed && anyWeaponNeedsToMeetRequirement(hauptWaffe, nebenWaffe, 'schild'))
        return false
    return true
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
