import * as fs from 'fs'
import * as xml2js from 'xml2js'

/**
 * XML Rule Importer for Ilaris FoundryVTT System
 * Converts XML rule files to Foundry compendium items
 */
export class XMLRuleImporter {
    constructor(xmlFilePath) {
        this.xmlFilePath = xmlFilePath
        this.xmlContent = null
        this.parsedXML = null
    }

    /**
     * Load and parse XML file
     */
    async loadXML() {
        try {
            this.xmlContent = fs.readFileSync(this.xmlFilePath, 'utf8')
            const parser = new xml2js.Parser({
                explicitArray: false,
                ignoreAttrs: false,
                mergeAttrs: true,
            })
            this.parsedXML = await parser.parseStringPromise(this.xmlContent)
            console.log('XML file loaded and parsed successfully')
        } catch (error) {
            console.error('Error loading XML file:', error)
            throw error
        }
    }

    /**
     * Generic method to extract elements from XML and convert to Foundry items
     * @param {string} xmlElementName - Name of XML element to extract (e.g., 'Fertigkeit', 'ÜbernatürlicheFertigkeit')
     * @param {string} foundryItemType - Foundry item type ('fertigkeit', 'uebernatuerliche_fertigkeit')
     * @returns {Array} Array of converted Foundry items
     */
    extractXMLElements(xmlElementName, foundryItemType) {
        if (!this.parsedXML) {
            throw new Error('XML not loaded. Call loadXML() first.')
        }

        const extractedItems = []

        // Navigate through the XML structure to find elements
        if (this.parsedXML.Datenbank && this.parsedXML.Datenbank[xmlElementName]) {
            const elements = Array.isArray(this.parsedXML.Datenbank[xmlElementName])
                ? this.parsedXML.Datenbank[xmlElementName]
                : [this.parsedXML.Datenbank[xmlElementName]]

            console.log(`Found ${elements.length} ${xmlElementName} elements in XML`)

            elements.forEach((element, index) => {
                try {
                    const foundryItem = this.convertXMLElementToFoundryItem(
                        element,
                        foundryItemType,
                        xmlElementName,
                    )
                    extractedItems.push(foundryItem)
                } catch (error) {
                    console.error(
                        `Error converting ${xmlElementName} at index ${index}:`,
                        error.message,
                    )
                    console.error('Element data:', JSON.stringify(element, null, 2))
                }
            })
        } else {
            console.warn(`No ${xmlElementName} elements found in XML`)
            if (this.parsedXML.Datenbank) {
                console.log(
                    'Available elements in Datenbank:',
                    Object.keys(this.parsedXML.Datenbank),
                )
            }
        }

        console.log(`Successfully extracted ${extractedItems.length} ${xmlElementName} items`)
        return extractedItems
    }

    /**
     * Extract Fertigkeit objects from XML and convert to Foundry items
     * @returns {Array} Array of Foundry fertigkeit items
     */
    extractFertigkeiten() {
        return this.extractXMLElements('Fertigkeit', 'fertigkeit')
    }

    /**
     * Extract ÜbernatürlicheFertigkeit objects from XML and convert to Foundry items
     * @returns {Array} Array of Foundry uebernatuerliche_fertigkeit items
     */
    extractUebernatuerlicheFertigkeiten() {
        return this.extractXMLElements('ÜbernatürlicheFertigkeit', 'uebernatuerliche_fertigkeit')
    }

    /**
     * Extract Waffeneigenschaft objects from XML and convert to Foundry items
     * @returns {Array} Array of Foundry waffeneigenschaft items
     */
    extractWaffeneigenschaften() {
        return this.extractXMLElements('Waffeneigenschaft', 'waffeneigenschaft')
    }

    /**
     * Extract Waffe objects from XML and convert to Foundry items
     * Automatically determines nahkampfwaffe vs fernkampfwaffe based on lz property
     * @returns {Array} Array of Foundry nahkampfwaffe and fernkampfwaffe items
     */
    extractWaffen() {
        if (!this.parsedXML) {
            throw new Error('XML not loaded. Call loadXML() first.')
        }

        const waffen = []

        // Navigate through the XML structure to find Waffe elements
        if (this.parsedXML.Datenbank && this.parsedXML.Datenbank.Waffe) {
            const waffeElements = Array.isArray(this.parsedXML.Datenbank.Waffe)
                ? this.parsedXML.Datenbank.Waffe
                : [this.parsedXML.Datenbank.Waffe]

            console.log(`Found ${waffeElements.length} Waffe elements in XML`)

            waffeElements.forEach((element, index) => {
                try {
                    const waffe = this.convertWaffeToFoundryItem(element)
                    waffen.push(waffe)
                } catch (error) {
                    console.error(`Error converting Waffe at index ${index}:`, error.message)
                    console.error('Element data:', JSON.stringify(element, null, 2))
                }
            })
        } else {
            console.warn('No Waffe elements found in XML')
            if (this.parsedXML.Datenbank) {
                console.log(
                    'Available elements in Datenbank:',
                    Object.keys(this.parsedXML.Datenbank),
                )
            }
        }

        console.log(`Successfully extracted ${waffen.length} Waffe items`)
        return waffen
    }

