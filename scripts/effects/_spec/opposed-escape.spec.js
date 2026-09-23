import {
    getOpposedEscapeAttributeOptions,
    resolveOpposedEscapeCounterCheck,
    sendOpposedEscapeCounterPrompt,
} from '../opposed-escape.js'

function createEffect(overrides = {}) {
    return {
        id: 'hold',
        name: 'Umklammern',
        system: { ilarisEnding: { type: 'opposedEscape', sourceActorUuid: 'Actor.source' } },
        flags: {
            ilaris: {
                opposedEscapeAttempt: {
                    nonce: 'single-use',
                    state: 'pending',
                    sourceActorUuid: 'Actor.source',
                },
            },
        },
        update: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    }
}

describe('opposed escape resolution', () => {
    let target
    let effect

    beforeEach(() => {
        global.CONFIG = { ILARIS: { label: {} } }
        global.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } }
        effect = createEffect()
        target = {
            uuid: 'Actor.target',
            effects: new Map([[effect.id, effect]]),
            deleteEmbeddedDocuments: jest.fn().mockResolvedValue(undefined),
        }
        foundry.utils.fromUuid = jest.fn(async (uuid) =>
            uuid === 'Actor.target' ? target : { uuid: 'Actor.source' },
        )
    })

    it('deletes exactly the linked ActiveEffect when the escape roll wins', async () => {
        await resolveOpposedEscapeCounterCheck(
            {
                nonce: 'single-use',
                effectId: 'hold',
                targetActorUuid: 'Actor.target',
                sourceActorUuid: 'Actor.source',
                escapeRoll: { roll: { total: 19 } },
            },
            { roll: { total: 17 } },
        )

        expect(target.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['hold'])
        expect(effect.update).not.toHaveBeenCalled()
    })

    it('rejects stale nonces without deleting an effect', async () => {
        await resolveOpposedEscapeCounterCheck(
            {
                nonce: 'stale',
                effectId: 'hold',
                targetActorUuid: 'Actor.target',
                sourceActorUuid: 'Actor.source',
                escapeRoll: { roll: { total: 20 } },
            },
            { roll: { total: 1 } },
        )

        expect(target.deleteEmbeddedDocuments).not.toHaveBeenCalled()
        expect(effect.update).not.toHaveBeenCalled()
    })

    it('keeps the linked effect after a failed escape', async () => {
        await resolveOpposedEscapeCounterCheck(
            {
                nonce: 'single-use',
                effectId: 'hold',
                targetActorUuid: 'Actor.target',
                sourceActorUuid: 'Actor.source',
                escapeRoll: { roll: { total: 12 } },
            },
            { roll: { total: 12 } },
        )

        expect(target.deleteEmbeddedDocuments).not.toHaveBeenCalled()
        expect(effect.update).toHaveBeenCalledWith({
            'flags.ilaris.opposedEscapeAttempt.state': 'resolved',
        })
    })

    it('offers GE and KK using their current PW values', () => {
        expect(
            getOpposedEscapeAttributeOptions({
                system: { attribute: { GE: { pw: 13 }, KK: { pw: 15 } } },
            }),
        ).toEqual([
            { key: 'GE', label: 'GE', pw: 13 },
            { key: 'KK', label: 'KK', pw: 15 },
        ])
    })

    it('routes a counter prompt to an active GM when the source has no active owner', async () => {
        const source = { uuid: 'Actor.source', testUserPermission: jest.fn(() => false) }
        game.users = [{ id: 'gm', active: true, isGM: true }]
        ChatMessage.create = jest.fn().mockResolvedValue(undefined)
        ChatMessage.getSpeaker = jest.fn(() => ({}))
        foundry.utils.fromUuid = jest.fn(async (uuid) =>
            uuid === 'Actor.target' ? target : source,
        )

        await sendOpposedEscapeCounterPrompt(
            {
                nonce: 'single-use',
                effectId: 'hold',
                effectName: 'Umklammern',
                targetActorUuid: 'Actor.target',
                sourceActorUuid: 'Actor.source',
            },
            { roll: { total: 14 } },
        )

        expect(ChatMessage.create).toHaveBeenCalledWith(
            expect.objectContaining({ whisper: ['gm'] }),
        )
    })
})
