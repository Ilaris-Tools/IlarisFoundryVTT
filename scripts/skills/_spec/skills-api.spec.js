import { jest } from '@jest/globals'

function setupSkillDialogGlobals() {
    class MockApplicationV2 {
        constructor(options = {}) {
            const defaultOptions = this.constructor.DEFAULT_OPTIONS || {}
            this.options = {
                ...defaultOptions,
                ...options,
                window: {
                    ...(defaultOptions.window || {}),
                    ...(options.window || {}),
                },
            }
        }

        async render(force) {
            this._renderCalledWith = force

            const renderOptions = typeof force === 'boolean' ? { force } : force || {}

            if (!this.element) {
                return this
            }

            const context = await this._prepareContext(renderOptions)
            this._lastRenderContext = context

            const configuredParts = this.constructor.PARTS || {}
            const partIds = renderOptions.parts || Object.keys(configuredParts)
            this._preparedPartContexts = {}

            for (const partId of partIds) {
                if (!configuredParts[partId]) continue

                const partContext = this._preparePartContext
                    ? await this._preparePartContext(partId, context, renderOptions)
                    : context
                this._preparedPartContexts[partId] = partContext
            }

            await this._onRender(context, renderOptions)
            return this
        }

        async _prepareContext() {
            return {}
        }

        async _onRender() {}
    }

    global.foundry = {
        utils: {
            randomID: jest.fn().mockReturnValue('random-id'),
        },
        applications: {
            api: {
                ApplicationV2: MockApplicationV2,
                HandlebarsApplicationMixin: (Base) => class extends Base {},
            },
            handlebars: {
                renderTemplate: jest.fn().mockResolvedValue('<div>Roll</div>'),
            },
        },
    }

    global.CONFIG = {
        ILARIS: {
            xd20_choice: {},
            schips_choice: {},
        },
        Dice: {
            rollModes: {
                roll: 'roll',
            },
        },
    }

    global.ChatMessage = {
        getSpeaker: jest.fn().mockReturnValue({ alias: 'Test' }),
    }

    global.game = {
        settings: {
            get: jest.fn((namespace, key) => {
                if (namespace === 'Ilaris' && key === 'realFumbleCrits') return false
                if (namespace === 'core' && key === 'rollMode') return 'roll'
                return null
            }),
        },
    }

    global.Hooks = {
        call: jest.fn().mockReturnValue(true),
        callAll: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn(),
    }
}

function createActor() {
    return {
        system: {
            abgeleitete: {
                globalermod: 2,
            },
            schips: {
                schips_stern: 2,
            },
        },
        profan: {
            fertigkeiten: {},
        },
        update: jest.fn().mockResolvedValue(undefined),
    }
}

function createDialogElement(dialogId, overrides = {}) {
    const modifierSummary = { innerHTML: '' }
    const talentWarning = { style: { display: 'none' } }
    const listenerInput = { addEventListener: jest.fn() }
    const fields = {
        [`input[name="xd20-${dialogId}"]:checked`]: { value: overrides.xd20 ?? '1' },
        [`input[name="schips-${dialogId}"]:checked`]: { value: overrides.schips ?? '0' },
        [`#hohequalitaet-${dialogId}`]: { value: overrides.hoheQualitaet ?? '0' },
        [`#modifikator-${dialogId}`]: { value: overrides.modifikator ?? '0' },
        [`#rollMode-${dialogId}`]: { value: overrides.rollMode ?? 'roll' },
        [`#talent-${dialogId}`]: overrides.includeTalentField
            ? { value: overrides.talentValue ?? '-2' }
            : null,
    }

    return {
        querySelector: jest.fn((selector) => {
            if (selector === '#modifier-summary') return modifierSummary
            if (selector === '.talent-warning') return talentWarning
            return fields[selector] ?? null
        }),
        querySelectorAll: jest.fn((selector) => {
            if (selector === 'input, select') return [listenerInput]
            return []
        }),
    }
}

describe('skills-api', () => {
    beforeEach(() => {
        jest.resetModules()
        jest.clearAllMocks()
        setupSkillDialogGlobals()
    })

    it('returns null when the pre-open hook cancels the dialog', async () => {
        Hooks.call.mockImplementation((hookName) => {
            if (hookName === 'Ilaris.preSkillDialog') return false
            return true
        })

        const { openSkillDialog } = await import('../skills-api.js')
        const actor = createActor()
        const dialog = await openSkillDialog(actor, {
            probeType: 'simple',
            fertigkeitName: 'Probe',
        })

        expect(dialog).toBeNull()
        expect(Hooks.call).toHaveBeenCalledWith(
            'Ilaris.preSkillDialog',
            actor,
            expect.objectContaining({ probeType: 'simple', fertigkeitName: 'Probe' }),
        )
    })

    it('renders the dialog through the public API', async () => {
        const { openSkillDialog } = await import('../skills-api.js')
        const actor = createActor()
        const dialog = await openSkillDialog(actor, {
            probeType: 'simple',
            fertigkeitName: 'Sinnesschärfe',
            pw: 12,
        })

        expect(dialog).not.toBeNull()
        expect(dialog.actor).toBe(actor)
        expect(dialog._renderCalledWith).toBe(true)
    })
})

