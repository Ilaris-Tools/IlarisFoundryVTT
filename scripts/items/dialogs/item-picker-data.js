import { ILARIS } from '../../core/config.js'

const ITEM_LABELS = {
    nahkampfwaffe: ['Nahkampfwaffe', 'Eigene Waffe erstellen'],
    fernkampfwaffe: ['Fernkampfwaffe', 'Eigene Waffe erstellen'],
    ruestung: ['Rüstung', 'Eigene Rüstung erstellen'],
    gegenstand: ['Gegenstand', 'Eigenen Gegenstand erstellen'],
    fertigkeit: ['Fertigkeit', 'Eigene Fertigkeit erstellen'],
    talent: ['Talent', 'Eigenes Talent erstellen'],
    freieFertigkeit: ['Freie Fertigkeit', 'Eigene Fertigkeit erstellen'],
    uebernatuerlicheFertigkeit: ['Übernatürliche Fertigkeit', 'Eigene Fertigkeit erstellen'],
    freiesTalent: ['Fertigkeit', 'Eigene Fertigkeit erstellen'],
    uebernatFreiesTalent: ['Übernatürliche Fertigkeit', 'Eigene Fertigkeit erstellen'],
    vorteil: ['Vorteil', 'Eigenen Vorteil erstellen'],
    eigenschaft: ['Eigenschaft', 'Eigene Eigenschaft erstellen'],
    eigenheit: ['Eigenheit', 'Eigene Eigenheit erstellen'],
    angriff: ['Angriff', 'Eigenen Angriff erstellen'],
    zauber: ['Zauber', 'Eigenen Zauber erstellen'],
    liturgie: ['Liturgie', 'Eigene Liturgie erstellen'],
    anrufung: ['Anrufung', 'Eigene Anrufung erstellen'],
    info: ['Info', 'Eigene Info erstellen'],
}

/** Capture the clicked control's category before any asynchronous work. */
export function resolvePickerContext(actorType, { itemclass, profan } = {}) {
    const creature = ['kreatur', 'nsc'].includes(actorType)
    const freeTalent = ['freiesTalent', 'uebernatFreiesTalent'].includes(itemclass)
    const category = itemclass !== 'uebernatFreiesTalent' && profan !== false && profan !== 'false'
    const [label, blankLabel] = ITEM_LABELS[itemclass] ?? ['Item', 'Eigenes Item erstellen']
    const blankType = creature && itemclass === 'vorteil' ? 'eigenschaft' : itemclass
    return {
        itemclass,
        creature,
        freeTalent,
        profan: category,
        blankType,
        title: `${label} hinzufügen`,
        blankLabel: blankType === 'eigenschaft' ? ITEM_LABELS.eigenschaft[1] : blankLabel,
        sourceTypes:
            freeTalent && creature
                ? category
                    ? ['fertigkeit', 'talent', 'freiesTalent']
                    : ['uebernatuerlicheFertigkeit', 'freiesTalent']
                : [freeTalent ? 'freiesTalent' : itemclass],
    }
}

export function matchesPickerContext(entry, context) {
    if (!context.sourceTypes.includes(entry.type)) return false
    return (
        !context.freeTalent ||
        entry.type !== 'freiesTalent' ||
        (entry.system?.profan ?? true) === context.profan
    )
}

export function createBlankItemData(context) {
    const template = ILARIS.itemTemplates[context.blankType]
    const data = {
        name: template?.name ?? 'Neues generisches Item',
        type: template?.type ?? context.blankType,
        system: foundry.utils.deepClone(template?.system ?? {}),
    }
    // These handlers formerly read event.currentTarget after the click had finished.
    if (context.freeTalent) data.system.profan = context.profan
    return data
}

export function getAccessibleItemPacks(packs, user) {
    return Array.from(packs).filter(
        (pack) =>
            pack.documentName === 'Item' &&
            pack.visible &&
            pack.testUserPermission(user, 'OBSERVER'),
    )
}

/** Foundry caches these indexes; full documents are only fetched for explicit actions. */
export async function loadPickerEntries(packs, context) {
    const results = await Promise.allSettled(
        packs.map(async (pack) => {
            const index = await pack.getIndex({ fields: ['type', 'img', 'system.profan'] })
            return Array.from(index)
                .filter((entry) => matchesPickerContext(entry, context))
                .map((entry) => ({
                    key: `${pack.collection}:${entry._id}`,
                    id: entry._id,
                    pack: pack.collection,
                    source: pack.title,
                    name: entry.name,
                    img: entry.img || 'icons/svg/item-bag.svg',
                }))
        }),
    )
    const entries = []
    const failures = []
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') entries.push(...result.value)
        else failures.push(packs[index].title)
    })
    entries.sort(
        (a, b) =>
            a.name.localeCompare(b.name, 'de') ||
            a.source.localeCompare(b.source, 'de') ||
            a.key.localeCompare(b.key),
    )
    return { entries, failures }
}

export function filterPickerEntries(entries, { search = '', pack = '' } = {}) {
    const clean = (value) => foundry.applications.ux.SearchFilter.cleanQuery(value).toLowerCase()
    const query = clean(search)
    return entries.filter(
        (entry) => (!pack || entry.pack === pack) && clean(entry.name).includes(query),
    )
}

/** Preserve source fields/effects while removing the identity of the compendium Item. */
export function preparePickerImport(document, context) {
    const data = foundry.utils.deepClone(document.toObject())
    delete data._id
    delete data.folder
    if (
        context.creature &&
        ['fertigkeit', 'talent', 'uebernatuerlicheFertigkeit'].includes(data.type)
    ) {
        data.system = { ...data.system, profan: data.type !== 'uebernatuerlicheFertigkeit' }
        data.type = 'freiesTalent'
    }
    return data
}
