/**
 * Collect all leaf `system.*` dotted field paths from registered Actor data models.
 * Used by IlarisActiveEffectConfig and UebernatuerlichTalentSheet for datalist autocomplete.
 *
 * @returns {string[]} Sorted, deduplicated array of dotted paths (e.g., "system.gesundheit.wunden")
 */
export function collectActorSystemPaths() {
    const keys = []
    for (const model of Object.values(CONFIG.Actor.dataModels || {})) {
        collectFieldPaths(model, 'system', keys)
    }
    return [...new Set(keys)].sort()
}

/**
 * Recursively collects dotted field paths from a DataModel schema.
 * @param {typeof foundry.abstract.TypeDataModel} model - The data model class
 * @param {string} prefix - Current path prefix
 * @param {string[]} out - Output array
 */
function collectFieldPaths(model, prefix, out) {
    const schema = model.defineSchema?.()
    if (!schema) return

    for (const [name, field] of Object.entries(schema)) {
        const path = `${prefix}.${name}`
        if (field instanceof foundry.data.fields.SchemaField) {
            collectSchemaFieldPaths(field, path, out)
            out.push(path)
        } else {
            out.push(path)
        }
    }
}

/**
 * Recursively collects paths from a nested SchemaField.
 * @param {foundry.data.fields.SchemaField} schemaField
 * @param {string} prefix - Current path prefix
 * @param {string[]} out - Output array
 */
function collectSchemaFieldPaths(schemaField, prefix, out) {
    for (const [name, field] of Object.entries(schemaField.fields)) {
        const path = `${prefix}.${name}`
        if (field instanceof foundry.data.fields.SchemaField) {
            collectSchemaFieldPaths(field, path, out)
            out.push(path)
        } else {
            out.push(path)
        }
    }
}