    /**
     * Extract Rüstung elements from parsed XML and convert to Foundry ruestung items
     * @returns {Array} Array of Foundry ruestung items
     */
    extractRuestungen() {
        const ruestungen = []

        if (this.parsedXML.Datenbank && this.parsedXML.Datenbank.Rüstung) {
            const ruestungElements = Array.isArray(this.parsedXML.Datenbank.Rüstung)
                ? this.parsedXML.Datenbank.Rüstung
                : [this.parsedXML.Datenbank.Rüstung]

            console.log(`Found ${ruestungElements.length} Rüstung elements in XML`)

            ruestungElements.forEach((element, index) => {
                try {
                    const ruestung = this.convertRuestungToFoundryItem(element)
                    ruestungen.push(ruestung)
                } catch (error) {
                    console.error(`Error converting Rüstung at index ${index}:`, error.message)
                    console.error('Element data:', JSON.stringify(element, null, 2))
                }
            })
        } else {
            console.warn('No Rüstung elements found in XML')
            if (this.parsedXML.Datenbank) {
                console.log(
                    'Available elements in Datenbank:',
                    Object.keys(this.parsedXML.Datenbank),
                )
            }
        }

        console.log(`Successfully extracted ${ruestungen.length} Rüstung items`)
        return ruestungen
    }

    /**
     * Extract Talent elements from parsed XML and convert to Foundry talent items
     * Only processes Talents with kategorie=0
     * @returns {Array} Array of Foundry talent items
     */
    extractTalente() {
        const talente = []

        if (this.parsedXML.Datenbank && this.parsedXML.Datenbank.Talent) {
            const talentElements = Array.isArray(this.parsedXML.Datenbank.Talent)
                ? this.parsedXML.Datenbank.Talent
                : [this.parsedXML.Datenbank.Talent]

            console.log(`Found ${talentElements.length} Talent elements in XML`)

            talentElements.forEach((element, index) => {
                try {
                    const talent = this.convertTalentToFoundryItem(element)
                    if (talent) {
                        // Only add if conversion was successful (kategorie=0)
                        talente.push(talent)
                    }
                } catch (error) {
                    console.error(`Error converting Talent at index ${index}:`, error.message)
                    console.error('Element data:', JSON.stringify(element, null, 2))
                }
            })
        } else {
            console.warn('No Talent elements found in XML')
            if (this.parsedXML.Datenbank) {
                console.log(
                    'Available elements in Datenbank:',
                    Object.keys(this.parsedXML.Datenbank),
                )
            }
        }

        console.log(`Successfully extracted ${talente.length} Talent items (kategorie=0 only)`)
        return talente
    }

    /**
     * Extract übernatürliche Talente (zauber, liturgie, anrufung) from XML data
     * Filters Talent elements by kategorie != 0
     * @returns {Array} Array of Foundry uebernatuerlich_talent items
     */
    extractUebernatuerlicheTalente() {
        const uebernatuerlicheTalente = []

        if (this.parsedXML.Datenbank && this.parsedXML.Datenbank.Talent) {
            const talentElements = Array.isArray(this.parsedXML.Datenbank.Talent)
                ? this.parsedXML.Datenbank.Talent
                : [this.parsedXML.Datenbank.Talent]

            console.log(
                `Found ${talentElements.length} total Talent elements in XML for übernatürliche processing`,
            )

            let zauberCount = 0
            let liturgieCount = 0
            let anrufungCount = 0

            // Filter for übernatürliche talents by kategorie != 0
            const uebernatuerlicheTalentElements = talentElements.filter((element) => {
                const attrs = element.$ || element
                const kategorie = parseInt(attrs.kategorie || element.kategorie) || 0
                return kategorie !== 0
            })

            console.log(
                `Found ${uebernatuerlicheTalentElements.length} übernatürliche talents after kategorie filtering`,
            )

            uebernatuerlicheTalentElements.forEach((element, index) => {
                try {
                    const talent = this.convertUebernatuerlicheTalentToFoundryItem(element)
                    if (talent) {
                        uebernatuerlicheTalente.push(talent)

                        // Count by determined type
                        const typ = talent.system.typ
                        if (typ === 'zauber') zauberCount++
                        else if (typ === 'liturgie') liturgieCount++
                        else if (typ === 'anrufung') anrufungCount++
                    }
                } catch (error) {
                    console.error(
                        `Error converting übernatürliches Talent at index ${index}:`,
                        error.message,
                    )
                    console.error('Element data:', JSON.stringify(element, null, 2))
                }
            })

            console.log(
                `Extracted ${zauberCount} Zauber, ${liturgieCount} Liturgie, ${anrufungCount} Anrufung`,
            )
        } else {
            console.warn('No Talent elements found in XML for übernatürliche processing')
            if (this.parsedXML.Datenbank) {
                console.log(
                    'Available elements in Datenbank:',
                    Object.keys(this.parsedXML.Datenbank),
                )
            }
        }

        console.log(
            `Successfully extracted ${uebernatuerlicheTalente.length} übernatürliche Talent items`,
        )
        return uebernatuerlicheTalente
    }

