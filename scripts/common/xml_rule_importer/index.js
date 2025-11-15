/**
 * XML Rule Importer for Ilaris FoundryVTT System
 * Main orchestrator that coordinates all import operations
 */

import { XMLParser } from './utils/xml-parser.js'
import { CompendiumCreator } from './utils/compendium-creator.js'
import { CompendiumUpdater } from './utils/compendium-updater.js'
import { DialogHandler } from './dialog-handler.js'
import {
    SkillExtractor,
    WeaponExtractor,
    ArmorExtractor,
    TalentExtractor,
    ManoeverExtractor,
    VorteilExtractor,
} from './extractors/index.js'

/**
 * Main XML Rule Importer class
 */
export class XMLRuleImporter {
    constructor(xmlFile = null) {
        this.xmlFile = xmlFile
        this.xmlDoc = null
    }

    /**
     * Load and parse XML file
     * @param {File} xmlFile - Browser File object (optional if provided in constructor)
     */
    async loadXML(xmlFile = null) {
        const fileToLoad = xmlFile || this.xmlFile
        if (!fileToLoad) {
            throw new Error('No XML file provided')
        }
        this.xmlDoc = await XMLParser.loadAndParseXML(fileToLoad)
    }

    /**
     * Extract all data from loaded XML document
     * @returns {Object} Object containing arrays of all imported item types
     */
    extractAllData() {
        if (!this.xmlDoc) {
            throw new Error('No XML document loaded. Call loadXML() first.')
        }

        const results = {
            fertigkeiten: [],
            uebernatuerlicheFertigkeiten: [],
            waffeneigenschaften: [],
            waffen: [],
            ruestungen: [],
            talente: [],
            uebernatuerlicheTalente: [],
            manoever: [],
            vorteile: [],
            totalItems: 0,
        }

        // Extract skills
        try {
            const skillExtractor = new SkillExtractor(this.xmlDoc)
            const skills = skillExtractor.extract()
            results.fertigkeiten = skills.fertigkeiten
            results.uebernatuerlicheFertigkeiten = skills.uebernatuerlicheFertigkeiten
        } catch (error) {
            console.error('Error extracting skills:', error.message)
        }

        // Extract weapons
        try {
            const weaponExtractor = new WeaponExtractor(this.xmlDoc)
            const weapons = weaponExtractor.extract()
            results.waffeneigenschaften = weapons.waffeneigenschaften
            results.waffen = weapons.waffen
        } catch (error) {
            console.error('Error extracting weapons:', error.message)
        }

        // Extract armor
        try {
            const armorExtractor = new ArmorExtractor(this.xmlDoc)
            results.ruestungen = armorExtractor.extract()
        } catch (error) {
            console.error('Error extracting armor:', error.message)
        }

        // Extract talents
        try {
            const talentExtractor = new TalentExtractor(this.xmlDoc)
            const talents = talentExtractor.extract()
            results.talente = talents.talente
            results.uebernatuerlicheTalente = talents.uebernatuerlicheTalente
        } catch (error) {
            console.error('Error extracting talents:', error.message)
        }

        // Extract manöver
        try {
            const manoeverExtractor = new ManoeverExtractor(this.xmlDoc)
            results.manoever = manoeverExtractor.extract()
        } catch (error) {
            console.error('Error extracting manöver:', error.message)
        }

        // Extract vorteile
        try {
            const vorteilExtractor = new VorteilExtractor(this.xmlDoc)
            results.vorteile = vorteilExtractor.extract()
        } catch (error) {
            console.error('Error extracting vorteile:', error.message)
        }

        // Calculate totals
        results.totalItems =
            results.fertigkeiten.length +
            results.uebernatuerlicheFertigkeiten.length +
            results.waffeneigenschaften.length +
            results.waffen.length +
            results.ruestungen.length +
            results.talente.length +
            results.uebernatuerlicheTalente.length +
            results.manoever.length +
            results.vorteile.length

        return results
    }

