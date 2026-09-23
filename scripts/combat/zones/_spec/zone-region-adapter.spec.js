import {
    createZoneRegionData,
    getCasterBoundaryPoint,
    validateZonePlacement,
} from '../zone-region-adapter.js'
import { resolveZoneTargets } from '../zone-targets.js'

describe('zone Region adapter', () => {
    beforeEach(() => {
        global.game = { user: { id: 'user', color: '#ffffff' } }
        global.CONST = { REGION_VISIBILITY: { ALWAYS: 2 } }
        global.canvas = { dimensions: { distancePixels: 100 }, grid: { size: 100 } }
    })

    test('maps Ilaris rectangle zones to a v14 Region rectangle shape', () => {
        expect(
            createZoneRegionData(
                { shape: 'rectangle', distance: 4, width: 1 },
                { x: 100, y: 200, direction: 90 },
            ),
        ).toMatchObject({
            restriction: { enabled: false },
            shapes: [{ type: 'rectangle', width: 400, height: 100, rotation: 90 }],
        })
    })

    test('measures free placement from the caster centre and includes maneuver range', () => {
        const grid = { measurePath: jest.fn(() => ({ distance: 10 })) }
        const profile = { placement: { range: 8 } }
        const token = { center: { x: 100, y: 100 } }
        expect(validateZonePlacement(profile, token, { x: 200, y: 100 }, 2, grid)).toBe(true)
        expect(validateZonePlacement(profile, token, { x: 200, y: 100 }, 1, grid)).toBe(false)
    })

    test('does not range-check a caster-anchored zone from its boundary pivot', () => {
        const grid = { measurePath: jest.fn(() => ({ distance: 1 })) }
        const profile = { placement: { anchor: 'caster', range: 0 } }
        const token = { center: { x: 100, y: 100 } }

        expect(validateZonePlacement(profile, token, { x: 151, y: 100 }, 0, grid)).toBe(true)
        expect(grid.measurePath).not.toHaveBeenCalled()
    })

    test('places a directional caster zone just outside the caster token boundary', () => {
        const token = {
            x: 10,
            y: 20,
            w: 100,
            h: 100,
            center: { x: 60, y: 70 },
            getShape: () => ({
                contains: (x, y) => x >= 0 && x <= 100 && y >= 0 && y <= 100,
            }),
        }

        expect(getCasterBoundaryPoint(token, 0).x).toBeCloseTo(111, 2)
        expect(getCasterBoundaryPoint(token, 0).y).toBeCloseTo(70, 2)
    })

    test('converts Foundry Region token documents into token-aware targets', () => {
        const targets = resolveZoneTargets({
            tokens: new Set([
                {
                    id: 'token-a',
                    name: 'A',
                    actor: { id: 'actor-a', name: 'Actor A' },
                    actorLink: false,
                },
            ]),
        })
        expect(targets).toEqual([
            {
                tokenId: 'token-a',
                actorId: 'actor-a',
                actorLink: false,
                name: 'Actor A',
                distance: 'Zone',
            },
        ])
    })
})