    /**
     * Extract Manöver from XML data
     * Processes Manöver with typ 0, 1, 2, 3, or 6
     * @returns {Array} Array of Foundry manoever items
     */
    extractManoever() {
        const manoever = []

        if (this.parsedXML.Datenbank && this.parsedXML.Datenbank['Manöver']) {
            const manoeverElements = Array.isArray(this.parsedXML.Datenbank['Manöver'])
                ? this.parsedXML.Datenbank['Manöver']
                : [this.parsedXML.Datenbank['Manöver']]

            console.log(`Found ${manoeverElements.length} Manöver elements in XML`)

            let typCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 6: 0 }

            manoeverElements.forEach((element, index) => {
                try {
                    const manoeverItem = this.convertManoeverToFoundryItem(element)
                    if (manoeverItem) {
                        // Handle both single item and array of items (for split probe cases)
                        const items = Array.isArray(manoeverItem) ? manoeverItem : [manoeverItem]
                        manoever.push(...items)

                        // Count by typ (count original element once, regardless of splits)
                        const typ = parseInt((element.$ || element).typ) || 0
                        if (typCounts.hasOwnProperty(typ)) {
                            typCounts[typ]++
                        }
                    }
                } catch (error) {
                    console.error(`Error converting Manöver at index ${index}:`, error.message)
                    console.error('Element data:', JSON.stringify(element, null, 2))
                }
            })

            console.log(
                `Extracted Manöver by typ: Typ 0: ${typCounts[0]}, Typ 1: ${typCounts[1]}, Typ 2: ${typCounts[2]}, Typ 3: ${typCounts[3]}, Typ 6: ${typCounts[6]}`,
            )
        } else {
            console.warn('No Manöver elements found in XML')
            if (this.parsedXML.Datenbank) {
                console.log(
                    'Available elements in Datenbank:',
                    Object.keys(this.parsedXML.Datenbank),
                )
            }
        }

