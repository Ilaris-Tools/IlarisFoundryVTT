/**
 * Tests for toArray() — Foundry V14 ObjectField normalization
 *
 * @spec openspec/changes/add-pre-effect-unit-tests/specs/pre-effect-unit-tests/spec.md
 */
import {
    applyInstantPreEffect,
    applyPreEffects,
    createActiveEffectFromPreEffect,
    toArray,
} from '../pre-effects-processor.js'

function createTargetActor(overrides = {}) {
    return {
        id: 'target-id',
        name: 'Target',
        type: 'held',
        system: {
            abgeleitete: { ws: 5, ws_stern: 5 },
            gesundheit: { wunden: 0, erschoepfung: 0 },
        },
        update: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    }
}

beforeEach(() => {
    global.ActiveEffect.createDocuments = jest.fn().mockResolvedValue([])
    global.ChatMessage.create = jest.fn().mockResolvedValue(undefined)
    global.game.settings.get = jest.fn((_namespace, key) => {
        if (key === 'damageTypes') {
            return JSON.stringify([
                { value: 'PROFAN', behavior: {} },
                { value: 'FEUER', behavior: { bypassesArmor: true } },
            ])
        }
        if (key === 'lepSystem') return false
        return undefined
    })
    global.CONFIG = { ILARIS: { schadenstypen: { PROFAN: 'Profan', FEUER: 'Feuer' } } }
    global.CONST = { CHAT_MESSAGE_STYLES: { OTHER: 0 } }
})

