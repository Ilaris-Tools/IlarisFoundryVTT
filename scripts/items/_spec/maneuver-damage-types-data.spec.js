const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const maneuverSourcePath = join(process.cwd(), 'comp_packs', 'manover', '_source')

function readManeuver(fileName) {
    return JSON.parse(readFileSync(join(maneuverSourcePath, fileName), 'utf8'))
}

describe('maneuver damage-type compendium data', () => {
    it('keeps Stumpfer Schlag on the canonical STUMPF registry key', () => {
        const maneuver = readManeuver('Stumpfer_Schlag_y4UIzfK4z72MvJaE.json')

        expect(Object.values(maneuver.system.modifications)).toContainEqual(
            expect.objectContaining({ type: 'CHANGE_DAMAGE_TYPE', value: 'STUMPF' }),
        )
    })

    it.each([
        'R_stungsbrecher_g6bD09kNeLUCndvG.json',
        'R_stungsbrecher__FK__X3fmits6gu1cpurC.json',
    ])('%s uses TRUE_DAMAGE rather than a hard-coded armor bypass', (fileName) => {
        const maneuver = readManeuver(fileName)
        const modifications = Object.values(maneuver.system.modifications)

        expect(modifications).toContainEqual(
            expect.objectContaining({ type: 'CHANGE_DAMAGE_TYPE', value: 'TRUE_DAMAGE' }),
        )
        expect(modifications).not.toContainEqual(
            expect.objectContaining({ type: 'ARMOR_BREAKING' }),
        )
        expect(modifications).not.toContainEqual(
            expect.objectContaining({ type: 'SPECIAL_TEXT', value: 'Ignoriert Rüstung' }),
        )
    })
})
