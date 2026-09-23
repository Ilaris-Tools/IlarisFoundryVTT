import { readFileSync } from 'node:fs'
import path from 'node:path'

const sourceDirectory = path.join(process.cwd(), 'comp_packs', 'vorteile', '_source')

function source(filename) {
    return JSON.parse(readFileSync(path.join(sourceDirectory, filename), 'utf8'))
}

function getModifier(filename) {
    const effect = source(filename).effects.find((entry) => entry.system?.ilarisModifiers?.length)
    return { effect, modifier: effect?.system?.ilarisModifiers?.[0] }
}

describe('contextual Vorteil effects', () => {
    it.each([
        ['Eindrucksvoll_I_O0pG6mRRYkRWsoCa.json', '2', ['sozialesDuell']],
        ['Eindrucksvoll_II_NabIXyEgtnkg9OUQ.json', '2', ['sozialesDuell']],
        ['Vorausschauend_I_nM9sElt4Fv86WGnw.json', '2', ['sozialesDuell']],
        ['Vorausschauend_II_3FrFovbJnQHccuSY.json', '2', ['sozialesDuell']],
        ['Bed_chtig_HwogoFXuTUa2Hyyg.json', '4', ['sozialesDuellAbwartend']],
        ['Scharfsinnig_I_a5u8kV590mZiWT6x.json', '2', ['ermittlungRecherche']],
        ['Scharfsinnig_II_p5XjDqav98vnQ3DZ.json', '2', ['ermittlungRecherche']],
        ['Zerst_rerisch_I_fN6AUnJ1XbbnzYrw.json', '4', ['gegenstandZerstoeren']],
        ['Zerst_rerisch_II_WhR8l6Qt1OnCFmjr.json', '4', ['gegenstandZerstoeren']],
    ])('%s is an ordinary transferred contextual Probe effect', (filename, value, situation) => {
        const { effect, modifier } = getModifier(filename)

        expect(effect).toEqual(
            expect.objectContaining({
                transfer: true,
                _key: expect.stringContaining('!items.effects!'),
                system: expect.objectContaining({ ilarisSource: 'ordinary' }),
            }),
        )
        expect(modifier).toEqual(
            expect.objectContaining({
                phase: 'roll',
                target: 'probe',
                value,
                stacking: 'add',
                selector: expect.objectContaining({ situation }),
            }),
        )
    })
})
