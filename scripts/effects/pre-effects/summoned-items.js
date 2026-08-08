import { IlarisGameSettingNames } from '../../settings/configure-game-settings.model.js'

const ui = {
    get notifications() {
        return globalThis.ui?.notifications
    },
}

function configuredSummonItemPacks(sourceKind) {
    try {
        const settingName =
            sourceKind === 'gegenstand'
                ? IlarisGameSettingNames.gegenstandPacks
                : IlarisGameSettingNames.waffenPacks
        return new Set(JSON.parse(game.settings.get('Ilaris', settingName) || '[]'))
    } catch (_error) {
        return new Set()
    }
}

function materializeValue(override, maechtigeQs) {
    let value = String(override?.value || '')
    if (override?.amplifiedByMaechtigeMagie && maechtigeQs > 0 && override?.maechtigBonus) {
        const bonus = String(override.maechtigBonus)
        value += (bonus.startsWith('+') || bonus.startsWith('-') ? bonus : `+${bonus}`).repeat(
            maechtigeQs,
        )
    }
    return value
}

function applyOverrides(data, overrides, maechtigeQs) {
    for (const override of overrides || []) {
        if (!override?.path) continue
        foundry.utils.setProperty(data, override.path, materializeValue(override, maechtigeQs))
    }
}

function isWeapon(data) {
    return data.type === 'nahkampfwaffe' || data.type === 'fernkampfwaffe'
}

/** Resolve, clone, and mark one summon without allowing a partial result. */
export async function summonItemFromPreEffect({
    targetActor,
    preEffect,
    caster,
    spellItem,
    effectiveDuration,
    maechtigeQs,
    preEffectIndex,
    applicationId,
}) {
    const config = preEffect.summonItem
    if (!config?.sourceUuid) return null

    const source = await fromUuid(config.sourceUuid)
    const sourceKind = config.sourceKind === 'gegenstand' ? 'gegenstand' : 'waffe'
    const allowedPacks = configuredSummonItemPacks(sourceKind)
    const sourceKindMatches =
        sourceKind === 'gegenstand' ? source?.type === 'gegenstand' : isWeapon(source || {})
    if (!source || !allowedPacks.has(source.pack) || !sourceKindMatches) {
        ui?.notifications?.error(`BeschwÃ¶rungsquelle fÃ¼r ${spellItem.name} ist nicht verfÃ¼gbar.`)
        return null
    }

    const data = foundry.utils.deepClone(source.toObject())
    delete data._id
    delete data._stats
    data.system ??= {}
    if (isWeapon(data)) data.system.hauptwaffe = true
    applyOverrides(data, config.overrides, maechtigeQs)
    data.flags ??= {}
    data.flags.ilaris = {
        ...(data.flags.ilaris || {}),
        summon: true,
        sourceItemUuid: source.uuid,
        spellUuid: spellItem.uuid,
        casterUuid: caster.uuid,
        preEffectIndex,
        applicationId,
    }

    let clone
    try {
        ;[clone] = await targetActor.createEmbeddedDocuments('Item', [data])
        if (!clone) throw new Error('Item creation returned no document.')

        if (isWeapon(data)) {
            const updates = targetActor.items
                .filter(
                    (item) =>
                        item.id !== clone.id && item.type === clone.type && item.system.hauptwaffe,
                )
                .map((item) => ({ _id: item.id, 'system.hauptwaffe': false }))
            if (updates.length) await targetActor.updateEmbeddedDocuments('Item', updates)
        }

        const marker = {
            name: spellItem.name,
            origin: caster.uuid,
            changes: [],
            duration: { turns: effectiveDuration },
            system: {
                ilarisSource: 'uebernatuerlich',
                ilarisModifiers: [],
                ilarisTiming: {
                    durationType: 'ownerTurns',
                    expiresOn: 'turnEnd',
                    remaining: effectiveDuration,
                    originalValue: effectiveDuration,
                },
            },
            flags: {
                ilaris: {
                    sourceType: 'summonItemMarker',
                    spellUuid: spellItem.uuid,
                    sourceItemUuid: source.uuid,
                    summonedItemId: clone.id,
                    preEffectIndex,
                    applicationId,
                },
            },
        }
        await ActiveEffect.createDocuments([marker], { parent: targetActor })
        return clone
    } catch (error) {
        if (clone?.id) await targetActor.deleteEmbeddedDocuments('Item', [clone.id])
        ui?.notifications?.error(`BeschwÃ¶rung von ${spellItem.name} fehlgeschlagen.`)
        console.error('Ilaris | Failed to summon Item:', error)
        return null
    }
}

export function getSummonMarkerIds(actor, applicationId, summonedItemId) {
    return Array.from(actor?.effects || actor?.appliedEffects || [])
        .filter(
            (effect) =>
                effect.flags?.ilaris?.sourceType === 'summonItemMarker' &&
                effect.flags.ilaris.applicationId === applicationId &&
                effect.flags.ilaris.summonedItemId === summonedItemId,
        )
        .map((effect) => effect.id)
        .filter(Boolean)
}
