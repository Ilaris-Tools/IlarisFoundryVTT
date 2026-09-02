let shouldRunModelDataNormalizationMigration
let runModelDataNormalizationMigrationIfNeeded
const TARGET_SCHEMA_VERSION = '13.3.0'
let progressNotification

function createDoc({ id, name, type, system }) {
    return {
        id,
        name,
        type,
        system,
        update: jest.fn(async function (data) {
            if (data?.type) {
                this.type = data.type
            }
            if (data?.system) {
                this.system = data.system
            }
        }),
        delete: jest.fn(async function () {}),
    }
}

function createActor({ id, name, type, system, items = [] }) {
    return {
        id,
        name,
        type,
        system,
        items,
        update: jest.fn(async function (data) {
            if (data?.system) {
                this.system = data.system
            }
        }),
        updateEmbeddedDocuments: jest.fn(async function (_embeddedType, updates) {
            for (const updateData of updates) {
                const item = this.items.find((entry) => entry.id === updateData._id)
                if (!item) continue
                if (updateData.system) {
                    item.system = updateData.system
                    continue
                }

                if (updateData.type) {
                    item.type = updateData.type
                }

                if (updateData['system.eigenschaften']) {
                    item.system.eigenschaften = updateData['system.eigenschaften']
                }
            }
        }),
        deleteEmbeddedDocuments: jest.fn(async function (_embeddedType, ids) {
            this.items = this.items.filter((item) => !ids.includes(item.id))
        }),
    }
}

function semverIsNewer(target, current) {
    const left = String(target)
        .split('.')
        .map((part) => Number(part))
    const right = String(current)
        .split('.')
        .map((part) => Number(part))

    const maxLength = Math.max(left.length, right.length)
    for (let i = 0; i < maxLength; i++) {
        const l = left[i] ?? 0
        const r = right[i] ?? 0
        if (l > r) return true
        if (l < r) return false
    }

    return false
}

