import { IlarisGameSettingNames } from '../../settings/configure-game-settings.model.js'
import { openSkillDialog } from '../../skills/skills-api.js'

const ui = {
    get notifications() {
        return globalThis.ui?.notifications
    },
}

const MAX_PLACEMENT_RING = 12
const SUMMON_CREATURE_BASE_SOURCE_FLAG = 'summonCreatureBaseSourceUuid'

function configuredCreaturePacks() {
    try {
        return new Set(
            JSON.parse(game.settings.get('Ilaris', IlarisGameSettingNames.kreaturenPacks) || '[]'),
        )
    } catch (_error) {
        return new Set()
    }
}

function isCreatureSource(source, allowedTypes = []) {
    if (!source || source.documentName !== 'Actor' || source.type !== 'kreatur') return false
    const creatureType = source.system?.kreaturentyp
    return !allowedTypes.length || allowedTypes.includes(creatureType)
}

export function normalizeCreatureTypes(value) {
    if (Array.isArray(value)) return value.filter(Boolean)
    return String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
}

function numericAddition(override, maechtigeQs) {
    const base = Number(override?.value ?? 0)
    const amplified = override?.amplifiedByMaechtigeMagie
        ? Number(override?.maechtigBonus ?? 0) * Math.max(0, Number(maechtigeQs) || 0)
        : 0
    const addition = base + amplified
    return Number.isFinite(addition) ? addition : null
}

/** Apply configured additions to cloned Actor source data without touching the compendium source. */
export function applySummonCreatureOverrides(sourceData, overrides, maechtigeQs = 0) {
    for (const override of overrides || []) {
        if (!override?.path) continue
        const addition = numericAddition(override, maechtigeQs)
        const current = foundry.utils.getProperty(sourceData, override.path)
        if (addition === null || current === undefined || current === null) continue

        if (
            typeof current === 'number' ||
            (typeof current === 'string' &&
                current.trim() !== '' &&
                Number.isFinite(Number(current)))
        ) {
            foundry.utils.setProperty(sourceData, override.path, Number(current) + addition)
            continue
        }
        if (typeof current === 'string') {
            const formula = current.replace(/\s+/g, '')
            foundry.utils.setProperty(
                sourceData,
                override.path,
                addition < 0 ? `${formula}${addition}` : `${formula}+${addition}`,
            )
        }
    }
    return sourceData
}

function cloneSourceData(source) {
    if (typeof source?.toObject === 'function') return foundry.utils.deepClone(source.toObject())
    return {
        system: foundry.utils.deepClone(source?.system || {}),
        items: foundry.utils.deepClone(source?.items || []),
    }
}

function importedCreatureBaseActor(sourceUuid) {
    return Array.from(game.actors?.values?.() || []).find(
        (actor) => actor.flags?.ilaris?.[SUMMON_CREATURE_BASE_SOURCE_FLAG] === sourceUuid,
    )
}

/**
 * Import a configured compendium creature once so Foundry can construct an
 * unlinked Token's synthetic Actor and ActorDelta from a world-level base.
 */
async function getOrImportCreatureBaseActor(source, sourceUuid) {
    const existing = importedCreatureBaseActor(sourceUuid)
    if (existing) return existing

    const sourceData = cloneSourceData(source)
    delete sourceData._id
    delete sourceData._stats
    delete sourceData.folder
    delete sourceData.sort
    sourceData.flags ??= {}
    sourceData.flags.ilaris = {
        ...(sourceData.flags.ilaris || {}),
        [SUMMON_CREATURE_BASE_SOURCE_FLAG]: sourceUuid,
    }
    return Actor.implementation.create(sourceData)
}

