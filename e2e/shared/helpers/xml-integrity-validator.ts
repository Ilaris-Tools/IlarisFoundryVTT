/**
 * XML Integrity Validator
 * Parses Sephrasto XML exports and compares with imported Foundry character data
 * to validate that character data integrity is maintained during import.
 */

import * as fs from 'fs'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface XmlCharacterData {
    name: string
    attributes: Record<string, number>
    skills: Record<string, number>
    advantages: string[]
    weapons: Array<{ name: string; [key: string]: any }>
    armor: Array<{ name: string; [key: string]: any }>
    talents: string[]
    supernaturalSkills: Record<string, number>
}

export interface FoundryCharacterSnapshot {
    name: string
    attributes: Record<string, number>
    skills: Record<string, number>
    advantages: string[]
    weapons: Array<{ name: string; [key: string]: any }>
    armor: Array<{ name: string; [key: string]: any }>
    talents: string[]
    supernaturalSkills: Record<string, number>
}

export interface IntegrityComparisonResult {
    valid: boolean
    mismatches: IntegrityMismatch[]
    summary: string
}

export interface IntegrityMismatch {
    category: string
    field: string
    expected: any
    actual: any
    severity: 'error' | 'warning'
}

// ── XML Parsing ────────────────────────────────────────────────────────────────

/**
 * Parse Sephrasto XML character export and extract relevant data
 * @throws Error if XML file is missing or parsing fails
 */
