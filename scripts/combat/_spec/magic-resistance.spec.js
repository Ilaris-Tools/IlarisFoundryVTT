import {
    acceptMagicResistanceResult,
    createMagicResistanceChallenge,
    getActorMagicResistance,
    resolveMagicResistanceTarget,
} from '../magic-resistance.js'
import { resolveDamageExecutorUserId } from '../dialogs/shared-dialog-helpers.js'

describe('target Magieresistenz challenge', () => {
    test('accepts exactly one Actor target and snapshots its derived MR', () => {
        const actor = {
            id: 'target',
            uuid: 'Actor.target',
            type: 'held',
            system: { abgeleitete: { mr: 7 } },
        }
        const target = resolveMagicResistanceTarget([{ actorId: 'target', tokenId: 'token' }], {
            resolveActor: (selected) => (selected.actorId === 'target' ? actor : null),
        })

        expect(target).toMatchObject({ actor, magicResistance: 7 })
        expect(
            createMagicResistanceChallenge({
                dialogId: 'dialog',
                target,
                executorUserId: 'owner',
                requestId: 'request',
            }),
        ).toMatchObject({
            id: 'request',
            dialogId: 'dialog',
            targetActorUuid: 'Actor.target',
            targetActorId: 'target',
            magicResistance: 7,
            executorUserId: 'owner',
            d20: null,
            difficulty: null,
        })
    })

    test('rejects missing, multiple, and non-Actor targets', () => {
        const resolveActor = () => null
        expect(resolveMagicResistanceTarget([], { resolveActor })).toBeNull()
        expect(
            resolveMagicResistanceTarget([{ actorId: 'one' }, { actorId: 'two' }], {
                resolveActor,
            }),
        ).toBeNull()
        expect(resolveMagicResistanceTarget([{ actorId: 'one' }], { resolveActor })).toBeNull()
    })

    test('uses a creature MR and accepts only one current D20 result', () => {
        expect(
            getActorMagicResistance({ type: 'kreatur', system: { kampfwerte: { mr: 11 } } }),
        ).toBe(11)
        const challenge = {
            id: 'request',
            dialogId: 'dialog',
            targetActorUuid: 'Actor.target',
            targetActorId: 'target',
            magicResistance: 11,
            d20: null,
            difficulty: null,
        }
        const result = acceptMagicResistanceResult(challenge, {
            requestId: 'request',
            dialogId: 'dialog',
            targetActorUuid: 'Actor.target',
            d20: 16,
        })
        expect(result).toMatchObject({ d20: 16, difficulty: 27 })
        expect(acceptMagicResistanceResult(result, { requestId: 'request', d20: 5 })).toBeNull()
        expect(acceptMagicResistanceResult(challenge, { requestId: 'stale', d20: 5 })).toBeNull()
    })

    test('uses the active target owner before the deterministic GM fallback', () => {
        global.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } }
        const owner = { id: 'player-owner', active: true, isGM: false }
        const gm = { id: 'gm-user', active: true, isGM: true }
        global.game = { users: [gm, owner], user: gm }
        const actor = {
            testUserPermission: (user) => user.id === owner.id,
            canUserModify: () => false,
        }

        expect(resolveDamageExecutorUserId(actor)).toBe(owner.id)
        actor.testUserPermission = () => false
        expect(resolveDamageExecutorUserId(actor)).toBe(gm.id)
    })
})