        console.log(`Successfully extracted ${manoever.length} Manöver items`)
        return manoever
    }

    /**
     * Create the base Foundry item structure
     * @param {string} name - Item name
     * @param {string} itemType - Foundry item type
     * @param {Object} systemData - System-specific data
     * @returns {Object} Base Foundry item structure
     */
    createFoundryItem(name, itemType, systemData) {
        const foundryId = this.generateFoundryId()
        return {
            name: name,
            type: itemType,
            img: 'systems/Ilaris/assets/images/skills/profan-skill.svg',
            system: systemData,
            effects: [],
            folder: null,
            sort: 0,
            flags: {},
            _id: foundryId,
            _stats: {
                coreVersion: '12.331',
                systemId: null,
                systemVersion: null,
                createdTime: null,
                modifiedTime: null,
                lastModifiedBy: null,
                compendiumSource: null,
                duplicateSource: null,
            },
            ownership: {
                default: 0,
            },
            _key: `!items!${foundryId}`,
        }
    }

    /**
     * Convert skill-based XML elements (Fertigkeit and ÜbernatürlicheFertigkeit) to Foundry items
     * @param {Object} element - XML element (parsed by xml2js)
     * @param {string} itemType - 'fertigkeit' or 'uebernatuerliche_fertigkeit'
     * @returns {Object} Foundry item
     */
    convertSkillToFoundryItem(element, itemType) {
        const attrs = element.$ || element
        const name = attrs.name || element.name || `Unnamed ${itemType}`
        const text = element._ || ''
        const voraussetzungen = attrs.voraussetzungen || element.voraussetzungen || ''

        const kategorie = parseInt(attrs.kategorie || element.kategorie) || 0
        const attribute = attrs.attribute || element.attribute || 'KO|KO|KO'

        // Split attributes by "|" and assign to attribut_0, attribut_1, attribut_2
        const attributeArray = attribute.split('|')
        const attribut_0 = attributeArray[0] || 'KO'
        const attribut_1 = attributeArray[1] || 'KO'
        const attribut_2 = attributeArray[2] || 'KO'

        const systemData = {
            basis: 0,
            fw: 0,
            pw: 0,
            attribut_0: attribut_0,
            attribut_1: attribut_1,
            attribut_2: attribut_2,
            gruppe: kategorie,
            text: text,
            pwt: 0,
        }

        // Add ÜbernatürlicheFertigkeit specific field
        if (itemType === 'uebernatuerliche_fertigkeit') {
            systemData.voraussetzung = voraussetzungen
        }

        return this.createFoundryItem(name, itemType, systemData)
    }

    /**
     * Convert Waffeneigenschaft XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @returns {Object} Foundry item
     */
    convertWaffeneigenschaftToFoundryItem(element) {
        const attrs = element.$ || element
        const name = attrs.name || element.name || 'Unnamed Waffeneigenschaft'
        const text = element._ || ''
        const script = attrs.script || element.script || ''

        const systemData = {
            name: name,
            sephrastoScript: script,
            foundryScript: '', // Empty by default, can be filled manually later
            text: text,
        }

        return this.createFoundryItem(name, 'waffeneigenschaft', systemData)
    }

    /**
     * Convert weapon XML elements (Nahkampfwaffe and Fernkampfwaffe) to Foundry items
     * @param {Object} element - XML element (parsed by xml2js)
     * @param {string} itemType - 'nahkampfwaffe' or 'fernkampfwaffe'
     * @returns {Object} Foundry item
     */
    convertWeaponToFoundryItem(element, itemType) {
        const attrs = element.$ || element
        const name = attrs.name || element.name || `Unnamed ${itemType}`
        const text = element._ || ''

        // Construct TP from würfel, würfelSeiten, and plus
        const würfel = attrs.würfel || element.würfel || '0'
        const würfelSeiten = attrs.würfelSeiten || element.würfelSeiten || '0'
        const plus = parseInt(attrs.plus || element.plus) || 0
        const tp = `${würfel}W${würfelSeiten}${plus !== 0 ? (plus > 0 ? '+' + plus : plus) : ''}`

        // Parse eigenschaften from _ property (comma-separated)
        const eigenschaftenRaw = element._ || ''
        const eigenschaftenList = eigenschaftenRaw
            .split(',')
            .map((e) => e.trim())
            .filter((e) => e.length > 0)

        // Basic weapon system data (shared between both types)
        const systemData = {
            tp: tp,
            fertigkeit: attrs.fertigkeit || element.fertigkeit || '',
            talent: attrs.talent || element.talent || '',
            rw: parseInt(attrs.rw || element.rw) || 0,
            rw_mod: 0, // Default value, not in XML
            hauptwaffe: false, // Default value, not in XML
            nebenwaffe: false, // Default value, not in XML
            eigenschaftenList: eigenschaftenList,
            text: text,
            manoverausgleich: {
                value: 0, // Default value, not in XML
                overcomplicated: true, // Default value
            },
        }

        // Add type-specific WM properties
        const wm = parseInt(attrs.wm || element.wm) || 0
        if (itemType === 'nahkampfwaffe') {
            // For nahkampfwaffe: wm applies to wm_at, and optionally wmVt to wm_vt
            systemData.wm_at = wm
            // Check if wmVt is present and not null/undefined
            const wmVt = attrs.wmVt || element.wmVt
            if (wmVt !== null && wmVt !== undefined && wmVt !== '') {
                systemData.wm_vt = parseInt(wmVt) || 0
            } else {
                systemData.wm_vt = wm
            }
        } else if (itemType === 'fernkampfwaffe') {
            // For fernkampfwaffe: wm applies to wm_fk, and we need lz
            systemData.wm_fk = wm
            systemData.lz = parseInt(attrs.lz || element.lz) || 0
        }

        return this.createFoundryItem(name, itemType, systemData)
    }

    /**
     * Convert Rüstung XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @returns {Object} Foundry item
     */
    convertRuestungToFoundryItem(element) {
        const attrs = element.$ || element
        const name = attrs.name || element.name || 'Unnamed Rüstung'
        const text = element._ || ''

        const systemData = {
            rs: 0, // Left empty as requested
            be: 0, // Left empty as requested
            rs_beine: parseInt(attrs.rsBeine || element.rsBeine) || 0,
            rs_larm: parseInt(attrs.rsLArm || element.rsLArm) || 0,
            rs_rarm: parseInt(attrs.rsRArm || element.rsRArm) || 0,
            rs_bauch: parseInt(attrs.rsBauch || element.rsBauch) || 0,
            rs_brust: parseInt(attrs.rsBrust || element.rsBrust) || 0,
            rs_kopf: parseInt(attrs.rsKopf || element.rsKopf) || 0,
            aktiv: false, // Default value, not in XML
            text: text,
        }

        return this.createFoundryItem(name, 'ruestung', systemData)
    }

    /**
     * Convert Talent XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @returns {Object} Foundry item
     */
    convertBasicTalentToFoundryItem(element) {
        const attrs = element.$ || element
        const name = attrs.name || element.name || 'Unnamed Talent'
        const text = element._ || ''

        const systemData = {
            text: text,
            fertigkeit: attrs.fertigkeiten || element.fertigkeiten || '', // XML uses 'fertigkeiten', Foundry uses 'fertigkeit'
        }

        return this.createFoundryItem(name, 'talent', systemData)
    }

    /**
     * Convert übernatürliche Talent XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @param {string} itemType - 'zauber', 'liturgie', or 'anrufung'
     * @returns {Object} Foundry item
     */
    convertUebernatuerlicheTalentToFoundryItem(element, itemType) {
        const attrs = element.$ || element
        const name = attrs.name || element.name || `Unnamed ${itemType}`
        const text = element._ || ''

        const parsedText = this.parseUebernatuerlicheTalentText(text)

        const systemData = {
            typ: itemType, // Set the type field
            fertigkeiten: attrs.fertigkeiten || element.fertigkeiten || '',
            fertigkeit_ausgewaehlt: 'auto',
            text: parsedText.text,
            maechtig: parsedText.maechtig,
            schwierigkeit: parsedText.schwierigkeit,
            modifikationen: parsedText.modifikationen,
            vorbereitung: parsedText.vorbereitung,
            ziel: parsedText.ziel,
            reichweite: parsedText.reichweite,
            wirkungsdauer: parsedText.wirkungsdauer,
            kosten: parsedText.kosten,
            erlernen: parsedText.erlernen,
            pw: 0,
            gruppe: 0, // Set to 0 as requested
        }

        return this.createFoundryItem(name, itemType, systemData)
    }

    /**
     * Convert Manöver XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @returns {Object} Foundry item
     */
    convertManoeverToFoundryItem(element) {
        const attrs = element.$ || element
        const name = attrs.name || element.name || 'Unnamed Manöver'
        const text = element._ || ''

        const typ = parseInt(attrs.typ || element.typ) || 0
        const probe = attrs.probe || element.probe || ''
        const gegenprobe = attrs.gegenprobe || element.gegenprobe || ''
        const voraussetzungen = attrs.voraussetzungen || element.voraussetzungen || ''

        // Determine gruppe based on probe content for typ 0
        let gruppe = typ
        if (typ === 0) {
            // For typ 0: Check if probe contains "VT" to determine if it's gruppe 13 (defense) or 0 (attack)
            gruppe = probe.includes('VT') ? 13 : 0
        }

        const systemData = {
            voraussetzungen: voraussetzungen, // Keep as string, not array
            input: {
                label: 'Checkbox',
                field: 'CHECKBOX',
            },
            modifications: [],
            gruppe: gruppe, // Determined based on probe content for typ 0
            probe: probe,
            gegenprobe: gegenprobe,
            text: text,
        }

        return this.createFoundryItem(name, 'manoever', systemData)
    }

    /**
     * Convert a single Fertigkeit XML element to Foundry item format
     * @param {Object} element - XML Fertigkeit element (parsed by xml2js)
     * @returns {Object} Foundry fertigkeit item
     */
    convertFertigkeitToFoundryItem(element) {
        return this.convertSkillToFoundryItem(element, 'fertigkeit')
    }

    /**
     * Convert a single ÜbernatürlicheFertigkeit XML element to Foundry item format
     * @param {Object} element - XML ÜbernatürlicheFertigkeit element (parsed by xml2js)
     * @returns {Object} Foundry uebernatuerliche_fertigkeit item
     */
    convertUebernatuerlicheFertigkeitToFoundryItem(element) {
        return this.convertSkillToFoundryItem(element, 'uebernatuerliche_fertigkeit')
    }

    /**
     * Convert a single Waffe XML element to Foundry item format
     * Determines if it should be nahkampfwaffe or fernkampfwaffe based on fk property
     * @param {Object} element - XML Waffe element (parsed by xml2js)
     * @returns {Object} Foundry nahkampfwaffe or fernkampfwaffe item
     */
    convertWaffeToFoundryItem(element) {
        // Determine weapon type based on fk property (0=nahkampfwaffe, 1=fernkampfwaffe)
        const fk = parseInt(element.fk) || 0
        const itemType = fk === 1 ? 'fernkampfwaffe' : 'nahkampfwaffe'

        return this.convertWeaponToFoundryItem(element, itemType)
    }

    /**
     * Convert a single Talent XML element to Foundry item format
     * Only processes Talents with kategorie=0
     * @param {Object} element - XML Talent element (parsed by xml2js)
     * @returns {Object|null} Foundry talent item or null if kategorie != 0
     */
    convertTalentToFoundryItem(element) {
        // Only process Talents with kategorie=0
        const kategorie = parseInt(element.kategorie) || 0
        if (kategorie !== 0) {
            return null // Skip this talent
        }

        return this.convertBasicTalentToFoundryItem(element)
    }

    /**
     * Convert a single übernatürliches Talent XML element to Foundry item format
     * Determines type based on kategorie: 1=zauber, 2=liturgie, 3=anrufung
     * @param {Object} element - XML Talent element (parsed by xml2js)
     * @returns {Object} Foundry uebernatuerlich_talent item
     */
    convertUebernatuerlicheTalentToFoundryItem(element) {
        const attrs = element.$ || element
        const kategorie = parseInt(attrs.kategorie || element.kategorie) || 1

        // Determine type based on kategorie
        let itemType = 'zauber' // Default to zauber

        switch (kategorie) {
            case 1:
                itemType = 'zauber'
                break
            case 2:
                itemType = 'liturgie'
                break
            case 3:
                itemType = 'anrufung'
                break
            default:
                itemType = 'zauber' // Fallback to zauber
                break
        }

        return this.convertUebernatuerlicheTalentToFoundryItem(element, itemType)
    }

    /**
     * Convert a single Manöver XML element to Foundry item format
     * Only processes Manöver with typ 0, 1, 2, 3, or 6
     * For typ 0: determines gruppe based on probe content (VT = gruppe 13, otherwise gruppe 0)
     * Special handling: splits Manöver with "AT ... oder VT ..." into two separate items
     * @param {Object} element - XML Manöver element (parsed by xml2js)
     * @returns {Object|Array|null} Foundry manoever item(s) or null if typ not supported
     */
    convertManoeverToFoundryItem(element) {
        const attrs = element.$ || element
        const typ = parseInt(attrs.typ || element.typ) || 0

        // Only process Manöver with typ 0, 1, 2, 3, or 6
        const supportedTypen = [0, 1, 2, 3, 6]
        if (!supportedTypen.includes(typ)) {
            return null // Skip this manöver
        }

        const probe = attrs.probe || element.probe || ''

        // Special case: If typ 0 and probe contains both AT and VT, create two separate Manöver
        if (
            typ === 0 &&
            probe.includes('AT') &&
            probe.includes('VT') &&
            (probe.toLowerCase().includes('oder') || probe.includes(';'))
        ) {
            const results = []

            // Split probe by "oder" (case insensitive) or semicolon
            const probeParts = probe.split(/\s+oder\s+|;\s*/i)

            for (const probePart of probeParts) {
                // Create a modified element for each probe part
                const modifiedElement = JSON.parse(JSON.stringify(element))
                if (modifiedElement.$) {
                    modifiedElement.$.probe = probePart.trim()
                } else {
                    modifiedElement.probe = probePart.trim()
                }

                const foundryItem = this.convertManoeverToFoundryItem(modifiedElement)
                if (foundryItem) {
                    // Add suffix to name to distinguish the variants
                    const isDefense = probePart.includes('VT')
                    foundryItem.name += isDefense ? ' (Verteidigung)' : ' (Angriff)'
                    results.push(foundryItem)
                }
            }

            return results.length > 0 ? results : null
        }

        // Normal case: single Manöver
        return this.convertManoeverToFoundryItem(element)
    }

    /**
     * Generate a Foundry-compatible ID
     * @returns {string} Generated ID
     */
    generateFoundryId() {
        return Math.random().toString(36).substr(2, 16)
    }

    /**
     * Parse structured text content for übernatürliche Talente (zauber, liturgie, anrufung)
     * Extracts fields like schwierigkeit, modifikationen, vorbereitung, etc. from HTML-formatted text
     * @param {string} text - The text content containing HTML-formatted structured data
     * @returns {Object} Object containing parsed fields
     */
    parseUebernatuerlicheTalentText(text) {
        const result = {
            text: '',
            maechtig: '',
            schwierigkeit: '',
            modifikationen: '',
            vorbereitung: '',
            ziel: '',
            reichweite: '',
            wirkungsdauer: '',
            kosten: '',
            erlernen: '',
        }

        if (!text) return result

        // Decode HTML entities
        const decodedText = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

        // Split by <b> tags to find structured fields
        const parts = decodedText.split(/<b>([^<]+):<\/b>\s*/)

        // First part (index 0) is the main description text
        if (parts.length > 0) {
            result.text = parts[0].trim()
        }

        // Process remaining parts in pairs (field name, field value)
        for (let i = 1; i < parts.length; i += 2) {
            if (i + 1 < parts.length) {
                const fieldName = parts[i].trim()
                const fieldValue = parts[i + 1].trim()

                // Map field names to result properties
                switch (fieldName) {
                    case 'Probenschwierigkeit':
                        result.schwierigkeit = fieldValue
                        break
                    case 'Modifikationen':
                        result.modifikationen = fieldValue
                        break
                    case 'Vorbereitungszeit':
                        result.vorbereitung = fieldValue
                        break
                    case 'Ziel':
                        result.ziel = fieldValue
                        break
                    case 'Reichweite':
                        result.reichweite = fieldValue
                        break
                    case 'Wirkungsdauer':
                        result.wirkungsdauer = fieldValue
                        break
                    case 'Kosten':
                        result.kosten = fieldValue
                        break
                    case 'Erlernen':
                        result.erlernen = fieldValue
                        break
                    case 'Mächtige Magie':
                    case 'Mächtige Liturgie':
                    case 'Mächtige Anrufung':
                        result.maechtig = fieldValue
                        break
                    // Add field to main text if not recognized
                    default:
                        result.text += `\n${fieldName}: ${fieldValue}`
                        break
                }
            }
        }

        return result
    }

    /**
     * Complete import process for the entire XML file - imports all supported element types
     * @returns {Object} Object containing arrays of all imported item types
     */
    async importAllFromXML() {
        console.log('Starting complete XML import process...')

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

        // Import Fertigkeiten
        console.log('\n--- Importing Fertigkeiten ---')
        try {
            results.fertigkeiten = this.extractFertigkeiten()
        } catch (error) {
            console.error('Error importing Fertigkeiten:', error.message)
        }

        // Import ÜbernatürlicheFertigkeiten
        console.log('\n--- Importing ÜbernatürlicheFertigkeiten ---')
        try {
            results.uebernatuerlicheFertigkeiten = this.extractUebernatuerlicheFertigkeiten()
        } catch (error) {
            console.error('Error importing ÜbernatürlicheFertigkeiten:', error.message)
        }

        // Import Waffeneigenschaften
        console.log('\n--- Importing Waffeneigenschaften ---')
        try {
            results.waffeneigenschaften = this.extractWaffeneigenschaften()
        } catch (error) {
            console.error('Error importing Waffeneigenschaften:', error.message)
        }

        // Import Waffen
        console.log('\n--- Importing Waffen ---')
        try {
            results.waffen = this.extractWaffen()
        } catch (error) {
            console.error('Error importing Waffen:', error.message)
        }

        // Import Rüstungen
        console.log('\n--- Importing Rüstungen ---')
        try {
            results.ruestungen = this.extractRuestungen()
        } catch (error) {
            console.error('Error importing Rüstungen:', error.message)
        }

        // Import Talente
        console.log('\n--- Importing Talente ---')
        try {
            results.talente = this.extractTalente()
        } catch (error) {
            console.error('Error importing Talente:', error.message)
        }

        // Import Übernatürliche Talente
        console.log('\n--- Importing Übernatürliche Talente ---')
        try {
            results.uebernatuerlicheTalente = this.extractUebernatuerlicheTalente()
        } catch (error) {
            console.error('Error importing Übernatürliche Talente:', error.message)
        }

        // Import Manöver
        console.log('\n--- Importing Manöver ---')
        try {
            results.manoever = this.extractManoever()
        } catch (error) {
            console.error('Error importing Manöver:', error.message)
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

        // Summary
        console.log('\n=== IMPORT SUMMARY ===')
        console.log(`Fertigkeiten imported: ${results.fertigkeiten.length}`)
        console.log(
            `ÜbernatürlicheFertigkeiten imported: ${results.uebernatuerlicheFertigkeiten.length}`,
        )
        console.log(`Waffeneigenschaften imported: ${results.waffeneigenschaften.length}`)
        console.log(`Waffen imported: ${results.waffen.length}`)
        console.log(`Rüstungen imported: ${results.ruestungen.length}`)
        console.log(`Talente imported: ${results.talente.length}`)
        console.log(`Übernatürliche Talente imported: ${results.uebernatuerlicheTalente.length}`)
        console.log(`Manöver imported: ${results.manoever.length}`)
        console.log(`Total items imported: ${results.totalItems}`)
        console.log('Complete XML import process finished successfully')

        return results
    }

    /**
     * Create compendium packs for each item type with imported data
     * Creates a folder with the XML filename and compendiums for each item type within
     * @param {Object} importedData - Data returned from importAllFromXML()
     * @param {string} xmlFileName - Name of the XML file (without extension) to use for folder and pack names
     * @returns {Promise<Object>} Object containing created pack information
     */
    async createCompendiumPacks(importedData, xmlFileName) {
        console.log(`\n=== Creating Compendium Packs for ${xmlFileName} ===`)

        const results = {
            folderName: xmlFileName,
            createdPacks: [],
            errors: [],
        }

        // Map of item types to their data and display names
        const packDefinitions = [
            {
                key: 'fertigkeiten',
                items: importedData.fertigkeiten,
                label: 'Fertigkeiten',
                type: 'Item',
            },
            {
                key: 'uebernatuerlicheFertigkeiten',
                items: importedData.uebernatuerlicheFertigkeiten,
                label: 'Übernatürliche Fertigkeiten',
                type: 'Item',
            },
            {
                key: 'waffeneigenschaften',
                items: importedData.waffeneigenschaften,
                label: 'Waffeneigenschaften',
                type: 'Item',
            },
            {
                key: 'waffen',
                items: importedData.waffen,
                label: 'Waffen',
                type: 'Item',
            },
            {
                key: 'ruestungen',
                items: importedData.ruestungen,
                label: 'Rüstungen',
                type: 'Item',
            },
            {
                key: 'talente',
                items: importedData.talente,
                label: 'Talente',
                type: 'Item',
            },
            {
                key: 'uebernatuerlicheTalente',
                items: importedData.uebernatuerlicheTalente,
                label: 'Übernatürliche Talente',
                type: 'Item',
            },
            {
                key: 'manoever',
                items: importedData.manoever,
                label: 'Manöver',
                type: 'Item',
            },
        ]

        // First, create a folder for this XML import
        let folder = null
        try {
            folder = await Folder.create({
                name: xmlFileName,
                type: 'Compendium',
                color: '#4169E1', // Royal blue color
            })
            console.log(`✅ Created folder: ${xmlFileName}`)
        } catch (error) {
            console.error(`❌ Error creating folder ${xmlFileName}:`, error)
            results.errors.push({ type: 'folder', name: xmlFileName, error: error.message })
        }

        // Create compendium packs for each item type
        for (const packDef of packDefinitions) {
            if (!packDef.items || packDef.items.length === 0) {
                console.log(`⊘ Skipping ${packDef.label} (no items)`)
                continue
            }

            try {
                // Create pack name as "xmlFileName - Label"
                const packName = `${xmlFileName} - ${packDef.label}`
                const packId = `world.${xmlFileName
                    .toLowerCase()
                    .replace(/\s+/g, '-')}-${packDef.key.toLowerCase()}`

                console.log(`Creating pack: ${packName} (${packDef.items.length} items)`)

                // Create the compendium pack
                const pack = await CompendiumCollection.createCompendium({
                    name: packId,
                    label: packName,
                    type: packDef.type,
                    folder: folder?.id,
                    package: 'world',
                    system: game.system.id,
                })

                console.log(`✅ Created pack: ${packName}`)

                // Add items to the pack
                const itemsToCreate = packDef.items.map((item) => {
                    // Remove _key and _stats fields that shouldn't be in the creation data
                    const { _key, _stats, _id, ...itemData } = item
                    return itemData
                })

                await Item.createDocuments(itemsToCreate, { pack: pack.collection })
                console.log(`✅ Added ${itemsToCreate.length} items to ${packName}`)

                results.createdPacks.push({
                    key: packDef.key,
                    packId: pack.collection,
                    label: packName,
                    itemCount: itemsToCreate.length,
                })
            } catch (error) {
                console.error(`❌ Error creating pack for ${packDef.label}:`, error)
                results.errors.push({
                    type: 'pack',
                    name: packDef.label,
                    error: error.message,
                })
            }
        }

        console.log('\n=== Compendium Creation Summary ===')
        console.log(`Folder: ${results.folderName}`)
        console.log(`Packs created: ${results.createdPacks.length}`)
        console.log(`Errors: ${results.errors.length}`)

        if (results.errors.length > 0) {
            console.log('\nErrors encountered:')
            results.errors.forEach((err) => {
                console.log(`  - ${err.type} "${err.name}": ${err.error}`)
            })
        }

        return results
    }

    /**
     * Complete workflow: Import XML and create compendiums
     * @param {File} xmlFile - XML file object from file upload
     * @returns {Promise<Object>} Results of import and pack creation
     */
    async importAndCreatePacks(xmlFile) {
        console.log(`\n=== Starting XML Import and Pack Creation ===`)
        console.log(`File: ${xmlFile.name}`)

        try {
            // Extract filename without extension
            const xmlFileName = xmlFile.name.replace(/\.[^/.]+$/, '')

            // Read file content
            const fileContent = await xmlFile.text()

            // Parse XML
            const parser = new xml2js.Parser({
                explicitArray: false,
                ignoreAttrs: false,
                mergeAttrs: true,
            })
            this.parsedXML = await parser.parseStringPromise(fileContent)
            console.log('✅ XML file parsed successfully')

            // Import all data by calling extraction methods directly
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

            // Extract each type
            console.log('\n--- Extracting data from XML ---')
            try {
                importedData.fertigkeiten = this.extractFertigkeiten()
            } catch (error) {
                console.error('Error extracting Fertigkeiten:', error.message)
            }

            try {
                importedData.uebernatuerlicheFertigkeiten =
                    this.extractUebernatuerlicheFertigkeiten()
            } catch (error) {
                console.error('Error extracting ÜbernatürlicheFertigkeiten:', error.message)
            }

            try {
                importedData.waffeneigenschaften = this.extractWaffeneigenschaften()
            } catch (error) {
                console.error('Error extracting Waffeneigenschaften:', error.message)
            }

            try {
                importedData.waffen = this.extractWaffen()
            } catch (error) {
                console.error('Error extracting Waffen:', error.message)
            }

            try {
                importedData.ruestungen = this.extractRuestungen()
            } catch (error) {
                console.error('Error extracting Rüstungen:', error.message)
            }

            try {
                importedData.talente = this.extractTalente()
            } catch (error) {
                console.error('Error extracting Talente:', error.message)
            }

            try {
                importedData.uebernatuerlicheTalente = this.extractUebernatuerlicheTalente()
            } catch (error) {
                console.error('Error extracting Übernatürliche Talente:', error.message)
            }

            try {
                importedData.manoever = this.extractManoever()
            } catch (error) {
                console.error('Error extracting Manöver:', error.message)
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

            console.log(`✅ Extracted ${importedData.totalItems} items total`)

            // Create compendium packs
            const packResults = await this.createCompendiumPacks(importedData, xmlFileName)

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
        new Dialog({
            title: 'Ilaris Regeln Importieren',
            content: `
                <form>
                    <div class="form-group">
                        <label>XML Datei mit Ilaris Regeln hochladen:</label>
                        <input type="file" name="xmlFile" accept=".xml" required />
                        <p class="notes">
                            Wähle eine XML-Datei mit Ilaris Regeln aus.
                            Es werden automatisch Kompendien für alle enthaltenen Regeltypen erstellt
                            (Fertigkeiten, Talente, Waffen, Zauber, Liturgien, Manöver, etc.).
                        </p>
                    </div>
                </form>
            `,
            buttons: {
                import: {
                    icon: '<i class="fas fa-file-import"></i>',
                    label: 'Importieren',
                    callback: async (html) => {
                        const fileInput = html.find('input[name="xmlFile"]')[0]
                        const file = fileInput.files[0]

                        if (!file) {
                            ui.notifications.warn('Bitte wähle eine XML-Datei aus')
                            return
                        }

                        ui.notifications.info('Importiere Regeln...')
                        const importer = new XMLRuleImporter()
                        await importer.importAndCreatePacks(file)
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Abbrechen',
                },
            },
            default: 'import',
        }).render(true)
    }
}

/**
 * Standalone function to import everything from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @returns {Object} Object containing all imported item types
 */
export async function importAllFromXML(xmlFilePath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importAllFromXML()
}

// Example usage:
// const results = await importAllFromXML('./path/to/your/xml/file.xml')
// console.log(`Imported ${results.totalItems} items total`)

// Example usage for dialog:
// XMLRuleImporter.showRuleImportDialog()
