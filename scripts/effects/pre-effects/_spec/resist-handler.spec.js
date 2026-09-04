import {
    registerResistHandler,
    registerResistResolutionListener,
    resolveResistDifficulty,
    resolveInitialResistTalent,
    resolveResistTargetActor,
    sendResistPrompt,
} from '../resist-handler.js'

const effectCreate = jest.fn().mockResolvedValue([])
let hookCallbacks

function preEffect(overrides = {}) {
    return {
        targetActorId: 'target',
        casterUuid: 'Actor.caster',
        spellUuid: 'Item.spell',
        baseDuration: 3,
        maneuverBonus: 1,
        isSelfCast: false,
        instant: false,
        changes: [{ key: 'system.test', type: 'add', value: '5', diminishedValue: '2' }],
        avoidTest: { diminishedOnly: false },
        ...overrides,
    }
}

beforeEach(() => {
    hookCallbacks = {}
    global.window = {}
    global.Hooks.on = jest.fn((event, callback) => {
        hookCallbacks[event] = callback
    })
    global.ActiveEffect.createDocuments = effectCreate
    effectCreate.mockClear()
    global.ChatMessage = {
        create: jest.fn().mockResolvedValue(undefined),
        getSpeaker: jest.fn(() => ({ alias: 'Target' })),
    }
    global.game = {
        actors: {
            get: jest.fn((id) =>
                id === 'target'
                    ? { id: 'target', name: 'Target', system: {}, update: jest.fn() }
                    : null,
            ),
        },
        users: [],
    }
    global.canvas = { tokens: { get: jest.fn(() => null) } }
    global.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } }
    global.foundry.utils.fromUuid = jest.fn((uuid) => {
        if (uuid === 'Item.spell') return { name: 'Spell', uuid, system: {} }
        if (uuid === 'Actor.caster') return { uuid }
        return null
    })
})

