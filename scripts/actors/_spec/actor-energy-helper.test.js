describe('IlarisActor energy helper', () => {
    let IlarisActor
    let HeldActor

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
        ;({ HeldActor } = await import('../data/held.js'))
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

    test('initializes WS* from the ActiveEffect-modified WS', async () => {
        global.game = {
            settings: {
                get: jest.fn().mockReturnValue(false),
            },
        }

        const actor = Object.assign(Object.create(HeldActor.prototype), {
            system: {
                attribute: {},
                modifikatoren: {},
                abgeleitete: { ws: 8 },
            },
            _sortItems: jest.fn(),
            _calculateAbgeleitete: jest.fn(),
            _calculateWounds: jest.fn(),
            _calculateFear: jest.fn(),
            _calculateModifikatoren: jest.fn(),
            _calculateProfanFertigkeiten: jest.fn(),
            _calculateUebernaturlichFertigkeiten: jest.fn(),
            _calculateUebernaturlichTalente: jest.fn(),
            _calculateKampf: jest.fn().mockResolvedValue(undefined),
            _calculateUebernatuerlichProbendiag: jest.fn(),
        })

        await actor._initializeActor()

        expect(actor.system.abgeleitete.ws_stern).toBe(8)
        expect(actor.system.abgeleitete.ws_beine).toBe(8)
        expect(actor.system.abgeleitete.ws_kopf).toBe(8)
    })
})
