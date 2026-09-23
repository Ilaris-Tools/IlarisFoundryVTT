import { IlarisItemPicker } from '../item-picker.js'

let source, pack, actor, created
const deferred = () => {
    let resolve
    const promise = new Promise((done) => {
        resolve = done
    })
    return { promise, resolve }
}
const setup = async (itemclass = 'nahkampfwaffe', actorType = 'held') => {
    actor.type = actorType
    const picker = new IlarisItemPicker({ actor, itemclass })
    picker.render = jest.fn().mockResolvedValue(picker)
    await picker.loadEntries()
    picker.selectEntry('world.weapons:a')
    return picker
}
beforeEach(() => {
    foundry.applications.ux = {
        SearchFilter: { cleanQuery: (value) => value.trim().toLowerCase() },
    }
    source = {
        type: 'nahkampfwaffe',
        system: { tp: '2W6' },
        name: 'Axt',
        toObject: jest.fn(() => ({
            _id: 'a',
            name: 'Axt',
            type: source.type,
            system: source.system,
        })),
        sheet: {
            constructor: class {
                constructor(options) {
                    this.options = options
                }
                render = jest.fn()
            },
        },
    }
    pack = {
        collection: 'world.weapons',
        title: 'Waffen',
        documentName: 'Item',
        visible: true,
        testUserPermission: jest.fn(() => true),
        getIndex: jest.fn(async () => [{ _id: 'a', name: 'Axt', type: 'nahkampfwaffe' }]),
        getDocument: jest.fn(async () => source),
    }
    game.packs = {
        [Symbol.iterator]: function* () {
            yield pack
        },
        get: () => pack,
    }
    game.user = {}
    created = { sheet: { render: jest.fn() } }
    actor = { isOwner: true, type: 'held', createEmbeddedDocuments: jest.fn(async () => [created]) }
})

test('opening and filtering never retrieve full documents or create items; hidden selection clears', async () => {
    const picker = await setup()
    expect((await picker._prepareContext({})).canAdd).toBe(true)
    picker.updateFilters({ search: 'missing' })
    expect(picker.selectedKey).toBeNull()
    expect((await picker._prepareContext({})).canAdd).toBe(false)
    expect(picker.render).toHaveBeenLastCalledWith({ parts: ['results', 'footer'] })
    expect(pack.getDocument).not.toHaveBeenCalled()
    expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled()
})

test('preview is read-only and creates nothing', async () => {
    const picker = await setup()
    const preview = await picker.previewEntry('world.weapons:a')
    expect(preview.isEditable).toBe(false)
    expect(preview.options.canImport).toBe(false)
    expect(preview.render).toHaveBeenCalledWith({ force: true })
    expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled()
})

test('repeated add clicks fetch and create only once', async () => {
    const pending = deferred()
    const picker = await setup()
    pack.getDocument.mockReturnValue(pending.promise)
    const first = picker.addSelected()
    await picker.addSelected()
    pending.resolve(source)
    expect(await first).toBe(created)
    expect(pack.getDocument).toHaveBeenCalledTimes(1)
    expect(actor.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
    expect(picker.closed).toBe(true)
})

test.each(['cancel', 'close'])(
    '%s while retrieval is pending prevents later creation',
    async (action) => {
        const pending = deferred()
        const picker = await setup()
        pack.getDocument.mockReturnValue(pending.promise)
        const adding = picker.addSelected()
        await picker[action]()
        pending.resolve(source)
        await adding
        expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled()
    },
)

test.each(['pack', 'actor', 'type', 'deleted'])(
    'rechecks %s before creation and keeps error recoverable',
    async (changed) => {
        const picker = await setup()
        if (changed === 'pack') pack.testUserPermission.mockReturnValue(false)
        if (changed === 'actor') actor.isOwner = false
        if (changed === 'type') source.type = 'zauber'
        if (changed === 'deleted') pack.getDocument.mockResolvedValue(null)
        await picker.addSelected()
        expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled()
        expect(picker.closed).toBe(false)
        expect(picker.error).toBeTruthy()
        expect(picker.busy).toBe(false)
    },
)

test('rechecks ownership and pack access after asynchronous retrieval', async () => {
    const picker = await setup()
    pack.getDocument.mockImplementation(async () => {
        pack.visible = false
        actor.isOwner = false
        return source
    })
    await picker.addSelected()
    expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled()
})

test.each([new Error('failed'), null])(
    'failed or empty creation can be retried',
    async (failure) => {
        const picker = await setup()
        if (failure) actor.createEmbeddedDocuments.mockRejectedValueOnce(failure)
        else actor.createEmbeddedDocuments.mockResolvedValueOnce([])
        await picker.addSelected()
        expect(picker.error).toBeTruthy()
        expect(picker.closed).toBe(false)
        expect(await picker.addSelected()).toBe(created)
        expect(picker.closed).toBe(true)
    },
)

test('blank action works during failed discovery, uses defaults and opens the created sheet', async () => {
    pack.getIndex.mockRejectedValue(new Error('offline'))
    const picker = await setup('freieFertigkeit')
    await picker.createBlank()
    expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [
        {
            name: 'freie Fertigkeit',
            type: 'freieFertigkeit',
            system: { stufe: 1, gruppe: 4 },
        },
    ])
    expect(created.sheet.render).toHaveBeenCalledWith(true)
    expect(pack.getDocument).not.toHaveBeenCalled()
})

