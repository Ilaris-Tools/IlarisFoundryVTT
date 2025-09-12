import { ILARIS } from '../config.js'

/**
 * XML Character Importer for Ilaris System
 * Imports character data from external character creation tool XML files
 */
export class XmlCharacterImporter {
    constructor() {
        this.xmlParser = new DOMParser()
    }

    /**
     * Parse XML character file and create a new actor
     * @param {string} xmlContent - The XML content as a string
     * @param {string} fileName - The name of the uploaded file (for character name fallback)
     * @returns {Promise<Actor>} The created actor
     */
    async importCharacterFromXml(xmlContent, fileName = 'Imported Character') {
        try {
            const xmlDoc = this.xmlParser.parseFromString(xmlContent, 'text/xml')
            const characterData = this.parseCharacterXml(xmlDoc)

            // Create base actor data
            const actorData = await this.createActorDataFromXml(characterData, fileName)

            // Create the actor
            const actor = await Actor.create(actorData)

            // Add items (skills, talents, advantages, etc.)
            await this.addItemsToActor(actor, characterData)

            ui.notifications.info(`Character "${actor.name}" imported successfully!`)
            return actor
        } catch (error) {
            console.error('Error importing character from XML:', error)
            ui.notifications.error(`Error importing character: ${error.message}`)
            throw error
        }
    }

    /**
     * Update an existing actor with XML data
     * @param {Actor} actor - The existing actor to update
     * @param {string} xmlContent - The XML content as a string
     * @returns {Promise<Actor>} The updated actor
     */
    async updateActorFromXml(actor, xmlContent) {
        try {
            const xmlDoc = this.xmlParser.parseFromString(xmlContent, 'text/xml')
            const characterData = this.parseCharacterXml(xmlDoc)

            // Update actor system data (attributes, energies, etc.)
            const updates = await this.createActorUpdatesFromXml(characterData)
            await actor.update(updates)

            // Remove ALL character-related items (skills, talents, advantages, weapons)
            // but preserve inventory items (gegenstand type items without XML flag)
            await this.syncAllCharacterItems(actor, characterData)

            ui.notifications.info(`Character "${actor.name}" synced successfully!`)
            return actor
        } catch (error) {
            console.error('Error syncing character from XML:', error)
            ui.notifications.error(`Error syncing character: ${error.message}`)
            throw error
        }
    }

    /**
     * Parse the XML document and extract character data
     * @param {Document} xmlDoc - Parsed XML document
     * @returns {Object} Character data object
     */
    parseCharacterXml(xmlDoc) {
        const characterData = {
            name: '',
            attributes: {},
            skills: [],
            talents: [],
            advantages: [],
            weapons: [],
            energies: {},
            experience: { total: 0, spent: 0 },
            description: {},
            notes: '',
        }

        // Extract basic character info
        const description = xmlDoc.querySelector('Beschreibung')
        if (description) {
            characterData.name = this.getTextContent(description, 'Name') || 'Unnamed Character'
            characterData.description.spezies = this.getTextContent(description, 'Spezies')
            characterData.description.status = this.getTextContent(description, 'Status')
            characterData.description.heimat = this.getTextContent(description, 'Heimat')
            characterData.description.kurzbeschreibung = this.getTextContent(
                description,
                'Kurzbeschreibung',
            )
            characterData.description.finanzen = this.getTextContent(description, 'Finanzen')
        }

        // Extract attributes
        const attributeNodes = xmlDoc.querySelectorAll('Attribute > Attribut')
        attributeNodes.forEach((attr) => {
            const name = attr.getAttribute('name')
            const value = parseInt(attr.getAttribute('wert')) || 0
            if (name) {
                characterData.attributes[name] = value
            }
        })

        // Extract energies (AsP, KaP, etc.)
        const energyNodes = xmlDoc.querySelectorAll('Energien > Energie')
        energyNodes.forEach((energy) => {
            const name = energy.getAttribute('name')
            const value = parseInt(energy.getAttribute('wert')) || 0
            const bound = parseInt(energy.getAttribute('gebunden')) || 0
            if (name) {
                characterData.energies[name] = { value, bound }
            }
        })

        // Extract skills
        const skillNodes = xmlDoc.querySelectorAll('Fertigkeiten > Fertigkeit')
        skillNodes.forEach((skill) => {
            const name = skill.getAttribute('name')
            const value = parseInt(skill.getAttribute('wert')) || 0
            if (name) {
                characterData.skills.push({ name, value })
            }
        })

        // Extract talents
        const talentNodes = xmlDoc.querySelectorAll('Talente > Talent')
        talentNodes.forEach((talent) => {
            const name = talent.getAttribute('name')
            if (name) {
                characterData.talents.push({ name })
            }
        })

        // Extract advantages
        const advantageNodes = xmlDoc.querySelectorAll('Vorteile > Vorteil')
        advantageNodes.forEach((advantage) => {
            const name = advantage.getAttribute('name')
            if (name) {
                characterData.advantages.push({ name })
            }
        })

        // Extract weapons
        const weaponNodes = xmlDoc.querySelectorAll('Objekte > Waffen > Waffe')
        weaponNodes.forEach((weapon) => {
            const name = weapon.getAttribute('name')
            if (name && name.trim()) {
                const weaponData = {
                    name,
                    id: weapon.getAttribute('id'),
                    wuerfel: parseInt(weapon.getAttribute('würfel')) || 0,
                    wuerfelSeiten: parseInt(weapon.getAttribute('würfelSeiten')) || 6,
                    plus: parseInt(weapon.getAttribute('plus')) || 0,
                    eigenschaften: weapon.getAttribute('eigenschaften') || '',
                    haerte: parseInt(weapon.getAttribute('härte')) || 0,
                    rw: parseInt(weapon.getAttribute('rw')) || 0,
                    kampfstil: weapon.getAttribute('kampfstil') || '',
                    wm: parseInt(weapon.getAttribute('wm')) || 0,
                    wmVt: parseInt(weapon.getAttribute('wmVt')) || 0,
                }
                characterData.weapons.push(weaponData)
            }
        })

        // Extract experience
        const experienceNode = xmlDoc.querySelector('Erfahrung')
        if (experienceNode) {
            characterData.experience.total =
                parseInt(this.getTextContent(experienceNode, 'Gesamt')) || 0
            characterData.experience.spent =
                parseInt(this.getTextContent(experienceNode, 'Ausgegeben')) || 0
        }

        // Extract notes
        const notesNode = xmlDoc.querySelector('Notiz')
        if (notesNode) {
            characterData.notes = notesNode.textContent || ''
        }

        console.log('Parsed character data:', characterData)
        return characterData
    }

