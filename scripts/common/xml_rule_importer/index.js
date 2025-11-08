/**
 * XML Rule Importer for Ilaris FoundryVTT System
 * Main orchestrator that coordinates all import operations
 */

import { XMLParser } from './utils/xml-parser.js'
import { CompendiumCreator } from './utils/compendium-creator.js'
import { DialogHandler } from './dialog-handler.js'
import {
    SkillExtractor,
    WeaponExtractor,
    ArmorExtractor,
    TalentExtractor,
    ManoeverExtractor,
} from './extractors/index.js'

/**
 * Main XML Rule Importer class
 */
export class XMLRuleImporter {
    constructor(xmlFilePath = null) {
        this.xmlFilePath = xmlFilePath
        this.parsedXML = null
    }

    /**
     * Load and parse XML file
     */
    async loadXML() {
        this.parsedXML = await XMLParser.loadAndParseXML(this.xmlFilePath)
    }

    /**
     * Import all rule types from the loaded XML
     * @returns {Object} Object containing arrays of all imported item types
     */
    async importAllFromXML() {
        await this.loadXML()

        const results = {
            fertigkeiten: [],
            uebernatuerlicheFertigkeiten: [],
            waffeneigenschaften: [],
            waffen: [],
            ruestungen: [],
            talente: [],
            uebernatuerlicheTalente: [],
            manoever: [],
            totalItems: 0,
        }

        // Extract skills
        try {
            const skillExtractor = new SkillExtractor(this.parsedXML)
            const skills = skillExtractor.extract()
            results.fertigkeiten = skills.fertigkeiten
            results.uebernatuerlicheFertigkeiten = skills.uebernatuerlicheFertigkeiten
        } catch (error) {
            console.error('Error extracting skills:', error.message)
        }

        // Extract weapons
        try {
            const weaponExtractor = new WeaponExtractor(this.parsedXML)
            const weapons = weaponExtractor.extract()
            results.waffeneigenschaften = weapons.waffeneigenschaften
            results.waffen = weapons.waffen
        } catch (error) {
            console.error('Error extracting weapons:', error.message)
        }

        // Extract armor
        try {
            const armorExtractor = new ArmorExtractor(this.parsedXML)
            results.ruestungen = armorExtractor.extract()
        } catch (error) {
            console.error('Error extracting armor:', error.message)
        }

        // Extract talents
        try {
            const talentExtractor = new TalentExtractor(this.parsedXML)
            const talents = talentExtractor.extract()
            results.talente = talents.talente
            results.uebernatuerlicheTalente = talents.uebernatuerlicheTalente
        } catch (error) {
            console.error('Error extracting talents:', error.message)
        }

        // Extract manöver
        try {
            const manoeverExtractor = new ManoeverExtractor(this.parsedXML)
            results.manoever = manoeverExtractor.extract()
        } catch (error) {
            console.error('Error extracting manöver:', error.message)
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
            results.manoever.length

        return results
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
            this.parsedXML = await XMLParser.parseXMLString(fileContent)

            // Extract all data using extractors
            const importedData = {
                fertigkeiten: [],
                uebernatuerlicheFertigkeiten: [],
                waffeneigenschaften: [],
                waffen: [],
                ruestungen: [],
                talente: [],
                uebernatuerlicheTalente: [],
                manoever: [],
                totalItems: 0,
            }

            // Extract skills
            try {
                const skillExtractor = new SkillExtractor(this.parsedXML)
                const skills = skillExtractor.extract()
                importedData.fertigkeiten = skills.fertigkeiten
                importedData.uebernatuerlicheFertigkeiten = skills.uebernatuerlicheFertigkeiten
            } catch (error) {
                console.error('Error extracting skills:', error.message)
            }

            // Extract weapons
            try {
                const weaponExtractor = new WeaponExtractor(this.parsedXML)
                const weapons = weaponExtractor.extract()
                importedData.waffeneigenschaften = weapons.waffeneigenschaften
                importedData.waffen = weapons.waffen
            } catch (error) {
                console.error('Error extracting weapons:', error.message)
            }

            // Extract armor
            try {
                const armorExtractor = new ArmorExtractor(this.parsedXML)
                importedData.ruestungen = armorExtractor.extract()
            } catch (error) {
                console.error('Error extracting armor:', error.message)
            }

            // Extract talents
            try {
                const talentExtractor = new TalentExtractor(this.parsedXML)
                const talents = talentExtractor.extract()
                importedData.talente = talents.talente
                importedData.uebernatuerlicheTalente = talents.uebernatuerlicheTalente
            } catch (error) {
                console.error('Error extracting talents:', error.message)
            }

            // Extract manöver
            try {
                const manoeverExtractor = new ManoeverExtractor(this.parsedXML)
                importedData.manoever = manoeverExtractor.extract()
            } catch (error) {
                console.error('Error extracting manöver:', error.message)
            }

            // Calculate totals
            importedData.totalItems =
                importedData.fertigkeiten.length +
                importedData.uebernatuerlicheFertigkeiten.length +
                importedData.waffeneigenschaften.length +
                importedData.waffen.length +
                importedData.ruestungen.length +
                importedData.talente.length +
                importedData.uebernatuerlicheTalente.length +
                importedData.manoever.length

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
}

/**
 * Standalone function to import everything from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @returns {Promise<Object>} Object containing all imported item types
 */
export async function importAllFromXML(xmlFilePath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importAllFromXML()
}

// Export for use in hooks and other modules
export { DialogHandler } from './dialog-handler.js'
export * from './constants.js'
