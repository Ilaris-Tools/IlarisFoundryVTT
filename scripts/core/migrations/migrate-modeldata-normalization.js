const isNewerVersion = foundry.utils.isNewerVersion

const TARGET_SCHEMA_VERSION = '13.2.0'

function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
}

function hasOnlyNumericKeys(obj) {
    return Object.keys(obj).every((key) => /^\d+$/.test(key))
}

function normalizeIndexedObjectToArray(value) {
    if (!isObject(value)) return value
    if (!hasOnlyNumericKeys(value)) return value

    return Object.entries(value)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map((entry) => entry[1])
}

function normalizeFreieFertigkeitNumericFields(system) {
    if (!system || typeof system !== 'object') return false

    let changed = false

    if (typeof system.stufe === 'string') {
        const parsed = Number(system.stufe)
        if (!Number.isNaN(parsed)) {
            system.stufe = parsed
            changed = true
        }
    }

    if (typeof system.gruppe === 'string') {
        const parsed = Number(system.gruppe)
        if (!Number.isNaN(parsed)) {
            system.gruppe = parsed
            changed = true
        }
    }

    return changed
}

function normalizeFreiesTalentPw(system) {
    if (!system || typeof system !== 'object') return false

    if (typeof system.pw !== 'string') return false

    const trimmed = system.pw.trim()
    if (trimmed === '') return false

    const parsed = Number(trimmed)
    if (Number.isNaN(parsed)) return false

    system.pw = parsed
    return true
}

function normalizeManoeverModifications(system) {
    if (!system || typeof system !== 'object') return false

    const normalized = normalizeIndexedObjectToArray(system.modifications)
    if (normalized !== system.modifications) {
        system.modifications = normalized
        return true
    }

    return false
}

function normalizeManoeverPrerequisite(system) {
    if (!system || typeof system !== 'object') return false

    if (!system.voraussetzung && system.voraussetzungen) {
        system.voraussetzung = system.voraussetzungen
        delete system.voraussetzungen
        return true
    }

    if (system.voraussetzungen) {
        delete system.voraussetzungen
        return true
    }

    return false
}

function normalizeWaffeneigenschaftParameterSlots(system) {
    if (!system || typeof system !== 'object') return false

    const normalized = normalizeIndexedObjectToArray(system.parameterSlots)
    if (normalized !== system.parameterSlots) {
        system.parameterSlots = normalized
        return true
    }

    return false
}

function normalizeWaffeRuntimeFields(system) {
    if (!system || typeof system !== 'object') return false

    let changed = false

    if (Object.hasOwn(system, 'rw_mod')) {
        delete system.rw_mod
        changed = true
    }

    if (Object.hasOwn(system, 'computed')) {
        delete system.computed
        changed = true
    }

    return changed
}

function normalizeAngriffWmAlias(system) {
    if (!system || typeof system !== 'object') return false

    let changed = false
    if (system.wm_at === undefined && typeof system.wm === 'number') {
        system.wm_at = system.wm
        changed = true
    }

    if (Object.hasOwn(system, 'wm')) {
        delete system.wm
        changed = true
    }

    return changed
}

function normalizeAbgeleiteterWertKey(system, itemName) {
    if (!system || typeof system !== 'object') return false

    if (system.key) {
        if (Object.hasOwn(system, 'name')) {
            delete system.name
            return true
        }
        return false
    }

    if (system.name) {
        system.key = system.name
        delete system.name
        return true
    }

    if (itemName) {
        system.key = itemName
        return true
    }

    return false
}

function normalizeItemData(itemData) {
    const type = itemData?.type
    const itemName = itemData?.name
    const system = foundry.utils.deepClone(itemData?.system || {})

    let changed = false

    if (type === 'manoever') {
        changed = normalizeManoeverModifications(system) || changed
        changed = normalizeManoeverPrerequisite(system) || changed
    }

    if (type === 'waffeneigenschaft') {
        changed = normalizeWaffeneigenschaftParameterSlots(system) || changed
    }

    if (type === 'freie_fertigkeit') {
        changed = normalizeFreieFertigkeitNumericFields(system) || changed
    }

    if (type === 'freiestalent') {
        changed = normalizeFreiesTalentPw(system) || changed
    }

    if (type === 'nahkampfwaffe' || type === 'fernkampfwaffe') {
        changed = normalizeWaffeRuntimeFields(system) || changed
    }

    if (type === 'angriff') {
        changed = normalizeAngriffWmAlias(system) || changed
    }

    if (type === 'abgeleiteter-wert') {
        changed = normalizeAbgeleiteterWertKey(system, itemName) || changed
    }

    return { changed, system }
}

