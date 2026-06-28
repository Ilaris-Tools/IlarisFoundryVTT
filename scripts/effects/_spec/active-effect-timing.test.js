/**
 * Tests for IlarisActiveEffect owner-scoped turn timing.
 *
 * Covers:
 * - isExpiryEvent guard (returns false for ownerTurns effects, delegates for others)
 * - updateDuration guard (skips core for ownerTurns effects, delegates for others)
 * - IlarisActiveEffectConfig._getIlarisTimingData defaults
 * - Regression: DoT effects are unaffected by the timing guards
 */

let IlarisActiveEffect
let IlarisActiveEffectConfig

beforeAll(async () => {
    // Minimal ActiveEffect base mock — tracks super calls
    global.ActiveEffect = class ActiveEffect {
        constructor() {
            this.system = {}
            this._isExpiryCalled = false
            this._updateDurationCalled = false
        }

        isExpiryEvent(_event, _context) {
            this._isExpiryCalled = true
            return true
        }

        updateDuration(_context) {
            this._updateDurationCalled = true
        }
    }

    const mockBaseConfig = class ActiveEffectConfig {
        static PARTS = {
            header: {},
            tabs: {},
            details: {},
            duration: {},
            changes: {},
            footer: {},
        }

        static TABS = {
            sheet: {
                initial: 'details',
                labelPrefix: 'EFFECT.Tab',
                tabs: [
                    { id: 'details', icon: 'fa-solid fa-circle-info' },
                    { id: 'duration', icon: 'fa-solid fa-hourglass-half' },
                    { id: 'changes', icon: 'fa-solid fa-pen-to-square' },
                ],
            },
        }

        async _prepareContext() {
            return {}
        }

        async _preparePartContext(_partId, context) {
            return context
        }

        _prepareTabs() {
            return {}
        }
    }

    global.foundry = {
        ...global.foundry,
        applications: {
            ...global.foundry?.applications,
            sheets: {
                ...global.foundry?.applications?.sheets,
                ActiveEffectConfig: mockBaseConfig,
            },
        },
    }
    ;({ IlarisActiveEffect } = await import('../active-effect.js'))
    ;({ IlarisActiveEffectConfig } = await import('../ilaris-effect-config.js'))
})

// ── isExpiryEvent ────────────────────────────────────────────────────────────

describe('IlarisActiveEffect.isExpiryEvent', () => {
    test('returns false for ownerTurns effects — core must not expire them', () => {
        const effect = new IlarisActiveEffect()
        effect.system = { ilarisTiming: { durationType: 'ownerTurns' } }
        expect(effect.isExpiryEvent({}, {})).toBe(false)
        expect(effect._isExpiryCalled).toBe(false)
    })

    test('delegates to super for effects without ilarisTiming', () => {
        const effect = new IlarisActiveEffect()
        effect.system = {}
        expect(effect.isExpiryEvent({}, {})).toBe(true)
        expect(effect._isExpiryCalled).toBe(true)
    })

    test('delegates to super for durationType="" (disabled / default)', () => {
        const effect = new IlarisActiveEffect()
        effect.system = { ilarisTiming: { durationType: '' } }
        expect(effect.isExpiryEvent({}, {})).toBe(true)
        expect(effect._isExpiryCalled).toBe(true)
    })
})

// ── updateDuration ───────────────────────────────────────────────────────────

describe('IlarisActiveEffect.updateDuration', () => {
    test('skips super for ownerTurns effects — core must not decrement them', () => {
        const effect = new IlarisActiveEffect()
        effect.system = { ilarisTiming: { durationType: 'ownerTurns' } }
        effect.updateDuration({})
        expect(effect._updateDurationCalled).toBe(false)
    })

    test('delegates to super for effects without ilarisTiming', () => {
        const effect = new IlarisActiveEffect()
        effect.system = {}
        effect.updateDuration({})
        expect(effect._updateDurationCalled).toBe(true)
    })

    test('delegates to super for durationType="" (disabled / default)', () => {
        const effect = new IlarisActiveEffect()
        effect.system = { ilarisTiming: { durationType: '' } }
        effect.updateDuration({})
        expect(effect._updateDurationCalled).toBe(true)
    })
})

// ── IlarisActiveEffectConfig._getIlarisTimingData ────────────────────────────

describe('IlarisActiveEffectConfig._getIlarisTimingData', () => {
    function makeConfig(systemData) {
        const cfg = Object.create(IlarisActiveEffectConfig.prototype)
        cfg.document = { system: systemData || {} }
        return cfg
    }

    test('returns defaults when system.ilarisTiming is absent', () => {
        const cfg = makeConfig({})
        expect(cfg._getIlarisTimingData()).toEqual({
            durationType: 'ownerTurns',
            remaining: 0,
            originalValue: 0,
            expiresOn: 'turnEnd',
        })
    })

    test('returns stored values when ilarisTiming is present', () => {
        const cfg = makeConfig({
            ilarisTiming: {
                durationType: 'ownerTurns',
                remaining: 3,
                originalValue: 5,
                expiresOn: 'turnEnd',
            },
        })
        expect(cfg._getIlarisTimingData()).toEqual({
            durationType: 'ownerTurns',
            remaining: 3,
            originalValue: 5,
            expiresOn: 'turnEnd',
        })
    })
})

// ── DoT regression ───────────────────────────────────────────────────────────

describe('DoT regression — timing guards do not affect DOT effects', () => {
    test('isExpiryEvent delegates to super for a DOT effect (no ilarisTiming)', () => {
        const effect = new IlarisActiveEffect()
        effect.system = {
            changes: [{ type: 'custom', key: 'system.gesundheit.wunden', value: '3' }],
        }
        expect(effect.isExpiryEvent({}, {})).toBe(true)
        expect(effect._isExpiryCalled).toBe(true)
    })

    test('updateDuration delegates to super for a DOT effect (no ilarisTiming)', () => {
        const effect = new IlarisActiveEffect()
        effect.system = {
            changes: [{ type: 'custom', key: 'system.gesundheit.wunden', value: '3' }],
        }
        effect.updateDuration({})
        expect(effect._updateDurationCalled).toBe(true)
    })
})
