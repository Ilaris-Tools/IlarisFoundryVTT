import {
    dismissZone,
    getZoneAdministrationRegistry,
    isValidPersistentIlarisZone,
    updateZoneRemaining,
} from '../zone-administration.js'

function region(id, name, zone) {
    return {
        id,
        name,
        flags: zone === undefined ? {} : { Ilaris: { zone } },
        update: jest.fn(),
        delete: jest.fn(),
    }
}

function persistentZone(overrides = {}) {
    return {
        applicationId: 'cast-a',
        spellUuid: 'Item.spell',
        casterUuid: 'Actor.caster',
        profile: {
            lifecycle: 'persistent',
            effectMode: 'triggered',
            trigger: { onEnter: true },
        },
        durationType: 'sceneRounds',
        remaining: 3,
        membership: ['token-a'],
        ...overrides,
    }
}

describe('zone administration registry', () => {
    beforeEach(() => {
        global.game = { user: { isGM: true } }
    })

    test('lists only valid persistent Ilaris Zones in stable name order', () => {
        const alpha = region('alpha', 'Alpha', persistentZone())
        const beta = region('beta', 'Beta', persistentZone({ remaining: 6 }))
        const core = region('core', 'Core Region')
        const registry = getZoneAdministrationRegistry({ regions: [beta, core, alpha] })

        expect(registry.zones.map((entry) => entry.id)).toEqual(['alpha', 'beta'])
        expect(registry.zones[0]).toMatchObject({
            durationType: 'sceneRounds',
            remaining: 3,
            membershipCount: 1,
            triggerLabel: 'Beim Betreten',
        })
        expect(registry.malformed).toEqual([])
    })

    test('keeps malformed Ilaris metadata inert and excludes ordinary core Regions', () => {
        const malformed = region('broken', 'Kaputte Zone', { profile: { lifecycle: 'persistent' } })
        const core = region('core', 'Normale Region')
        const registry = getZoneAdministrationRegistry({ regions: [malformed, core] })

        expect(registry.zones).toEqual([])
        expect(registry.malformed).toEqual([
            expect.objectContaining({ id: 'broken', name: 'Kaputte Zone' }),
        ])
        expect(isValidPersistentIlarisZone(malformed)).toBe(false)
        expect(isValidPersistentIlarisZone(core)).toBe(false)
    })

    test('updates only a positive integer scene-round duration on a current valid Region', async () => {
        const target = region('target', 'Zielzone', persistentZone())
        const scene = { regions: new Map([[target.id, target]]) }

        await expect(updateZoneRemaining(scene, target.id, '6')).resolves.toBe(target)
        expect(target.update).toHaveBeenCalledWith({ 'flags.Ilaris.zone.remaining': 6 })
        await expect(updateZoneRemaining(scene, target.id, '0')).rejects.toThrow(
            'mindestens eine Szenenrunde',
        )
        await expect(updateZoneRemaining(scene, target.id, '2.5')).rejects.toThrow('ganze Zahl')
    })

    test('updates only the selected Zone when another fixture Zone exists', async () => {
        const target = region('target', 'Zielzone', persistentZone())
        const comparison = region('comparison', 'Vergleichszone', persistentZone({ remaining: 4 }))
        const scene = {
            regions: new Map([
                [target.id, target],
                [comparison.id, comparison],
            ]),
        }

        await updateZoneRemaining(scene, target.id, 6)

        expect(target.update).toHaveBeenCalledWith({ 'flags.Ilaris.zone.remaining': 6 })
        expect(comparison.update).not.toHaveBeenCalled()
    })

    test('rejects permanent, stale, and malformed Region duration mutations', async () => {
        const permanent = region(
            'permanent',
            'Permanente Zone',
            persistentZone({ durationType: 'infinite', remaining: 0 }),
        )
        const malformed = region('broken', 'Kaputte Zone', { profile: { lifecycle: 'persistent' } })
        const scene = {
            regions: new Map([
                [permanent.id, permanent],
                [malformed.id, malformed],
            ]),
        }

        await expect(updateZoneRemaining(scene, permanent.id, 4)).rejects.toThrow('permanent')
        await expect(updateZoneRemaining(scene, malformed.id, 4)).rejects.toThrow('keine gültige')
        await expect(updateZoneRemaining(scene, 'deleted', 4)).rejects.toThrow('nicht mehr')
    })

    test('dismisses only the current Region through its document lifecycle', async () => {
        const target = region('target', 'Zielzone', persistentZone())
        const comparison = region('comparison', 'Andere Zone', persistentZone())
        const scene = {
            regions: new Map([
                [target.id, target],
                [comparison.id, comparison],
            ]),
        }

        await expect(dismissZone(scene, target.id)).resolves.toBe(target)

        expect(target.delete).toHaveBeenCalledTimes(1)
        expect(comparison.delete).not.toHaveBeenCalled()
    })
})