export async function getCreatureSourceOptions(allowedTypes = []) {
    const configuredPacks = configuredCreaturePacks()
    const options = []

    for (const packId of configuredPacks) {
        const pack = game.packs.get(packId)
        if (!pack || pack.metadata?.type !== 'Actor') continue
        try {
            const index =
                pack.index?.size || Array.isArray(pack.index)
                    ? pack.index
                    : await pack.getIndex({ fields: ['type', 'system.kreaturentyp'] })
            for (const entry of index) {
                const creatureType = entry.system?.kreaturentyp
                if (entry.type !== 'kreatur' || !creatureType) continue
                if (allowedTypes.length && !allowedTypes.includes(creatureType)) continue
                options.push({
                    uuid: `Compendium.${pack.collection}.Actor.${entry._id}`,
                    name: entry.name,
                    kreaturentyp: creatureType,
                    packName: pack.metadata?.label || packId,
                    summoningDifficulty: Number(entry.system?.summoningDifficulty) || 12,
                    summoningCost: Number(entry.system?.summoningCost) || 12,
                })
            }
        } catch (error) {
            console.warn(`Ilaris | Could not read creature pack ${packId}:`, error)
        }
    }

    return options.sort((left, right) => left.name.localeCompare(right.name, 'de'))
}

export async function resolveSummonCreatureSource(sourceUuid, allowedTypes = []) {
    if (!sourceUuid) return null
    const source = await fromUuid(sourceUuid)
    if (!configuredCreaturePacks().has(source?.pack) || !isCreatureSource(source, allowedTypes))
        return null
    return source
}

function tokenRect(token, gridSize) {
    return {
        left: Number(token.x) || 0,
        top: Number(token.y) || 0,
        right: (Number(token.x) || 0) + (Number(token.width) || 1) * gridSize,
        bottom: (Number(token.y) || 0) + (Number(token.height) || 1) * gridSize,
    }
}

function overlaps(left, right) {
    return (
        left.left < right.right &&
        left.right > right.left &&
        left.top < right.bottom &&
        left.bottom > right.top
    )
}

export function getPlacementCandidates(
    casterToken,
    summonedToken,
    gridSize,
    maxRing = MAX_PLACEMENT_RING,
) {
    const candidates = []
    const casterX = Math.round((Number(casterToken.x) || 0) / gridSize)
    const casterY = Math.round((Number(casterToken.y) || 0) / gridSize)
    for (let ring = 1; ring <= maxRing; ring++) {
        for (let dx = -ring; dx <= ring; dx++) {
            for (let dy = -ring; dy <= ring; dy++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue
                candidates.push({
                    x: (casterX + dx) * gridSize,
                    y: (casterY + dy) * gridSize,
                    width: Number(summonedToken.width) || 1,
                    height: Number(summonedToken.height) || 1,
                })
            }
        }
    }
    return candidates
}

export function findSummonPlacement({ scene, casterToken, summonedToken, gridSize }) {
    const sceneWidth = Number(scene?.dimensions?.width) || 0
    const sceneHeight = Number(scene?.dimensions?.height) || 0
    const existing = Array.from(scene?.tokens || [])
    for (const candidate of getPlacementCandidates(casterToken, summonedToken, gridSize)) {
        const rect = tokenRect(candidate, gridSize)
        if (rect.left < 0 || rect.top < 0 || rect.right > sceneWidth || rect.bottom > sceneHeight)
            continue
        if (existing.some((token) => overlaps(rect, tokenRect(token, gridSize)))) continue
        return candidate
    }
    return null
}

function validBoundResource(config) {
    const amount = Number(config?.amount)
    if (
        !config?.enabled ||
        !['gasp', 'gkap'].includes(config?.resource) ||
        !Number.isFinite(amount) ||
        amount <= 0
    )
        return null
    return { resource: config.resource, amount }
}

async function reserveBoundResource(caster, config) {
    const bound = validBoundResource(config)
    if (!bound) return null
    const path = `system.abgeleitete.${bound.resource}`
    const current = Number(caster.system?.abgeleitete?.[bound.resource]) || 0
    const availableKey = bound.resource === 'gasp' ? 'asp' : 'kap'
    const available = Number(caster.system?.abgeleitete?.[availableKey]) || 0
    if (available < bound.amount) {
        ui.notifications?.warn(
            `Nicht genügend ${bound.resource === 'gasp' ? 'AsP' : 'KaP'} für die Bindung.`,
        )
        return false
    }
    await caster.update({ [path]: current + bound.amount })
    return { ...bound, casterUuid: caster.uuid }
}

async function releaseBoundResource(provenance) {
    if (!provenance?.casterUuid || provenance.released) return
    const caster = await fromUuid(provenance.casterUuid)
    if (!caster) return
    const path = `system.abgeleitete.${provenance.resource}`
    const current = Number(caster.system?.abgeleitete?.[provenance.resource]) || 0
    await caster.update({ [path]: Math.max(0, current - provenance.amount) })
}

