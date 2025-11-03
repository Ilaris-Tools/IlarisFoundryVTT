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
     * Filters Talent elements that contain magic-related content
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

            // Filter for spell-like talents by content analysis
            const magicKeywords = [
                'zauber',
                'magie',
                'ritual',
                'liturgie',
                'anrufung',
                'beschwörung',
            ]
            const spellLikeTalents = talentElements.filter((element) => {
                const attrs = element.$ || element
                const name = (attrs.name || element.name || '').toLowerCase()
                const text = (element._ || '').toLowerCase()

                // Include if contains magic keywords and exclude theoretical/practice talents
                const hasMagicKeywords = magicKeywords.some(
                    (keyword) => name.includes(keyword) || text.includes(keyword),
                )

                const isTheoretical =
                    name.includes('theorie') ||
                    name.includes('praxis') ||
                    name.includes('kunde') ||
                    name.includes('willenskraft')

                return (
                    hasMagicKeywords &&
                    !isTheoretical &&
                    (text.includes('zauber') ||
                        text.includes('liturgie') ||
                        text.includes('anrufung'))
                )
            })

            console.log(`Found ${spellLikeTalents.length} spell-like talents after filtering`)

            spellLikeTalents.forEach((element, index) => {
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
     * Generic method to convert XML elements to Foundry items
     * @param {Object} element - XML element (parsed by xml2js)
     * @param {string} itemType - The Foundry item type ('fertigkeit', 'uebernatuerliche_fertigkeit', 'waffeneigenschaft')
     * @param {string} xmlType - The XML element type for logging ('Fertigkeit', 'ÜbernatürlicheFertigkeit', 'Waffeneigenschaft')
     * @returns {Object} Foundry item
     */
    convertXMLElementToFoundryItem(element, itemType, xmlType) {
        // Handle different XML structures - attributes can be in $ object or direct properties
        const attrs = element.$ || element

        // Get basic attributes from the XML element
        const name = attrs.name || element.name || `Unnamed ${xmlType}`
        const text = element._ || ''

        // Additional XML fields for different types
        const voraussetzungen = attrs.voraussetzungen || element.voraussetzungen || ''
        const steigerungsfaktor = attrs.steigerungsfaktor || element.steigerungsfaktor || ''
        const kampffertigkeit = attrs.kampffertigkeit || element.kampffertigkeit || false
        const talentegruppieren = attrs.talentegruppieren || element.talentegruppieren || false
        const script = attrs.script || element.script || ''

        let systemData = {}

        // Create type-specific system data
        if (itemType === 'fertigkeit' || itemType === 'uebernatuerliche_fertigkeit') {
            // Handle skill-based items (Fertigkeit and ÜbernatürlicheFertigkeit)
            const kategorie = parseInt(attrs.kategorie || element.kategorie) || 0
            const attribute = attrs.attribute || element.attribute || 'KO|KO|KO'

            // Split attributes by "|" and assign to attribut_0, attribut_1, attribut_2
            const attributeArray = attribute.split('|')
            const attribut_0 = attributeArray[0] || 'KO'
            const attribut_1 = attributeArray[1] || 'KO'
            const attribut_2 = attributeArray[2] || 'KO'

            systemData = {
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
        } else if (itemType === 'waffeneigenschaft') {
            // Handle Waffeneigenschaft items
            systemData = {
                name: name,
                sephrastoScript: script,
                foundryScript: '', // Empty by default, can be filled manually later
                text: text,
            }
        } else if (itemType === 'nahkampfwaffe' || itemType === 'fernkampfwaffe') {
            // Handle Waffe items (both nahkampfwaffe and fernkampfwaffe)

            // Construct TP from würfel, würfelSeiten, and plus
            const würfel = attrs.würfel || element.würfel || '0'
            const würfelSeiten = attrs.würfelSeiten || element.würfelSeiten || '0'
            const plus = parseInt(attrs.plus || element.plus) || 0
            const tp = `${würfel}W${würfelSeiten}${
                plus !== 0 ? (plus > 0 ? '+' + plus : plus) : ''
            }`

            // Parse eigenschaften from _ property (comma-separated)
            const eigenschaftenRaw = element._ || ''
            const eigenschaftenList = eigenschaftenRaw
                .split(',')
                .map((e) => e.trim())
                .filter((e) => e.length > 0)

            // Basic weapon system data (shared between both types)
            systemData = {
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
                systemData.eigenschaften =
                    this.initializeNahkampfwaffeEigenschaften(eigenschaftenList)
            } else if (itemType === 'fernkampfwaffe') {
                // For fernkampfwaffe: wm applies to wm_fk, and we need lz
                systemData.wm_fk = wm
                systemData.lz = parseInt(attrs.lz || element.lz) || 0
                systemData.eigenschaften =
                    this.initializeFernkampfwaffeEigenschaften(eigenschaftenList)
            }
        } else if (itemType === 'ruestung') {
            // Handle Rüstung items
            systemData = {
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
        } else if (itemType === 'talent') {
            // Handle Talent items (only kategorie=0 should reach here)
            systemData = {
                text: text,
                fertigkeit: attrs.fertigkeiten || element.fertigkeiten || '', // XML uses 'fertigkeiten', Foundry uses 'fertigkeit'
            }
        } else if (itemType === 'zauber' || itemType === 'liturgie' || itemType === 'anrufung') {
            // Handle übernatürliche Talente (zauber, liturgie, anrufung)
            const parsedText = this.parseUebernatuerlicheTalentText(text)

            systemData = {
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
        } else if (itemType === 'manoever') {
            // Handle Manöver items - special logic for typ 0 based on probe content
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

            systemData = {
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
        }

        // Create Foundry item
        const foundryId = this.generateFoundryId()
        const foundryItem = {
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

        // Type-specific logging
        if (itemType === 'fertigkeit') {
            const kategorie = parseInt(element.kategorie) || 0
            const attribute = element.attribute || 'KO|KO|KO'
            console.log(
                `Converted Fertigkeit: ${name} (kategorie: ${kategorie}, attributes: ${attribute}, kampffertigkeit: ${kampffertigkeit})`,
            )
        } else if (itemType === 'uebernatuerliche_fertigkeit') {
            const kategorie = parseInt(element.kategorie) || 0
            const attribute = element.attribute || 'KO|KO|KO'
            console.log(
                `Converted ÜbernatürlicheFertigkeit: ${name} (kategorie: ${kategorie}, attributes: ${attribute}, voraussetzungen: ${voraussetzungen.substring(
                    0,
                    50,
                )}${voraussetzungen.length > 50 ? '...' : ''})`,
            )
        } else if (itemType === 'waffeneigenschaft') {
            console.log(
                `Converted Waffeneigenschaft: ${name} (script: ${
                    script ? 'present' : 'none'
                }, text length: ${text.length})`,
            )
        } else if (itemType === 'nahkampfwaffe') {
            const tp = systemData.tp
            const wm_at = systemData.wm_at
            const eigenschaften = systemData.eigenschaftenList.join(', ')
            console.log(
                `Converted Nahkampfwaffe: ${name} (TP: ${tp}, WM_AT/VT: ${wm_at}, Eigenschaften: [${eigenschaften}])`,
            )
        } else if (itemType === 'fernkampfwaffe') {
            const tp = systemData.tp
            const wm_fk = systemData.wm_fk
            const lz = systemData.lz
            const eigenschaften = systemData.eigenschaftenList.join(', ')
            console.log(
                `Converted Fernkampfwaffe: ${name} (TP: ${tp}, WM_FK: ${wm_fk}, LZ: ${lz}, Eigenschaften: [${eigenschaften}])`,
            )
        } else if (itemType === 'ruestung') {
            const rs_parts = [
                `Beine: ${systemData.rs_beine}`,
                `LArm: ${systemData.rs_larm}`,
                `RArm: ${systemData.rs_rarm}`,
                `Bauch: ${systemData.rs_bauch}`,
                `Brust: ${systemData.rs_brust}`,
                `Kopf: ${systemData.rs_kopf}`,
            ].join(', ')
            console.log(`Converted Rüstung: ${name} (${rs_parts})`)
        } else if (itemType === 'talent') {
            const fertigkeit = systemData.fertigkeit
            console.log(
                `Converted Talent: ${name} (Fertigkeit: ${fertigkeit}, Text length: ${text.length})`,
            )
        } else if (itemType === 'zauber' || itemType === 'liturgie' || itemType === 'anrufung') {
            const fertigkeiten = systemData.fertigkeiten
            const schwierigkeit = systemData.schwierigkeit
            const typeLabel = itemType.charAt(0).toUpperCase() + itemType.slice(1)
            console.log(
                `Converted ${typeLabel}: ${name} (Fertigkeiten: ${fertigkeiten}, Schwierigkeit: ${schwierigkeit})`,
            )
        } else if (itemType === 'manoever') {
            const gruppe = systemData.gruppe
            const probe = systemData.probe
            const voraussetzungen = systemData.voraussetzungen // Already a string, no need to join
            console.log(
                `Converted Manöver: ${name} (Gruppe: ${gruppe}, Probe: ${probe}, Voraussetzungen: ${
                    voraussetzungen || 'none'
                })`,
            )
        }

        return foundryItem
    }

    /**
     * Convert a single Fertigkeit XML element to Foundry item format
     * @param {Object} element - XML Fertigkeit element (parsed by xml2js)
     * @returns {Object} Foundry fertigkeit item
     */
    convertFertigkeitToFoundryItem(element) {
        return this.convertXMLElementToFoundryItem(element, 'fertigkeit', 'Fertigkeit')
    }

    /**
     * Convert a single ÜbernatürlicheFertigkeit XML element to Foundry item format
     * @param {Object} element - XML ÜbernatürlicheFertigkeit element (parsed by xml2js)
     * @returns {Object} Foundry uebernatuerliche_fertigkeit item
     */
    convertUebernatuerlicheFertigkeitToFoundryItem(element) {
        return this.convertXMLElementToFoundryItem(
            element,
            'uebernatuerliche_fertigkeit',
            'ÜbernatürlicheFertigkeit',
        )
    }

    /**
     * Convert a single Waffeneigenschaft XML element to Foundry item format
     * @param {Object} element - XML Waffeneigenschaft element (parsed by xml2js)
     * @returns {Object} Foundry waffeneigenschaft item
     */
    convertWaffeneigenschaftToFoundryItem(element) {
        return this.convertXMLElementToFoundryItem(
            element,
            'waffeneigenschaft',
            'Waffeneigenschaft',
        )
    }

    /**
     * Convert a single Waffe XML element to Foundry item format
     * Determines if it should be nahkampfwaffe or fernkampfwaffe based on lz property
     * @param {Object} element - XML Waffe element (parsed by xml2js)
     * @returns {Object} Foundry nahkampfwaffe or fernkampfwaffe item
     */
    convertWaffeToFoundryItem(element) {
        // Determine weapon type based on fk property (0=nahkampfwaffe, 1=fernkampfwaffe)
        const fk = parseInt(element.fk) || 0
        const itemType = fk === 1 ? 'fernkampfwaffe' : 'nahkampfwaffe'
        const xmlType = 'Waffe'

        return this.convertXMLElementToFoundryItem(element, itemType, xmlType)
    }

    /**
     * Convert a single Rüstung XML element to Foundry item format
     * @param {Object} element - XML Rüstung element (parsed by xml2js)
     * @returns {Object} Foundry ruestung item
     */
    convertRuestungToFoundryItem(element) {
        return this.convertXMLElementToFoundryItem(element, 'ruestung', 'Rüstung')
    }

    /**
     * Convert a single Talent XML element to Foundry item format
     * Only processes Talents with kategorie=0
     * @param {Object} element - XML Talent element (parsed by xml2js)
     * @returns {Object} Foundry talent item
     */
    convertTalentToFoundryItem(element) {
        // Only process Talents with kategorie=0
        const kategorie = parseInt(element.kategorie) || 0
        if (kategorie !== 0) {
            return null // Skip this talent
        }

        return this.convertXMLElementToFoundryItem(element, 'talent', 'Talent')
    }

    /**
     * Convert a single übernatürliches Talent XML element to Foundry item format
     * Determines type based on text content analysis: zauber, liturgie, or anrufung
     * @param {Object} element - XML Talent element (parsed by xml2js)
     * @returns {Object} Foundry uebernatuerlich_talent item
     */
    convertUebernatuerlicheTalentToFoundryItem(element) {
        const text = (element._ || '').toLowerCase()
        const attrs = element.$ || element
        const name = attrs.name || element.name || 'Unknown'

        // Determine type based on text content
        let itemType = 'zauber' // Default to zauber

        if (text.includes('liturgie') || text.includes('götter') || text.includes('gebet')) {
            itemType = 'liturgie'
        } else if (text.includes('anrufung') || text.includes('dämon')) {
            itemType = 'anrufung'
        }

        return this.convertXMLElementToFoundryItem(element, itemType, 'ÜbernatürlichesTalent')
    }

    /**
     * Convert a single Manöver XML element to Foundry item format
     * Only processes Manöver with typ 0, 1, 2, 3, or 6
     * For typ 0: determines gruppe based on probe content (VT = gruppe 13, otherwise gruppe 0)
     * Special handling: splits Manöver with "AT ... oder VT ..." into two separate items
     * @param {Object} element - XML Manöver element (parsed by xml2js)
     * @returns {Object|Array} Foundry manoever item(s) or null if typ not supported
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

                const foundryItem = this.convertXMLElementToFoundryItem(
                    modifiedElement,
                    'manoever',
                    'Manöver',
                )
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
        return this.convertXMLElementToFoundryItem(element, 'manoever', 'Manöver')
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
     * Initialize eigenschaften object for nahkampfwaffe based on eigenschaftenList
     * @param {Array} eigenschaftenList - List of eigenschaften names
     * @returns {Object} Eigenschaften object with boolean flags
     */
    initializeNahkampfwaffeEigenschaften(eigenschaftenList) {
        const eigenschaften = {
            kopflastig: false,
            niederwerfen: false,
            parierwaffe: false,
            reittier: false,
            ruestungsbrechend: false,
            schild: false,
            schwer_4: false,
            schwer_8: false,
            stumpf: false,
            unberechenbar: false,
            unzerstoerbar: false,
            wendig: false,
            zerbrechlich: false,
            zweihaendig: false,
            kein_malus_nebenwaffe: false,
        }

        // Map XML eigenschaften names to Foundry property names
        eigenschaftenList.forEach((eigenschaft) => {
            const normalized = eigenschaft.toLowerCase().replace(/[\s-]/g, '_')
            switch (normalized) {
                case 'kopflastig':
                    eigenschaften.kopflastig = true
                    break
                case 'niederwerfen':
                    eigenschaften.niederwerfen = true
                    break
                case 'parierwaffe':
                    eigenschaften.parierwaffe = true
                    break
                case 'reittier':
                    eigenschaften.reittier = true
                    break
                case 'rüstungsbrechend':
                    eigenschaften.ruestungsbrechend = true
                    break
                case 'schild':
                    eigenschaften.schild = true
                    break
                case 'schwer':
                    eigenschaften.schwer_4 = true
                    break // Default to schwer_4
                case 'stumpf':
                    eigenschaften.stumpf = true
                    break
                case 'unberechenbar':
                    eigenschaften.unberechenbar = true
                    break
                case 'unzerstörbar':
                    eigenschaften.unzerstoerbar = true
                    break
                case 'wendig':
                    eigenschaften.wendig = true
                    break
                case 'zerbrechlich':
                    eigenschaften.zerbrechlich = true
                    break
                case 'zweihändig':
                    eigenschaften.zweihaendig = true
                    break
                case 'kein_malus_als_nebenwaffe':
                    eigenschaften.kein_malus_nebenwaffe = true
                    break
            }
        })

        return eigenschaften
    }

    /**
     * Initialize eigenschaften object for fernkampfwaffe based on eigenschaftenList
     * @param {Array} eigenschaftenList - List of eigenschaften names
     * @returns {Object} Eigenschaften object with boolean flags
     */
    initializeFernkampfwaffeEigenschaften(eigenschaftenList) {
        const eigenschaften = {
            kein_reiter: false,
            niederwerfen: false,
            niederwerfen_4: false,
            niederwerfen_8: false,
            schwer_4: false,
            schwer_8: false,
            stationaer: false,
            stumpf: false,
            umklammern_212: false,
            umklammern_416: false,
            umklammern_816: false,
            zweihaendig: false,
        }

        // Map XML eigenschaften names to Foundry property names
        eigenschaftenList.forEach((eigenschaft) => {
            const normalized = eigenschaft.toLowerCase().replace(/[\s-]/g, '_')
            switch (normalized) {
                case 'kein_reittier':
                    eigenschaften.kein_reiter = true
                    break
                case 'niederwerfen':
                    eigenschaften.niederwerfen = true
                    break
                case 'schwer':
                    eigenschaften.schwer_4 = true
                    break // Default to schwer_4
                case 'stationär':
                    eigenschaften.stationaer = true
                    break
                case 'stumpf':
                    eigenschaften.stumpf = true
                    break
                case 'umklammern':
                    eigenschaften.umklammern_212 = true
                    break // Default variant
                case 'zweihändig':
                    eigenschaften.zweihaendig = true
                    break
            }
        })

        return eigenschaften
    }

    /**
     * Generic method to save items to JSON file
     * @param {Array} items - Array of items to save
     * @param {string} outputPath - Path to save the JSON file
     * @param {string} itemTypeName - Name of item type for logging
     */
    saveItemsToJSON(items, outputPath, itemTypeName) {
        try {
            fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8')
            console.log(`Saved ${items.length} ${itemTypeName} to ${outputPath}`)
        } catch (error) {
            console.error(`Error saving ${itemTypeName} to JSON:`, error)
            throw error
        }
    }

    /**
     * Save fertigkeiten to JSON file
     * @param {Array} fertigkeiten - Array of fertigkeit items
     * @param {string} outputPath - Path to save the JSON file
     */
    saveFertigkeitenToJSON(fertigkeiten, outputPath) {
        this.saveItemsToJSON(fertigkeiten, outputPath, 'Fertigkeiten')
    }

    /**
     * Save uebernatuerliche fertigkeiten to JSON file
     * @param {Array} uebernatuerlicheFertigkeiten - Array of uebernatuerliche_fertigkeit items
     * @param {string} outputPath - Path to save the JSON file
     */
    saveUebernatuerlicheFertigkeitenToJSON(uebernatuerlicheFertigkeiten, outputPath) {
        this.saveItemsToJSON(uebernatuerlicheFertigkeiten, outputPath, 'ÜbernatürlicheFertigkeiten')
    }

    /**
     * Save waffeneigenschaften to JSON file
     * @param {Array} waffeneigenschaften - Array of waffeneigenschaft items
     * @param {string} outputPath - Path to save the JSON file
     */
    saveWaffeneigenschaftenToJSON(waffeneigenschaften, outputPath) {
        this.saveItemsToJSON(waffeneigenschaften, outputPath, 'Waffeneigenschaften')
    }

    /**
     * Save waffen to JSON file
     * @param {Array} waffen - Array of nahkampfwaffe and fernkampfwaffe items
     * @param {string} outputPath - Path to save the JSON file
     */
    saveWaffenToJSON(waffen, outputPath) {
        this.saveItemsToJSON(waffen, outputPath, 'Waffen')
    }

    /**
     * Save Rüstung items to JSON file
     * @param {Array} ruestungen - Array of Foundry ruestung items
     * @param {string} outputPath - Path to save the JSON file
     */
    saveRuestungenToJSON(ruestungen, outputPath) {
        this.saveItemsToJSON(ruestungen, outputPath, 'Rüstungen')
    }

    /**
     * Save Talent items to JSON file
     * @param {Array} talente - Array of Foundry talent items
     * @param {string} outputPath - Path to save the JSON file
     */
    saveTalenteToJSON(talente, outputPath) {
        this.saveItemsToJSON(talente, outputPath, 'Talente')
    }

    /**
     * Complete import process for Fertigkeiten
     * @param {string} outputPath - Path to save the converted items
     * @returns {Array} Array of converted fertigkeit items
     */
    async importFertigkeiten(outputPath = './imported_fertigkeiten.json') {
        console.log('Starting Fertigkeit import process...')

        await this.loadXML()
        const fertigkeiten = this.extractFertigkeiten()

        if (outputPath) {
            this.saveFertigkeitenToJSON(fertigkeiten, outputPath)
        }

        console.log('Fertigkeit import process completed successfully')
        return fertigkeiten
    }

    /**
     * Complete import process for ÜbernatürlicheFertigkeiten
     * @param {string} outputPath - Path to save the converted items
     * @returns {Array} Array of converted uebernatuerliche_fertigkeit items
     */
    async importUebernatuerlicheFertigkeiten(
        outputPath = './imported_uebernatuerliche_fertigkeiten.json',
    ) {
        console.log('Starting ÜbernatürlicheFertigkeit import process...')

        await this.loadXML()
        const uebernatuerlicheFertigkeiten = this.extractUebernatuerlicheFertigkeiten()

        if (outputPath) {
            this.saveUebernatuerlicheFertigkeitenToJSON(uebernatuerlicheFertigkeiten, outputPath)
        }

        console.log('ÜbernatürlicheFertigkeit import process completed successfully')
        return uebernatuerlicheFertigkeiten
    }

    /**
     * Complete import process for Waffeneigenschaften
     * @param {string} outputPath - Path to save the converted items
     * @returns {Array} Array of converted waffeneigenschaft items
     */
    async importWaffeneigenschaften(outputPath = './imported_waffeneigenschaften.json') {
        console.log('Starting Waffeneigenschaft import process...')

        await this.loadXML()
        const waffeneigenschaften = this.extractWaffeneigenschaften()

        if (outputPath) {
            this.saveWaffeneigenschaftenToJSON(waffeneigenschaften, outputPath)
        }

        console.log('Waffeneigenschaft import process completed successfully')
        return waffeneigenschaften
    }

    /**
     * Complete import process for Waffen
     * @param {string} outputPath - Path to save the converted items
     * @returns {Array} Array of converted nahkampfwaffe and fernkampfwaffe items
     */
    async importWaffen(outputPath = './imported_waffen.json') {
        console.log('Starting Waffen import process...')

        await this.loadXML()
        const waffen = this.extractWaffen()

        if (outputPath) {
            this.saveWaffenToJSON(waffen, outputPath)
        }

        console.log('Waffen import process completed successfully')
        return waffen
    }

    /**
     * Import Rüstung elements from XML file and save to JSON
     * @param {string} outputPath - Path to save the converted ruestung items
     * @returns {Array} Array of converted ruestung items
     */
    async importRuestungen(outputPath = './imported_ruestungen.json') {
        console.log('Starting Rüstungen import process...')

        await this.loadXML()
        const ruestungen = this.extractRuestungen()

        if (outputPath) {
            this.saveRuestungenToJSON(ruestungen, outputPath)
        }

        console.log('Rüstungen import process completed successfully')
        return ruestungen
    }

    /**
     * Import Talent elements from XML file and save to JSON
     * Only processes and imports Talents with kategorie=0
     * @param {string} outputPath - Path to save the converted talent items
     * @returns {Array} Array of converted talent items
     */
    async importTalente(outputPath = './imported_talente.json') {
        console.log('Starting Talente import process...')

        await this.loadXML()
        const talente = this.extractTalente()

        if (outputPath) {
            this.saveTalenteToJSON(talente, outputPath)
        }

        console.log('Talente import process completed successfully')
        return talente
    }

    /**
     * Save übernatürliche Talent items to JSON file
     * @param {Array} uebernatuerlicheTalente - Array of Foundry uebernatuerlich_talent items
     * @param {string} outputPath - Path to save the JSON file
     */
    saveUebernatuerlicheTalenteToJSON(uebernatuerlicheTalente, outputPath) {
        this.saveItemsToJSON(uebernatuerlicheTalente, outputPath, 'ÜbernatürlicheTalente')
    }

    /**
     * Import übernatürliche Talent elements from XML file and save to JSON
     * Processes and imports Talents with kategorie 1, 2, or 3 (zauber, liturgie, anrufung)
     * @param {string} outputPath - Path to save the converted übernatürliche talent items
     * @returns {Array} Array of converted übernatürliche talent items
     */
    async importUebernatuerlicheTalente(outputPath = './imported_uebernatuerliche_talente.json') {
        console.log('Starting übernatürliche Talente import process...')

        await this.loadXML()
        const uebernatuerlicheTalente = this.extractUebernatuerlicheTalente()

        if (outputPath) {
            this.saveUebernatuerlicheTalenteToJSON(uebernatuerlicheTalente, outputPath)
        }

        console.log('Übernatürliche Talente import process completed successfully')
        return uebernatuerlicheTalente
    }

    /**
     * Save Manöver items to JSON file
     * @param {Array} manoever - Array of Foundry manoever items
     * @param {string} outputPath - Path to save the JSON file
     */
    saveManoeverToJSON(manoever, outputPath) {
        this.saveItemsToJSON(manoever, outputPath, 'Manöver')
    }

    /**
     * Import Manöver elements from XML file and save to JSON
     * Processes and imports Manöver with typ 0, 1, 2, 3, or 6
     * @param {string} outputPath - Path to save the converted manöver items
     * @returns {Array} Array of converted manöver items
     */
    async importManoever(outputPath = './imported_manoever.json') {
        console.log('Starting Manöver import process...')

        await this.loadXML()
        const manoever = this.extractManoever()

        if (outputPath) {
            this.saveManoeverToJSON(manoever, outputPath)
        }

        console.log('Manöver import process completed successfully')
        return manoever
    }

    /**
     * Complete import process for the entire XML file - imports all supported element types
     * @param {string} outputDir - Directory to save the converted items (optional)
     * @returns {Object} Object containing arrays of all imported item types
     */
    async importAllFromXML(outputDir = './') {
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
            if (results.fertigkeiten.length > 0 && outputDir) {
                const fertigkeitPath = `${outputDir}/imported_fertigkeiten.json`
                this.saveFertigkeitenToJSON(results.fertigkeiten, fertigkeitPath)
            }
        } catch (error) {
            console.error('Error importing Fertigkeiten:', error.message)
        }

        // Import ÜbernatürlicheFertigkeiten
        console.log('\n--- Importing ÜbernatürlicheFertigkeiten ---')
        try {
            results.uebernatuerlicheFertigkeiten = this.extractUebernatuerlicheFertigkeiten()
            if (results.uebernatuerlicheFertigkeiten.length > 0 && outputDir) {
                const uebernatuerlichePath = `${outputDir}/imported_uebernatuerliche_fertigkeiten.json`
                this.saveUebernatuerlicheFertigkeitenToJSON(
                    results.uebernatuerlicheFertigkeiten,
                    uebernatuerlichePath,
                )
            }
        } catch (error) {
            console.error('Error importing ÜbernatürlicheFertigkeiten:', error.message)
        }

        // Import Waffeneigenschaften
        console.log('\n--- Importing Waffeneigenschaften ---')
        try {
            results.waffeneigenschaften = this.extractWaffeneigenschaften()
            if (results.waffeneigenschaften.length > 0 && outputDir) {
                const waffeneigenschaftPath = `${outputDir}/imported_waffeneigenschaften.json`
                this.saveWaffeneigenschaftenToJSON(
                    results.waffeneigenschaften,
                    waffeneigenschaftPath,
                )
            }
        } catch (error) {
            console.error('Error importing Waffeneigenschaften:', error.message)
        }

        // Import Waffen
        console.log('\n--- Importing Waffen ---')
        try {
            results.waffen = this.extractWaffen()
            if (results.waffen.length > 0 && outputDir) {
                const waffenPath = `${outputDir}/imported_waffen.json`
                this.saveWaffenToJSON(results.waffen, waffenPath)
            }
        } catch (error) {
            console.error('Error importing Waffen:', error.message)
        }

        // Import Rüstungen
        console.log('\n--- Importing Rüstungen ---')
        try {
            results.ruestungen = this.extractRuestungen()
            if (results.ruestungen.length > 0 && outputDir) {
                const ruestungenPath = `${outputDir}/imported_ruestungen.json`
                this.saveRuestungenToJSON(results.ruestungen, ruestungenPath)
            }
        } catch (error) {
            console.error('Error importing Rüstungen:', error.message)
        }

        // Import Talente
        console.log('\n--- Importing Talente ---')
        try {
            results.talente = this.extractTalente()
            if (results.talente.length > 0 && outputDir) {
                const talentePath = `${outputDir}/imported_talente.json`
                this.saveTalenteToJSON(results.talente, talentePath)
            }
        } catch (error) {
            console.error('Error importing Talente:', error.message)
        }

        // Import Übernatürliche Talente
        console.log('\n--- Importing Übernatürliche Talente ---')
        try {
            results.uebernatuerlicheTalente = this.extractUebernatuerlicheTalente()
            if (results.uebernatuerlicheTalente.length > 0 && outputDir) {
                const uebernatuerlicheTalentePath = `${outputDir}/imported_uebernatuerliche_talente.json`
                this.saveUebernatuerlicheTalenteToJSON(
                    results.uebernatuerlicheTalente,
                    uebernatuerlicheTalentePath,
                )
            }
        } catch (error) {
            console.error('Error importing Übernatürliche Talente:', error.message)
        }

        // Import Manöver
        console.log('\n--- Importing Manöver ---')
        try {
            results.manoever = this.extractManoever()
            if (results.manoever.length > 0 && outputDir) {
                const manoeverPath = `${outputDir}/imported_manoever.json`
                this.saveManoeverToJSON(results.manoever, manoeverPath)
            }
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
}

/**
 * Standalone function to import fertigkeiten from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputPath - Path to save converted items (optional)
 * @returns {Array} Array of converted fertigkeit items
 */
export async function importFertigkeitenFromXML(xmlFilePath, outputPath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importFertigkeiten(outputPath)
}

/**
 * Standalone function to import uebernatuerliche fertigkeiten from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputPath - Path to save converted items (optional)
 * @returns {Array} Array of converted uebernatuerliche_fertigkeit items
 */
export async function importUebernatuerlicheFertigkeitenFromXML(xmlFilePath, outputPath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importUebernatuerlicheFertigkeiten(outputPath)
}

/**
 * Standalone function to import waffeneigenschaften from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputPath - Path to save converted items (optional)
 * @returns {Array} Array of converted waffeneigenschaft items
 */
export async function importWaffeneigenschaftenFromXML(xmlFilePath, outputPath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importWaffeneigenschaften(outputPath)
}

/**
 * Standalone function to import waffen from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputPath - Path to save converted items (optional)
 * @returns {Array} Array of converted nahkampfwaffe and fernkampfwaffe items
 */
export async function importWaffenFromXML(xmlFilePath, outputPath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importWaffen(outputPath)
}

/**
 * Standalone function to import Rüstungen from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputPath - Path to save converted items (optional)
 * @returns {Array} Array of converted ruestung items
 */
export async function importRuestungenFromXML(xmlFilePath, outputPath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importRuestungen(outputPath)
}

/**
 * Standalone function to import Talente from XML file (kategorie=0 only)
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputPath - Path to save converted items (optional)
 * @returns {Array} Array of converted talent items
 */
export async function importTalenteFromXML(xmlFilePath, outputPath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importTalente(outputPath)
}

/**
 * Standalone function to import übernatürliche talente from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputPath - Path to save converted items (optional)
 * @returns {Array} Array of converted übernatürliche talent items
 */
export async function importUebernatuerlicheTalenteFromXML(xmlFilePath, outputPath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importUebernatuerlicheTalente(outputPath)
}

/**
 * Standalone function to import manöver from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputPath - Path to save converted items (optional)
 * @returns {Array} Array of converted manöver items
 */
export async function importManoeverFromXML(xmlFilePath, outputPath) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importManoever(outputPath)
}

/**
 * Standalone function to import everything from XML file
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} outputDir - Directory to save converted items (optional)
 * @returns {Object} Object containing all imported item types
 */
export async function importAllFromXML(xmlFilePath, outputDir) {
    const importer = new XMLRuleImporter(xmlFilePath)
    return await importer.importAllFromXML(outputDir)
}

// Example usage (uncomment to run)
// const importer = new XMLRuleImporter('./path/to/your/xml/file.xml')
// const fertigkeiten = await importer.importFertigkeiten('./output/fertigkeiten.json')
// const uebernatuerlicheFertigkeiten = await importer.importUebernatuerlicheFertigkeiten('./output/uebernatuerliche_fertigkeiten.json')
// const allItems = await importer.importAllFromXML('./output/')