    /**
     * Helper method to get text content from XML elements
     * @param {Element} parent - Parent element
     * @param {string} tagName - Tag name to search for
     * @returns {string} Text content or empty string
     */
    getTextContent(parent, tagName) {
        const element = parent.querySelector(tagName)
        return element ? element.textContent.trim() : ''
    }

    /**
     * Create Foundry actor data from parsed XML character data
     * @param {Object} characterData - Parsed character data
     * @param {string} fileName - Fallback name
     * @returns {Object} Actor data for Foundry
     */
    async createActorDataFromXml(characterData, fileName) {
        const actorData = {
            name: characterData.name || fileName.replace(/\.[^/.]+$/, ''),
            type: 'held',
            system: {
                attribute: {},
                energien: {
                    asp: { max: 0, value: 0, threshold: 0 },
                    kap: { max: 0, value: 0, threshold: 0 },
                    gup: { max: 0, value: 0, threshold: 0 },
                },
                notes: characterData.notes || '',
            },
        }

        // Map XML attributes to Foundry system
        const attributeMapping = {
            KO: 'KO',
            MU: 'MU',
            GE: 'GE',
            KK: 'KK',
            IN: 'IN',
            KL: 'KL',
            CH: 'CH',
            FF: 'FF',
        }

        Object.entries(attributeMapping).forEach(([xmlName, systemName]) => {
            const value = characterData.attributes[xmlName] || 0
            actorData.system.attribute[systemName] = {
                wert: value,
                pw: 0, // Will be calculated by the system
            }
        })

        // Map energies
        if (characterData.energies.AsP) {
            actorData.system.energien.asp.max = characterData.energies.AsP.value
            actorData.system.energien.asp.value = characterData.energies.AsP.value
        }

        // Note: KaP and other energies can be added similarly if they exist in the XML

        return actorData
    }