describe('resist result listener', () => {
    it('applies a full non-instant effect when the resist roll fails', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    zoneRegionId: 'zone-region',
                    targetTokenId: 'target-token',
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(effectCreate).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    changes: [expect.objectContaining({ value: '5' })],
                    flags: expect.objectContaining({
                        ilaris: expect.objectContaining({
                            zoneRegionId: 'zone-region',
                            targetTokenId: 'target-token',
                        }),
                    }),
                }),
            ],
            expect.any(Object),
        )
        expect(dialog._resistContext).toBeUndefined()
    })

    it('does not apply an effect when the resist roll succeeds normally', async () => {
        registerResistResolutionListener()
        const dialog = { _resistContext: { preEffectData: preEffect(), spellUuid: 'Item.spell' } }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: true } })

        expect(effectCreate).not.toHaveBeenCalled()
    })

    it('applies a resistance result to the structured unlinked Token Actor before its world Actor', async () => {
        const tokenActor = {
            id: 'synthetic-target',
            name: 'Synthetic Target',
            system: {},
            effects: [],
        }
        const worldActor = { id: 'target', name: 'World Target', system: {}, effects: [] }
        global.canvas.tokens.get.mockReturnValue({
            actor: tokenActor,
            document: { actorLink: false },
        })
        global.game.actors.get.mockReturnValue(worldActor)
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    target: { actorId: 'target', tokenId: 'token-1', actorLink: false },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(effectCreate).toHaveBeenCalledWith(expect.any(Array), { parent: tokenActor })
        expect(global.game.actors.get).not.toHaveBeenCalled()
    })

    it('resolves a wall traversal through its narrow Zone marker lifecycle', async () => {
        const actor = {
            id: 'target',
            name: 'Target',
            system: {},
            effects: [],
            createEmbeddedDocuments: jest.fn(async (_type, [data]) => {
                const effect = { id: 'wall-marker', ...data }
                actor.effects.push(effect)
                return [effect]
            }),
            deleteEmbeddedDocuments: jest.fn(async (_type, ids) => {
                actor.effects = actor.effects.filter((effect) => !ids.includes(effect.id))
            }),
        }
        const region = {
            id: 'wall-region',
            flags: { Ilaris: { zone: { applicationId: 'cast-a', spellUuid: 'Item.spell' } } },
        }
        global.game.actors.get.mockReturnValue(actor)
        global.game.scenes = {
            get: jest.fn(() => ({ regions: new Map([[region.id, region]]) })),
        }
        global.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } }
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                spellUuid: 'Item.spell',
                preEffectData: preEffect({
                    target: { actorId: 'target' },
                    traversal: {
                        sceneId: 'scene-a',
                        regionId: 'wall-region',
                        tokenId: 'target-token',
                        applicationId: 'cast-a',
                        spellUuid: 'Item.spell',
                        spellName: 'Wand aus Dornen',
                    },
                }),
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(actor.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
        expect(effectCreate).not.toHaveBeenCalled()
        expect(global.ChatMessage.create).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Token vor der Wand') }),
        )
    })

    it('routes Zone movement resistance to the neutral marker lifecycle without applying a pre-effect', async () => {
        const actor = {
            id: 'target',
            name: 'Target',
            system: {},
            effects: [],
            createEmbeddedDocuments: jest.fn(async (_type, [data]) => {
                const marker = { id: 'movement-marker', ...data, update: jest.fn() }
                actor.effects.push(marker)
                return [marker]
            }),
            deleteEmbeddedDocuments: jest.fn(async (_type, ids) => {
                actor.effects = actor.effects.filter((effect) => !ids.includes(effect.id))
            }),
        }
        const region = {
            id: 'zone-region',
            parent: { tokens: new Map([['target-token', { id: 'target-token' }]]) },
        }
        global.game.actors.get.mockReturnValue(actor)
        global.game.scenes = { get: jest.fn(() => ({ regions: new Map([[region.id, region]]) })) }
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                spellUuid: 'Item.spell',
                preEffectData: preEffect({
                    target: { actorId: 'target' },
                    zoneMovementResistance: {
                        sceneId: 'scene-a',
                        regionId: 'zone-region',
                        tokenId: 'target-token',
                        applicationId: 'cast-a',
                        spellUuid: 'Item.spell',
                        spellName: 'Pandämonium',
                        origin: { x: 10, y: 20 },
                    },
                }),
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(effectCreate).not.toHaveBeenCalled()
        expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
            expect.objectContaining({
                changes: [],
                flags: expect.objectContaining({
                    ilaris: expect.objectContaining({
                        zoneMovementResistanceMarker: true,
                        zoneMovementOrigin: { x: 10, y: 20 },
                    }),
                }),
            }),
        ])
    })

    it('applies diminished values when a diminished resist succeeds', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({ avoidTest: { diminishedOnly: true } }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: true } })

        expect(effectCreate).toHaveBeenCalledWith(
            [expect.objectContaining({ changes: [expect.objectContaining({ value: '2' })] })],
            expect.any(Object),
        )
    })

    it('applies only the explicit failure marker and keeps its spell provenance', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    castSkill: 'Dämonisch',
                    resistanceOutcomes: {
                        failure: {
                            enabled: true,
                            changes: [],
                            ilarisModifiers: [],
                            marker: {
                                enabled: true,
                                id: 'handlungsunfaehig',
                                label: 'Handlungsunfähig',
                            },
                            condition: { enabled: false, statusId: '' },
                        },
                    },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(effectCreate).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    name: 'Handlungsunfähig — Spell',
                    changes: [],
                    flags: expect.objectContaining({
                        ilaris: expect.objectContaining({
                            sourceItemUuid: 'Item.spell',
                            spellUuid: 'Item.spell',
                            castSkill: 'Dämonisch',
                            resistanceOutcome: 'failure',
                            markerId: 'handlungsunfaehig',
                        }),
                    }),
                }),
            ],
            expect.any(Object),
        )
    })

    it('keeps a failed Sturm outcome traceable and asks the table to reposition manually', async () => {
        const targetActor = {
            id: 'target',
            uuid: 'Actor.target',
            name: 'Target',
            system: {},
            update: jest.fn(),
            testUserPermission: jest.fn(() => true),
        }
        global.game.actors.get.mockReturnValue(targetActor)
        global.game.users = [
            { id: 'owner', active: true, isGM: false },
            { id: 'gm', active: true, isGM: true },
        ]
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    castSkill: 'Elementar',
                    spellModificationId: 'sturm',
                    resistanceOutcomes: {
                        failure: {
                            enabled: true,
                            changes: [],
                            ilarisModifiers: [],
                            marker: {
                                enabled: true,
                                id: 'zurueckgestossen',
                                label: 'Zurückgestoßen',
                            },
                            condition: { enabled: false, statusId: '' },
                            tableManagedDisplacement: { enabled: true },
                        },
                    },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(effectCreate).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    flags: expect.objectContaining({
                        ilaris: expect.objectContaining({
                            spellUuid: 'Item.spell',
                            spellModificationId: 'sturm',
                            castSkill: 'Elementar',
                            resistanceOutcome: 'failure',
                            markerId: 'zurueckgestossen',
                        }),
                    }),
                }),
            ],
            expect.any(Object),
        )
        expect(ChatMessage.create).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('Zurückstoßen (Spielleitung)'),
                whisper: ['owner', 'gm'],
                flags: expect.objectContaining({
                    ilaris: expect.objectContaining({
                        tableManagedDisplacement: true,
                        spellModificationId: 'sturm',
                    }),
                }),
            }),
        )
        expect(targetActor.update).not.toHaveBeenCalled()
    })

    it('applies an explicit success payload instead of diminished values', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    castSkill: 'Dämonisch',
                    avoidTest: { diminishedOnly: true },
                    resistanceOutcomes: {
                        success: {
                            enabled: true,
                            changes: [],
                            ilarisModifiers: [
                                {
                                    phase: 'roll',
                                    target: 'probe',
                                    value: '-4',
                                    stacking: 'strongest-supernatural',
                                    selector: {},
                                },
                            ],
                            marker: { enabled: false, id: '', label: '' },
                            condition: { enabled: false, statusId: '' },
                        },
                    },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: true } })

        expect(effectCreate).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    changes: [],
                    system: expect.objectContaining({
                        ilarisModifiers: [expect.objectContaining({ value: '-4' })],
                    }),
                    flags: expect.objectContaining({
                        ilaris: expect.objectContaining({
                            resistanceOutcome: 'success',
                            castSkill: 'Dämonisch',
                        }),
                    }),
                }),
            ],
            expect.any(Object),
        )
    })

    it('warns and falls back to legacy behavior for a malformed enabled marker', async () => {
        global.ui = { notifications: { warn: jest.fn() } }
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    resistanceOutcomes: {
                        failure: {
                            enabled: true,
                            changes: [],
                            ilarisModifiers: [],
                            marker: { enabled: true, id: '', label: '' },
                            condition: { enabled: false, statusId: '' },
                        },
                    },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(ui.notifications.warn).toHaveBeenCalled()
        expect(effectCreate).toHaveBeenCalledWith(
            [expect.objectContaining({ changes: [expect.objectContaining({ value: '5' })] })],
            expect.any(Object),
        )
    })

    it('keeps the zero-value marker when a diminished-only resist fails', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    changes: [
                        {
                            key: 'system.modifikatoren.manuellermod',
                            type: 'add',
                            value: '0',
                            diminishedValue: '-4',
                        },
                    ],
                    avoidTest: { diminishedOnly: true },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(effectCreate).toHaveBeenCalledWith(
            [expect.objectContaining({ changes: [expect.objectContaining({ value: '0' })] })],
            expect.any(Object),
        )
    })

    it('uses the diminished global modifier when a diminished-only resist succeeds', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    changes: [
                        {
                            key: 'system.modifikatoren.manuellermod',
                            type: 'add',
                            value: '0',
                            diminishedValue: '-4',
                        },
                    ],
                    avoidTest: { diminishedOnly: true },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: true } })

        expect(effectCreate).toHaveBeenCalledWith(
            [expect.objectContaining({ changes: [expect.objectContaining({ value: '-4' })] })],
            expect.any(Object),
        )
    })

    it('warns and re-enables the prompt button when the target actor is missing', async () => {
        global.ui = { notifications: { warn: jest.fn() } }
        global.game.actors.get.mockReturnValue(null)
        registerResistHandler()
        const button = {
            dataset: { actorId: 'missing', preEffectData: encodeURIComponent(JSON.stringify({})) },
            disabled: false,
            addEventListener: jest.fn((_, callback) => {
                button.clickHandler = callback
            }),
        }
        const htmlDOM = {
            querySelectorAll: jest.fn(() => [button]),
            closest: jest.fn(() => ({ classList: { remove: jest.fn(), add: jest.fn() } })),
        }

        hookCallbacks.renderChatMessageHTML({}, htmlDOM)
        await button.clickHandler.call(button)

        expect(global.ui.notifications.warn).toHaveBeenCalled()
        expect(button.disabled).toBe(false)
    })

    it('uses the structured unlinked Token Actor for the prompt click before its world Actor', async () => {
        const tokenActor = { id: 'synthetic-target', name: 'Synthetic Target', system: {} }
        global.ui = { notifications: { warn: jest.fn() } }
        global.canvas.tokens.get.mockReturnValue({
            actor: tokenActor,
            document: { actorLink: false },
        })
        registerResistHandler()
        const classList = { remove: jest.fn(), add: jest.fn() }
        const button = {
            dataset: {
                preEffectData: encodeURIComponent(
                    JSON.stringify({
                        target: { actorId: 'target', tokenId: 'token-1', actorLink: false },
                        avoidTest: {},
                    }),
                ),
            },
            disabled: false,
            addEventListener: jest.fn((_, callback) => {
                button.clickHandler = callback
            }),
        }
        const htmlDOM = {
            querySelectorAll: jest.fn(() => [button]),
            closest: jest.fn(() => ({ classList })),
        }

        hookCallbacks.renderChatMessageHTML({}, htmlDOM)
        await button.clickHandler.call(button)

        expect(classList.add).toHaveBeenCalledWith('resist-handled')
        expect(global.game.actors.get).not.toHaveBeenCalled()
    })
})

