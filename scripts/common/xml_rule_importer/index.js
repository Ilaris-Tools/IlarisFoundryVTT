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
     * Import all rule types from the loaded XML
     * @param {File} xmlFile - Browser File object (optional if provided in constructor)
     * @returns {Object} Object containing arrays of all imported item types
     */
    async importAllFromXML(xmlFile = null) {
        await this.loadXML(xmlFile)

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
                vorteile: [],
                totalItems: 0,
            }

            // Extract skills
            try {
                const skillExtractor = new SkillExtractor(this.xmlDoc)
                const skills = skillExtractor.extract()
                importedData.fertigkeiten = skills.fertigkeiten
                importedData.uebernatuerlicheFertigkeiten = skills.uebernatuerlicheFertigkeiten
            } catch (error) {
                console.error('Error extracting skills:', error.message)
            }

            // Extract weapons
            try {
                const weaponExtractor = new WeaponExtractor(this.xmlDoc)
                const weapons = weaponExtractor.extract()
                importedData.waffeneigenschaften = weapons.waffeneigenschaften
                importedData.waffen = weapons.waffen
            } catch (error) {
                console.error('Error extracting weapons:', error.message)
            }

            // Extract armor
            try {
                const armorExtractor = new ArmorExtractor(this.xmlDoc)
                importedData.ruestungen = armorExtractor.extract()
            } catch (error) {
                console.error('Error extracting armor:', error.message)
            }

            // Extract talents
            try {
                const talentExtractor = new TalentExtractor(this.xmlDoc)
                const talents = talentExtractor.extract()
                importedData.talente = talents.talente
                importedData.uebernatuerlicheTalente = talents.uebernatuerlicheTalente
            } catch (error) {
                console.error('Error extracting talents:', error.message)
            }

            // Extract manöver
            try {
                const manoeverExtractor = new ManoeverExtractor(this.xmlDoc)
                importedData.manoever = manoeverExtractor.extract()
            } catch (error) {
                console.error('Error extracting manöver:', error.message)
            }

            // Extract vorteile
            try {
                const vorteilExtractor = new VorteilExtractor(this.xmlDoc)
                importedData.vorteile = vorteilExtractor.extract()
            } catch (error) {
                console.error('Error extracting vorteile:', error.message)
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
                importedData.manoever.length +
                importedData.vorteile.length

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
