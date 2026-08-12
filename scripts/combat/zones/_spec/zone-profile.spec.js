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
            trigger: { triggerOnCreate: true, onEnter: true },
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
})
