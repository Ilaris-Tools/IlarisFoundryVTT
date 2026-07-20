/**
 * Build a prompt for LLM-assisted pre-effect generation.
 * Returns an OpenAI-compatible chat completions request body.
 *
 * @param {object} spellData - The spell's system data (text, maechtig, wirkungsdauer, etc.)
 * @param {string} spellName - The spell's display name
 * @param {Array<{value: string, label: string}>} damageTypes - Available damage types from the `damageTypes` setting
 * @param {string[]} systemKeys - Available `system.*` field paths from `collectActorSystemPaths()`
 * @param {string} model - The LLM model to use
 * @returns {{model: string, messages: Array<{role: string, content: string}>}}
 */
export function buildPreEffectPrompt(spellData, spellName, damageTypes, systemKeys, model) {
    const damageTypeList = damageTypes.map((t) => `"${t.value}" (${t.label})`).join(', ')
    const systemKeyList = systemKeys.join('\n- ')

    const systemMessage = `Du bist ein Assistent für das Foundry VTT Ilaris-System. Deine Aufgabe ist es, aus einer Zauberspruch-Beschreibung die passende preEffects-Konfiguration zu generieren.

## Verfügbare Schadenstypen
${damageTypeList}

## Verfügbare system.* Key-Pfade
- ${systemKeyList}

## Pre-Effect JSON Schema
Jeder Pre-Effect hat folgende Struktur (als JSON-Array):
\`\`\`
[{
  "baseDuration": number,        // Dauer in Runden (0 für instant)
  "instant": boolean,            // true = sofortiger Schaden/Heilung, false = ActiveEffect
  "changes": [{
    "key": string,               // system.* Pfad aus der Liste oben
    "type": "add",               // "add" | "custom" | "multiply" | "override"
    "value": string,             // Formel (z.B. "4W6", "-2W6-4" für Heilung, "+2")
    "amplifiedByMaechtigeMagie": boolean,
    "maechtigBonus": string,     // Bonus pro QS (z.B. "+2W6", "+4"), leer wenn nicht verstärkt
    "damageType": string,        // Einer der verfügbaren Schadenstypen
    "diminishedValue": string,   // Abgeschwächter Wert (leer lassen)
    "diminishedMaechtigBonus": string,
    "priority": null
  }],
  "avoidTest": {
    "enabled": false,            // Nur true wenn der Zaubertext explizit eine Widerstandsprobe beschreibt
    "fertigkeit": "",
    "attribut": "",
    "diminishedOnly": false,
    "resistDifficulty": 12
  }
}]
\`\`\`

## Regeln
- Sofortiger Schaden (augenblicklich, TP): instant=true, key="system.gesundheit.wunden"
- Heilung: value negativ, z.B. "-2W6-4", instant=true
- Buffs/Debuffs mit Dauer: instant=false, baseDuration aus Wirkungsdauer ableiten
- Mächtige Magie Bonus aus dem maechtig-Text extrahieren
- avoidTest.enabled NUR wenn der Zaubertext eine Widerstandsprobe beschreibt (nicht Magieresistenz als Schwierigkeit)
- Antworte NUR mit gültigem JSON im Format {"preEffects": [...]} ohne Markdown-Code-Fences`

    const userMessage = `Generiere die preEffects für folgenden Zauberspruch:

Name: ${spellName}
Text: ${spellData.text || ''}
Mächtig: ${spellData.maechtig || ''}
Wirkungsdauer: ${spellData.wirkungsdauer || ''}
Ziel: ${spellData.ziel || ''}
Reichweite: ${spellData.reichweite || ''}
Fertigkeiten: ${spellData.fertigkeiten || ''}
Modifikationen: ${spellData.modifikationen || ''}
Schwierigkeit: ${spellData.schwierigkeit || ''}`

    return {
        model,
        messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage },
        ],
    }
}