describe('FertigkeitDialog hooks', () => {
    let FertigkeitDialog
    let actor

    beforeEach(async () => {
        jest.resetModules()
        jest.clearAllMocks()
        setupSkillDialogGlobals()

        global.Roll = jest.fn().mockImplementation(() => ({
            total: 17,
            evaluate: jest.fn().mockResolvedValue({ _total: 17 }),
            dice: [
                {
                    results: [{ active: true, result: 15 }],
                },
            ],
            toMessage: jest.fn().mockResolvedValue({ id: 'chat-1' }),
        }))
        ;({ FertigkeitDialog } = await import('../dialogs/fertigkeit.js'))
        actor = createActor()
    })

    it('emits rendered and state hooks after the initial preview is built', async () => {
        const dialog = new FertigkeitDialog(actor, {
            probeType: 'simple',
            fertigkeitName: 'Wahrnehmung',
            pw: 10,
        })
        dialog.element = createDialogElement(dialog.dialogId, { modifikator: '1' })

        await dialog._onRender({}, {})
        await dialog._initialPreviewPromise

        expect(Hooks.callAll).toHaveBeenCalledWith(
            'Ilaris.skillDialogStateChanged',
            dialog,
            expect.objectContaining({
                reason: 'render',
                diceFormula: '3d20dl1dh1',
                finalPW: 13,
                effectivePW: 10,
                label: 'Wahrnehmung',
            }),
        )
        expect(Hooks.callAll).toHaveBeenCalledWith(
            'Ilaris.skillDialogRendered',
            dialog,
            expect.objectContaining({ reason: 'render', finalPW: 13 }),
        )
    })

    it('prepares the computed summary context for summaries-only rerenders', async () => {
        const dialog = new FertigkeitDialog(actor, {
            probeType: 'simple',
            fertigkeitName: 'Wahrnehmung',
            pw: 10,
        })
        dialog.element = createDialogElement(dialog.dialogId, { modifikator: '1' })

        const statePayload = await dialog._updateModifierDisplay('change')

        expect(dialog._renderCalledWith).toEqual({ parts: ['summaries'] })
        expect(dialog._preparedPartContexts.summaries.summary).toEqual(dialog.summary)
        expect(dialog._preparedPartContexts.summaries.summary).toEqual(
            expect.objectContaining({
                title: 'Würfelaktionen:',
                isEmpty: false,
                isError: false,
                sections: [
                    expect.objectContaining({
                        action: 'previewClick',
                        heading: '🎲 Wahrnehmung: 3W20 (Median)+13',
                        rows: expect.arrayContaining([
                            expect.objectContaining({
                                label: 'Basis PW',
                                value: '10',
                            }),
                            expect.objectContaining({
                                label: 'Status (Wunden/Furcht)',
                                value: '+2',
                            }),
                            expect.objectContaining({
                                label: 'Modifikator',
                                value: '+1',
                            }),
                        ]),
                        totalRow: expect.objectContaining({
                            text: 'Addierte Modifikatoren: +3',
                        }),
                    }),
                ],
            }),
        )
        expect(statePayload).toEqual(
            expect.objectContaining({
                reason: 'change',
                finalPW: 13,
                totalMod: 3,
            }),
        )
    })

    it('stops the roll when the pre-roll hook cancels it', async () => {
        Hooks.call.mockImplementation((hookName) => {
            if (hookName === 'Ilaris.preSkillRoll') return false
            return true
        })

        const dialog = new FertigkeitDialog(actor, {
            probeType: 'simple',
            fertigkeitName: 'Wahrnehmung',
            pw: 10,
        })
        dialog.element = createDialogElement(dialog.dialogId, { schips: '1', modifikator: '1' })

        await dialog._executeRoll()

        expect(Roll).not.toHaveBeenCalled()
        expect(actor.update).not.toHaveBeenCalled()
        expect(Hooks.call).toHaveBeenCalledWith(
            'Ilaris.preSkillRoll',
            dialog,
            expect.objectContaining({
                formula: '4d20dl2dh1 + 10 + 2 + 0 + 1',
                schips: expect.objectContaining({ applied: true }),
            }),
        )
    })

    it('emits schips and post-roll hooks with a structured payload', async () => {
        const dialog = new FertigkeitDialog(actor, {
            probeType: 'simple',
            fertigkeitName: 'Wahrnehmung',
            pw: 10,
        })
        dialog.element = createDialogElement(dialog.dialogId, { schips: '1', modifikator: '1' })

        await dialog._executeRoll()

        expect(Hooks.call).toHaveBeenCalledWith(
            'Ilaris.preSkillSchipsConsumption',
            dialog,
            expect.objectContaining({
                amount: 1,
                remainingBefore: 2,
                remainingAfter: 1,
            }),
        )
        expect(actor.update).toHaveBeenCalledWith({ 'system.schips.schips_stern': 1 })
        expect(Hooks.callAll).toHaveBeenCalledWith(
            'Ilaris.postSkillSchipsConsumption',
            dialog,
            expect.objectContaining({ amount: 1, remainingAfter: 1 }),
        )
        expect(Hooks.callAll).toHaveBeenCalledWith(
            'Ilaris.postSkillRoll',
            dialog,
            expect.objectContaining({
                formula: '4d20dl2dh1 + 10 + 2 + 0 + 1',
                total: 17,
                success: false,
                schipsConsumed: true,
                chatMessage: { id: 'chat-1' },
            }),
        )
    })
})
