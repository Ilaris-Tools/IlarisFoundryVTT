import { sanitizeEnergyCost } from '../common/utilities.js'
import * as settings from './../settings/index.js'

//TODO delete, is a function for test setup
export function sum(a, b) {
    return a + b
}

export function behinderung(be, systemData) {
    // let pw = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.pw;
    let rg = systemData.vorteil.kampf.find((x) => x.name == 'Rüstungsgewöhnung')
    let vrg = systemData.vorteil.kampf.find((x) => x.name == 'Verbesserte Rüstungsgewöhnung')
    if (be > 0 && rg) {
        be -= 1
    }
    if (be > 0 && vrg) {
        be -= 2
        be = be >= 0 ? be : 0
    }
    return be
}

export function beTraglast(systemData) {
    let be_mod = 0
    let weaponSpaceRequirement = game.settings.get(
        settings.ConfigureGameSettingsCategories.Ilaris,
        settings.IlarisGameSettingNames.weaponSpaceRequirement,
    )

    if (!weaponSpaceRequirement) {
        return be_mod
    }

    let summeGewicht = systemData.getragen
    let traglast = systemData.abgeleitete.traglast
    let intervall = systemData.abgeleitete.traglast_intervall

    let gewicht_diff = summeGewicht - traglast
    if (gewicht_diff > 0) {
        let div_floor = Math.floor(gewicht_diff / intervall)
        let div_ceil = Math.ceil(gewicht_diff / intervall)
        if (div_ceil == div_floor) {
            be_mod = div_floor
        } else {
            be_mod = div_floor + 1
        }
    }
    return be_mod
}

export function wundschwelle(ws, actor) {
    if (actor.vorteil.profan.find((x) => x.name == 'Unverwüstlich')) ws += 1
    // let uv = data.vorteil.profan.find(x => x.name == "Unverwüstlich");
    // let nr = data.vorteil.allgemein.find(x => x.name == "Natürliche Rüstung");
    // if (uv) ws += 1;
    // if (nr) ws += 1;
    return ws
}

export function wundschwelleStern(ws, actor) {
    if (actor.vorteil.allgemein.find((x) => x.name == 'Natürliche Rüstung')) ws += 1
    return ws
}

export function globalermod(systemData) {
    return (
        systemData.gesundheit.wundabzuege +
        systemData.furcht.furchtabzuege +
        systemData.modifikatoren.manuellermod
    )
}

export function initiative(ini, actor) {
    let kr = actor.vorteil.kampf.find((x) => x.name == 'Kampfreflexe')
    if (kr) ini += 4
    return ini
}

export function magieresistenz(mr, actor) {
    let wsI = actor.vorteil.profan.find((x) => x.name == 'Willensstark I')
    let wsII = actor.vorteil.profan.find((x) => x.name == 'Willensstark II')
    let ub = actor.vorteil.profan.find((x) => x.name == 'Unbeugsamkeit')
    if (wsI) mr += 4
    if (wsII) mr += 4
    if (ub) mr += Math.round(actor.system.attribute.MU.wert / 2)
    return mr
}

export function geschwindigkeit(gs, actor) {
    let fI = actor.vorteil.profan.find((x) => x.name == 'Flink I')
    let fII = actor.vorteil.profan.find((x) => x.name == 'Flink II')
    if (fI) gs += 1
    if (fII) gs += 1
    return gs
}

export function durchhalte(actor) {
    //Reihenfolge der Berechnung?
    let be_traglast = actor.system.abgeleitete.be_traglast
    let be = actor.system.abgeleitete.be - be_traglast
    let dh = actor.system.attribute.KO.wert
    let agh = actor.vorteil.profan.find((x) => x.name == 'Abgehärtet II')
    if (agh) dh += 2
    dh -= 2 * be
    dh = dh > 1 ? dh : 1
    dh -= 2 * be_traglast
    return dh
}

