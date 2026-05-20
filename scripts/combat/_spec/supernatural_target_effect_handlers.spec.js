import { jest } from '@jest/globals'

describe('supernatural target effect handlers', () => {
    let handleSupernaturalPostAngriff
    let applySupernaturalEffectsToTarget
    let mockResolveDamageExecutorUserId
    let mockResolveTargetActorForDamage

    beforeAll(async () => {
        mockResolveDamageExecutorUserId = jest.fn()
        mockResolveTargetActorForDamage = jest.fn()

        await jest.unstable_mockModule('../dialogs/shared-dialog-helpers.js', () => ({
            resolveDamageExecutorUserId: mockResolveDamageExecutorUserId,
            resolveTargetActorForDamage: mockResolveTargetActorForDamage,
        }))
        ;({ handleSupernaturalPostAngriff } =
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
                item: { type: 'zauber', effects: [] },
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
            effects: [
                {
                    toObject: () => ({
                        name: 'Brennend',
                        disabled: false,
                        transfer: true,
                        duration: { rounds: 2 },
                        changes: [{ key: 'system.status.brennend', value: '1', mode: 2 }],
                        flags: {
                            Ilaris: {
                                preEffect: {
                                    targetMode: 'direct',
                                    applicationType: 'persistent',
                                },
                            },
                        },
                    }),
                },
            ],
        }

        await handleSupernaturalPostAngriff(
            { success: true },
            {
                attackType: 'supernatural',
                actor: { name: 'Zauberer' },
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
                flags: {
                    Ilaris: {
                        preEffect: {
                            targetMode: 'direct',
                            applicationType: 'immediate',
                        },
                    },
                },
            },
            {
                name: 'Arealreserve',
                changes: [{ key: 'system.status.ignored', value: '1', mode: 2 }],
                flags: {
                    Ilaris: {
                        preEffect: {
                            targetMode: 'area',
                            applicationType: 'persistent',
                        },
                    },
                },
            },
        ])

        expect(targetActor.update).toHaveBeenCalledWith({ 'system.status.malus': '-4' })
        expect(targetActor.createEmbeddedDocuments).not.toHaveBeenCalled()
    })
})
