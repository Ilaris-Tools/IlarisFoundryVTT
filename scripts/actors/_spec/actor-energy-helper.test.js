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

    test('applies semantic GS modifiers after native preparation without persisting actor data', () => {
        global.game.settings.get = jest.fn().mockReturnValue('ilaris')
        const nativePrepare = Actor.prototype.prepareData
        Actor.prototype.prepareData = function () {
            this.system.abgeleitete.gs = 5
        }
        const actor = createActorFixture({
            system: { abgeleitete: { gs: 0 }, attribute: { GE: { wert: 12 } } },
            allApplicableEffects: () => [
                {
                    name: 'Axxeleratus',
                    system: {
                        ilarisSource: 'uebernatuerlich',
                        ilarisModifiers: [
                            {
                                phase: 'prepare',
                                target: 'gs',
                                value: '4',
                                stacking: 'strongest-supernatural',
                            },
                            {
                                phase: 'roll',
                                target: 'ge',
                                value: '8',
                                stacking: 'strongest-supernatural',
                            },
                        ],
                    },
                },
            ],
            update: jest.fn(),
        })

        actor.prepareData()

        expect(actor.system.abgeleitete.gs).toBe(9)
        expect(actor.system.attribute.GE.wert).toBe(12)
        expect(actor.update).not.toHaveBeenCalled()
        Actor.prototype.prepareData = nativePrepare
    })

    test('applies semantic MR modifiers after native preparation without persisting actor data', () => {
        global.game.settings.get = jest.fn().mockReturnValue('ilaris')
        const nativePrepare = Actor.prototype.prepareData
        Actor.prototype.prepareData = function () {
            this.system.abgeleitete.mr = 7
        }
        const actor = createActorFixture({
            system: { abgeleitete: { gs: 4, mr: 0 } },
            allApplicableEffects: () => [
                {
                    name: 'Psychostabilis',
                    system: {
                        ilarisSource: 'uebernatuerlich',
                        ilarisModifiers: [
                            {
                                phase: 'prepare',
                                target: 'mr',
                                value: '4',
                                stacking: 'strongest-supernatural',
                            },
                        ],
                    },
                },
            ],
            update: jest.fn(),
        })

        actor.prepareData()

        expect(actor.system.abgeleitete.mr).toBe(11)
        expect(actor._ilarisPrepareModifierLedger.mr.value).toBe(4)
        expect(actor.update).not.toHaveBeenCalled()
        Actor.prototype.prepareData = nativePrepare
    })
})