// export function schips(sch, data) {
export function schips(actor) {
    let schips = 4
    if (actor.vorteil.allgemein.find((x) => x.name == 'Glück I')) schips = 5
    if (actor.vorteil.allgemein.find((x) => x.name == 'Glück II')) schips = 6
    // let gI = data.vorteil.allgemein.find(x => x.name == "Glück I");
    // let gII = data.vorteil.allgemein.find(x => x.name == "Glück II");
    // if (gI) sch += 1;
    // if (gII) sch += 1;
    return schips
}

// export function zauberer(asp, data) {
export function zauberer(actor) {
    let asp = 0
    if (actor.vorteil.allgemein.find((x) => x.name == 'Zauberer I')) asp = 8
    if (actor.vorteil.allgemein.find((x) => x.name == 'Zauberer II')) asp = 16
    if (actor.vorteil.allgemein.find((x) => x.name == 'Zauberer III')) asp = 24
    if (actor.vorteil.allgemein.find((x) => x.name == 'Zauberer IV')) asp = 32
    if (actor.vorteil.magie.find((x) => x.name == 'Gefäß der Sterne'))
        asp += 4 + actor.system.attribute.CH.wert
    // let zI = data.vorteil.allgemein.find(x => x.name == "Zauberer I");
    // let zII = data.vorteil.allgemein.find(x => x.name == "Zauberer II");
    // let zIII = data.vorteil.allgemein.find(x => x.name == "Zauberer III");
    // let zIV = data.vorteil.allgemein.find(x => x.name == "Zauberer IV");
    // let gds = data.vorteil.magie.find(x => x.name == "Gefäß der Sterne");
    // if (zI) asp += 8;
    // if (zII) asp += 8;
    // if (zIII) asp += 8;
    // if (zIV) asp += 8;
    // if (gds) asp += 4 + data.data.attribute.CH.wert;
    return asp
}

// export function geweihter(kap, data) {
export function geweihter(actor) {
    let kap = 0
    if (actor.vorteil.allgemein.find((x) => x.name == 'Geweiht I')) kap = 8
    if (actor.vorteil.allgemein.find((x) => x.name == 'Geweiht II')) kap = 16
    if (actor.vorteil.allgemein.find((x) => x.name == 'Geweiht III')) kap = 24
    if (actor.vorteil.allgemein.find((x) => x.name == 'Geweiht IV')) kap = 32
    // let gI = data.vorteil.allgemein.find(x => x.name == "Geweiht I");
    // let gII = data.vorteil.allgemein.find(x => x.name == "Geweiht II");
    // let gIII = data.vorteil.allgemein.find(x => x.name == "Geweiht III");
    // let gIV = data.vorteil.allgemein.find(x => x.name == "Geweiht IV");
    // if (gI) kap += 8;
    // if (gII) kap += 8;
    // if (gIII) kap += 8;
    // if (gIV) kap += 8;
    return kap
}

export function getKampfstile(actor) {
    let kampfstile = {
        ohne: {
            name: CONFIG.ILARIS.label['ohne'],
            key: 'ohne',
            stufe: 0,
            sources: [],
            modifiers: { at: 0, vt: 0, damage: 0, rw: 0, be: 0 }, // Default no modifiers
            bedingungen: '',
            foundryScriptMethods: [], // Default no methods
        },
    }

    // Group kampfstile by their base name (without the level suffix)
    const kampfstilGroups = actor.vorteil.kampfstil.reduce((groups, stil) => {
        const baseName = stil.name.replace(/ [IV]+.*$/, '')
        if (!groups[baseName]) {
            groups[baseName] = []
        }
        groups[baseName].push(stil)
        return groups
    }, {})

    // Add the highest level of each kampfstil group
    Object.values(kampfstilGroups).forEach((stile) => {
        const highestStil = stile.reduce((prev, current) => {
            const prevStufe = getKampfstilStufe(prev.name)
            const currentStufe = getKampfstilStufe(current.name)
            return currentStufe > prevStufe ? current : prev
        })

        // Collect all compendium sources for this kampfstil group
        const sources = stile.map((stil) => stil.name)

        // Accumulate script modifiers from all kampfstile in this group
        const accumulatedModifiers = { at: 0, vt: 0, damage: 0, rw: 0, be: 0 }
        let bedingungen = ''
        let foundryScriptMethods = []
        stile.forEach((stil) => {
            const modifiers = parseKampfstilScript(stil.system?.script, stil.name)
            bedingungen += stil.system?.bedingungen || ''
            if (modifiers) {
                accumulatedModifiers.at += modifiers[0]
                accumulatedModifiers.vt += modifiers[1]
                accumulatedModifiers.damage += modifiers[2]
                accumulatedModifiers.rw += modifiers[3]
                accumulatedModifiers.be += modifiers[4]
            }

            // Parse foundryScript to extract method calls
            if (stil.system?.foundryScript && typeof stil.system.foundryScript === 'string') {
                const methodCalls = stil.system.foundryScript
                    .split(';')
                    .map((methodCall) => methodCall.trim())
                    .filter((methodCall) => methodCall.length > 0)
                foundryScriptMethods.push(...methodCalls)
            }
        })

        // Only add if all sources are non-null and highestStil has a compendium source
        const name = highestStil.name.replace(/ [IV]+.*$/, '')
        if (sources.every((source) => source !== null)) {
            kampfstile[name] = {
                name: name,
                key: name,
                stufe: getKampfstilStufe(highestStil.name),
                sources: sources,
                modifiers: accumulatedModifiers,
                bedingungen: bedingungen.trim(),
                foundryScriptMethods: [...new Set(foundryScriptMethods)], // Remove duplicates
            }
        }
    })

    return kampfstile
}