export function resolveDominationCheck(config, kreaturentyp) {
    const checks = config?.dominationChecks
    if (!checks?.enabled || !kreaturentyp) return null
    return (Array.isArray(checks.entries) ? checks.entries : []).find(
        (entry) => entry?.kreaturentyp === kreaturentyp,
    )
}

export function dominationDialogOptions(caster, check) {
    const difficulty = Number(check?.difficulty) || 12
    if (check?.probeType === 'attribut') {
        const attribut = check.attribut
        const pw = caster.system?.attribute?.[attribut]?.pw
        if (pw === undefined) return null
        return {
            probeType: 'attribut',
            fertigkeitKey: attribut,
            fertigkeitName: CONFIG.ILARIS.label?.[attribut] || attribut,
            pw,
            success_val: difficulty,
            attributeTargets: [attribut],
        }
    }

    const skills = caster.profan?.fertigkeiten || []
    const skillIndex = skills.findIndex((skill) => skill.name === check?.fertigkeit)
    if (skillIndex < 0) return null
    const skill = skills[skillIndex]
    const talents = skill.system?.talente || []
    return {
        probeType: 'fertigkeit',
        fertigkeitKey: skillIndex,
        fertigkeitName: skill.name,
        pw: skill.system?.pw || 0,
        success_val: difficulty,
        talentList: Object.fromEntries(talents.map((talent, index) => [index, talent.name])),
        initialTalent: talents.some((talent) => talent.name === check?.talent) ? check.talent : '',
        attributeTargets: [
            skill.system?.attribut_0,
            skill.system?.attribut_1,
            skill.system?.attribut_2,
        ].filter(Boolean),
    }
}

async function startDominationCheck(caster, source, config) {
    const check = resolveDominationCheck(config, source.system?.kreaturentyp)
    if (!check) return
    const options = dominationDialogOptions(caster, check)
    if (!options) {
        ui.notifications?.warn(
            'Die konfigurierte Beherrschungsprobe kann für die beschwörende Person nicht ausgeführt werden.',
        )
        return
    }
    const dialog = await openSkillDialog(caster, options)
    if (dialog) dialog._summonDominationContext = { creatureName: source.name }
}