    /**
     * Create update data for an existing actor from XML character data
     * @param {Object} characterData - Parsed character data
     * @returns {Object} Update data for Foundry
     */
    async createActorUpdatesFromXml(characterData) {
        const updates = {
            // Update the character name from XML
            name: characterData.name,
            system: {
                attribute: {},
                energien: {
                    asp: { max: 0, value: 0, threshold: 0 },
                    kap: { max: 0, value: 0, threshold: 0 },
                    gup: { max: 0, value: 0, threshold: 0 },
                },
                // Note: Deliberately NOT updating notes to preserve manual entries
            },
        }

        // Map XML attributes to Foundry system
        const attributeMapping = {
            KO: 'KO',
            MU: 'MU',
            GE: 'GE',
            KK: 'KK',
            IN: 'IN',
            KL: 'KL',
            CH: 'CH',
            FF: 'FF',
        }

        Object.entries(attributeMapping).forEach(([xmlName, systemName]) => {
            const value = characterData.attributes[xmlName] || 0
            updates.system.attribute[systemName] = {
                wert: value,
                pw: 0, // Will be calculated by the system
            }
        })

        // Map energies
        if (characterData.energies.AsP) {
            updates.system.energien.asp = {
                max: characterData.energies.AsP.value,
                value: characterData.energies.AsP.value,
                threshold: 0,
            }
        }

        // Map other energies if they exist in XML
        if (characterData.energies.KaP) {
            updates.system.energien.kap = {
                max: characterData.energies.KaP.value,
                value: characterData.energies.KaP.value,
                threshold: 0,
            }
        }

        if (characterData.energies.GuP) {
            updates.system.energien.gup = {
                max: characterData.energies.GuP.value,
                value: characterData.energies.GuP.value,
                threshold: 0,
            }
        }

        console.log('Actor update data:', updates)
        return updates
    }

    /**
     * Sync all character items with XML data (removes character items, preserves inventory)
     * @param {Actor} actor - The actor to update
     * @param {Object} characterData - Parsed character data
     */
    async syncAllCharacterItems(actor, characterData) {
        // Define which item types should be removed/replaced from XML
        const characterItemTypes = [
            'fertigkeit',
            'talent',
            'freie_fertigkeit',
            'uebernatuerliche_fertigkeit',
            'zauber',
            'liturgie',
            'anrufung',
            'vorteil',
            'nahkampfwaffe',
            'fernkampfwaffe',
            'manoever',
        ]

        // Define which item types should be preserved (inventory items)
        const preservedItemTypes = ['gegenstand', 'ruestung']

        // Get items that should be removed (all character-related items)
        const itemsToDelete = actor.items
            .filter((item) => characterItemTypes.includes(item.type))
            .map((item) => item.id)

        // Get items that will be preserved
        const preservedItems = actor.items.filter((item) => preservedItemTypes.includes(item.type))

        console.log(
            `Sync: Removing ${itemsToDelete.length} character items, preserving ${preservedItems.length} inventory items`,
        )

        // Delete old character items (preserve inventory items like 'gegenstand', 'ruestung')
        if (itemsToDelete.length > 0) {
            await actor.deleteEmbeddedDocuments('Item', itemsToDelete)
        }

        // Add new items with XML import flag
        await this.addItemsToActor(actor, characterData, true)

        console.log(`Sync complete: Added new character data, preserved inventory and notes`)
    }

    /**
     * Add items (skills, talents, advantages) to the actor
     * @param {Actor} actor - The created actor
     * @param {Object} characterData - Parsed character data
     * @param {boolean} markAsImported - Whether to flag items as XML imported
     */
    async addItemsToActor(actor, characterData, markAsImported = false) {
        const itemsToCreate = []

        // Process skills
        for (const skill of characterData.skills) {
            const foundSkill = await this.findItemInCompendium(skill.name, 'fertigkeit')
            if (foundSkill) {
                const skillData = foundSkill.toObject()
                skillData.system.fw = skill.value
                skillData.system.basis = 0 // Reset basis value from XML
                if (markAsImported) {
                    skillData.flags = { ilaris: { xmlImported: true } }
                }
                itemsToCreate.push(skillData)
            } else {
                // Try to create a custom skill if not found
                console.warn(`Skill not found in compendium: ${skill.name}, creating custom skill`)
                const customSkill = {
                    name: skill.name,
                    type: 'fertigkeit',
                    system: {
                        fw: skill.value,
                        basis: 0,
                        pw: 0,
                        attribut_0: 'KO',
                        attribut_1: 'KO',
                        attribut_2: 'KO',
                        gruppe: -1,
                        text: 'Imported from XML',
                    },
                }
                if (markAsImported) {
                    customSkill.flags = { ilaris: { xmlImported: true } }
                }
                itemsToCreate.push(customSkill)
            }
        }

        // Process talents
        for (const talent of characterData.talents) {
            const foundTalent = await this.findItemInCompendium(talent.name, 'talent')
            if (foundTalent) {
                const talentData = foundTalent.toObject()
                if (markAsImported) {
                    talentData.flags = { ilaris: { xmlImported: true } }
                }
                itemsToCreate.push(talentData)
            } else {
                console.warn(`Talent not found in compendium: ${talent.name}`)
            }
        }

        // Process advantages
        for (const advantage of characterData.advantages) {
            const foundAdvantage = await this.findItemInCompendium(advantage.name, 'vorteil')
            if (foundAdvantage) {
                const advantageData = foundAdvantage.toObject()
                if (markAsImported) {
                    advantageData.flags = { ilaris: { xmlImported: true } }
                }
                itemsToCreate.push(advantageData)
            } else {
                console.warn(`Advantage not found in compendium: ${advantage.name}`)
            }
        }

        // Process weapons
        for (const weapon of characterData.weapons) {
            if (weapon.name && weapon.name !== 'Hand') {
                // Skip empty or hand weapons
                const foundWeapon = await this.findItemInCompendium(weapon.name, [
                    'nahkampfwaffe',
                    'fernkampfwaffe',
                ])
                if (foundWeapon) {
                    const weaponData = foundWeapon.toObject()
                    if (markAsImported) {
                        weaponData.flags = { ilaris: { xmlImported: true } }
                    }
                    itemsToCreate.push(weaponData)
                } else {
                    console.warn(`Weapon not found in compendium: ${weapon.name}`)
                }
            }
        }

        // Create all items at once
        if (itemsToCreate.length > 0) {
            await actor.createEmbeddedDocuments('Item', itemsToCreate)
        }
    }

