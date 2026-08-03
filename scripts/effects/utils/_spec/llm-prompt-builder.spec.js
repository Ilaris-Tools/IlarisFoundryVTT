/**
 * Tests for llm-prompt-builder.js
 */
import { buildPreEffectPrompt } from '../llm-prompt-builder.js'

const mockSpellData = {
    text: 'Eine Flammenlanze fügt dem Ziel 4W6 TP zu und verursacht Nachbrennen.',
    maechtig: 'Die TP steigen um 2W6.',
    wirkungsdauer: 'augenblicklich',
    ziel: 'Einzelwesen, Einzelobjekt',
    reichweite: '16 Schritt',
    fertigkeiten: 'Feuer',
    modifikationen: 'Gezielter Strahl (-4)',
    schwierigkeit: '12',
}

const mockDamageTypes = [
    { value: 'PROFAN', label: 'Profan (Wunden)', behavior: {} },
    { value: 'FEUER', label: 'Feuer', behavior: {} },
    {
        value: 'HEALING_WOUND',
        label: 'Heilung (Wunden)',
        behavior: { healing: true },
    },
    {
        value: 'HEALING_EXHAUSTION',
        label: 'Heilung (Erschöpfung)',
        behavior: { healing: true, targetsErschoepfung: true },
    },
]

const mockSystemKeys = [
    'system.gesundheit.wunden',
    'system.gesundheit.erschoepfung',
    'system.abgeleitete.gs',
]

const mockModel = 'gpt-4o'

describe('buildPreEffectPrompt', () => {
    it('returns correct structure with model and messages', () => {
        const result = buildPreEffectPrompt(
            mockSpellData,
            'Ignifaxius',
            mockDamageTypes,
            mockSystemKeys,
            mockModel,
        )

        expect(result).toHaveProperty('model', 'gpt-4o')
        expect(result).toHaveProperty('messages')
        expect(result.messages).toHaveLength(2)
        expect(result.messages[0]).toHaveProperty('role', 'system')
        expect(result.messages[1]).toHaveProperty('role', 'user')
    })

    it('system message contains JSON schema', () => {
        const result = buildPreEffectPrompt(
            mockSpellData,
            'Ignifaxius',
            mockDamageTypes,
            mockSystemKeys,
            mockModel,
        )

        const systemMsg = result.messages[0].content
        expect(systemMsg).toContain('baseDuration')
        expect(systemMsg).toContain('instant')
        expect(systemMsg).toContain('changes')
        expect(systemMsg).toContain('avoidTest')
        expect(systemMsg).toContain('amplifiedByMaechtigeMagie')
    })

    it('system message lists all damage types', () => {
        const result = buildPreEffectPrompt(
            mockSpellData,
            'Ignifaxius',
            mockDamageTypes,
            mockSystemKeys,
            mockModel,
        )

        const systemMsg = result.messages[0].content
        expect(systemMsg).toContain('PROFAN')
        expect(systemMsg).toContain('Profan (Wunden)')
        expect(systemMsg).toContain('FEUER')
        expect(systemMsg).toContain('Feuer')
        expect(systemMsg).toContain('HEALING_WOUND')
        expect(systemMsg).toContain('HEALING_EXHAUSTION')
    })

    it('documents positive healing values and the healing damage types', () => {
        const result = buildPreEffectPrompt(
            mockSpellData,
            'Balsam Salabunde',
            mockDamageTypes,
            mockSystemKeys,
            mockModel,
        )

        const systemMsg = result.messages[0].content
        expect(systemMsg).toContain('damageType `HEALING_WOUND` oder `HEALING_EXHAUSTION`')
        expect(systemMsg).toContain('value positiv')
    })

    it('system message lists all system keys', () => {
        const result = buildPreEffectPrompt(
            mockSpellData,
            'Ignifaxius',
            mockDamageTypes,
            mockSystemKeys,
            mockModel,
        )

        const systemMsg = result.messages[0].content
        expect(systemMsg).toContain('system.gesundheit.wunden')
        expect(systemMsg).toContain('system.gesundheit.erschoepfung')
        expect(systemMsg).toContain('system.abgeleitete.gs')
    })

    it('user message contains spell name', () => {
        const result = buildPreEffectPrompt(
            mockSpellData,
            'Ignifaxius',
            mockDamageTypes,
            mockSystemKeys,
            mockModel,
        )

        const userMsg = result.messages[1].content
        expect(userMsg).toContain('Ignifaxius')
    })

    it('user message contains spell text and metadata', () => {
        const result = buildPreEffectPrompt(
            mockSpellData,
            'Ignifaxius',
            mockDamageTypes,
            mockSystemKeys,
            mockModel,
        )

        const userMsg = result.messages[1].content
        expect(userMsg).toContain('4W6 TP')
        expect(userMsg).toContain('Die TP steigen um 2W6')
        expect(userMsg).toContain('augenblicklich')
        expect(userMsg).toContain('Einzelwesen, Einzelobjekt')
        expect(userMsg).toContain('16 Schritt')
        expect(userMsg).toContain('Feuer')
        expect(userMsg).toContain('Gezielter Strahl')
        expect(userMsg).toContain('12')
    })

    it('handles empty damage types gracefully', () => {
        const result = buildPreEffectPrompt(mockSpellData, 'Test', [], mockSystemKeys, mockModel)

        expect(result.messages[0].content).toContain('Schadenstypen')
        expect(result.messages[0].content).not.toContain('undefined')
    })

    it('handles empty system keys gracefully', () => {
        const result = buildPreEffectPrompt(mockSpellData, 'Test', mockDamageTypes, [], mockModel)

        expect(result.messages[0].content).toContain('Key-Pfade')
        expect(result.messages[0].content).not.toContain('undefined')
    })

    it('handles missing spell fields gracefully', () => {
        const result = buildPreEffectPrompt(
            { text: 'Only text' },
            'Minimal',
            mockDamageTypes,
            mockSystemKeys,
            mockModel,
        )

        const userMsg = result.messages[1].content
        expect(userMsg).toContain('Minimal')
        expect(userMsg).toContain('Only text')
        expect(userMsg).not.toContain('undefined')
    })
})
