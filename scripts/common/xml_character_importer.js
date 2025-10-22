import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from './../settings/configure-game-settings.model.js'
import { XmlCharacterImportDialogs } from './xml-character-import-dialogs.js'

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

            // Show confirmation dialog with details of what will be imported and what's missing
            const importAnalysis = await this.analyzeImportData(characterData)
            const confirmed = await XmlCharacterImportDialogs.showImportConfirmationDialog(
                characterData,
                fileName,
                importAnalysis,
            )
            if (!confirmed) {
                ui.notifications.info('Charakter-Import vom Benutzer abgebrochen.')
                return null
            }

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
     * @param {string} fileName - The name of the XML file being imported
     * @returns {Promise<Actor>} The updated actor
     */
    async updateActorFromXml(actor, xmlContent, fileName = 'XML file') {
        try {
            const xmlDoc = this.xmlParser.parseFromString(xmlContent, 'text/xml')
            const characterData = this.parseCharacterXml(xmlDoc)

            // Show confirmation dialog with details of what will be changed
            const confirmed = await XmlCharacterImportDialogs.showSyncConfirmationDialog(
                actor,
                characterData,
                fileName,
            )
            if (!confirmed) {
                ui.notifications.info('Charakter-Synchronisation vom Benutzer abgebrochen.')
                return actor
            }

            // Update actor system data (attributes, energies, etc.)
            const updates = await this.createActorUpdatesFromXml(characterData)
            await actor.update(updates)

            // Remove ALL character-related items (skills, talents, advantages, weapons)
            // but preserve inventory items (gegenstand type items without XML flag)
            await this.syncAllCharacterItems(actor, characterData)

            ui.notifications.info(`Charakter "${actor.name}" erfolgreich synchronisiert!`)
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
            supernaturalSkills: [],
            talents: [],
            supernaturalTalents: [], // Add supernatural talents (zauber/liturgie)
            advantages: [],
            weapons: [],
            energies: {},
            experience: { total: 0, spent: 0 },
            description: {},
            eigenheiten: [], // Character quirks/traits
            notes: '',
            freeSkills: [], // Free skills (Freie Fertigkeiten)
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

            // Extract eigenheiten (character quirks/traits)
            const eigenheitenNodes = description.querySelectorAll('Eigenheiten > Eigenheit')
            eigenheitenNodes.forEach((eigenheitNode) => {
                const eigenheitText = eigenheitNode.textContent.trim()
                if (eigenheitText) {
                    let name, text

                    // Check if the eigenheit has a name (contains ":")
                    const colonIndex = eigenheitText.indexOf(':')
                    if (colonIndex > 0) {
                        name = eigenheitText.substring(0, colonIndex).trim()
                        text = eigenheitText.substring(colonIndex + 1).trim()
                    } else {
                        // No colon, use first word as name and full text as content
                        const firstWord = eigenheitText.split(/\s+/)[0]
                        name = firstWord
                        text = eigenheitText
                    }

                    if (name && text) {
                        characterData.eigenheiten.push({ name, text })
                    }
                }
            })
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

        // Extract free skills (Freie Fertigkeiten)
        const freeSkillNodes = xmlDoc.querySelectorAll('FreieFertigkeiten > FreieFertigkeit')
        freeSkillNodes.forEach((freeSkill) => {
            const name = freeSkill.getAttribute('name')
            const value = parseInt(freeSkill.getAttribute('wert')) || 0
            if (name) {
                characterData.freeSkills.push({ name, value })
            }
        })

        // Extract talents - determine type during XML parsing
        const talentNodes = xmlDoc.querySelectorAll('Talente > Talent')
        talentNodes.forEach((talent) => {
            const name = talent.getAttribute('name')
            if (name) {
                // Add to both arrays for now - we'll determine type during processing
                characterData.talents.push({ name })
                characterData.supernaturalTalents.push({ name })
            }
        })

        // Filter supernatural skills - only include those with positive values
        // The required skills will be determined when we match supernatural talents
        const supernaturalSkillNodes = xmlDoc.querySelectorAll(
            'ÜbernatürlicheFertigkeiten > ÜbernatürlicheFertigkeit',
        )
        supernaturalSkillNodes.forEach((skill) => {
            const name = skill.getAttribute('name')
            const value = parseInt(skill.getAttribute('wert')) || 0

            if (name && value > 0) {
                characterData.supernaturalSkills.push({ name, value })
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

        console.debug('Parsed character data:', characterData)
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
            CH: 'CH',
            FF: 'FF',
            GE: 'GE',
            IN: 'IN',
            KK: 'KK',
            KL: 'KL',
            KO: 'KO',
            MU: 'MU',
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
            CH: 'CH',
            FF: 'FF',
            GE: 'GE',
            IN: 'IN',
            KK: 'KK',
            KL: 'KL',
            KO: 'KO',
            MU: 'MU',
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

        console.debug('Actor update data:', updates)
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
            'manoever',
            // Note: eigenheit is NOT included here - they are preserved and only replaced on exact duplicates
        ]

        // Define which item types should be preserved (inventory and equipment items)
        const preservedItemTypes = [
            'gegenstand', // Regular items/objects
            'ruestung', // Armor pieces
            'nahkampfwaffe', // Melee weapons
            'fernkampfwaffe', // Ranged weapons
            // Add any other inventory-related item types that should be preserved
        ]

        // Get items that should be removed (only character-related items, preserve everything else)
        const itemsToDelete = actor.items
            .filter((item) => {
                // Only delete items that are explicitly character-related AND not marked for preservation
                return (
                    characterItemTypes.includes(item.type) &&
                    !preservedItemTypes.includes(item.type)
                )
            })
            .map((item) => item.id)

        // Get items that will be preserved (both explicit preserved types and any other types not in character types)
        const preservedItems = actor.items.filter(
            (item) =>
                preservedItemTypes.includes(item.type) || !characterItemTypes.includes(item.type),
        )

        console.debug(
            `Sync: Removing ${itemsToDelete.length} character items, preserving ${preservedItems.length} inventory items`,
        )

        // Delete old character items (preserve inventory items like 'gegenstand', 'ruestung')
        if (itemsToDelete.length > 0) {
            await actor.deleteEmbeddedDocuments('Item', itemsToDelete)
        }

        // Add new items with XML import flag (skip inventory items for sync)
        await this.addItemsToActor(actor, characterData, true, true)

        console.debug(`Sync complete: Added new character data, preserved inventory and notes`)
    }

    /**
     * Add items (skills, talents, advantages) to the actor
     * @param {Actor} actor - The created actor
     * @param {Object} characterData - Parsed character data
     * @param {boolean} markAsImported - Whether to flag items as XML imported
     * @param {boolean} skipInventoryItems - Whether to skip weapons and armor (for sync operations)
     */
    async addItemsToActor(
        actor,
        characterData,
        markAsImported = false,
        skipInventoryItems = false,
    ) {
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
                        attribut_0: 'CH',
                        attribut_1: 'CH',
                        attribut_2: 'CH',
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

        // Process free skills (Freie Fertigkeiten)
        // These do not exist in compendiums, so we always create them directly
        for (const freeSkill of characterData.freeSkills) {
            const freeSkillData = {
                name: freeSkill.name,
                type: 'freie_fertigkeit',
                system: {
                    stufe: freeSkill.value,
                    gruppe: '1',
                },
            }
            if (markAsImported) {
                freeSkillData.flags = { ilaris: { xmlImported: true } }
            }
            itemsToCreate.push(freeSkillData)
        }

        // First pass: Process supernatural talents (zauber and liturgie) and collect required supernatural skills
        const requiredSupernaturalSkills = new Set()
        const processedTalents = new Set()

        for (const supernaturalTalent of characterData.supernaturalTalents) {
            // Check if this talent is a supernatural talent (zauber or liturgie)
            const foundSpell = await this.findItemInCompendium(supernaturalTalent.name, [
                'zauber',
                'liturgie',
            ])
            if (foundSpell) {
                const talentData = foundSpell.toObject()
                if (markAsImported) {
                    talentData.flags = { ilaris: { xmlImported: true } }
                }
                itemsToCreate.push(talentData)
                processedTalents.add(supernaturalTalent.name)

                // Extract required supernatural skills from the talent's fertigkeiten property
                if (talentData.system && talentData.system.fertigkeiten) {
                    const skillNames = talentData.system.fertigkeiten
                        .split(',')
                        .map((name) => name.trim())
                    skillNames.forEach((skillName) => {
                        if (skillName) {
                            requiredSupernaturalSkills.add(skillName)
                        }
                    })
                }
            }
        }

        // Second pass: Process regular talents (but skip those already processed as supernatural talents)
        for (const talent of characterData.talents) {
            if (processedTalents.has(talent.name)) {
                continue // Skip talents already processed as supernatural talents
            }

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

        // Process supernatural skills (Übernatürliche Fertigkeiten) - only those required by supernatural talents
        for (const supernaturalSkill of characterData.supernaturalSkills) {
            // Only include supernatural skills that are required by supernatural talents
            if (!requiredSupernaturalSkills.has(supernaturalSkill.name)) {
                console.debug(
                    `Skipping supernatural skill ${supernaturalSkill.name} - not required by any supernatural talent`,
                )
                continue
            }

            const foundSkill = await this.findItemInCompendium(
                supernaturalSkill.name,
                'uebernatuerliche_fertigkeit',
            )
            if (foundSkill) {
                const skillData = foundSkill.toObject()
                skillData.system.fw = supernaturalSkill.value
                skillData.system.basis = 0 // Reset basis value from XML
                if (markAsImported) {
                    skillData.flags = { ilaris: { xmlImported: true } }
                }
                itemsToCreate.push(skillData)
            } else {
                // Try to create a custom supernatural skill if not found
                console.warn(
                    `Supernatural skill not found in compendium: ${supernaturalSkill.name}, creating custom skill`,
                )
                const customSkill = {
                    name: supernaturalSkill.name,
                    type: 'uebernatuerliche_fertigkeit',
                    system: {
                        fw: supernaturalSkill.value,
                        basis: 0,
                        pw: 0,
                        attribut_0: 'CH',
                        attribut_1: 'CH',
                        attribut_2: 'CH',
                        gruppe: -1,
                        text: 'Imported from XML',
                        voraussetzung: '',
                    },
                }
                if (markAsImported) {
                    customSkill.flags = { ilaris: { xmlImported: true } }
                }
                itemsToCreate.push(customSkill)
            }
        }

        // Process weapons (skip during sync operations to preserve existing inventory)
        if (!skipInventoryItems) {
            for (const weapon of characterData.weapons) {
                if (weapon.name) {
                    // Skip empty weapons
                    const foundWeapon = await this.findWeaponInCompendium(weapon.id)
                    if (foundWeapon) {
                        const weaponData = foundWeapon.toObject()
                        if (markAsImported) {
                            weaponData.flags = { ilaris: { xmlImported: true } }
                        }
                        itemsToCreate.push(weaponData)
                    } else {
                        console.warn(
                            `Weapon not found in compendium: ${weapon.name} (ID: ${weapon.id})`,
                        )
                    }
                }
            }
        } else {
            console.debug('Skipping weapons during sync - preserving existing inventory')
        }

        // Process eigenheiten (character quirks/traits) with duplicate detection
        const eigenheitenToDelete = []

        for (const eigenheit of characterData.eigenheiten) {
            // Normalize text for comparison (remove newlines, extra spaces)
            const normalizedImportText = eigenheit.text.replace(/\s+/g, ' ').trim()

            // Check for existing eigenheiten with same name and text
            const existingEigenheit = actor.items.find(
                (item) =>
                    item.type === 'eigenheit' &&
                    item.name === eigenheit.name &&
                    item.system.text &&
                    item.system.text.replace(/\s+/g, ' ').trim() === normalizedImportText,
            )

            if (existingEigenheit) {
                // Mark existing eigenheit for deletion (will be replaced)
                eigenheitenToDelete.push(existingEigenheit.id)
                console.debug(
                    `Found duplicate eigenheit "${eigenheit.name}", will replace existing one`,
                )
            }

            // Create new eigenheit item
            const eigenheitData = {
                name: eigenheit.name,
                type: 'eigenheit',
                system: {
                    text: eigenheit.text,
                },
            }

            if (markAsImported) {
                eigenheitData.flags = { ilaris: { xmlImported: true } }
            }

            itemsToCreate.push(eigenheitData)
        }

        // Delete duplicate eigenheiten before creating new ones
        if (eigenheitenToDelete.length > 0) {
            await actor.deleteEmbeddedDocuments('Item', eigenheitenToDelete)
            console.debug(`Deleted ${eigenheitenToDelete.length} duplicate eigenheiten`)
        }

        // Create all items at once
        if (itemsToCreate.length > 0) {
            await actor.createEmbeddedDocuments('Item', itemsToCreate)
        }
    }

    /**
     * Find a weapon in the compendiums by matching XML weapon ID with compendium item name
     * @param {string} weaponId - Weapon ID from XML to match with compendium item name
     * @returns {Promise<Item|null>} Found weapon or null
     */
    async findWeaponInCompendium(weaponId) {
        if (!weaponId) {
            return null
        }

        // Search through ALL compendium packs that have items (both system and world)
        const compendiumsToSearch = []

        // Get all compendium packs and filter for those that contain items
        for (const pack of game.packs) {
            try {
                // Load the compendium index to check if it has items
                await pack.getIndex()

                // Only include packs that have items and are item-type packs
                if (pack.index && pack.index.size > 0 && pack.documentName === 'Item') {
                    compendiumsToSearch.push(pack)
                }
            } catch (error) {
                console.warn(`Could not load compendium ${pack.metadata.id}:`, error)
            }
        }

        for (const pack of compendiumsToSearch) {
            try {
                // Search for weapon items where the compendium item name matches the XML weapon ID
                for (const indexEntry of pack.index) {
                    // Check if this is a weapon type and if the name matches the weaponId
                    if (
                        (indexEntry.type === 'nahkampfwaffe' ||
                            indexEntry.type === 'fernkampfwaffe') &&
                        indexEntry.name === weaponId
                    ) {
                        const item = await pack.getDocument(indexEntry._id)
                        if (item) {
                            console.debug(
                                `Found weapon with ID match: "${weaponId}" in compendium "${pack.metadata.label}" (${pack.metadata.id})`,
                            )
                            return item
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error searching compendium ${pack.metadata.id}:`, error)
                continue
            }
        }

        return null
    }

    /**
     * Find an item in the compendiums by name and type
     * @param {string} itemName - Name of the item to find
     * @param {string|Array} itemType - Type(s) of the item
     * @returns {Promise<Item|null>} Found item or null
     */
    async findItemInCompendium(itemName, itemType) {
        const typesToSearch = Array.isArray(itemType) ? itemType : [itemType]

        // Search through ALL compendium packs that have items (both system and world)
        const compendiumsToSearch = []

        // Get all compendium packs and filter for those that contain items
        for (const pack of game.packs) {
            try {
                // Load the compendium index to check if it has items
                await pack.getIndex()

                // Only include packs that have items and are item-type packs
                if (pack.index && pack.index.size > 0 && pack.documentName === 'Item') {
                    compendiumsToSearch.push(pack)
                }
            } catch (error) {
                console.warn(`Could not load compendium ${pack.metadata.id}:`, error)
            }
        }

        for (const pack of compendiumsToSearch) {
            try {
                // Search for item by name and type
                for (const indexEntry of pack.index) {
                    // Try exact match first
                    if (indexEntry.name === itemName && typesToSearch.includes(indexEntry.type)) {
                        const item = await pack.getDocument(indexEntry._id)
                        if (item) {
                            console.debug(
                                `Found item "${itemName}" in compendium "${pack.metadata.label}" (${pack.metadata.id})`,
                            )
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
                            console.debug(
                                `Found item "${itemName}" (case-insensitive) in compendium "${pack.metadata.label}" (${pack.metadata.id})`,
                            )
                            return item
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error searching compendium ${pack.metadata.id}:`, error)
                continue
            }
        }

        return null
    }

    /**
     * Analyze what items will be found vs missing in compendiums
     * @param {Object} characterData - The parsed character data from XML
     * @returns {Promise<Object>} Analysis of what will be found vs missing
     */
    async analyzeImportData(characterData) {
        const analysis = {
            skills: { found: [], missing: [] },
            talents: { found: [], missing: [], total: 0 },
            advantages: { found: [], missing: [] },
            supernaturalSkills: { found: [], missing: [], total: 0 },
            weapons: { found: [], missing: [] },
            freeSkills: { total: 0 }, // Free skills are always created directly
        }

        // Analyze skills
        for (const skill of characterData.skills) {
            const found = await this.findItemInCompendium(skill.name, 'fertigkeit')
            if (found) {
                analysis.skills.found.push(skill.name)
            } else {
                analysis.skills.missing.push(skill.name)
            }
        }

        // Analyze talents (both regular and supernatural)
        const processedTalentNames = new Set()

        // Check supernatural talents first
        for (const supernaturalTalent of characterData.supernaturalTalents) {
            if (!processedTalentNames.has(supernaturalTalent.name)) {
                const found = await this.findItemInCompendium(supernaturalTalent.name, [
                    'zauber',
                    'liturgie',
                ])
                if (found) {
                    analysis.talents.found.push(supernaturalTalent.name)
                    processedTalentNames.add(supernaturalTalent.name)
                }
            }
        }

        // Check regular talents (skip those already processed as supernatural)
        for (const talent of characterData.talents) {
            if (!processedTalentNames.has(talent.name)) {
                const found = await this.findItemInCompendium(talent.name, 'talent')
                if (found) {
                    analysis.talents.found.push(talent.name)
                } else {
                    analysis.talents.missing.push(talent.name)
                }
                processedTalentNames.add(talent.name)
            }
        }

        analysis.talents.total = processedTalentNames.size

        // Analyze advantages
        for (const advantage of characterData.advantages) {
            const found = await this.findItemInCompendium(advantage.name, 'vorteil')
            if (found) {
                analysis.advantages.found.push(advantage.name)
            } else {
                analysis.advantages.missing.push(advantage.name)
            }
        }

        // Analyze supernatural skills (only those with positive values)
        const supernaturalSkillsWithValues = characterData.supernaturalSkills.filter(
            (skill) => skill.value > 0,
        )
        analysis.supernaturalSkills.total = supernaturalSkillsWithValues.length

        for (const supernaturalSkill of supernaturalSkillsWithValues) {
            const found = await this.findItemInCompendium(
                supernaturalSkill.name,
                'uebernatuerliche_fertigkeit',
            )
            if (found) {
                analysis.supernaturalSkills.found.push(supernaturalSkill.name)
            } else {
                analysis.supernaturalSkills.missing.push(supernaturalSkill.name)
            }
        }

        for (const weapon of characterData.weapons) {
            const found = await this.findWeaponInCompendium(weapon.id)
            if (found) {
                analysis.weapons.found.push(weapon.name)
            } else {
                analysis.weapons.missing.push(weapon.name)
            }
        }

        // Count free skills (these are always created directly, no compendium lookup needed)
        analysis.freeSkills.total = characterData.freeSkills.length

        return analysis
    }

    /**
     * Show file upload dialog for XML import
     */
    static async showImportDialog() {
        return await XmlCharacterImportDialogs.showImportDialog()
    }

    /**
     * Show file upload dialog for XML sync with existing actor
     * @param {Actor} actor - The actor to sync
     */
    static async showSyncDialog(actor) {
        return await XmlCharacterImportDialogs.showSyncDialog(actor)
    }
}