function normalizeKreaturData(system) {
    if (!system || typeof system !== 'object') return false

    let changed = false

    if (system.abgeleitete && !system.displayWerte) {
        system.displayWerte = foundry.utils.deepClone(system.abgeleitete)
        changed = true
    }

    if (system.kampfwerte && typeof system.kampfwerte.ini === 'number') {
        const normalizedIni = Number(system.kampfwerte.ini)
        if (system.initiative !== normalizedIni) {
            system.initiative = normalizedIni
            changed = true
        }
    }

    if (system.attribute && typeof system.attribute === 'object') {
        for (const [attr, values] of Object.entries(system.attribute)) {
            if (!values || typeof values !== 'object') continue
            if (values.kampfPw !== undefined) continue
            if (typeof values.pw !== 'number') continue

            system.attribute[attr].kampfPw = values.pw
            changed = true
        }
    }

    return changed
}

function normalizeActorData(actorData) {
    const type = actorData?.type
    const system = foundry.utils.deepClone(actorData?.system || {})

    let changed = false

    if (type === 'kreatur') {
        changed = normalizeKreaturData(system) || changed
    }

    return { changed, system }
}

async function migrateWorldItems() {
    let migrated = 0
    let skipped = 0
    let errors = 0

    const candidateTypes = new Set([
        'manoever',
        'waffeneigenschaft',
        'freie_fertigkeit',
        'freiestalent',
        'angriff',
        'abgeleiteter-wert',
        'nahkampfwaffe',
        'fernkampfwaffe',
    ])
    const items = game.items.filter((item) => candidateTypes.has(item.type))

    for (const item of items) {
        try {
            const { changed, system } = normalizeItemData(item)
            if (!changed) {
                skipped++
                continue
            }

            await item.update({ system })
            migrated++
        } catch (error) {
            errors++
            console.error(
                `Ilaris | ModelData normalization failed for world item ${item.name}:`,
                error,
            )
        }
    }

    return { migrated, skipped, errors }
}

async function migrateActorEmbeddedItems() {
    let migrated = 0
    let skipped = 0
    let errors = 0

    const candidateTypes = new Set([
        'manoever',
        'waffeneigenschaft',
        'freie_fertigkeit',
        'freiestalent',
        'angriff',
        'abgeleiteter-wert',
        'nahkampfwaffe',
        'fernkampfwaffe',
    ])

    for (const actor of game.actors) {
        const updates = []

        for (const item of actor.items) {
            if (!candidateTypes.has(item.type)) continue

            try {
                const { changed, system } = normalizeItemData(item)
                if (!changed) {
                    skipped++
                    continue
                }

                updates.push({
                    _id: item.id,
                    system,
                })
            } catch (error) {
                errors++
                console.error(
                    `Ilaris | ModelData normalization failed for embedded item ${item.name} on actor ${actor.name}:`,
                    error,
                )
            }
        }

        if (updates.length > 0) {
            try {
                await actor.updateEmbeddedDocuments('Item', updates)
                migrated += updates.length
            } catch (error) {
                errors += updates.length
                console.error(
                    `Ilaris | ModelData normalization failed while updating embedded items on actor ${actor.name}:`,
                    error,
                )
            }
        }
    }

    return { migrated, skipped, errors }
}

async function migrateCompendiumItems() {
    let migrated = 0
    let skipped = 0
    let errors = 0

    const candidateTypes = new Set([
        'manoever',
        'waffeneigenschaft',
        'freie_fertigkeit',
        'freiestalent',
        'angriff',
        'abgeleiteter-wert',
        'nahkampfwaffe',
        'fernkampfwaffe',
    ])
    const packs = game.packs.filter(
        (pack) => pack.metadata.type === 'Item' && pack.collection?.startsWith('Ilaris.'),
    )

    for (const pack of packs) {
        if (pack.locked) {
            continue
        }

        let documents = []
        try {
            documents = await pack.getDocuments()
        } catch (error) {
            errors++
            console.error(
                `Ilaris | ModelData normalization failed to read pack ${pack.collection}:`,
                error,
            )
            continue
        }

        for (const doc of documents) {
            if (!candidateTypes.has(doc.type)) continue

            try {
                const { changed, system } = normalizeItemData(doc)
                if (!changed) {
                    skipped++
                    continue
                }

                await doc.update({ system })
                migrated++
            } catch (error) {
                errors++
                console.error(
                    `Ilaris | ModelData normalization failed for compendium item ${doc.name} in ${pack.collection}:`,
                    error,
                )
            }
        }
    }

    return { migrated, skipped, errors }
}

