import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let IlarisZoneAdministrationDialog
let openZoneAdministration

function zoneRegion({ id = 'zone-a', name = 'Alpha-Zone', remaining = 3 } = {}) {
    return {
        id,
        name,
        flags: {
            Ilaris: {
                zone: {
                    applicationId: 'application-a',
                    spellUuid: 'Item.spell-a',
                    casterUuid: 'Actor.caster-a',
                    profile: {
                        lifecycle: 'persistent',
                        effectMode: 'triggered',
                        trigger: { onEnter: true },
                    },
                    durationType: 'sceneRounds',
                    remaining,
                    membership: ['token-a'],
                },
            },
        },
        update: jest.fn(),
        delete: jest.fn(),
        sheet: { render: jest.fn() },
    }
}

function setupDialogGlobals() {
    const region = zoneRegion()
    const scene = { name: 'Verwaltungsszene', regions: new Map([[region.id, region]]) }
    const placeable = { id: region.id, control: jest.fn() }
    global.game = { user: { isGM: true } }
    global.canvas = {
        scene,
        regions: {
            activate: jest.fn(),
            get: jest.fn().mockReturnValue(placeable),
            placeables: [placeable],
        },
    }
    global.ui = { notifications: { warn: jest.fn(), info: jest.fn() } }
    global.foundry.utils.fromUuid = jest.fn(async (uuid) => ({
        name: uuid === 'Item.spell-a' ? 'Armatrutz' : 'Magierin',
    }))
    global.foundry.utils.escapeHTML = jest.fn((value) => value)
    global.foundry.applications.api.DialogV2.confirm = jest.fn()
    global.foundry.applications.instances = new Map()
    return { placeable, region, scene }
}

beforeAll(async () => {
    ;({ IlarisZoneAdministrationDialog, openZoneAdministration } =
        await import('../zone-administration-dialog.js'))
})

beforeEach(() => {
    jest.clearAllMocks()
    setupDialogGlobals()
})

describe('IlarisZoneAdministrationDialog', () => {
    test('prepares named registry rows for the active scene', async () => {
        const dialog = new IlarisZoneAdministrationDialog()

        const context = await dialog._prepareContext()

        expect(context).toEqual(
            expect.objectContaining({
                isGM: true,
                sceneName: 'Verwaltungsszene',
                malformed: [],
            }),
        )
        expect(context.zones).toEqual([
            expect.objectContaining({
                name: 'Alpha-Zone',
                spellName: 'Armatrutz',
                casterName: 'Magierin',
                durationLabel: '3 Szenenrunden',
                triggerLabel: 'Beim Betreten',
                isSceneRounds: true,
            }),
        ])
    })

    test('selects the Region through Foundry’s Region layer and opens its native sheet', async () => {
        const { placeable, region } = setupDialogGlobals()
        const dialog = new IlarisZoneAdministrationDialog()

        await dialog.selectZone(region.id)
        await dialog.editZone(region.id)

        expect(canvas.regions.activate).toHaveBeenCalledTimes(1)
        expect(placeable.control).toHaveBeenCalledWith({ releaseOthers: true, pan: true })
        expect(region.sheet.render).toHaveBeenCalledWith({ force: true })
    })

    test('does not expose the manager to a non-GM', () => {
        game.user.isGM = false

        expect(openZoneAdministration()).toBeNull()

        expect(ui.notifications.warn).toHaveBeenCalledWith(
            'Nur die Spielleitung kann Ilaris-Zonen verwalten.',
        )
    })

    test('shows permanent Zones without a duration editor and confirms dismissal', async () => {
        const { region } = setupDialogGlobals()
        region.flags.Ilaris.zone.durationType = 'infinite'
        region.flags.Ilaris.zone.remaining = 0
        foundry.applications.api.DialogV2.confirm.mockResolvedValue(true)
        const dialog = new IlarisZoneAdministrationDialog()

        const context = await dialog._prepareContext()
        await dialog.dismissZone(region.id)

        expect(context.zones[0]).toEqual(
            expect.objectContaining({ durationLabel: 'Permanent', isSceneRounds: false }),
        )
        expect(foundry.applications.api.DialogV2.confirm).toHaveBeenCalledWith(
            expect.objectContaining({ window: { title: 'Zone aufheben' } }),
        )
        expect(region.delete).toHaveBeenCalledTimes(1)
    })
})

describe('zone-administration template', () => {
    test('keeps the required top-to-bottom action hierarchy', () => {
        const template = readFileSync(
            resolve(process.cwd(), 'scripts/combat/templates/zone-administration.hbs'),
            'utf8',
        )

        expect(template.indexOf('zone-administration-context')).toBeLessThan(
            template.indexOf('reconcileZones'),
        )
        expect(template.indexOf('reconcileZones')).toBeLessThan(
            template.indexOf('zone-administration-warning'),
        )
        expect(template.indexOf('zone-administration-warning')).toBeLessThan(
            template.indexOf('zone-administration-list'),
        )
        expect(template.indexOf('selectZone')).toBeLessThan(template.indexOf('editZone'))
        expect(template.indexOf('editZone')).toBeLessThan(template.indexOf('saveDuration'))
        expect(template.indexOf('saveDuration')).toBeLessThan(template.indexOf('dismissZone'))
    })
})
