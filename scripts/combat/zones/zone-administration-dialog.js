import {
    dismissZone,
    getCurrentZoneRegion,
    getZoneAdministrationRegistry,
    updateZoneRemaining,
} from './zone-administration.js'
import { reconcileZoneAdministration } from './zone-lifecycle.js'

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api

function currentScene() {
    return globalThis.canvas?.scene || null
}

function canAdministerZones() {
    return game.user?.isGM === true
}

async function resolveDocumentName(uuid, fallback) {
    if (!uuid || !foundry.utils?.fromUuid) return fallback
    try {
        return (await foundry.utils.fromUuid(uuid))?.name || fallback
    } catch (_error) {
        return fallback
    }
}

/** GM-facing administration for persistent Ilaris Regions in the active Scene. */
export class IlarisZoneAdministrationDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: 'ilaris-zone-administration',
        classes: ['ilaris', 'zone-administration-dialog'],
        position: { width: 760, height: 'auto' },
        window: { title: 'Ilaris-Zonen verwalten', resizable: true },
        actions: {
            reconcileZones: IlarisZoneAdministrationDialog.#onReconcileZones,
            selectZone: IlarisZoneAdministrationDialog.#onSelectZone,
            editZone: IlarisZoneAdministrationDialog.#onEditZone,
            saveDuration: IlarisZoneAdministrationDialog.#onSaveDuration,
            dismissZone: IlarisZoneAdministrationDialog.#onDismissZone,
        },
    }

    static PARTS = {
        main: { template: 'systems/Ilaris/scripts/combat/templates/zone-administration.hbs' },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const scene = currentScene()
        const registry = getZoneAdministrationRegistry(scene)
        context.isGM = canAdministerZones()
        context.sceneName = scene?.name || 'Keine aktive Szene'
        context.zones = await Promise.all(
            registry.zones.map(async (zone) => ({
                ...zone,
                spellName: await resolveDocumentName(zone.spellUuid, zone.spellUuid),
                casterName: await resolveDocumentName(
                    zone.casterUuid,
                    zone.casterUuid || 'Unbekannt',
                ),
                durationLabel:
                    zone.durationType === 'infinite'
                        ? 'Permanent'
                        : `${zone.remaining} Szenenrunde${zone.remaining === 1 ? '' : 'n'}`,
                effectSummary:
                    zone.effectMode === 'passive'
                        ? `${zone.membershipCount} Mitglied(er) · passive Wirkungen`
                        : `${zone.membershipCount} Mitglied(er) · ausgelöste Wirkungen`,
                isSceneRounds: zone.durationType === 'sceneRounds',
            })),
        )
        context.malformed = registry.malformed
        return context
    }

    _requireGM() {
        if (canAdministerZones()) return true
        ui.notifications.warn('Nur die Spielleitung kann Ilaris-Zonen verwalten.')
        return false
    }

    _sceneOrWarn() {
        const scene = currentScene()
        if (scene) return scene
        ui.notifications.warn('Es ist keine aktive Szene verfügbar.')
        return null
    }

    _regionOrWarn(regionId) {
        const scene = this._sceneOrWarn()
        if (!scene) return null
        try {
            return getCurrentZoneRegion(scene, regionId)
        } catch (error) {
            ui.notifications.warn(error.message)
            return null
        }
    }

    async selectZone(regionId) {
        if (!this._requireGM() || !this._regionOrWarn(regionId)) return
        const placeable =
            globalThis.canvas?.regions?.get?.(regionId) ||
            globalThis.canvas?.regions?.placeables?.find((entry) => entry.id === regionId)
        if (!placeable) {
            ui.notifications.warn('Die Zone ist auf der Karte nicht verfügbar.')
            return
        }
        globalThis.canvas.regions.activate()
        placeable.control({ releaseOthers: true, pan: true })
    }

    async editZone(regionId) {
        if (!this._requireGM()) return
        const region = this._regionOrWarn(regionId)
        if (region) region.sheet.render({ force: true })
    }

    async saveDuration(regionId, value) {
        if (!this._requireGM()) return
        const scene = this._sceneOrWarn()
        if (!scene) return
        try {
            await updateZoneRemaining(scene, regionId, value)
            await this.render()
        } catch (error) {
            ui.notifications.warn(error.message)
        }
    }

    async dismissZone(regionId) {
        if (!this._requireGM()) return
        const region = this._regionOrWarn(regionId)
        if (!region) return
        const confirmed = await DialogV2.confirm({
            window: { title: 'Zone aufheben' },
            content: `<p>Soll die Zone <strong>${foundry.utils.escapeHTML(region.name)}</strong> wirklich aufgehoben werden?</p>`,
            yes: { label: 'Zone aufheben' },
            no: { label: 'Abbrechen' },
        })
        if (!confirmed) return
        try {
            await dismissZone(this._sceneOrWarn(), regionId)
            await this.render()
        } catch (error) {
            ui.notifications.warn(error.message)
        }
    }

    async reconcileZones() {
        if (!this._requireGM()) return
        const scene = this._sceneOrWarn()
        if (!scene) return
        await reconcileZoneAdministration(scene)
        ui.notifications.info('Ilaris-Zonen wurden abgeglichen.')
        await this.render()
    }

    static async #onReconcileZones() {
        await this.reconcileZones()
    }

    static async #onSelectZone(_event, target) {
        await this.selectZone(target.dataset.zoneId)
    }

    static async #onEditZone(_event, target) {
        await this.editZone(target.dataset.zoneId)
    }

    static async #onSaveDuration(_event, target) {
        const row = target.closest('.zone-administration-row')
        await this.saveDuration(
            target.dataset.zoneId,
            row?.querySelector('[name="remaining"]')?.value,
        )
    }

    static async #onDismissZone(_event, target) {
        await this.dismissZone(target.dataset.zoneId)
    }
}

export function openZoneAdministration() {
    if (!canAdministerZones()) {
        ui.notifications.warn('Nur die Spielleitung kann Ilaris-Zonen verwalten.')
        return null
    }
    const existing = foundry.applications.instances?.get?.('ilaris-zone-administration')
    if (existing) return existing.render({ force: true })
    return new IlarisZoneAdministrationDialog().render({ force: true })
}
