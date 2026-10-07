jest.mock('../../../dice/wuerfel.js', () => ({ wuerfelwurf: jest.fn() }))
jest.mock('../../../items/model-data/shared.js', () => ({
    createNahkampfwaffeDefaults: jest.fn(),
    createFernkampfwaffeDefaults: jest.fn(),
}))
jest.mock('../../../items/dialogs/item-picker.js', () => ({
    IlarisItemPicker: jest.fn().mockImplementation(() => ({ render: jest.fn() })),
}))
import { IlarisItemPicker } from '../../../items/dialogs/item-picker.js'
let IlarisActorSheet, KreaturSheet
beforeAll(async () => {
    foundry.applications.sheets = { ActorSheetV2: class {} }
    foundry.applications.ux = { TextEditor: { implementation: {} } }
    ;({ IlarisActorSheet } = await import('../actor.js'))
    ;({ KreaturSheet } = await import('../kreatur.js'))
})
beforeEach(() => jest.clearAllMocks())
test('item action captures target context without creating', async () => {
    const actor = { isOwner: true, createEmbeddedDocuments: jest.fn() }
    await IlarisActorSheet.onItemCreate.call(
        { actor, isEditable: true },
        {},
        {
            dataset: { itemclass: 'freiesTalent', profan: 'false' },
        },
    )
    expect(IlarisItemPicker).toHaveBeenCalledWith({
        actor,
        itemclass: 'freiesTalent',
        profan: 'false',
    })
    expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled()
})
test('ActiveEffects retain direct creation and sheet opening', async () => {
    const effect = { sheet: { render: jest.fn() } }
    const actor = { isOwner: true, createEmbeddedDocuments: jest.fn(async () => [effect]) }
    await IlarisActorSheet.onItemCreate.call(
        { actor, isEditable: true },
        {},
        { dataset: { itemclass: 'effect' } },
    )
    expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
        expect.objectContaining({ name: 'Neuer Effekt' }),
    ])
    expect(effect.sheet.render).toHaveBeenCalledWith(true)
    expect(IlarisItemPicker).not.toHaveBeenCalled()
})
test('creature advantage action opens the shared picker', () => {
    const actor = { isOwner: true }
    KreaturSheet.addVorteilInfo.call({ actor, isEditable: true }, {}, {})
    expect(IlarisItemPicker).toHaveBeenCalledWith({ actor, itemclass: 'vorteil' })
})
test('non-editable sheets do not open a picker', async () => {
    await IlarisActorSheet.onItemCreate.call(
        { actor: { isOwner: false }, isEditable: false },
        {},
        {
            dataset: { itemclass: 'nahkampfwaffe' },
        },
    )
    expect(IlarisItemPicker).not.toHaveBeenCalled()
})
