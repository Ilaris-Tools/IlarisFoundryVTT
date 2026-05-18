describe('IlarisActor energy helper', () => {
    let IlarisActor

    const createActorFixture = (data) => Object.assign(Object.create(IlarisActor.prototype), data)

    beforeAll(async () => {
        global.Actor = class Actor {
            async _preCreate() {}

            prepareData() {}

            prepareBaseData() {}

            getRollData() {
                return {}
            }
        }
        ;({ IlarisActor } = await import('../data/actor.js'))
    })

    test('returns held ASP state from legacy abgeleitete fields', () => {
        const actor = createActorFixture({
            type: 'held',
            system: {
                abgeleitete: {
                    asp: 18,
                    asp_stern: 11,
                    gasp: 2,
                    asp_zugekauft: 20,
                },
            },
        })

        const energyState = actor.getEnergyState('asp')

        expect(energyState).toEqual({
            key: 'asp',
            source: 'abgeleitete',
            current: 11,
            max: 18,
            threshold: 0,
            bound: 2,
            purchased: 20,
            currentPath: 'system.abgeleitete.asp_stern',
            maxPath: 'system.abgeleitete.asp',
            thresholdPath: null,
            boundPath: 'system.abgeleitete.gasp',
            purchasedPath: 'system.abgeleitete.asp_zugekauft',
        })
    })

    test('returns kreatur ASP state from structured energien fields', () => {
        const actor = createActorFixture({
            type: 'kreatur',
            system: {
                energien: {
                    asp: {
                        value: 7,
                        max: 10,
                        threshold: 1,
                    },
                },
            },
        })

        const energyState = actor.getEnergyState('asp')

        expect(energyState).toEqual({
            key: 'asp',
            source: 'energien',
            current: 7,
            max: 10,
            threshold: 1,
            bound: null,
            purchased: null,
            currentPath: 'system.energien.asp.value',
            maxPath: 'system.energien.asp.max',
            thresholdPath: 'system.energien.asp.threshold',
            boundPath: null,
            purchasedPath: null,
        })
    })

    test('returns null for unknown energy keys', () => {
        const actor = createActorFixture({
            type: 'held',
            system: {},
        })

        const energyState = actor.getEnergyState('lep')

        expect(energyState).toBeNull()
    })
})