    /**
     * Find an item in the compendiums by name and type
     * @param {string} itemName - Name of the item to find
     * @param {string|Array} itemType - Type(s) of the item
     * @returns {Promise<Item|null>} Found item or null
     */
    async findItemInCompendium(itemName, itemType) {
        const typesToSearch = Array.isArray(itemType) ? itemType : [itemType]

        // Search in all relevant compendiums
        const compendiumsToSearch = [
            'Ilaris.fertigkeiten-und-talente',
            'Ilaris.fertigkeiten-und-talente-advanced',
            'Ilaris.vorteile',
            'Ilaris.waffen',
        ]

        for (const compendiumId of compendiumsToSearch) {
            const pack = game.packs.get(compendiumId)
            if (!pack) {
                console.warn(`Compendium not found: ${compendiumId}`)
                continue
            }

            try {
                // Load the compendium index
                await pack.getIndex()

                // Search for item by name and type
                for (const indexEntry of pack.index) {
                    // Try exact match first
                    if (indexEntry.name === itemName && typesToSearch.includes(indexEntry.type)) {
                        const item = await pack.getDocument(indexEntry._id)
                        if (item) {
                            return item
                        }
                    }

                    // Try case-insensitive match
                    if (
                        indexEntry.name.toLowerCase() === itemName.toLowerCase() &&
                        typesToSearch.includes(indexEntry.type)
                    ) {
                        const item = await pack.getDocument(indexEntry._id)
                        if (item) {
                            return item
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error searching compendium ${compendiumId}:`, error)
                continue
            }
        }

        return null
    }

    /**
     * Show file upload dialog for XML import
     */
    static async showImportDialog() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.xml'
        input.style.display = 'none'

        return new Promise((resolve) => {
            input.onchange = async (event) => {
                const file = event.target.files[0]
                if (!file) {
                    resolve(null)
                    return
                }

                const reader = new FileReader()
                reader.onload = async (e) => {
                    try {
                        const importer = new XmlCharacterImporter()
                        const actor = await importer.importCharacterFromXml(
                            e.target.result,
                            file.name,
                        )
                        resolve(actor)
                    } catch (error) {
                        console.error('Import failed:', error)
                        resolve(null)
                    }
                }
                reader.readAsText(file)
            }

            document.body.appendChild(input)
            input.click()
            document.body.removeChild(input)
        })
    }

    /**
     * Show file upload dialog for XML sync with existing actor
     * @param {Actor} actor - The actor to sync
     */
    static async showSyncDialog(actor) {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.xml'
        input.style.display = 'none'

        return new Promise((resolve) => {
            input.onchange = async (event) => {
                const file = event.target.files[0]
                if (!file) {
                    resolve(null)
                    return
                }

                const reader = new FileReader()
                reader.onload = async (e) => {
                    try {
                        const importer = new XmlCharacterImporter()
                        const updatedActor = await importer.updateActorFromXml(
                            actor,
                            e.target.result,
                        )
                        resolve(updatedActor)
                    } catch (error) {
                        console.error('Sync failed:', error)
                        resolve(null)
                    }
                }
                reader.readAsText(file)
            }

            document.body.appendChild(input)
            input.click()
            document.body.removeChild(input)
        })
    }
}