export function getKampfstilStufe(kampfstilName) {
    // Match Roman numerals followed by optional text, allowing for space before
    const match = kampfstilName.match(/ (I{1,3}|IV).*$/)
    if (!match) return 0

    // Convert Roman numeral to number
    const romanToNum = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
    }

    return romanToNum[match[1]] || 0
}

/**
 * Parses a kampfstil script string to extract modifyKampfstil modifiers
 * @param {string} script - The script string (e.g., "modifyKampfstil('Beidhändiger Kampf', 1, 0, 0, 0)")
 * @param {string} kampfstilName - The name of the kampfstil for error logging
 * @returns {number[]|null} Array of 5 numbers representing the modifiers, or null if parsing failed
 */
export function parseKampfstilScript(script, kampfstilName) {
    if (!script || typeof script !== 'string') {
        return null
    }

    // Match modifyKampfstil function call with 5 numeric parameters (can be negative)
    const regex =
        /modifyKampfstil\s*\(\s*['"](.*?)['"],\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),?\s*(-?\d+)?\s*\)/
    const match = script.match(regex)

    if (!match) {
        return null
    }

    // Extract the numeric values, defaulting the 6th parameter to 0 if not present
    const modifiers = [
        parseInt(match[2], 10),
        parseInt(match[3], 10),
        parseInt(match[4], 10),
        parseInt(match[5], 10),
        parseInt(match[6] || '0', 10),
    ]

    // Validate that all values are integers
    if (modifiers.some(isNaN)) {
        console.warn(`Invalid modifiers in kampfstil script for ${kampfstilName}: ${script}`)
        return null
    }

    return modifiers
}

export function getAngepasst(angepasst_string, actor) {
    let angepasst = 0
    let string_1 = `Angepasst (${angepasst_string}) I`
    let string_2 = `Angepasst (${angepasst_string}) II`
    if (actor.vorteil.allgemein.find((x) => x.name == string_1)) angepasst = 1
    if (actor.vorteil.allgemein.find((x) => x.name == string_2)) angepasst = 2
    return angepasst
}

export function getSelectedStil(actor, stilType) {
    // Only process for held-type actors
    if (actor.type !== 'held') {
        return null
    }

    // Determine which stil list and selected value to use based on type
    let selectedValue, stile
    if (stilType === 'kampf') {
        selectedValue = actor.system.misc?.selected_kampfstil ?? 'ohne'
        stile = actor.misc.kampfstile_list
    } else if (stilType === 'uebernatuerlich') {
        selectedValue = actor.system.misc?.selected_uebernatuerlicher_stil ?? 'ohne'
        stile = actor.misc.uebernatuerliche_stile_list
    } else {
        return null
    }

    return stile[selectedValue] ?? stile['ohne']
}

export function getUebernatuerlicheStile(actor) {
    let stile = {
        ohne: {
            name: CONFIG.ILARIS.label['ohne'],
            key: 'ohne',
            stufe: 0,
            sources: [],
        },
    }

    // Combine both geweihtentradition and zaubertraditionen
    const allTraditions = [
        ...actor.vorteil.geweihtentradition.map((t) => ({ ...t, type: 'geweiht' })),
        ...actor.vorteil.zaubertraditionen.map((t) => ({ ...t, type: 'zauber' })),
    ]

    // Group traditions by their base name (without the level suffix)
    const traditionGroups = allTraditions.reduce((groups, tradition) => {
        const baseName = tradition.name.replace(/ [IV]+.*$/, '')
        if (!groups[baseName]) {
            groups[baseName] = []
        }
        groups[baseName].push(tradition)
        return groups
    }, {})

    // Add the highest level of each tradition group
    Object.values(traditionGroups).forEach((traditions) => {
        const highestTradition = traditions.reduce((prev, current) => {
            const prevStufe = getKampfstilStufe(prev.name)
            const currentStufe = getKampfstilStufe(current.name)
            return currentStufe > prevStufe ? current : prev
        })

        // Collect all compendium sources for this tradition group
        const sources = traditions.map((tradition) => tradition.name)

        // Add to stile object using the key as property name
        const name = highestTradition.name.replace(/ [IV]+.*$/, '')
        if (sources.every((source) => source !== null)) {
            stile[name] = {
                name: name,
                key: name,
                stufe: getKampfstilStufe(highestTradition.name),
                sources: sources,
                type: highestTradition.type,
            }
        }
    })

    return stile
}

/**
 * Calculates the modified cost for supernatural abilities (spells and liturgies) based on various advantages
 *
 * Currently handles the following hardcoded advantages:
 * - Durro-Dun style (level 2+): Reduces cost by 1/4 of base cost
 * - Liebling der Gottheit: Makes liturgies free if success roll is 16+
 * - Mühelose Magie: Reduces spell cost by half of base cost if success roll is 16+
 *
 * @param {Actor} actor - The actor performing the supernatural ability
 * @param {Item} item - The spell or liturgy being cast
 * @param {boolean} isSuccess - Whether the casting was successful
 * @param {boolean} is16OrHigher - Whether the success roll was 16 or higher
 * @param {number} currentCost - The current cost before modifications
 * @returns {number} The final modified cost (never below 0)
 */
export function calculateModifiedCost(
    actor,
    item,
    isSuccess,
    is16OrHigher,
    currentCost,
    energyOverride = 0,
) {
    let cost = currentCost
    const baseKosten = energyOverride > 0 ? energyOverride : sanitizeEnergyCost(item.system.kosten)

    const selectedStil = getSelectedStil(actor, 'uebernatuerlich')
    const hasDurroDunII =
        actor.type === 'kreatur'
            ? actor.vorteil.allgemein.some((v) => v.name.includes('Durro-Dun II')) ||
              actor.vorteil.magie.some((v) => v.name.includes('Durro-Dun II')) ||
              actor.vorteil.zaubertraditionen.some((v) => v.name.includes('Durro-Dun II'))
            : selectedStil?.name.includes('Durro') && selectedStil.stufe >= 2

    if (hasDurroDunII) {
        cost = Math.max(0, cost - Math.ceil(baseKosten / 4))
    }

    // If success with 16 or higher and has Liebling der Gottheit, cost is 0
    if (
        isSuccess &&
        is16OrHigher &&
        actor.type == 'held' &&
        item.type == 'liturgie' &&
        actor.vorteil.karma.some((v) => v.name == 'Liebling der Gottheit')
    ) {
        cost = 0
    }
    // If success with 16 or higher and has Mühelose Magie, cost is reduced by half of cost
    else if (
        isSuccess &&
        is16OrHigher &&
        actor.type == 'held' &&
        item.type == 'zauber' &&
        actor.vorteil.magie.some((v) => v.name == 'Mühelose Magie')
    ) {
        cost = Math.max(0, Math.ceil(cost / 2))
    }

    return cost
}