async function migrateWorldActors() {
    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const actor of game.actors) {
        try {
            const { changed, system } = normalizeActorData(actor)
            if (!changed) {
                skipped++
                continue
            }

            await actor.update({ system })
            migrated++
        } catch (error) {
            errors++
            console.error(`Ilaris | ModelData normalization failed for actor ${actor.name}:`, error)
        }
    }

    return { migrated, skipped, errors }
}

async function migrateCompendiumActors() {
    let migrated = 0
    let skipped = 0
    let errors = 0

    const packs = game.packs.filter(
        (pack) => pack.metadata.type === 'Actor' && pack.collection?.startsWith('Ilaris.'),
    )

    for (const pack of packs) {
        if (pack.locked) {
            continue
        }

        let documents = []
        try {
            documents = await pack.getDocuments()
        } catch (error) {
            errors++
            console.error(
                `Ilaris | ModelData normalization failed to read actor pack ${pack.collection}:`,
                error,
            )
            continue
        }

        for (const doc of documents) {
            try {
                const { changed, system } = normalizeActorData(doc)
                if (!changed) {
                    skipped++
                    continue
                }

                await doc.update({ system })
                migrated++
            } catch (error) {
                errors++
                console.error(
                    `Ilaris | ModelData normalization failed for actor ${doc.name} in ${pack.collection}:`,
                    error,
                )
            }
        }
    }

    return { migrated, skipped, errors }
}

export function shouldRunModelDataNormalizationMigration() {
    if (!game.user.isGM) {
        return false
    }

    const worldSchemaVersion = game.settings.get('Ilaris', 'worldSchemaVersion') || '0.0.0'
    return isNewerVersion(TARGET_SCHEMA_VERSION, worldSchemaVersion)
}

export async function runModelDataNormalizationMigrationIfNeeded() {
    if (!shouldRunModelDataNormalizationMigration()) {
        return
    }

    console.log('Ilaris | Running ModelData normalization migration...')

    const totals = {
        migrated: 0,
        skipped: 0,
        errors: 0,
    }

    try {
        const worldStats = await migrateWorldItems()
        totals.migrated += worldStats.migrated
        totals.skipped += worldStats.skipped
        totals.errors += worldStats.errors

        const actorStats = await migrateActorEmbeddedItems()
        totals.migrated += actorStats.migrated
        totals.skipped += actorStats.skipped
        totals.errors += actorStats.errors

        const packStats = await migrateCompendiumItems()
        totals.migrated += packStats.migrated
        totals.skipped += packStats.skipped
        totals.errors += packStats.errors

        const worldActorStats = await migrateWorldActors()
        totals.migrated += worldActorStats.migrated
        totals.skipped += worldActorStats.skipped
        totals.errors += worldActorStats.errors

        const packActorStats = await migrateCompendiumActors()
        totals.migrated += packActorStats.migrated
        totals.skipped += packActorStats.skipped
        totals.errors += packActorStats.errors

        await game.settings.set('Ilaris', 'worldSchemaVersion', TARGET_SCHEMA_VERSION)

        console.log(
            `Ilaris | ModelData normalization migration done: ${totals.migrated} migrated, ${totals.skipped} skipped, ${totals.errors} errors`,
        )

        if (totals.migrated > 0) {
            ui.notifications.info(
                `Ilaris: ModelData-Normalisierung abgeschlossen (${totals.migrated} aktualisiert, ${totals.errors} Fehler).`,
            )
        }
    } catch (error) {
        console.error('Ilaris | ModelData normalization migration failed:', error)
        ui.notifications.error(
            'Ilaris: ModelData-Normalisierung fehlgeschlagen. Details in der Konsole.',
        )
    }
}