/** Create one unlinked Scene Token from a selected creature compendium Actor. */
export async function summonCreatureFromPreEffect({
    caster,
    preEffect,
    selectedCreatureUuid,
    effectiveDuration = 0,
    maechtigeQs = 0,
    spellItem,
    preEffectIndex = 0,
    applicationId = foundry.utils.randomID(),
}) {
    const config = preEffect?.summonCreature
    const sourceUuid = config?.sourceUuid || selectedCreatureUuid || config?.selectedCreatureUuid
    const source = await resolveSummonCreatureSource(
        sourceUuid,
        normalizeCreatureTypes(config?.kreaturentypen),
    )
    if (!source) {
        ui.notifications?.warn(
            'Die ausgewählte Kreatur ist nicht in den konfigurierten Kreaturen-Kompendien verfügbar.',
        )
        return null
    }

    const scene = canvas?.scene
    const casterToken = canvas?.tokens?.controlled?.find(
        (token) => token.actor?.id === caster.id,
    )?.document
    if (!scene || !casterToken) {
        ui.notifications?.warn(
            'Für die Beschwörung wird ein kontrollierter Token der beschwörenden Person benötigt.',
        )
        return null
    }

    let baseActor
    try {
        baseActor = await getOrImportCreatureBaseActor(source, sourceUuid)
    } catch (error) {
        ui.notifications?.error(
            'Die Kreatur konnte nicht als Grundlage für den beschworenen Token importiert werden.',
        )
        console.error('Ilaris | Failed to import creature summon base Actor:', error)
        return null
    }

    const baseActorData = cloneSourceData(baseActor)
    const overriddenActorData = foundry.utils.deepClone(baseActorData)
    applySummonCreatureOverrides(overriddenActorData, config?.overrides, maechtigeQs)
    const sourceToken = await baseActor.getTokenDocument({
        actorLink: false,
        delta: foundry.utils.diffObject(baseActorData, overriddenActorData),
    })
    const placement = findSummonPlacement({
        scene,
        casterToken,
        summonedToken: sourceToken,
        gridSize: canvas.grid.size,
    })
    if (!placement) {
        ui.notifications?.warn('Für die beschworene Kreatur ist kein freier Platz verfügbar.')
        return null
    }

    const reservation = await reserveBoundResource(caster, config?.boundResourceCost)
    if (config?.boundResourceCost?.enabled && reservation === false) return null
    const tokenData = sourceToken.toObject()
    delete tokenData._id
    tokenData.actorLink = false
    tokenData.x = placement.x
    tokenData.y = placement.y
    tokenData.flags ??= {}
    tokenData.flags.ilaris = {
        ...(tokenData.flags.ilaris || {}),
        summonCreature: {
            sourceUuid,
            ...(reservation ? { boundResource: reservation } : {}),
        },
    }

    let created
    try {
        const createdTokens = await scene.createEmbeddedDocuments('Token', [tokenData])
        created = createdTokens[0]
        if (!created) throw new Error('Token creation returned no document.')
    } catch (error) {
        if (reservation) await releaseBoundResource(reservation)
        ui.notifications?.error(
            'Die beschworene Kreatur konnte nicht auf der Szene erstellt werden.',
        )
        console.error('Ilaris | Failed to summon creature:', error)
        return null
    }

    if (config?.lifetime === 'timed') {
        try {
            if (!effectiveDuration) throw new Error('Timed creature summon needs a duration.')
            await ActiveEffect.createDocuments(
                [
                    {
                        name: spellItem?.name || source.name,
                        origin: caster.uuid,
                        changes: [],
                        // Ilaris owns this lifecycle through ilarisTiming. Supplying
                        // legacy core turn data makes Foundry v14's ActiveEffect
                        // registry attempt a conflicting native expiry.
                        duration: {},
                        system: {
                            ilarisTiming: {
                                durationType: 'ownerTurns',
                                expiresOn: 'turnEnd',
                                remaining: effectiveDuration,
                                originalValue: effectiveDuration,
                            },
                        },
                        flags: {
                            ilaris: {
                                sourceType: 'summonCreatureMarker',
                                sourceUuid,
                                casterUuid: caster.uuid,
                                spellUuid: spellItem?.uuid || '',
                                preEffectIndex,
                                applicationId,
                                summonedSceneUuid: scene.uuid,
                                summonedTokenId: created.id,
                                summonedTokenUuid:
                                    created.uuid || `${scene.uuid}.Token.${created.id}`,
                            },
                        },
                    },
                ],
                { parent: caster },
            )
        } catch (error) {
            await scene.deleteEmbeddedDocuments('Token', [created.id])
            if (reservation) await releaseBoundResource(reservation)
            ui.notifications?.error(
                'Die zeitlich begrenzte Kreatur konnte nicht eingerichtet werden.',
            )
            console.error('Ilaris | Failed to create creature summon marker:', error)
            return null
        }
    }

    try {
        created.actor?.sheet?.render(true)
        await startDominationCheck(caster, source, config)
    } catch (error) {
        ui.notifications?.warn(
            'Die Kreatur wurde beschworen, aber ihr Bogen oder die Beherrschungsprobe konnte nicht geöffnet werden.',
        )
        console.error('Ilaris | Failed to present summoned creature:', error)
    }
    return created
}

export async function releaseSummonedCreatureBoundResource(tokenDocument) {
    const provenance = tokenDocument?.flags?.ilaris?.summonCreature?.boundResource
    if (!provenance || tokenDocument.getFlag?.('ilaris', 'summonCreatureResourceReleased')) return
    await releaseBoundResource(provenance)
    await tokenDocument.setFlag?.('ilaris', 'summonCreatureResourceReleased', true)
}

export function registerSummonDominationResolutionListener() {
    Hooks.on('Ilaris.postSkillRoll', (dialog, payload) => {
        if (!dialog?._summonDominationContext) return
        const outcome = payload?.rollResult?.success ? 'gelungen' : 'misslungen'
        ui.notifications?.info(
            `Beherrschungsprobe für ${dialog._summonDominationContext.creatureName}: ${outcome}.`,
        )
        delete dialog._summonDominationContext
    })
}
