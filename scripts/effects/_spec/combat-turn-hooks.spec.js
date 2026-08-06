import { expireEffect } from '../combat-turn-hooks.js'

describe('summoned item expiry', () => {
    it('deletes the linked summoned item before deleting its owner-turn marker', async () => {
        const actor = {
            items: new Map([['summoned-item', { id: 'summoned-item' }]]),
            deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        }
        const marker = {
            flags: { ilaris: { summonedItemId: 'summoned-item' } },
            delete: jest.fn().mockResolvedValue(undefined),
        }

        await expireEffect(actor, marker)

        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('Item', ['summoned-item'])
        expect(marker.delete).toHaveBeenCalledTimes(1)
        expect(actor.deleteEmbeddedDocuments.mock.invocationCallOrder[0]).toBeLessThan(
            marker.delete.mock.invocationCallOrder[0],
        )
    })

    it('still deletes the marker when its linked item was removed beforehand', async () => {
        const actor = {
            items: new Map(),
            deleteEmbeddedDocuments: jest.fn(),
        }
        const marker = {
            flags: { ilaris: { summonedItemId: 'already-removed' } },
            delete: jest.fn().mockResolvedValue(undefined),
        }

        await expireEffect(actor, marker)

        expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled()
        expect(marker.delete).toHaveBeenCalledTimes(1)
    })
})
