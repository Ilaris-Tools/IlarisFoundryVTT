import {
    normalizeSpellModifications,
    resolveSpellModificationContext,
} from '../spell-modifications.js'

const item = (system) => ({ system })

describe('structured spell modifications', () => {
    const baseSystem = {
        schwierigkeit: '12',
        kosten: '4 AsP',
        ziel: 'Zone',
        reichweite: '8 Schritt',
        wirkungsdauer: '16 Initiativphasen',
        preEffects: [{ id: 'base' }],
    }

    test('normalizes malformed fields and defaults omitted mode to inherit', () => {
        expect(normalizeSpellModifications({ spellModifications: { bad: true } })).toEqual({
            groups: [],
            modifications: [],
        })

        const normalized = normalizeSpellModifications({
            spellModificationGroups: [{ id: 'form', label: 'Form', required: true }],
            spellModifications: [{ id: 'faxius', name: 'Miasmafaxius', group: 'form' }],
        })
        expect(normalized.modifications[0]).toMatchObject({ id: 'faxius', effectMode: 'inherit' })
    })

    test('requires exactly one member of a required group', () => {
        const source = item({
            ...baseSystem,
            spellModificationGroups: [{ id: 'attribute', required: true }],
            spellModifications: [
                { id: 'ff', name: 'FF', group: 'attribute' },
                { id: 'ge', name: 'GE', group: 'attribute' },
            ],
        })

        expect(resolveSpellModificationContext(source, []).valid).toBe(false)
        expect(resolveSpellModificationContext(source, ['ff', 'ge']).valid).toBe(false)
        expect(resolveSpellModificationContext(source, ['ff']).valid).toBe(true)
    })

    test('composes profile overrides and all effect modes deterministically', () => {
        const source = item({
            ...baseSystem,
            spellModifications: [
                {
                    id: 'inherit',
                    profile: {
                        difficulty: -4,
                        cost: { mode: 'set', value: 8 },
                        target: 'Einzelperson',
                    },
                },
                { id: 'extend', effectMode: 'extend', preEffects: [{ id: 'extra' }] },
                { id: 'replace', effectMode: 'replace', preEffects: [{ id: 'replacement' }] },
            ],
        })

        const inherited = resolveSpellModificationContext(source, ['inherit'])
        expect(inherited.profile).toMatchObject({ difficulty: 8, cost: 8, target: 'Einzelperson' })
        expect(inherited.preEffects).toEqual([{ id: 'base' }])

        expect(resolveSpellModificationContext(source, ['extend']).preEffects).toEqual([
            { id: 'base' },
            { id: 'extra' },
        ])
        expect(resolveSpellModificationContext(source, ['replace']).preEffects).toEqual([
            { id: 'replacement' },
        ])
    })

    test('rejects unknown ids and conflicting independent set overrides', () => {
        const source = item({
            ...baseSystem,
            spellModifications: [
                { id: 'eight', profile: { cost: { mode: 'set', value: 8 } } },
                { id: 'sixteen', profile: { cost: { mode: 'set', value: 16 } } },
            ],
        })
        expect(resolveSpellModificationContext(source, ['unknown']).valid).toBe(false)
        expect(resolveSpellModificationContext(source, ['eight', 'sixteen']).valid).toBe(false)
    })

    test('keeps optional forms independent and leaves legacy-only Items untouched', () => {
        const source = item({
            ...baseSystem,
            modifikationen: 'Alte Textmodifikation (-4)',
            spellModificationGroups: [{ id: 'required', required: true }],
            spellModifications: [
                { id: 'required-form', group: 'required' },
                { id: 'optional-form', profile: { difficulty: -2 } },
            ],
        })

        expect(
            resolveSpellModificationContext(source, ['required-form', 'optional-form']),
        ).toMatchObject({
            valid: true,
            profile: { difficulty: 10 },
        })
        expect(resolveSpellModificationContext(item(baseSystem), [])).toMatchObject({
            valid: true,
            selectedForms: [],
            preEffects: [{ id: 'base' }],
        })
    })

    test('resolves a selected form zone over the optional base zone', () => {
        const source = item({
            ...baseSystem,
            zone: {
                shape: 'cone',
                distance: 8,
                angle: 45,
                placement: { anchor: 'caster', pivot: 'tip' },
            },
            spellModifications: [
                {
                    id: 'miasmasphaero',
                    zone: {
                        shape: 'circle',
                        distance: 8,
                        placement: { anchor: 'caster', pivot: 'center' },
                    },
                },
            ],
        })

        expect(resolveSpellModificationContext(source, ['miasmasphaero']).zone).toMatchObject({
            shape: 'circle',
            distance: 8,
            placement: { anchor: 'caster', pivot: 'center' },
        })
        expect(resolveSpellModificationContext(item(baseSystem), []).zone).toBeNull()
    })

    test('lets a form opt out of inherited zone automation', () => {
        const source = item({
            ...baseSystem,
            zone: { shape: 'circle', distance: 8, placement: { anchor: 'caster' } },
            spellModifications: [{ id: 'faxius', zone: false }],
        })
        expect(resolveSpellModificationContext(source, ['faxius']).zone).toBeNull()
    })

    test('inherits an Aeolitus-style Zone while a form switches its duration source and triggers', () => {
        const source = item({
            ...baseSystem,
            zone: {
                shape: 'cone',
                distance: 16,
                angle: 45,
                placement: { anchor: 'caster', range: 0, pivot: 'tip' },
                lifecycle: 'instant',
            },
            spellModifications: [
                {
                    id: 'langer-atem',
                    profile: { difficulty: -8, cost: { mode: 'set', value: 8 } },
                    zone: {
                        lifecycle: 'persistent',
                        duration: { source: 'casterAttribute', attribute: 'KO' },
                        trigger: { triggerOnCreate: true, onEnter: true, onRoundStart: true },
                    },
                },
            ],
        })

        expect(resolveSpellModificationContext(source, ['langer-atem'])).toMatchObject({
            profile: { difficulty: 4, cost: 8 },
            zone: {
                shape: 'cone',
                distance: 16,
                placement: { anchor: 'caster', pivot: 'tip' },
                lifecycle: 'persistent',
                duration: { source: 'casterAttribute', attribute: 'KO', remaining: 0 },
                trigger: { triggerOnCreate: true, onEnter: true, onRoundStart: true },
            },
        })
    })

    test('requires one anti-magic preset form and accepts any one of its four choices', () => {
        const source = item({ ...baseSystem, spellModificationPreset: 'antiMagic' })

        expect(resolveSpellModificationContext(source, []).valid).toBe(false)
        expect(resolveSpellModificationContext(source, ['zauber-aufheben'])).toMatchObject({
            valid: true,
            selectedForms: [expect.objectContaining({ effectMode: 'replace' })],
            profile: { permanentCost: 'Halbe Basiskosten des Zielzaubers' },
        })
    })
})
