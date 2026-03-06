/**
 * Importer feature hooks.
 * Handles XML character and rule import UI integration.
 *
 * TODO Phase 3: Consolidate importer hooks from core/init.js and remove legacy imports.
 *
 * import { XmlCharacterImporter } from './xml_character_importer.js'
 * import { XMLRuleImporter } from './xml_rule_importer/index.js'
 *
 * Hooks.on('renderActorDirectory', (app, html, data) => {
 *     // Add XML import button to actor directory
 * })
 *
 * Hooks.on('renderCompendiumDirectory', (app, html, data) => {
 *     // Add rule import button to compendium directory
 * })
 *
 * Hooks.on('getSceneControlButtons', (buttons) => {
 *     // Add importer buttons to scene controls
 *     // NOTE: Remove duplicate getSceneControlButtons hook that currently exists in hooks.js
 * })
 *
 * export function importerReady() {
 *     // Importer-specific ready logic
 * }
 */