test('creature source conversion creates only one free talent', async () => {
    source.type = 'fertigkeit'
    pack.getIndex.mockResolvedValue([{ _id: 'a', name: 'Fertigkeit', type: 'fertigkeit' }])
    const picker = await setup('freiesTalent', 'kreatur')
    await picker.addSelected()
    expect(actor.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
    expect(actor.createEmbeddedDocuments.mock.calls[0][1]).toEqual([
        expect.objectContaining({
            type: 'freiesTalent',
            system: expect.objectContaining({ profan: true }),
        }),
    ])
})

test('each picker owns its native radio group without submitting creation', () => {
    expect(IlarisItemPicker.DEFAULT_OPTIONS.tag).toBe('form')
    expect(IlarisItemPicker.DEFAULT_OPTIONS.form.closeOnSubmit).toBe(false)
})

test('blank double-click and competing import cannot duplicate creation', async () => {
    const pending = deferred()
    const picker = await setup()
    actor.createEmbeddedDocuments.mockReturnValue(pending.promise)
    const first = picker.createBlank()
    await picker.createBlank()
    await picker.addSelected()
    pending.resolve([created])
    await first
    expect(actor.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
    expect(pack.getDocument).not.toHaveBeenCalled()
})

test('late index completion cannot rerender a closed picker', async () => {
    const picker = await setup()
    const pending = deferred()
    pack.getIndex.mockReturnValue(pending.promise)
    const loading = picker.loadEntries()
    await Promise.resolve()
    await picker.close()
    picker.render.mockClear()
    pending.resolve([])
    await loading
    expect(picker.render).not.toHaveBeenCalled()
    expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled()
})

test('preview skips custom editing listeners and blocks mutating action/form dispatch', async () => {
    const customRender = jest.fn()
    const nativeRender = jest.fn()
    foundry.applications.api.DocumentSheetV2 = class {
        _onRender = nativeRender
    }
    foundry.applications.api.DocumentSheetV2.prototype._onRender = nativeRender
    source.sheet.constructor.prototype._onRender = customRender
    const picker = await setup()
    const preview = await picker.previewEntry('world.weapons:a')
    const deleteControl = { dataset: { action: 'deleteItem' }, tagName: 'A', hidden: false }
    preview.element = { querySelectorAll: () => [deleteControl] }
    preview._onRender({}, {})
    expect(nativeRender).toHaveBeenCalled()
    expect(customRender).not.toHaveBeenCalled()
    expect(deleteControl.hidden).toBe(true)
    const event = { preventDefault: jest.fn() }
    preview._onClickAction(event, deleteControl)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(preview._onSubmitForm()).toBeUndefined()
    expect(preview._onChangeForm()).toBeUndefined()
})
