/**
 * Tests for toArray() — Foundry V14 ObjectField normalization
 *
 * @spec openspec/changes/add-pre-effect-unit-tests/specs/pre-effect-unit-tests/spec.md
 */
import {
    applyPreEffectOperation,
    applyInstantPreEffect,
    applyPreEffects,
    createActiveEffectFromPreEffect,
    toArray,
} from '../pre-effects-processor.js'

function createTargetActor(overrides = {}) {
    return {
        id: 'target-id',
        name: 'Target',
        effects: [],
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
                { value: 'PROFAN', label: 'Profan', behavior: {} },
                { value: 'FEUER', label: 'Feuer', behavior: { bypassesArmor: true } },
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
    it('uses an explicit form list instead of source pre-effects and records form provenance', async () => {
        const caster = createTargetActor({ id: 'caster-id', uuid: 'Actor.caster' })
        global.game.actors = { get: jest.fn((id) => (id === caster.id ? caster : undefined)) }
        const spell = {
            name: 'Fortifex',
            uuid: 'Item.fortifex',
            system: {
                preEffects: [
                    { baseDuration: 2, changes: [{ key: 'system.base', type: 'add', value: '1' }] },
                ],
            },
        }
        const replacement = {
            baseDuration: 4,
            changes: [{ key: 'system.replacement', type: 'add', value: '2' }],
        }

        await applyPreEffects(
            { success: true },
            { item: spell, actor: caster, selectedActors: [{ actorId: caster.id }], speaker: {} },
            {},
            {
                preEffects: [replacement],
                spellModificationId: 'schimmernder-schild',
                zoneRegionId: 'zone-region-1',
            },
        )

        const created = global.ActiveEffect.createDocuments.mock.calls[0][0][0]
        expect(created.changes).toEqual([
            expect.objectContaining({ key: 'system.replacement', value: '2' }),
        ])
        expect(created.flags.ilaris.spellModificationId).toBe('schimmernder-schild')
        expect(created.flags.ilaris.zoneRegionId).toBe('zone-region-1')
    })

    it('routes a canonical condition pre-effect to one status-bearing condition effect', async () => {
        global.CONFIG.statusEffects = {
            Position4: {
                id: 'Position4',
                name: 'Sehr schlechte Position (Liegend)',
                img: 'falling.svg',
                changes: [{ key: 'system.modifikatoren.nahkampfmod', mode: 2, value: -4 }],
            },
        }
        const target = createTargetActor()

        await createActiveEffectFromPreEffect(
            target,
            { condition: { enabled: true, statusId: 'Position4' } },
            { uuid: 'Actor.attacker' },
            {
                name: 'Niederwerfen',
                uuid: 'Compendium.Ilaris.manover.Item.niederwerfen',
                system: {},
            },
            0,
            0,
            0,
            'knockdown',
            {},
            'maneuver',
        )

        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    name: 'Sehr schlechte Position (Liegend)',
                    statuses: ['Position4'],
                    system: expect.objectContaining({
                        ilarisCondition: expect.objectContaining({
                            statusId: 'Position4',
                            sources: [
                                expect.objectContaining({
                                    id: 'knockdown:0',
                                    type: 'preEffect',
                                    origin: 'Compendium.Ilaris.manover.Item.niederwerfen',
                                }),
                            ],
                        }),
                    }),
                }),
            ],
            { parent: target },
        )
    })

    it('materializes maneuver provenance and its opposed-escape ending without spell replacement', async () => {
        const target = createTargetActor()
        await createActiveEffectFromPreEffect(
            target,
            {
                changes: [{ key: 'system.modifikatoren.nahkampfmod', type: 'add', value: '-1' }],
                ilarisEnding: { type: 'opposedEscape' },
            },
            { uuid: 'Actor.grappler' },
            { name: 'Umklammern', uuid: 'Compendium.Ilaris.manover.Item.umklammern', system: {} },
            0,
            0,
            2,
            'maneuver-application',
            {},
            'maneuver',
        )

        const created = global.ActiveEffect.createDocuments.mock.calls[0][0][0]
        expect(created.flags.ilaris).toMatchObject({
            sourceType: 'maneuver',
            maneuverUuid: 'Compendium.Ilaris.manover.Item.umklammern',
            sourceActorUuid: 'Actor.grappler',
            preEffectIndex: 2,
            applicationId: 'maneuver-application',
        })
        expect(created.system.ilarisEnding).toEqual({
            type: 'opposedEscape',
            sourceActorUuid: 'Actor.grappler',
        })
    })

    it('deselects only the selector-selected equipped weapon', async () => {
        const mainWeapon = {
            type: 'nahkampfwaffe',
            system: { hauptwaffe: true, nebenwaffe: false },
            update: jest.fn().mockResolvedValue(undefined),
        }
        const secondaryWeapon = {
            type: 'nahkampfwaffe',
            system: { hauptwaffe: false, nebenwaffe: true },
            update: jest.fn().mockResolvedValue(undefined),
        }
        const target = createTargetActor({ items: [mainWeapon, secondaryWeapon] })

        await applyPreEffectOperation(
            target,
            { operation: 'deselectEquippedWeapon' },
            { selector: 'Nebenwaffe' },
        )

        expect(mainWeapon.update).not.toHaveBeenCalled()
        expect(secondaryWeapon.update).toHaveBeenCalledWith({ 'system.nebenwaffe': false })
    })

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
                    system: expect.objectContaining({
                        ilarisSource: 'uebernatuerlich',
                        ilarisModifiers: [],
                        ilarisTiming: {
                            durationType: 'ownerTurns',
                            expiresOn: 'turnEnd',
                            remaining: 7,
                            originalValue: 7,
                        },
                    }),
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

    it('materializes semantic modifiers and redirects native main attributes to roll-only data', async () => {
        const target = createTargetActor()
        await createActiveEffectFromPreEffect(
            target,
            {
                changes: [
                    {
                        key: 'system.attribute.GE.wert',
                        type: 'add',
                        value: '2',
                    },
                ],
                ilarisModifiers: [
                    {
                        phase: 'roll',
                        target: 'at',
                        value: '2',
                        stacking: 'strongest-supernatural',
                        amplifiedByMaechtigeMagie: true,
                        maechtigBonus: '+1',
                        diminishedValue: '1',
                    },
                ],
            },
            { uuid: 'Actor.caster' },
            { name: 'Attributo', uuid: 'Item.attributo', system: {} },
            3,
            2,
        )

        const created = global.ActiveEffect.createDocuments.mock.calls[0][0][0]
        expect(created.changes).toEqual([])
        expect(created.system).toMatchObject({
            ilarisSource: 'uebernatuerlich',
            ilarisModifiers: expect.arrayContaining([
                expect.objectContaining({ target: 'ge', value: '2' }),
                expect.objectContaining({ target: 'at', value: '2+1+1' }),
            ]),
        })
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

        await applyPreEffects({ success: true }, dialog)

        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledTimes(2)
        expect(global.ActiveEffect.createDocuments.mock.calls[0][0][0].duration.turns).toBe(6)
        expect(global.ActiveEffect.createDocuments.mock.calls[1][0][0].duration.turns).toBe(5)
    })

    it.each(['ilaris', 'foundry'])(
        'creates independent summoned clones for every target in %s stacking mode',
        async (stackingMode) => {
            let nextItemId = 1
            const createSummonTarget = (id) => {
                const target = createTargetActor({
                    id,
                    uuid: `Actor.${id}`,
                    items: [],
                    createEmbeddedDocuments: jest.fn(async (_type, [data]) => {
                        const clone = { id: `summon-${nextItemId++}`, ...data }
                        target.items.push(clone)
                        return [clone]
                    }),
                    updateEmbeddedDocuments: jest.fn().mockResolvedValue([]),
                    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
                })
                return target
            }
            const firstTarget = createSummonTarget('first-target')
            const secondTarget = createSummonTarget('second-target')
            global.game.settings.get = jest.fn((_namespace, key) => {
                if (key === 'waffenPacks') return '["Ilaris.waffen"]'
                if (key === 'supernaturalEffectStacking') return stackingMode
                return undefined
            })
            global.game.actors = {
                get: jest.fn(
                    (id) => ({ 'first-target': firstTarget, 'second-target': secondTarget })[id],
                ),
            }
            global.fromUuid = jest.fn().mockResolvedValue({
                pack: 'Ilaris.waffen',
                type: 'nahkampfwaffe',
                uuid: 'Compendium.Ilaris.waffen.Item.source',
                toObject: () => ({
                    _id: 'source',
                    name: 'Beschworene Waffe',
                    type: 'nahkampfwaffe',
                    effects: [{ _id: 'transferred', transfer: true }],
                    system: { hauptwaffe: false },
                }),
            })
            global.ActiveEffect.createDocuments = jest.fn().mockResolvedValue([])
            const dialog = {
                item: {
                    name: 'Beschwörung',
                    uuid: 'Item.beschwoerung',
                    system: {
                        preEffects: [
                            {
                                baseDuration: 3,
                                instant: false,
                                summonItem: {
                                    sourceUuid: 'Compendium.Ilaris.waffen.Item.source',
                                    overrides: [{ path: 'system.tp', value: '2W20' }],
                                },
                            },
                        ],
                    },
                },
                selectedActors: [{ actorId: 'first-target' }, { actorId: 'second-target' }],
                actor: { id: 'caster-id', uuid: 'Actor.caster' },
                speaker: {},
                maneuverDurationBonus: 0,
                maechtigeMagieQs: 0,
            }

            await applyPreEffects(
                { success: true },
                dialog,
                {},
                { spellModificationId: 'shield-form' },
            )
            await applyPreEffects({ success: true }, dialog)

            for (const target of [firstTarget, secondTarget]) {
                expect(target.items).toHaveLength(2)
                expect(target.items).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            type: 'nahkampfwaffe',
                            effects: [{ _id: 'transferred', transfer: true }],
                            system: expect.objectContaining({ hauptwaffe: true, tp: '2W20' }),
                            flags: expect.objectContaining({
                                ilaris: expect.objectContaining({
                                    summon: true,
                                    sourceItemUuid: 'Compendium.Ilaris.waffen.Item.source',
                                    spellUuid: 'Item.beschwoerung',
                                }),
                            }),
                        }),
                    ]),
                )
                expect(
                    new Set(target.items.map((item) => item.flags.ilaris.applicationId)).size,
                ).toBe(2)
            }
            expect(global.ActiveEffect.createDocuments).toHaveBeenCalledTimes(4)
            expect(
                global.ActiveEffect.createDocuments.mock.calls[0][0][0].flags.ilaris,
            ).toMatchObject({
                spellModificationId: 'shield-form',
            })
        },
    )

    it('materializes bounded armed input and charges without changing the source definition', async () => {
        const target = createTargetActor()
        global.game.actors = { get: jest.fn(() => target) }
        const armedCombat = {
            trigger: 'nextSuccessfulAttack',
            scope: 'any',
            inputs: [{ key: 'previousHits', default: 0, min: 0, max: 8 }],
            damage: { input: 'previousHits', perInput: 'W6' },
            charges: { base: 1, amplifiedByMaechtigeMagie: true, maechtigBonus: 1 },
        }
        const dialog = {
            item: {
                name: 'Neun Streiche in einem',
                uuid: 'Item.neun-streiche',
                system: { preEffects: [{ baseDuration: 1, instant: false, armedCombat }] },
            },
            selectedActors: [{ actorId: 'target-id' }],
            actor: { id: 'caster-id', uuid: 'Actor.caster' },
            speaker: {},
            maneuverDurationBonus: 0,
            maechtigeMagieQs: 2,
        }

        await applyPreEffects({ success: true }, dialog, { previousHits: 99 })

        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    system: expect.objectContaining({
                        ilarisArmedCombat: expect.objectContaining({
                            inputs: { previousHits: 8 },
                            remainingCharges: 3,
                            damage: { input: 'previousHits', perInput: 'W6', units: 8 },
                        }),
                    }),
                }),
            ],
            { parent: target },
        )
        expect(armedCombat.inputs[0]).toEqual({ key: 'previousHits', default: 0, min: 0, max: 8 })
    })

    it('records the source Pre-Effect index for each direct application', async () => {
        const target = createTargetActor()
        const caster = { id: 'caster-id', uuid: 'Actor.caster' }
        global.game.actors = { get: jest.fn(() => target) }
        const dialog = {
            item: {
                name: 'Component spell',
                uuid: 'Item.component-spell',
                system: {
                    preEffects: [
                        {
                            baseDuration: 2,
                            instant: false,
                            changes: [{ key: 'system.first', type: 'add', value: '1' }],
                        },
                        {
                            baseDuration: 2,
                            instant: false,
                            changes: [{ key: 'system.second', type: 'add', value: '1' }],
                        },
                    ],
                },
            },
            selectedActors: [{ actorId: 'target-id' }],
            actor: caster,
            speaker: {},
            maneuverDurationBonus: 0,
            maechtigeMagieQs: 0,
        }

        await applyPreEffects({ success: true }, dialog)

        expect(
            global.ActiveEffect.createDocuments.mock.calls[0][0][0].flags.ilaris.preEffectIndex,
        ).toBe(0)
        expect(
            global.ActiveEffect.createDocuments.mock.calls[1][0][0].flags.ilaris.preEffectIndex,
        ).toBe(1)
        expect(
            global.ActiveEffect.createDocuments.mock.calls[0][0][0].flags.ilaris.applicationId,
        ).toEqual(
            global.ActiveEffect.createDocuments.mock.calls[1][0][0].flags.ilaris.applicationId,
        )
    })

    it('serializes the source Pre-Effect index for delayed resistance resolution', async () => {
        const target = createTargetActor({
            testUserPermission: jest.fn().mockReturnValue(false),
        })
        global.game.actors = { get: jest.fn(() => target) }
        global.game.users = [{ id: 'gm-id', active: true, isGM: true }]
        const dialog = {
            item: {
                name: 'Resisted spell',
                uuid: 'Item.resisted-spell',
                system: {
                    preEffects: [
                        {
                            baseDuration: 2,
                            instant: false,
                            changes: [{ key: 'system.test', type: 'add', value: '1' }],
                            avoidTest: { enabled: true, fertigkeit: 'Athletik' },
                        },
                    ],
                },
            },
            selectedActors: [{ actorId: 'target-id' }],
            actor: { id: 'caster-id', uuid: 'Actor.caster' },
            speaker: {},
            maneuverDurationBonus: 0,
            maechtigeMagieQs: 0,
        }

        await applyPreEffects({ success: true, roll: { total: 18 } }, dialog)

        const content = global.ChatMessage.create.mock.calls[0][0].content
        const serialized = content.match(/data-pre-effect-data="([^"]+)"/)[1]
        expect(JSON.parse(decodeURIComponent(serialized))).toMatchObject({
            preEffectIndex: 0,
            applicationId: expect.any(String),
            triggeringRollTotal: 18,
            target: { actorId: 'target-id', tokenId: '', actorLink: true },
        })
    })

    it('does not serialize a triggering total when the caller has no usable Roll', async () => {
        const target = createTargetActor({
            testUserPermission: jest.fn().mockReturnValue(false),
        })
        global.game.actors = { get: jest.fn(() => target) }
        global.game.users = [{ id: 'gm-id', active: true, isGM: true }]
        const dialog = {
            item: {
                name: 'Resisted spell',
                uuid: 'Item.resisted-spell',
                system: {
                    preEffects: [
                        {
                            baseDuration: 2,
                            instant: false,
                            changes: [],
                            avoidTest: { enabled: true, attribut: 'KK' },
                        },
                    ],
                },
            },
            selectedActors: [{ actorId: 'target-id' }],
            actor: { id: 'caster-id', uuid: 'Actor.caster' },
            speaker: {},
            maneuverDurationBonus: 0,
            maechtigeMagieQs: 0,
        }

        await applyPreEffects({ success: true, roll: { total: Number.NaN } }, dialog)

        const content = global.ChatMessage.create.mock.calls[0][0].content
        const serialized = content.match(/data-pre-effect-data="([^"]+)"/)[1]
        expect(JSON.parse(decodeURIComponent(serialized))).not.toHaveProperty('triggeringRollTotal')
    })

    it('retains same-spell effects in Ilaris mode', async () => {
        const existingEffect = {
            id: 'existing-component',
            flags: {
                ilaris: {
                    sourceType: 'uebernatuerlich',
                    spellUuid: 'Item.component-spell',
                    preEffectIndex: 0,
                },
            },
        }
        const target = createTargetActor({
            effects: [existingEffect],
            deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        })
        global.game.settings.get = jest.fn((_namespace, key) =>
            key === 'supernaturalEffectStacking' ? 'ilaris' : undefined,
        )

        await createActiveEffectFromPreEffect(
            target,
            { changes: [{ key: 'system.test', type: 'add', value: '1' }] },
            { uuid: 'Actor.caster' },
            { name: 'Component spell', uuid: 'Item.component-spell', system: {} },
            2,
            0,
            0,
        )

        expect(target.deleteEmbeddedDocuments).not.toHaveBeenCalled()
        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledTimes(1)
    })

    it('replaces the whole prior spell application in Foundry mode', async () => {
        const target = createTargetActor({
            effects: [
                {
                    id: 'old-first-component',
                    flags: {
                        ilaris: {
                            sourceType: 'uebernatuerlich',
                            spellUuid: 'Item.component-spell',
                            preEffectIndex: 0,
                            applicationId: 'old-cast',
                        },
                    },
                },
                {
                    id: 'old-second-component',
                    flags: {
                        ilaris: {
                            sourceType: 'uebernatuerlich',
                            spellUuid: 'Item.component-spell',
                            preEffectIndex: 1,
                            applicationId: 'old-cast',
                        },
                    },
                },
                {
                    id: 'legacy',
                    flags: {
                        ilaris: {
                            sourceType: 'uebernatuerlich',
                            spellUuid: 'Item.component-spell',
                        },
                    },
                },
                {
                    id: 'other-spell',
                    flags: {
                        ilaris: {
                            sourceType: 'uebernatuerlich',
                            spellUuid: 'Item.other-spell',
                            applicationId: 'other-cast',
                        },
                    },
                },
            ],
            deleteEmbeddedDocuments: jest.fn().mockImplementation(async (_type, ids) => {
                target.effects = target.effects.filter((effect) => !ids.includes(effect.id))
            }),
        })
        global.game.settings.get = jest.fn((_namespace, key) =>
            key === 'supernaturalEffectStacking' ? 'foundry' : undefined,
        )
        global.ActiveEffect.createDocuments = jest.fn().mockImplementation(async ([effectData]) => {
            target.effects.push({ id: `new-${target.effects.length}`, ...effectData })
        })

        await createActiveEffectFromPreEffect(
            target,
            { changes: [{ key: 'system.test', type: 'add', value: '1' }] },
            { uuid: 'Actor.caster' },
            { name: 'Component spell', uuid: 'Item.component-spell', system: {} },
            7,
            0,
            0,
            'new-cast',
        )
        await createActiveEffectFromPreEffect(
            target,
            { changes: [{ key: 'system.other', type: 'add', value: '2' }] },
            { uuid: 'Actor.caster' },
            { name: 'Component spell', uuid: 'Item.component-spell', system: {} },
            7,
            0,
            1,
            'new-cast',
        )

        expect(target.deleteEmbeddedDocuments).toHaveBeenCalledTimes(1)
        expect(target.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
            'old-first-component',
            'old-second-component',
            'legacy',
        ])
        expect(target.effects.map((effect) => effect.id)).toEqual(['other-spell', 'new-1', 'new-2'])
        expect(
            target.effects
                .filter((effect) => effect.flags?.ilaris?.spellUuid === 'Item.component-spell')
                .map((effect) => effect.flags.ilaris),
        ).toEqual([
            expect.objectContaining({ preEffectIndex: 0, applicationId: 'new-cast' }),
            expect.objectContaining({ preEffectIndex: 1, applicationId: 'new-cast' }),
        ])
        expect(target.deleteEmbeddedDocuments.mock.invocationCallOrder[0]).toBeLessThan(
            global.ActiveEffect.createDocuments.mock.invocationCallOrder[0],
        )
    })
})