describe('resolveResistTargetActor', () => {
    it('prefers the structured unlinked Token Actor over UUID and world Actor fallbacks', async () => {
        const tokenActor = { id: 'synthetic-target', name: 'Synthetic Target', system: {} }
        global.canvas.tokens.get.mockReturnValue({
            actor: tokenActor,
            document: { actorLink: false },
        })

        const resolved = await resolveResistTargetActor({
            target: { actorId: 'target', tokenId: 'token-1', actorLink: false },
            targetActorUuid: 'Actor.target',
            targetActorId: 'target',
        })

        expect(resolved).toBe(tokenActor)
        expect(global.foundry.utils.fromUuid).not.toHaveBeenCalled()
        expect(global.game.actors.get).not.toHaveBeenCalled()
    })

    it('resolves synthetic token actors via UUID', async () => {
        const tokenActor = {
            name: 'Unlinked Goblin',
            uuid: 'Scene.s1.Token.t1.Actor.a1',
            documentName: 'Actor',
        }
        global.foundry.utils.fromUuid = jest.fn((uuid) =>
            uuid === 'Scene.s1.Token.t1.Actor.a1' ? tokenActor : null,
        )

        const resolved = await resolveResistTargetActor({
            targetActorUuid: 'Scene.s1.Token.t1.Actor.a1',
        })

        expect(resolved).toBe(tokenActor)
        expect(global.game.actors.get).not.toHaveBeenCalled()
    })

    it('falls back to the world collection for legacy payloads', async () => {
        const resolved = await resolveResistTargetActor({ targetActorId: 'target' })

        expect(resolved).toEqual(expect.objectContaining({ id: 'target' }))
    })

    it('returns null when nothing resolves', async () => {
        expect(await resolveResistTargetActor({})).toBeNull()
        expect(await resolveResistTargetActor({ targetActorId: 'missing' })).toBeNull()
    })

    it('does not use a non-Actor UUID document as a resistance target', async () => {
        global.foundry.utils.fromUuid.mockResolvedValue({ documentName: 'Item' })

        const resolved = await resolveResistTargetActor({
            targetActorUuid: 'Item.spell',
            targetActorId: 'target',
        })

        expect(resolved).toEqual(expect.objectContaining({ id: 'target' }))
    })
})

