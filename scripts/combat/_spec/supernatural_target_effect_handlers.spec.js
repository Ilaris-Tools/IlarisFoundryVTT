import { jest } from '@jest/globals'

describe('supernatural target effect handlers', () => {
    let handleSupernaturalPostAngriff
    let applySupernaturalEffectsToTarget
    let getSupernaturalEffectTargets
    let mockResolveDamageExecutorUserId
    let mockResolveTargetActorForDamage

    beforeAll(async () => {
        mockResolveDamageExecutorUserId = jest.fn()
        mockResolveTargetActorForDamage = jest.fn()

        await jest.unstable_mockModule('../dialogs/shared-dialog-helpers.js', () => ({
            resolveDamageExecutorUserId: mockResolveDamageExecutorUserId,
            resolveTargetActorForDamage: mockResolveTargetActorForDamage,
        }))
        ;({ handleSupernaturalPostAngriff, getSupernaturalEffectTargets } =
            await import('../hooks/supernatural_target_effect_handlers.js'))
        ;({ applySupernaturalEffectsToTarget } =
            await import('../../effects/supernatural-pre-effect.js'))
    })

    beforeEach(() => {
        jest.clearAllMocks()

        global.window = {}
        global.CONFIG = {
            ActiveEffect: {
                documentClass: class MockActiveEffectDocument {
                    constructor(data) {
                        this.changes = data.changes || []
                    }

                    static getEffectStart() {
                        return { startRound: 3, startTurn: 1 }
                    }

                    apply(actor, change) {
                        return { [change.key]: change.value }
                    }
                },
            },
        }
        global.CONST = {
            DOCUMENT_OWNERSHIP_LEVELS: {
                OWNER: 3,
            },
        }
        global.game = {
            user: {
                id: 'owner-1',
            },
            users: [
                {
                    id: 'owner-1',
                    active: true,
                    isGM: false,
                },
            ],
            actors: {
                get: jest.fn(),
            },
            socket: {
                emit: jest.fn(),
            },
            combat: {},
        }
        global.canvas = {
            tokens: {
                get: jest.fn().mockReturnValue(null),
            },
        }
        global.ui = {
            notifications: {
                error: jest.fn(),
            },
        }
    })

    it('ignores failed supernatural rolls', async () => {
        await handleSupernaturalPostAngriff(
            { success: false },
            {
                attackType: 'supernatural',
                item: { type: 'zauber', getFlag: jest.fn().mockReturnValue([]) },
                selectedActors: [{ actorId: 'target-1' }],
            },
        )

        expect(game.socket.emit).not.toHaveBeenCalled()
    })

    it('routes persistent direct effects to the resolved unlinked token actor', async () => {
        const targetActor = {
            id: 'target-actor',
            name: 'Ziel',
            testUserPermission: jest.fn().mockReturnValue(true),
            canUserModify: jest.fn().mockReturnValue(true),
            createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({}),
        }

        global.canvas.tokens.get.mockReturnValue({
            actor: targetActor,
            document: { actorLink: false },
        })

        mockResolveTargetActorForDamage.mockReturnValue({
            targetActor,
            actorLink: false,
        })
        mockResolveDamageExecutorUserId.mockReturnValue('owner-1')

        const item = {
            type: 'zauber',
            name: 'Lodernde Hand',
            uuid: 'Item.zauber-1',
            getFlag: jest.fn().mockReturnValue([
                {
                    id: 'pre-effect-1',
                    name: 'Brennend',
                    disabled: false,
                    duration: { rounds: 2 },
                    changes: [
                        { key: 'system.status.at', value: '1', mode: 2 },
                        {
                            key: 'system.status.gs',
                            value: '2',
                            mode: 2,
                            applyEffectModifier: true,
                        },
                    ],
                    targetMode: 'direct',
                    applicationType: 'persistent',
                    multiplierStrategy: 'maechtigeMagie',
                    multiplierValue: 1,
                },
            ]),
        }

        await handleSupernaturalPostAngriff(
            { success: true },
            {
                attackType: 'supernatural',
                actor: { name: 'Zauberer' },
                castingModifiers: {
                    maechtigeMagie: 1,
                    maechtigeLiturgie: 0,
                    maechtigeAnrufung: 0,
                    hoheQualitaet: 0,
                    effectModifierCount: 1,
                },
                item,
                selectedActors: [{ actorId: 'target-actor', tokenId: 'token-1', actorLink: false }],
            },
        )

        expect(game.socket.emit).toHaveBeenCalledWith(
            'system.Ilaris',
            expect.objectContaining({
                type: 'applySupernaturalEffectsByOwner',
                data: expect.objectContaining({
                    target: expect.objectContaining({
                        actorId: 'target-actor',
                        tokenId: 'token-1',
                        actorLink: false,
                    }),
                }),
            }),
        )
        expect(targetActor.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
            expect.objectContaining({
                name: 'Brennend',
                transfer: false,
                origin: 'Item.zauber-1',
                changes: [
                    expect.objectContaining({ key: 'system.status.at', value: '1' }),
                    expect.objectContaining({ key: 'system.status.gs', value: '4' }),
                ],
                duration: expect.objectContaining({
                    rounds: 2,
                    startRound: 3,
                    startTurn: 1,
                }),
            }),
        ])
    })

    it('applies immediate direct effects and skips template-only entries in phase 1', async () => {
        const targetActor = {
            update: jest.fn().mockResolvedValue({}),
            createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        }

        await applySupernaturalEffectsToTarget(targetActor, [
            {
                name: 'Sofortiger Malus',
                changes: [{ key: 'system.status.malus', value: '-4', mode: 2 }],
                targetMode: 'direct',
                applicationType: 'immediate',
            },
            {
                name: 'Arealreserve',
                changes: [{ key: 'system.status.ignored', value: '1', mode: 2 }],
                targetMode: 'area',
                applicationType: 'persistent',
            },
        ])

        expect(targetActor.update).toHaveBeenCalledWith({ 'system.status.malus': '-4' })
        expect(targetActor.createEmbeddedDocuments).not.toHaveBeenCalled()
    })

    it('falls back to custom effect modifier counts for immediate effects', async () => {
        const targetActor = {
            update: jest.fn().mockResolvedValue({}),
            createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        }

        await applySupernaturalEffectsToTarget(
            targetActor,
            [
                {
                    name: 'Beschleunigt',
                    changes: [
                        {
                            key: 'system.status.gs',
                            value: '2',
                            mode: 2,
                            applyEffectModifier: true,
                        },
                    ],
                    targetMode: 'direct',
                    applicationType: 'immediate',
                    multiplierStrategy: 'custom',
                    multiplierValue: 1,
                },
            ],
            {
                effectModifierCount: 2,
                castingModifiers: { effectModifierCount: 2 },
            },
        )

        expect(targetActor.update).toHaveBeenCalledWith({ 'system.status.gs': '6' })
    })

    it('uses the casting actor as fallback target for self-target spells', () => {
        const targetActor = {
            id: 'self-actor',
            name: 'Zauberer',
            getActiveTokens: jest.fn().mockReturnValue([
                {
                    id: 'self-token',
                    document: { actorLink: true },
                },
            ]),
        }

        const item = {
            type: 'zauber',
            name: 'Adlerauge',
            uuid: 'Item.zauber-self',
            system: { ziel: 'selbst' },
            getFlag: jest.fn().mockReturnValue([
                {
                    id: 'pre-effect-self',
                    name: 'Selbstbuff',
                    disabled: false,
                    duration: { turns: 16 },
                    changes: [{ key: 'system.abgeleitete.gs', value: '4', mode: 2 }],
                    targetMode: 'direct',
                    applicationType: 'persistent',
                },
            ]),
        }

        expect(
            getSupernaturalEffectTargets({
                attackType: 'supernatural',
                actor: targetActor,
                item,
                selectedActors: [],
            }),
        ).toEqual([
            expect.objectContaining({
                actorId: 'self-actor',
                tokenId: 'self-token',
                actorLink: true,
                name: 'Zauberer',
            }),
        ])
    })

    it('falls back to the casting actor for single-person self-casts without selected targets', () => {
        const targetActor = {
            id: 'self-actor',
            name: 'Zauberer',
            getActiveTokens: jest.fn().mockReturnValue([]),
        }

        expect(
            getSupernaturalEffectTargets({
                actor: targetActor,
                item: { type: 'zauber', system: { ziel: 'Einzelperson' } },
                selectedActors: null,
            }),
        ).toEqual([
            expect.objectContaining({
                actorId: 'self-actor',
                tokenId: null,
                actorLink: true,
            }),
        ])
    })
})
