import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readManeuver(filename) {
    return JSON.parse(
        readFileSync(join(process.cwd(), 'comp_packs', 'manover', '_source', filename), 'utf8'),
    )
}

describe('reviewed maneuver pre-effect source data', () => {
    it('authors the reviewed persistent maneuver effects', () => {
        const binden = readManeuver('Binden_TJXMKpzBv5brMNrJ.json')
        const niederwerfen = readManeuver('Niederwerfen_knRrQgT5sBWjhrZk.json')
        const umreissen = readManeuver('Umrei_en_A8B5tpDDVdJUrWEV.json')
        const umklammern = readManeuver('Umklammern_g7prT1XxeR6oeQbD.json')
        const entwaffnen = readManeuver('Entwaffnen_9q6tsaXKJAKvYCPV.json')

        expect(binden.system.preEffects[0]).toMatchObject({ activation: 'onSuccessfulDefense' })
        expect(niederwerfen.system.preEffects[0].avoidTest.attribut).toBe('KK')
        expect(niederwerfen.system.preEffects[0]).toMatchObject({
            changes: [],
            condition: { enabled: true, statusId: 'Position4' },
        })
        expect(umreissen.system.preEffects[0].avoidTest.attributChoices).toEqual(['GE', 'KO'])
        expect(umreissen.system.preEffects[0]).toMatchObject({
            changes: [],
            condition: { enabled: true, statusId: 'Position4' },
        })
        expect(umklammern.system.preEffects[0].ilarisEnding).toEqual({ type: 'opposedEscape' })
        expect(entwaffnen.system).toMatchObject({
            input: { field: 'SELECTOR', choices: ['Hauptwaffe', 'Nebenwaffe'] },
            preEffects: [expect.objectContaining({ operation: 'deselectEquippedWeapon' })],
        })
    })
})