describe('sendResistPrompt', () => {
    it('serializes the Actor UUID beside the structured target payload', async () => {
        const targetActor = {
            id: 'target',
            uuid: 'Scene.s1.Token.t1.Actor.target',
            testUserPermission: jest.fn(() => false),
        }
        global.game.users = [{ id: 'gm', active: true, isGM: true }]

        await sendResistPrompt(
            targetActor,
            { target: { actorId: 'target', tokenId: 'token-1', actorLink: false } },
            'Testzauber',
            {},
        )

        const content = global.ChatMessage.create.mock.calls[0][0].content
        const serialized = content.match(/data-pre-effect-data="([^"]+)"/)[1]
        const payload = JSON.parse(decodeURIComponent(serialized))
        expect(payload.target).toEqual({ actorId: 'target', tokenId: 'token-1', actorLink: false })
        expect(payload.targetActorUuid).toBe(targetActor.uuid)
    })
})

describe('resolveInitialResistTalent', () => {
    it('keeps a configured talent owned by the resolved profane skill', () => {
        expect(
            resolveInitialResistTalent([{ name: 'Akrobatik' }, { name: 'Laufen' }], 'Akrobatik'),
        ).toBe('Akrobatik')
    })

    it('falls back to no talent when the target does not own the configured talent', () => {
        expect(resolveInitialResistTalent([{ name: 'Laufen' }], 'Akrobatik')).toBe('')
    })
})