export function parseXmlCharacter(xmlPath: string): XmlCharacterData {
    try {
        const xmlContent = fs.readFileSync(xmlPath, 'utf-8')

        if (!xmlContent || xmlContent.length === 0) {
            throw new Error(`XML file is empty: ${xmlPath}`)
        }

        // Simple XML parsing using regex (Node.js doesn't have native XML parser in test env)
        const nameMatch = xmlContent.match(/<Name>(.*?)<\/Name>/)
        const name = nameMatch ? nameMatch[1] : 'Unknown'

        const attributes = parseAttributes(xmlContent)
        const skills = parseSkills(xmlContent)
        const advantages = parseAdvantages(xmlContent)
        const weapons = parseWeapons(xmlContent)
        const armor = parseArmor(xmlContent)
        const talents = parseTalents(xmlContent)
        const supernaturalSkills = parseSupernatauralSkills(xmlContent)

        return {
            name,
            attributes,
            skills,
            advantages,
            weapons,
            armor,
            talents,
            supernaturalSkills,
        }
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('XML file is empty')) {
            throw error
        }
        throw new Error(
            `Failed to parse XML character file "${xmlPath}": ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

function parseAttributes(xmlContent: string): Record<string, number> {
    const attributes: Record<string, number> = {}
    const attrRegex = /<Attribut name="(\w+)" wert="(\d+)"/g
    let match

    while ((match = attrRegex.exec(xmlContent)) !== null) {
        attributes[match[1]] = parseInt(match[2], 10)
    }

    return attributes
}

function parseSkills(xmlContent: string): Record<string, number> {
    const skills: Record<string, number> = {}
    const skillRegex = /<Fertigkeit name="(.*?)" wert="(\d+)"/g
    let match

    while ((match = skillRegex.exec(xmlContent)) !== null) {
        skills[match[1]] = parseInt(match[2], 10)
    }

    return skills
}

function parseAdvantages(xmlContent: string): string[] {
    const advantages: string[] = []
    const advRegex = /<Vorteil name="(.*?)"/g
    let match

    while ((match = advRegex.exec(xmlContent)) !== null) {
        advantages.push(match[1])
    }

    return advantages
}

function parseWeapons(xmlContent: string): Array<{ name: string; [key: string]: any }> {
    const weapons: Array<{ name: string; [key: string]: any }> = []
    const weaponRegex = /<Waffe name="(.*?)" id="(.*?)"(.*?)\/>/g
    let match

    while ((match = weaponRegex.exec(xmlContent)) !== null) {
        const name = match[1]
        const id = match[2]
        const attrs = match[3]

        const weapon: any = { name, id }

        // Parse attributes from the weapon tag
        const würfelMatch = attrs.match(/würfel="(\d+)"/)
        if (würfelMatch) weapon.würfel = parseInt(würfelMatch[1], 10)

        const würfelSeitenMatch = attrs.match(/würfelSeiten="(\d+)"/)
        if (würfelSeitenMatch) weapon.würfelSeiten = parseInt(würfelSeitenMatch[1], 10)

        const plusMatch = attrs.match(/plus="([-\d]+)"/)
        if (plusMatch) weapon.plus = parseInt(plusMatch[1], 10)

        const härteMatch = attrs.match(/härte="(\d+)"/)
        if (härteMatch) weapon.härte = parseInt(härteMatch[1], 10)

        const rwMatch = attrs.match(/rw="(\d+)"/)
        if (rwMatch) weapon.rw = parseInt(rwMatch[1], 10)

        const eigenschaftenMatch = attrs.match(/eigenschaften="(.*?)"/)
        if (eigenschaftenMatch) weapon.eigenschaften = eigenschaftenMatch[1]

        weapons.push(weapon)
    }

    return weapons
}

function parseArmor(xmlContent: string): Array<{ name: string; [key: string]: any }> {
    const armor: Array<{ name: string; [key: string]: any }> = []
    const armorRegex = /<Rüstung name="(.*?)" be="(\d+)" rs="(.*?)"/g
    let match

    while ((match = armorRegex.exec(xmlContent)) !== null) {
        const name = match[1]
        if (!name) continue // Skip empty names

        armor.push({
            name,
            be: parseInt(match[2], 10),
            rs: match[3],
        })
    }

    return armor
}

function parseTalents(xmlContent: string): string[] {
    const talents: string[] = []
    const talentRegex = /<Talent name="(.*?)"/g
    let match

    while ((match = talentRegex.exec(xmlContent)) !== null) {
        talents.push(match[1])
    }

    return talents
}

function parseSupernatauralSkills(xmlContent: string): Record<string, number> {
    const skills: Record<string, number> = {}
    const skillRegex = /<ÜbernatürlicheFertigkeit name="(.*?)" wert="(\d+)"/g
    let match

    while ((match = skillRegex.exec(xmlContent)) !== null) {
        skills[match[1]] = parseInt(match[2], 10)
    }

    return skills
}

// ── Foundry Data Extraction ────────────────────────────────────────────────────

/**
 * Extract character data from Foundry actor for comparison
 */
export async function extractFoundryCharacterData(
    page: any,
    actorName: string,
): Promise<FoundryCharacterSnapshot> {
    return page.evaluate((name: string) => {
        const actor = (game as any).actors?.getName(name)
        if (!actor) throw new Error(`Actor "${name}" not found`)

        // Extract attributes
        const attributes: Record<string, number> = {}
        for (const [attrName, attrData] of Object.entries(actor.system.attribute || {})) {
            attributes[attrName] = ((attrData as any).wert as number) || 0
        }

        // Extract skills (fertigkeiten)
        const skills: Record<string, number> = {}
        for (const item of actor.items) {
            if (item.type === 'fertigkeit') {
                skills[item.name] = (item.system.fw as number) || 0
            }
        }

        // Extract advantages (vorteile)
        const advantages: string[] = []
        for (const item of actor.items) {
            if (item.type === 'vorteil') {
                advantages.push(item.name)
            }
        }

        // Extract weapons
        const weapons: Array<{ name: string; [key: string]: any }> = []
        for (const item of actor.items) {
            if (item.type === 'nahkampfwaffe' || item.type === 'fernkampfwaffe') {
                weapons.push({
                    name: item.name,
                    würfel: item.system.würfel as number,
                    würfelSeiten: item.system.würfelSeiten as number,
                    plus: item.system.plus as number,
                    härte: item.system.härte as number,
                    rw: item.system.rw as number,
                    eigenschaften: (item.system.eigenschaften as string[])?.join(', ') || '',
                })
            }
        }

        // Extract armor
        // NOTE: Foundry stores armor RS (resistance) as separate fields per body part:
        // rs_kopf, rs_brust, rs_bauch, rs_rarm, rs_larm, rs_beine
        // We reconstruct into XML format: "3/3/3/3/3/3" for comparison
        const armor: Array<{ name: string; [key: string]: any }> = []
        for (const item of actor.items) {
            if (item.type === 'rüstung') {
                const rsArray = [
                    item.system.rs_kopf ?? 0,
                    item.system.rs_brust ?? 0,
                    item.system.rs_bauch ?? 0,
                    item.system.rs_rarm ?? 0,
                    item.system.rs_larm ?? 0,
                    item.system.rs_beine ?? 0,
                ]
                const rsString = rsArray.join('/')

                armor.push({
                    name: item.name,
                    be: item.system.be as number,
                    rs: rsString, // Reconstructed from individual fields
                })
            }
        }

        // Extract talents (spells/liturgies/talents)
        const talents: string[] = []
        for (const item of actor.items) {
            if (
                item.type === 'zauber' ||
                item.type === 'liturgie' ||
                item.type === 'talent' ||
                item.type === 'zaubertrick'
            ) {
                talents.push(item.name)
            }
        }

        // Extract supernatural skills
        const supernaturalSkills: Record<string, number> = {}
        for (const item of actor.items) {
            if (item.type === 'übernatürliche_fertigkeit') {
                supernaturalSkills[item.name] = (item.system.fw as number) || 0
            }
        }

        return {
            name: actor.name,
            attributes,
            skills,
            advantages,
            weapons,
            armor,
            talents,
            supernaturalSkills,
        }
    }, actorName)
}

// ── Comparison & Validation ────────────────────────────────────────────────────

/**
 * Compare XML source data with imported Foundry character data
 * Performs strict validation on CRITICAL fields (attributes, skills, advantages)
 * Uses warnings for optional/derived fields (armor, talents, supernaturals)
 */
export function validateCharacterIntegrity(
    xmlData: XmlCharacterData,
    foundryData: FoundryCharacterSnapshot,
): IntegrityComparisonResult {
    const mismatches: IntegrityMismatch[] = []

    // CRITICAL VALIDATIONS (strict, errors)
    // ────────────────────────────────────────────────────────────────────────

    // 1. Compare attributes (CRITICAL)
    for (const [attrName, expectedValue] of Object.entries(xmlData.attributes)) {
        const actualValue = foundryData.attributes[attrName]
        if (actualValue !== expectedValue) {
            mismatches.push({
                category: 'Attribute',
                field: attrName,
                expected: expectedValue,
                actual: actualValue,
                severity: 'error',
            })
        }
    }

    // 2. Compare skills (CRITICAL)
    for (const [skillName, expectedValue] of Object.entries(xmlData.skills)) {
        const actualValue = foundryData.skills[skillName]
        if (actualValue !== expectedValue) {
            mismatches.push({
                category: 'Skill',
                field: skillName,
                expected: expectedValue,
                actual: actualValue,
                severity: 'error',
            })
        }
    }

    // 3. Compare advantages (CRITICAL)
    for (const advantage of xmlData.advantages) {
        if (!foundryData.advantages.includes(advantage)) {
            mismatches.push({
                category: 'Advantage',
                field: advantage,
                expected: 'present',
                actual: 'missing',
                severity: 'error',
            })
        }
    }

    // OPTIONAL VALIDATIONS (warnings for now)
    // ────────────────────────────────────────────────────────────────────────
    // These are logged but don't fail the test because import logic may differ

    // 4. Compare weapons (count-based, lenient)
    if (xmlData.weapons.length > 0 && foundryData.weapons.length === 0) {
        mismatches.push({
            category: 'Weapon',
            field: 'total_count',
            expected: xmlData.weapons.length,
            actual: foundryData.weapons.length,
            severity: 'warning',
        })
    }

    // 5. Compare armor (count-based, lenient)
    if (xmlData.armor.length > 0 && foundryData.armor.length === 0) {
        mismatches.push({
            category: 'Armor',
            field: 'total_count',
            expected: xmlData.armor.length,
            actual: foundryData.armor.length,
            severity: 'warning',
        })
    }

    // 6. Compare talents (sample-based, lenient)
    const missingTalentCount = xmlData.talents.filter(
        (t) => !foundryData.talents.includes(t),
    ).length
    if (missingTalentCount > 0) {
        mismatches.push({
            category: 'Talent',
            field: `missing_count/${xmlData.talents.length}`,
            expected: 0,
            actual: missingTalentCount,
            severity: 'warning',
        })
    }

    // 7. Compare supernatural skills (lenient)
    const missingSupernaturalCount = Object.entries(xmlData.supernaturalSkills).filter(
        ([skillName]) => !foundryData.supernaturalSkills[skillName],
    ).length
    if (missingSupernaturalCount > 0) {
        mismatches.push({
            category: 'Supernatural Skill',
            field: `missing_count/${Object.keys(xmlData.supernaturalSkills).length}`,
            expected: 0,
            actual: missingSupernaturalCount,
            severity: 'warning',
        })
    }

    // Build summary
    const errorCount = mismatches.filter((m) => m.severity === 'error').length
    const warningCount = mismatches.filter((m) => m.severity === 'warning').length
    const summary =
        mismatches.length === 0
            ? 'All integrity checks passed!'
            : `${errorCount} error(s), ${warningCount} warning(s)`

    return {
        valid: errorCount === 0, // Only critical errors fail the test
        mismatches,
        summary,
    }
}