    /**
     * Import all rule types from the loaded XML
     * @param {File} xmlFile - Browser File object (optional if provided in constructor)
     * @returns {Object} Object containing arrays of all imported item types
     */
    async importAllFromXML(xmlFile = null) {
        await this.loadXML(xmlFile)
        return this.extractAllData()
    }

    /**
     * Update existing compendiums with XML file data
     * @param {File} xmlFile - XML file object from file upload
     * @returns {Promise<Object>} Results of update operations
     */
    async updateAndSyncPacks(xmlFile) {
        try {
            // Extract filename without extension
            const xmlFileName = xmlFile.name.replace(/\.[^/.]+$/, '')

            // Read and parse file content
            const fileContent = await xmlFile.text()
            this.xmlDoc = await XMLParser.parseXMLString(fileContent)

            // Extract all data using the shared extraction method
            const importedData = this.extractAllData()

            // Update compendium packs
            const updateResults = await CompendiumUpdater.updateCompendiumPacks(
                importedData,
                xmlFileName,
            )

            // Show notification to user
            const totalOperations =
                updateResults.updated.length +
                updateResults.created.length +
                updateResults.deleted.length

            if (updateResults.errors.length === 0) {
                ui.notifications.info(
                    `Erfolgreich aktualisiert: ${updateResults.updated.length} aktualisiert, ${updateResults.created.length} erstellt, ${updateResults.deleted.length} gelöscht`,
                )
            } else {
                ui.notifications.warn(
                    `${totalOperations} Operationen mit ${updateResults.errors.length} Fehler(n)`,
                )
            }

            return {
                success: true,
                results: updateResults,
            }
        } catch (error) {
            console.error('Error in update and sync:', error)
            ui.notifications.error(`Fehler beim Aktualisieren der Regeln: ${error.message}`)
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Complete workflow: Import XML file and create compendiums
     * @param {File} xmlFile - XML file object from file upload
     * @returns {Promise<Object>} Results of import and pack creation
     */
    async importAndCreatePacks(xmlFile) {
        try {
            // Extract filename without extension
            const xmlFileName = xmlFile.name.replace(/\.[^/.]+$/, '')

            // Read and parse file content
            const fileContent = await xmlFile.text()
            this.xmlDoc = await XMLParser.parseXMLString(fileContent)

            // Extract all data using the shared extraction method
            const importedData = this.extractAllData()

            // Create compendium packs
            const packResults = await CompendiumCreator.createCompendiumPacks(
                importedData,
                xmlFileName,
            )

            // Show notification to user
            if (packResults.errors.length === 0) {
                ui.notifications.info(
                    `Erfolgreich ${packResults.createdPacks.length} Kompendien aus ${xmlFile.name} erstellt!`,
                )
            } else {
                ui.notifications.warn(
                    `${packResults.createdPacks.length} Kompendien erstellt mit ${packResults.errors.length} Fehler(n)`,
                )
            }

            return {
                success: true,
                imported: importedData,
                packs: packResults,
            }
        } catch (error) {
            console.error('Error in import and pack creation:', error)
            ui.notifications.error(`Fehler beim Importieren der Regeln: ${error.message}`)
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Show file upload dialog for XML rule import
     * Allows user to upload XML file and creates compendiums automatically
     */
    static async showRuleImportDialog() {
        await DialogHandler.showRuleImportDialog(async (file) => {
            const importer = new XMLRuleImporter()
            await importer.importAndCreatePacks(file)
        })
    }

    /**
     * Show file upload dialog for XML rule update
     * Allows user to upload XML file and updates existing compendiums
     */
    static async showRuleUpdateDialog() {
        await DialogHandler.showRuleImportDialog(async (file) => {
            const importer = new XMLRuleImporter()
            await importer.updateAndSyncPacks(file)
        })
    }
}

/**
 * Standalone function to import everything from XML file
 * @param {File} xmlFile - Browser File object from file input
 * @returns {Promise<Object>} Object containing all imported item types
 */
export async function importAllFromXML(xmlFile) {
    const importer = new XMLRuleImporter(xmlFile)
    return await importer.importAllFromXML()
}

// Export for use in hooks and other modules
export { DialogHandler } from './dialog-handler.js'
export * from './constants.js'
