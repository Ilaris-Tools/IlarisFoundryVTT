import { normalizeZoneProfile, resolveZoneProfile } from '../zone-profile.js'

describe('zone profiles', () => {
    it('normalizes persistent profiles with scene-round timing and creation triggers', () => {
        expect(
            normalizeZoneProfile({
                shape: 'rectangle',
                distance: 4,
                width: 1,
                placement: { anchor: 'free', range: 8, pivot: 'topLeft' },
                lifecycle: 'persistent',
                duration: { remaining: 256 },
                trigger: { onEnter: true },
            }),
        ).toMatchObject({
            shape: 'rectangle',
            placement: { anchor: 'free', range: 8, pivot: 'topLeft' },
            duration: { type: 'sceneRounds', remaining: 256, originalValue: 256 },
            trigger: {
                triggerOnCreate: true,
                onEnter: true,
                onTurnStart: false,
                onRoundStart: false,
                onTraverse: false,
            },
        })
    })

    it('lets a spell modification replace base zone geometry', () => {
        expect(
            resolveZoneProfile(
                { shape: 'cone', distance: 8, angle: 45, placement: { anchor: 'caster' } },
                { shape: 'circle', distance: 8, placement: { anchor: 'caster', pivot: 'center' } },
            ),
        ).toMatchObject({ shape: 'circle', placement: { anchor: 'caster', pivot: 'center' } })
    })

    it('excludes the caster from automatic targets unless the zone explicitly includes them', () => {
        expect(normalizeZoneProfile({ shape: 'circle', distance: 4 })).toMatchObject({
            targeting: { includeCaster: false },
        })
        expect(
            normalizeZoneProfile({
                shape: 'circle',
                distance: 4,
                targeting: { includeCaster: true },
            }),
        ).toMatchObject({ targeting: { includeCaster: true } })
    })

    it('defaults to triggered effects and accepts passive effects only for persistent Zones', () => {
        expect(normalizeZoneProfile({ shape: 'circle', distance: 4 })).toMatchObject({
            effectMode: 'triggered',
        })
        expect(
            normalizeZoneProfile({
                shape: 'circle',
                distance: 4,
                lifecycle: 'persistent',
                duration: { remaining: 4 },
                effectMode: 'passive',
            }),
        ).toMatchObject({ effectMode: 'passive' })
        expect(
            normalizeZoneProfile({ shape: 'circle', distance: 4, effectMode: 'passive' }),
        ).toBeNull()
    })

    it('keeps combat triggers opt-in and independent from other Zone triggers', () => {
        expect(
            normalizeZoneProfile({
                shape: 'circle',
                distance: 4,
                lifecycle: 'persistent',
                duration: { remaining: 4 },
            }),
        ).toMatchObject({
            trigger: {
                triggerOnCreate: true,
                onEnter: false,
                onTurnStart: false,
                onRoundStart: false,
                onTraverse: false,
            },
        })
        expect(
            normalizeZoneProfile({
                shape: 'circle',
                distance: 4,
                lifecycle: 'persistent',
                duration: { remaining: 4 },
                trigger: {
                    triggerOnCreate: true,
                    onEnter: true,
                    onTurnStart: true,
                    onRoundStart: true,
                    onTraverse: false,
                },
            }),
        ).toMatchObject({
            trigger: {
                triggerOnCreate: true,
                onEnter: true,
                onTurnStart: true,
                onRoundStart: true,
                onTraverse: false,
            },
        })
    })

    it('accepts traversal only for persistent triggered rectangle Zones', () => {
        const traversal = {
            avoidTest: { attribut: 'GE', resistDifficulty: 16 },
            failureMarker: { name: 'Durchquerung fehlgeschlagen' },
        }
        expect(
            normalizeZoneProfile({
                shape: 'rectangle',
                distance: 4,
                width: 1,
                lifecycle: 'persistent',
                duration: { remaining: 4 },
                trigger: { triggerOnCreate: false, onTraverse: true },
                traversal,
            }),
        ).toMatchObject({
            trigger: { onTraverse: true, onEnter: false },
            traversal,
        })
        expect(
            normalizeZoneProfile({
                shape: 'circle',
                distance: 4,
                lifecycle: 'persistent',
                duration: { remaining: 4 },
                trigger: { triggerOnCreate: false, onTraverse: true },
                traversal,
            }),
        ).toBeNull()
        expect(
            normalizeZoneProfile({
                shape: 'rectangle',
                distance: 4,
                width: 1,
                lifecycle: 'persistent',
                duration: { remaining: 4 },
                trigger: { triggerOnCreate: false, onTraverse: true, onEnter: true },
                traversal,
            }),
        ).toBeNull()
    })
})
