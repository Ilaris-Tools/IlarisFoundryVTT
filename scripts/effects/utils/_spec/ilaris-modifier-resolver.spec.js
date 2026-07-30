import {
    getIlarisComparisonMagnitude,
    resolveIlarisModifiers,
} from '../ilaris-modifier-resolver.js'

function effect(name, modifiers, source = 'uebernatuerlich', extra = {}) {
    return {
        name,
        system: { ilarisSource: source, ilarisModifiers: modifiers },
        ...extra,
    }
}

function resolve(effects, context = {}) {
    return resolveIlarisModifiers({
        actor: { allApplicableEffects: () => effects },
        phase: 'roll',
        target: 'at',
        fertigkeit: 'Klingenwaffen',
        stackingMode: 'ilaris',
        ...context,
    })
}

describe('resolveIlarisModifiers', () => {
    it('suppresses a same-effect general +1 AT behind a matching +2 Klingenwaffen component', () => {
        const result = resolve([
            effect('Attributo', [
                { phase: 'roll', target: 'at', value: '1', stacking: 'strongest-supernatural' },
                {
                    phase: 'roll',
                    target: 'at',
                    value: '2',
                    stacking: 'strongest-supernatural',
                    selector: { fertigkeit: ['Klingenwaffen'] },
                },
            ]),
        ])

        expect(result.value).toBe(2)
        expect(result.selected).toHaveLength(1)
        expect(result.suppressed).toHaveLength(1)
    })

    it('keeps the general component where its specialized selector does not match', () => {
        const result = resolve(
            [
                effect('Attributo', [
                    { phase: 'roll', target: 'at', value: '1', stacking: 'strongest-supernatural' },
                    {
                        phase: 'roll',
                        target: 'at',
                        value: '2',
                        stacking: 'strongest-supernatural',
                        selector: { fertigkeit: ['Klingenwaffen'] },
                    },
                ]),
            ],
            { fertigkeit: 'Stangenwaffen' },
        )

        expect(result.value).toBe(1)
        expect(result.hasSuppression).toBe(false)
    })

    it('selects the strongest positive and strongest negative components independently', () => {
        const result = resolve([
            effect('Mirakel', [
                { phase: 'roll', target: 'at', value: '8', stacking: 'strongest-supernatural' },
            ]),
            effect('Fluch -3', [
                { phase: 'roll', target: 'at', value: '-3', stacking: 'strongest-supernatural' },
            ]),
            effect('Fluch -5', [
                { phase: 'roll', target: 'at', value: '-5', stacking: 'strongest-supernatural' },
            ]),
        ])

        expect(result.value).toBe(3)
        expect(result.selected.map((entry) => entry.sourceName)).toEqual(['Mirakel', 'Fluch -5'])
        expect(result.suppressed.map((entry) => entry.sourceName)).toEqual(['Fluch -3'])
    })

    it('adds ordinary and Vorteil modifiers while competing supernatural components do not stack', () => {
        const result = resolve([
            effect(
                'Ordinary',
                [{ phase: 'roll', target: 'at', value: '1', stacking: 'add' }],
                'ordinary',
            ),
            effect(
                'Magischer Vorteil',
                [{ phase: 'roll', target: 'at', value: '2', stacking: 'strongest-supernatural' }],
                'uebernatuerlich',
                {
                    parent: { type: 'vorteil' },
                },
            ),
            effect('Mirakel', [
                { phase: 'roll', target: 'at', value: '4', stacking: 'strongest-supernatural' },
            ]),
            effect('Attributo', [
                { phase: 'roll', target: 'at', value: '3', stacking: 'strongest-supernatural' },
            ]),
        ])

        expect(result.value).toBe(7)
        expect(result.suppressed.map((entry) => entry.sourceName)).toEqual(['Attributo'])
    })

    it('adds every matching component in Foundry stack mode', () => {
        const result = resolve(
            [
                effect('Mirakel', [
                    { phase: 'roll', target: 'at', value: '4', stacking: 'strongest-supernatural' },
                ]),
                effect('Attributo', [
                    { phase: 'roll', target: 'at', value: '3', stacking: 'strongest-supernatural' },
                ]),
            ],
            { stackingMode: 'foundry' },
        )

        expect(result.value).toBe(7)
        expect(result.hasSuppression).toBe(false)
    })

    it('reactivates the next strongest component after the stronger effect expires', () => {
        const mirakel = effect('Mirakel', [
            { phase: 'roll', target: 'at', value: '8', stacking: 'strongest-supernatural' },
        ])
        const attributo = effect('Attributo', [
            { phase: 'roll', target: 'at', value: '4', stacking: 'strongest-supernatural' },
        ])

        expect(resolve([mirakel, attributo]).value).toBe(8)
        mirakel.disabled = true
        expect(resolve([mirakel, attributo]).value).toBe(4)
    })

    it('resolves transferred item effects and compares TP with Waffenschaden as one damage group', () => {
        const result = resolve(
            [
                effect(
                    'Waffensegen',
                    [
                        {
                            phase: 'roll',
                            target: 'tp',
                            value: '3',
                            stacking: 'strongest-supernatural',
                        },
                    ],
                    'uebernatuerlich',
                    { parent: { type: 'nahkampfwaffe' } },
                ),
                effect('Kleiner Schaden', [
                    {
                        phase: 'roll',
                        target: 'waffenschaden',
                        value: '2',
                        stacking: 'strongest-supernatural',
                    },
                ]),
            ],
            { target: 'damage', maneuver: 'Hammerschlag' },
        )

        expect(result.value).toBe(3)
        expect(result.selected.map((entry) => entry.sourceName)).toEqual(['Waffensegen'])
        expect(result.suppressed.map((entry) => entry.sourceName)).toEqual(['Kleiner Schaden'])
    })
})

describe('getIlarisComparisonMagnitude', () => {
    it('uses expected values for linear W6 formulas and supports explicit comparison values', () => {
        expect(getIlarisComparisonMagnitude({ value: '-2W6+1' })).toBe(6)
        expect(getIlarisComparisonMagnitude({ value: '1W6', comparisonValue: '8' })).toBe(8)
        expect(getIlarisComparisonMagnitude({ value: '1W6', comparisonValue: '4+2+2' })).toBe(8)
    })

    it('rejects unsupported formulas instead of silently comparing them', () => {
        expect(() => getIlarisComparisonMagnitude({ value: '1W20' })).toThrow('Unsupported')
    })
})