describe('toArray', () => {
    it('returns array unchanged when input is already an array', () => {
        const input = [{ a: 1 }, { b: 2 }]
        const result = toArray(input)

        // Same reference returned (pass-through)
        expect(result).toBe(input)
        expect(result).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('normalizes ObjectField {0:{a}, 1:{b}} to array [{a}, {b}]', () => {
        const input = { 0: { a: 1 }, 1: { b: 2 } }
        const result = toArray(input)

        expect(Array.isArray(result)).toBe(true)
        expect(result).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('returns empty array for null', () => {
        expect(toArray(null)).toEqual([])
    })

    it('returns empty array for undefined', () => {
        expect(toArray(undefined)).toEqual([])
    })

    it('returns empty array for empty object', () => {
        expect(toArray({})).toEqual([])
    })
})

describe('pre-effect processor', () => {
    it('normalizes W formulas, applies MÃ¤chtige Magie bonuses, and forwards the damage type', async () => {
        const formulas = []
        global.Roll = class {
            constructor(formula) {
                formulas.push(formula)
                this.total = 11
            }

            async evaluate() {
                return this
            }
        }
        const target = createTargetActor()

        await applyInstantPreEffect(
            target,
            {
                changes: [
                    {
                        value: '2W6',
                        maechtigBonus: '2',
                        amplifiedByMaechtigeMagie: true,
                        damageType: 'FEUER',
                    },
                ],
            },
            2,
            { alias: 'Caster' },
        )

        expect(formulas).toEqual(['2d6+2+2'])
        expect(target.update).toHaveBeenCalledWith({ 'system.gesundheit.wunden': 2 })
        expect(global.ChatMessage.create).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Feuer') }),
        )
    })

    it('falls back to the numeric prefix when a formula cannot be evaluated', async () => {
        global.Roll = class {
            constructor() {
                throw new Error('invalid formula')
            }
        }
        const target = createTargetActor()

        await applyInstantPreEffect(
            target,
            { changes: [{ value: '6invalid', damageType: 'PROFAN' }] },
            0,
            {},
        )

        expect(target.update).toHaveBeenCalledWith({ 'system.gesundheit.wunden': 1 })
    })

    it('creates one ActiveEffect with mapped changes, origin metadata, and effective duration', async () => {
        const target = createTargetActor()
        const caster = { uuid: 'Actor.caster' }
        const spell = {
            name: 'Axxeleratus',
            uuid: 'Actor.caster.Item.spell',
            system: { fertigkeiten: 'Bewegung' },
        }

        await createActiveEffectFromPreEffect(
            target,
            {
                changes: [
                    { key: 'system.abgeleitete.gs', type: 'add', value: '4', priority: 20 },
                    {
                        key: 'system.modifikatoren.verteidigungmod',
                        type: 'multiply',
                        value: '2',
                        amplifiedByMaechtigeMagie: true,
                        maechtigBonus: '+1',
                        priority: 0,
                    },
                    { key: 'system.test', type: 'override', value: '7' },
                    { key: 'system.custom', type: 'custom', value: 'x' },
                ],
            },
            caster,
            spell,
            7,
            2,
        )

        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    name: 'Axxeleratus',
                    origin: 'Actor.caster',
                    changes: [
                        { key: 'system.abgeleitete.gs', mode: 2, value: '4', priority: 20 },
                        {
                            key: 'system.modifikatoren.verteidigungmod',
                            mode: 4,
                            value: '2+1+1',
                            priority: null,
                        },
                        { key: 'system.test', mode: 1, value: '7', priority: null },
                        { key: 'system.custom', mode: 10, value: 'x', priority: null },
                    ],
                    duration: { turns: 7 },
                    system: {
                        ilarisTiming: {
                            durationType: 'ownerTurns',
                            expiresOn: 'turnEnd',
                            remaining: 7,
                            originalValue: 7,
                        },
                    },
                    flags: {
                        ilaris: expect.objectContaining({
                            sourceType: 'uebernatuerlich',
                            spellName: 'Axxeleratus',
                            spellUuid: 'Actor.caster.Item.spell',
                            casterUuid: 'Actor.caster',
                            fertigkeiten: 'Bewegung',
                        }),
                    },
                }),
            ],
            { parent: target },
        )
    })

    it('does not create an effect for an empty change list', async () => {
        await createActiveEffectFromPreEffect(
            createTargetActor(),
            { changes: [] },
            { uuid: 'Actor.caster' },
            { name: 'Empty', uuid: 'Item.empty', system: {} },
            1,
            0,
        )

        expect(global.ActiveEffect.createDocuments).not.toHaveBeenCalled()
    })

    it('creates a timed spell-named zero-modifier marker without updating the actor', async () => {
        const target = createTargetActor()

        await createActiveEffectFromPreEffect(
            target,
            {
                changes: [
                    {
                        key: 'system.modifikatoren.manuellermod',
                        type: 'add',
                        value: '0',
                    },
                ],
            },
            { uuid: 'Actor.caster' },
            { name: 'Hexengalle', uuid: 'Item.hexengalle', system: {} },
            2,
            0,
        )

        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    name: 'Hexengalle',
                    changes: [
                        expect.objectContaining({
                            key: 'system.modifikatoren.manuellermod',
                            value: '0',
                        }),
                    ],
                    duration: { turns: 2 },
                }),
            ],
            { parent: target },
        )
        expect(target.update).not.toHaveBeenCalled()
    })

    it('creates independent effects for a self target and another target', async () => {
        const caster = { id: 'caster-id', uuid: 'Actor.caster' }
        const self = createTargetActor({ id: 'caster-id', name: 'Caster' })
        const other = createTargetActor({ id: 'other-id', name: 'Other' })
        global.game.actors = {
            get: jest.fn((id) => ({ 'caster-id': self, 'other-id': other })[id] ?? null),
        }
        const dialog = {
            item: {
                name: 'Buff',
                uuid: 'Item.buff',
                system: {
                    preEffects: {
                        0: {
                            baseDuration: 3,
                            instant: false,
                            changes: [{ key: 'system.test', type: 'add', value: '1' }],
                        },
                    },
                },
            },
            selectedActors: [{ actorId: 'caster-id' }, { actorId: 'other-id' }],
            actor: caster,
            speaker: {},
            maneuverDurationBonus: 2,
            maechtigeMagieQs: 0,
        }

        applyPreEffects({ success: true }, dialog)
        await Promise.resolve()
        await Promise.resolve()

        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledTimes(2)
        expect(global.ActiveEffect.createDocuments.mock.calls[0][0][0].duration.turns).toBe(6)
        expect(global.ActiveEffect.createDocuments.mock.calls[1][0][0].duration.turns).toBe(5)
    })
})
