import { ILARIS } from '../../../core/config.js'
import {
    resolvePickerContext,
    matchesPickerContext,
    getAccessibleItemPacks,
    loadPickerEntries,
    filterPickerEntries,
    preparePickerImport,
    createBlankItemData,
} from '../item-picker-data.js'

const context = (type = 'nahkampfwaffe', actorType = 'held', extra = {}) =>
    resolvePickerContext(actorType, { itemclass: type, ...extra })
const pack = (collection, entries = [], overrides = {}) => ({
    collection,
    title: collection,
    documentName: 'Item',
    visible: true,
    testUserPermission: jest.fn(() => true),
    getIndex: jest.fn(async () => entries),
    getDocument: jest.fn(),
    ...overrides,
})

beforeAll(() => {
    foundry.applications.ux = {
        SearchFilter: {
            cleanQuery: (value) =>
                value
                    .trim()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase(),
        },
    }
})

test('excludes non-Item, invisible and unreadable packs before querying', async () => {
    const available = pack('world.weapons', [{ _id: 'a', name: 'Axt', type: 'nahkampfwaffe' }])
    const hidden = pack('world.hidden', [], { visible: false })
    const denied = pack('world.denied', [], { testUserPermission: () => false })
    const actors = pack('world.actors', [], { documentName: 'Actor' })
    const packs = getAccessibleItemPacks([available, hidden, denied, actors], {})
    expect(packs).toEqual([available])
    await loadPickerEntries(packs, context())
    for (const excluded of [hidden, denied, actors])
        expect(excluded.getIndex).not.toHaveBeenCalled()
    expect(available.getDocument).not.toHaveBeenCalled()
    expect(available.getIndex).toHaveBeenCalledWith({ fields: ['type', 'img', 'system.profan'] })
})

test('keeps duplicates from different packs and retains results after an index failure', async () => {
    const entry = { _id: 'same', name: 'Säbel', type: 'nahkampfwaffe' }
    const failed = pack('module.failed', [], {
        getIndex: jest.fn().mockRejectedValue(new Error('offline')),
    })
    const result = await loadPickerEntries(
        [pack('world.a', [entry]), pack('Ilaris.b', [entry]), failed],
        context(),
    )
    expect(result.entries.map((row) => row.key).sort()).toEqual(['Ilaris.b:same', 'world.a:same'])
    expect(result.failures).toEqual(['module.failed'])
    expect(filterPickerEntries(result.entries, { search: ' SÄB ', pack: 'world.a' })).toHaveLength(
        1,
    )
    expect(filterPickerEntries(result.entries, { search: '[', pack: '' })).toEqual([])
})

test.each([
    ['freiesTalent', undefined, true, ['fertigkeit', 'talent']],
    ['freiesTalent', 'false', false, ['uebernatuerlicheFertigkeit']],
    ['uebernatFreiesTalent', undefined, false, ['uebernatuerlicheFertigkeit']],
])(
    'resolves creature category %s/%s without stale event data',
    (itemclass, profan, expected, types) => {
        const resolved = context(itemclass, 'kreatur', { profan })
        expect(createBlankItemData(resolved).system.profan).toBe(expected)
        for (const type of types) expect(matchesPickerContext({ type }, resolved)).toBe(true)
        expect(
            matchesPickerContext({ type: 'freiesTalent', system: { profan: expected } }, resolved),
        ).toBe(true)
        expect(
            matchesPickerContext({ type: 'freiesTalent', system: { profan: !expected } }, resolved),
        ).toBe(false)
        expect(matchesPickerContext({ type: 'nahkampfwaffe' }, resolved)).toBe(false)
    },
)

test('ordinary contexts exclude different types', () => {
    expect(matchesPickerContext({ type: 'fernkampfwaffe' }, context())).toBe(false)
    expect(matchesPickerContext({ type: 'nahkampfwaffe' }, context())).toBe(true)
})

test('blank defaults remain independent and creature advantages explicitly create Eigenschaften', () => {
    const blank = createBlankItemData(context('freieFertigkeit'))
    expect(blank).toEqual({
        name: 'freie Fertigkeit',
        type: 'freieFertigkeit',
        system: { stufe: 1, gruppe: 4 },
    })
    blank.system.stufe = 3
    expect(ILARIS.itemTemplates.freieFertigkeit.system.stufe).toBe(1)
    expect(createBlankItemData(context('vorteil', 'kreatur')).type).toBe('eigenschaft')
})

test.each([
    ['nahkampfwaffe', 'held', 'nahkampfwaffe', undefined],
    ['fertigkeit', 'kreatur', 'freiesTalent', true],
    ['talent', 'kreatur', 'freiesTalent', true],
    ['uebernatuerlicheFertigkeit', 'kreatur', 'freiesTalent', false],
])('preserves complete %s source when importing to %s', (type, actorType, targetType, profan) => {
    const source = {
        _id: 'source',
        folder: 'folder',
        name: 'Quelle',
        type,
        img: 'icon.webp',
        system: { text: '<p>Text</p>', pw: '8', custom: 7 },
        flags: { module: { enabled: true } },
        effects: [{ _id: 'effect', changes: [{ key: 'x', value: '2' }] }],
    }
    const before = JSON.stringify(source)
    const data = preparePickerImport({ toObject: () => source }, context(type, actorType))
    expect(data).toEqual({
        name: 'Quelle',
        type: targetType,
        img: 'icon.webp',
        system: profan === undefined ? source.system : { ...source.system, profan },
        flags: source.flags,
        effects: source.effects,
    })
    data.flags.module.enabled = false
    expect(JSON.stringify(source)).toBe(before)
})