describe('migrate-modeldata-normalization', () => {
    beforeEach(async () => {
        jest.resetModules()

        global.foundry.utils.isNewerVersion = jest.fn(semverIsNewer)

        progressNotification = {
            update: jest.fn(),
            remove: jest.fn(),
        }

        global.ui = {
            notifications: {
                info: jest.fn(() => progressNotification),
                error: jest.fn(),
            },
        }

        game.user = { isGM: true }
        game.settings.get = jest.fn().mockReturnValue('13.0.0')
        game.settings.set = jest.fn().mockResolvedValue(undefined)
        game.items = []
        game.actors = []
        game.packs = []

        const migrationModule = await import('../migrations/migrate-modeldata-normalization.js')
        shouldRunModelDataNormalizationMigration =
            migrationModule.shouldRunModelDataNormalizationMigration
        runModelDataNormalizationMigrationIfNeeded =
            migrationModule.runModelDataNormalizationMigrationIfNeeded
    })

    it('should run only for GM and older schema version', () => {
        game.user.isGM = true
        game.settings.get.mockReturnValue('13.0.0')
        expect(shouldRunModelDataNormalizationMigration()).toBe(true)

        game.user.isGM = false
        expect(shouldRunModelDataNormalizationMigration()).toBe(false)

        game.user.isGM = true
        game.settings.get.mockReturnValue(TARGET_SCHEMA_VERSION)
        expect(shouldRunModelDataNormalizationMigration()).toBe(false)
    })

    it('should normalize legacy world, embedded and compendium data and bump schema version', async () => {
        const worldManoever = createDoc({
            id: 'w1',
            name: 'Wuchtschlag',
            type: 'manoever',
            system: {
                voraussetzungen: 'Vorteil Test',
                modifications: {
                    1: { field: 'at', value: -4 },
                    0: { field: 'at', value: -2 },
                },
            },
        })

        const worldWaffeneigenschaft = createDoc({
            id: 'w2',
            name: 'Schwer',
            type: 'waffeneigenschaft',
            system: {
                parameterSlots: {
                    1: { name: 'Zwei' },
                    0: { name: 'Eins' },
                },
            },
        })

        const worldFreieFertigkeit = createDoc({
            id: 'w3',
            name: 'Gassenwissen',
            type: 'freieFertigkeit',
            system: {
                stufe: '3',
                gruppe: '0',
            },
        })

        const worldFreiesTalent = createDoc({
            id: 'w4',
            name: 'Freies Talent',
            type: 'freiesTalent',
            system: {
                pw: '10',
            },
        })

        const worldAngriff = createDoc({
            id: 'w5',
            name: 'Biss',
            type: 'angriff',
            system: {
                wm: 2,
            },
        })

        const worldAbgeleiteterWert = createDoc({
            id: 'w6',
            name: 'Initiative',
            type: 'abgeleiteterWert',
            system: {
                name: 'INI',
            },
        })

        const worldWaffe = createDoc({
            id: 'w7',
            name: 'Schwert',
            type: 'nahkampfwaffe',
            system: {
                rw_mod: 2,
                computed: { at: 14 },
                tp: '1W6+4',
            },
        })

        game.items = [
            worldManoever,
            worldWaffeneigenschaft,
            worldFreieFertigkeit,
            worldFreiesTalent,
            worldAngriff,
            worldAbgeleiteterWert,
            worldWaffe,
        ]

        const embeddedManoever = {
            id: 'e1',
            type: 'manoever',
            system: {
                voraussetzungen: 'Vorteil X',
                modifications: { 0: { field: 'at', value: -2 } },
            },
        }

        const worldKreatur = createActor({
            id: 'a1',
            name: 'Goblin',
            type: 'kreatur',
            system: {
                abgeleitete: { globalermoddisplay: '-' },
                kampfwerte: { ini: 7 },
                summoningDifficulty: '14',
                summoningCost: null,
                attribute: {
                    FF: { pw: 10 },
                    GE: { pw: 8 },
                },
            },
            items: [embeddedManoever],
        })

        game.actors = [worldKreatur]

        const compendiumManoever = createDoc({
            id: 'c1',
            name: 'Compendium Wuchtschlag',
            type: 'manoever',
            system: {
                voraussetzungen: 'Vorteil Y',
                modifications: { 0: { field: 'at', value: -2 } },
            },
        })

        const compendiumKreatur = createDoc({
            id: 'c2',
            name: 'Compendium Goblin',
            type: 'kreatur',
            system: {
                abgeleitete: { globalermoddisplay: '-' },
                kampfwerte: { ini: 5 },
                summoningDifficulty: 'nicht-numerisch',
                summoningCost: 8,
                attribute: {
                    MU: { pw: 4 },
                },
            },
        })

        game.packs = [
            {
                metadata: { type: 'Item' },
                collection: 'Ilaris.manover',
                locked: false,
                getDocuments: jest.fn().mockResolvedValue([compendiumManoever]),
            },
            {
                metadata: { type: 'Actor' },
                collection: 'Ilaris.kreaturen',
                locked: false,
                getDocuments: jest.fn().mockResolvedValue([compendiumKreatur]),
            },
        ]

        await runModelDataNormalizationMigrationIfNeeded()

        expect(worldManoever.update).toHaveBeenCalled()
        expect(worldManoever.system.voraussetzung).toBe('Vorteil Test')
        expect(worldManoever.system.voraussetzungen).toBeUndefined()
        expect(Array.isArray(worldManoever.system.modifications)).toBe(true)
        expect(worldManoever.system.modifications).toHaveLength(2)
        expect(worldManoever.system.modifications[0]).toEqual({ field: 'at', value: -2 })

        expect(worldWaffeneigenschaft.update).toHaveBeenCalled()
        expect(Array.isArray(worldWaffeneigenschaft.system.parameterSlots)).toBe(true)
        expect(worldWaffeneigenschaft.system.parameterSlots[0]).toEqual({ name: 'Eins' })

        expect(worldFreieFertigkeit.update).toHaveBeenCalled()
        expect(worldFreieFertigkeit.system.stufe).toBe(3)
        expect(worldFreieFertigkeit.system.gruppe).toBe(0)

        expect(worldFreiesTalent.update).toHaveBeenCalled()
        expect(worldFreiesTalent.system.pw).toBe(10)

        expect(worldAngriff.update).toHaveBeenCalled()
        expect(worldAngriff.system.wm).toBeUndefined()
        expect(worldAngriff.system.wm_at).toBe(2)

        expect(worldAbgeleiteterWert.update).toHaveBeenCalled()
        expect(worldAbgeleiteterWert.system.name).toBeUndefined()
        expect(worldAbgeleiteterWert.system.key).toBe('INI')

        expect(worldWaffe.update).toHaveBeenCalled()
        expect(worldWaffe.system.rw_mod).toBeUndefined()
        expect(worldWaffe.system.computed).toBeUndefined()
        expect(worldWaffe.system.tp).toBe('1W6+4')

        expect(worldKreatur.updateEmbeddedDocuments).toHaveBeenCalled()
        expect(embeddedManoever.system.voraussetzung).toBe('Vorteil X')
        expect(Array.isArray(embeddedManoever.system.modifications)).toBe(true)

        expect(worldKreatur.update).toHaveBeenCalled()
        expect(worldKreatur.system.displayWerte).toEqual({ globalermoddisplay: '-' })
        expect(worldKreatur.system.initiative).toBe(7)
        expect(worldKreatur.system.summoningDifficulty).toBe(14)
        expect(worldKreatur.system.summoningCost).toBe(12)
        expect(worldKreatur.system.attribute.FF.kampfPw).toBe(10)

        expect(compendiumManoever.update).toHaveBeenCalled()
        expect(compendiumManoever.system.voraussetzung).toBe('Vorteil Y')
        expect(compendiumManoever.system.voraussetzungen).toBeUndefined()

        expect(compendiumKreatur.update).toHaveBeenCalled()
        expect(compendiumKreatur.system.initiative).toBe(5)
        expect(compendiumKreatur.system.summoningDifficulty).toBe(12)
        expect(compendiumKreatur.system.summoningCost).toBe(8)
        expect(compendiumKreatur.system.attribute.MU.kampfPw).toBe(4)

        expect(game.settings.set).toHaveBeenCalledWith(
            'Ilaris',
            'worldSchemaVersion',
            TARGET_SCHEMA_VERSION,
        )
        expect(ui.notifications.info).toHaveBeenCalledWith(
            'Ilaris: ModelData-Normalisierung wird vorbereitet...',
            {
                permanent: true,
            },
        )
        expect(progressNotification.update).toHaveBeenCalled()
        expect(progressNotification.remove).toHaveBeenCalled()
        expect(ui.notifications.info).toHaveBeenCalled()
    })

    it('should rename legacy item types in world, actor embedded and compendium documents', async () => {
        const worldLegacyFreeSkill = createDoc({
            id: 'w-old-1',
            name: 'Alt Freie Fertigkeit',
            type: 'freie_fertigkeit',
            system: {
                stufe: '2',
                gruppe: '1',
            },
        })

        game.items = [worldLegacyFreeSkill]

        const worldActorEmbeddedLegacy = createDoc({
            id: 'e-old-1',
            name: 'Alt ÜF',
            type: 'uebernatuerliche_fertigkeit',
            system: {
                fw: 3,
            },
        })

        const worldActor = createActor({
            id: 'a-old-1',
            name: 'Alt Held',
            type: 'held',
            system: {},
            items: [worldActorEmbeddedLegacy],
        })

        game.actors = [worldActor]

        const compendiumLegacyEffect = createDoc({
            id: 'c-old-1',
            name: 'Alt Effekt',
            type: 'effect-item',
            system: {},
        })

        const compendiumActorEmbeddedLegacy = createDoc({
            id: 'ce-old-1',
            name: 'Alt AW',
            type: 'abgeleiteter-wert',
            system: { name: 'INI' },
        })

        const compendiumActor = createActor({
            id: 'ca-old-1',
            name: 'Alt Kompendiums-Held',
            type: 'held',
            system: {},
            items: [compendiumActorEmbeddedLegacy],
        })

        game.packs = [
            {
                metadata: { type: 'Item' },
                collection: 'Ilaris.gegenstande',
                locked: false,
                getDocuments: jest.fn().mockResolvedValue([compendiumLegacyEffect]),
            },
            {
                metadata: { type: 'Actor' },
                collection: 'Ilaris.beispiel-helden',
                locked: false,
                getDocuments: jest.fn().mockResolvedValue([compendiumActor]),
            },
        ]

        await runModelDataNormalizationMigrationIfNeeded()

        expect(worldLegacyFreeSkill.type).toBe('freieFertigkeit')
        expect(worldLegacyFreeSkill.system.stufe).toBe(2)
        expect(worldLegacyFreeSkill.system.gruppe).toBe(1)
        expect(worldLegacyFreeSkill.update).toHaveBeenCalledWith(
            {
                type: 'freieFertigkeit',
                system: {
                    stufe: '2',
                    gruppe: '1',
                },
            },
            { recursive: false },
        )

        expect(worldActorEmbeddedLegacy.update).toHaveBeenCalledWith(
            {
                type: 'uebernatuerlicheFertigkeit',
                system: {
                    fw: 3,
                },
            },
            { recursive: false },
        )
        expect(worldActorEmbeddedLegacy.type).toBe('uebernatuerlicheFertigkeit')

        expect(compendiumLegacyEffect.delete).toHaveBeenCalled()
        expect(compendiumLegacyEffect.update).not.toHaveBeenCalled()

        expect(compendiumActorEmbeddedLegacy.update).toHaveBeenCalledWith(
            {
                type: 'abgeleiteterWert',
                system: { name: 'INI' },
            },
            { recursive: false },
        )
        expect(compendiumActorEmbeddedLegacy.type).toBe('abgeleiteterWert')

        expect(game.settings.set).toHaveBeenCalledWith(
            'Ilaris',
            'worldSchemaVersion',
            TARGET_SCHEMA_VERSION,
        )
    })
})