describe('resolveResistDifficulty', () => {
    it('defaults a fixed difficulty to 12 and applies Mächtige Magie quality stages', () => {
        expect(
            resolveResistDifficulty({
                avoidTest: { resistDifficultySource: 'fixed' },
                maechtigeQs: 2,
            }),
        ).toEqual({ difficulty: 20, missingTriggeringRoll: false })
    })

    it('preserves an explicit fixed zero instead of treating it as a source sentinel', () => {
        expect(
            resolveResistDifficulty({
                avoidTest: { resistDifficultySource: 'fixed', resistDifficulty: 0 },
                maechtigeQs: 1,
            }),
        ).toEqual({ difficulty: 4, missingTriggeringRoll: false })
    })

    it('uses the triggering roll total exactly without adding Mächtige Magie', () => {
        expect(
            resolveResistDifficulty({
                avoidTest: { resistDifficultySource: 'triggeringRoll', resistDifficulty: 99 },
                triggeringRollTotal: 17,
                maechtigeQs: 3,
            }),
        ).toEqual({ difficulty: 17, missingTriggeringRoll: false })
    })

    it('falls back to 12 and reports a missing triggering total', () => {
        expect(
            resolveResistDifficulty({
                avoidTest: { resistDifficultySource: 'triggeringRoll' },
                maechtigeQs: 3,
            }),
        ).toEqual({ difficulty: 12, missingTriggeringRoll: true })
    })
})
