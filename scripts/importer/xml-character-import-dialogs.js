/**
 * Dialog classes for XML Character Import operations
 * Provides confirmation dialogs for import and sync operations
 */

export class XmlCharacterImportDialogs {
    /**
     * Show confirmation dialog before importing character data
     * @param {Object} characterData - The parsed character data from XML
     * @param {string} fileName - The name of the XML file
     * @param {Object} importAnalysis - Analysis of what will be found vs missing
     * @returns {Promise<boolean>} True if user confirms, false if cancelled
     */
    static async showImportConfirmationDialog(characterData, fileName, importAnalysis) {
        const dialogContent = `
            <div style="margin-bottom: 15px;">
                <h3>Charakter-Import bestätigen</h3>
                <p><strong>Datei:</strong> ${fileName}</p>
                <p><strong>Charakter:</strong> ${characterData.name}</p>
            </div>
            
            ${this.generateConfiguredPacksInfo(importAnalysis.configuredPacks)}
            
            <div style="margin-bottom: 15px;">
                <h4 style="color: #2e7d32; margin-bottom: 8px;">✅ Wird IMPORTIERT:</h4>
                <ul style="margin-left: 20px; margin-bottom: 0;">
                    <li><strong>Charaktername:</strong> "${characterData.name}"</li>
                    <li><strong>Attribute:</strong> ${
                        Object.keys(characterData.attributes).length
                    } Attribute (${Object.keys(characterData.attributes).join(', ')})</li>
                    <li><strong>Energien:</strong> ${
                        Object.keys(characterData.energies).length
                    } Energien (${Object.keys(characterData.energies).join(', ')})</li>
                    <li><strong>Fertigkeiten:</strong> ${importAnalysis.skills.found.length}/${
                        characterData.skills.length
                    } gefunden</li>
                    <li><strong>Talente:</strong> ${importAnalysis.talents.found.length}/${
                        importAnalysis.talents.total
                    } gefunden</li>
                    <li><strong>Vorteile:</strong> ${importAnalysis.advantages.found.length}/${
                        characterData.advantages.length
                    } gefunden</li>
                    <li><strong>Übernatürliche Fertigkeiten:</strong> ${
                        importAnalysis.supernaturalSkills.found.length
                    }/${importAnalysis.supernaturalSkills.total} gefunden</li>
                    <li><strong>Freie Fertigkeiten:</strong> ${
                        importAnalysis.freeSkills.total
                    } Freie Fertigkeiten</li>
                    <li><strong>Waffen:</strong> ${importAnalysis.weapons.found.length}/${
                        characterData.weapons.filter((w) => w.name).length
                    } gefunden</li>
                    <li><strong>Rüstungen:</strong> ${importAnalysis.armors.found.length}/${
                        characterData.armors.filter((a) => a.name).length
                    } werden erstellt</li>
                    <li><strong>Eigenheiten:</strong> ${
                        characterData.eigenheiten.length
                    } Eigenheiten</li>
                    ${
                        characterData.experience.total > 0
                            ? `<li><strong>Erfahrung:</strong> ${characterData.experience.total} Gesamt, ${characterData.experience.spent} Ausgegeben</li>`
                            : ''
                    }
                    ${characterData.notes ? '<li><strong>Notizen:</strong> Enthalten</li>' : ''}
                </ul>
            </div>
            
            ${this.generateMissingItemsWarning(importAnalysis)}
            
            <div style="background-color: #e8f5e8; border: 1px solid #4caf50; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                <strong>ℹ️ Hinweis:</strong> Nicht gefundene Items werden nicht importiert. Damit alles korrekt importiert wird, stellen Sie sicher, dass die benötigten Items in Kompendien vorhanden sind. Dabei ist auf korrekte Schreibweise des Namens zu achten, da Sephrasto und Ilaris-Foundry nur mit Namen und nicht mit IDs arbeiten.
            </div>
            
            <p><strong>Möchten Sie den Charakter "${
                characterData.name
            }" aus der XML-Datei "${fileName}" importieren?</strong></p>
        `

        return new Promise((resolve) => {
            new Dialog(
                {
                    title: 'Charakter-Import bestätigen',
                    content: dialogContent,
                    buttons: {
                        yes: {
                            icon: '<i class="fas fa-download"></i>',
                            label: 'Charakter importieren',
                            callback: () => resolve(true),
                        },
                        no: {
                            icon: '<i class="fas fa-times"></i>',
                            label: 'Abbrechen',
                            callback: () => resolve(false),
                        },
                    },
                    default: 'yes',
                    close: () => resolve(false),
                },
                {
                    width: 650,
                    height: 'auto',
                },
            ).render(true)
        })
    }

    /**
     * Show confirmation dialog before syncing character data
     * @param {Actor} actor - The actor that will be updated
     * @param {Object} characterData - The parsed character data from XML
     * @param {string} fileName - The name of the XML file
     * @returns {Promise<boolean>} True if user confirms, false if cancelled
     */
    static async showSyncConfirmationDialog(actor, characterData, fileName) {
        // Count current items that will be affected
        const currentSkills = actor.items.filter((item) => item.type === 'fertigkeit').length
        const currentTalents = actor.items.filter((item) =>
            ['talent', 'zauber', 'liturgie'].includes(item.type),
        ).length
        const currentAdvantages = actor.items.filter((item) => item.type === 'vorteil').length
        const currentSupernaturalSkills = actor.items.filter(
            (item) => item.type === 'uebernatuerliche_fertigkeit',
        ).length
        const currentFreeSkills = actor.items.filter(
            (item) => item.type === 'freie_fertigkeit',
        ).length

        // Count preserved items
        const preservedInventory = actor.items.filter((item) =>
            ['gegenstand', 'ruestung', 'nahkampfwaffe', 'fernkampfwaffe'].includes(item.type),
        ).length
        const preservedEigenheiten = actor.items.filter((item) => item.type === 'eigenheit').length

        // Count new items from XML
        const newSkills = characterData.skills.length
        const newTalents =
            characterData.talents.length +
            characterData.supernaturalTalents.filter((t) =>
                characterData.talents.every((regular) => regular.name !== t.name),
            ).length
        const newAdvantages = characterData.advantages.length
        const newSupernaturalSkills = characterData.supernaturalSkills.filter(
            (skill) => skill.value > 0,
        ).length
        const newFreeSkills = characterData.freeSkills.length

        const dialogContent = `
            <div style="margin-bottom: 15px;">
                <h3>Charakter-Synchronisation bestätigen</h3>
                <p><strong>Datei:</strong> ${fileName}</p>
                <p><strong>Charakter:</strong> ${actor.name} → ${characterData.name}</p>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h4 style="color: #d32f2f; margin-bottom: 8px;">⚠️ Wird ERSETZT:</h4>
                <ul style="margin-left: 20px; margin-bottom: 0;">
                    <li><strong>Charaktername:</strong> "${actor.name}" → "${characterData.name}"</li>
                    <li><strong>Attribute:</strong> Alle Attributwerte werden aktualisiert</li>
                    <li><strong>Energien:</strong> AsP-, KaP-, GuP-Werte werden aktualisiert</li>
                    <li><strong>Fertigkeiten:</strong> ${currentSkills} aktuell → ${newSkills} aus XML</li>
                    <li><strong>Talente:</strong> ${currentTalents} aktuell → ${newTalents} aus XML</li>
                    <li><strong>Vorteile:</strong> ${currentAdvantages} aktuell → ${newAdvantages} aus XML</li>
                    <li><strong>Übernatürliche Fertigkeiten:</strong> ${currentSupernaturalSkills} aktuell → ${newSupernaturalSkills} aus XML</li>
                    <li><strong>Freie Fertigkeiten:</strong> ${currentFreeSkills} aktuell → ${newFreeSkills} aus XML</li>
                    <li><strong>Eigenheiten:</strong> Nur Duplikate werden ersetzt, Bestehende bleiben erhalten, neue werden hinzugefügt</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h4 style="color: #2e7d32; margin-bottom: 8px;">✅ Bleibt ERHALTEN:</h4>
                <ul style="margin-left: 20px; margin-bottom: 0;">
                    <li><strong>Inventar-Gegenstände:</strong> ${preservedInventory} Gegenstände (Waffen, Rüstungen, Objekte)</li>
                    <li><strong>Finanzen:</strong> Geld wird nicht aus der XML übernommen</li>
                    <li><strong>Charakternotizen:</strong> Manuelle Notizen werden nicht überschrieben</li>
                    <li><strong>Eigenheiten:</strong> ${preservedEigenheiten} bestehende (keine Duplikate bleiben erhalten)</li>
                    <li><strong>Charakterbogen-Einstellungen:</strong> UI-Einstellungen, eigene Anpassungen</li>
                </ul>
            </div>
            
            <div style="background-color: #e3f2fd; border: 1px solid #2196f3; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                <strong>ℹ️ Design-Philosophie:</strong> Sephrasto ist der Charakterverwalter (Werte, Fertigkeiten, Talente), während Foundry der Inventarverwalter ist (Waffen, Rüstungen, Gegenstände, Geld). Die Synchronisation aktualisiert nur Charakterwerte und -fähigkeiten, aber nicht das Inventar.
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                <strong>⚠️ Warnung:</strong> Diese Aktion kann nicht rückgängig gemacht werden! Alle aktuellen Fertigkeiten, Talente und Vorteile werden durch die Daten aus der XML-Datei ersetzt.
            </div>
            
            <p><strong>Sind Sie sicher, dass Sie den Charakter "${actor.name}" mit der XML-Datei "${fileName}" synchronisieren möchten?</strong></p>
        `

        return new Promise((resolve) => {
            new Dialog(
                {
                    title: 'Charakter-Synchronisation bestätigen',
                    content: dialogContent,
                    buttons: {
                        yes: {
                            icon: '<i class="fas fa-sync-alt"></i>',
                            label: 'Charakter synchronisieren',
                            callback: () => resolve(true),
                        },
                        no: {
                            icon: '<i class="fas fa-times"></i>',
                            label: 'Abbrechen',
                            callback: () => resolve(false),
                        },
                    },
                    default: 'no',
                    close: () => resolve(false),
                },
                {
                    width: 600,
                    height: 'auto',
                },
            ).render(true)
        })
    }

    /**
     * Generate section showing configured compendium packs
     * @param {Object} packInfo - Pack information from getConfiguredPacks
     * @returns {string} HTML string for pack information
     */
    static generateConfiguredPacksInfo(packInfo) {
        if (!packInfo) {
            return ''
        }

        const sections = []

        if (packInfo.skills && packInfo.skills.length > 0) {
            sections.push(
                `<li><strong>Fertigkeiten-Kompendien:</strong> ${packInfo.skills.join(', ')}</li>`,
            )
        }

        if (packInfo.talents && packInfo.talents.length > 0) {
            sections.push(
                `<li><strong>Talente-Kompendien:</strong> ${packInfo.talents.join(', ')}</li>`,
            )
        }

        if (packInfo.advantages && packInfo.advantages.length > 0) {
            sections.push(
                `<li><strong>Vorteile-Kompendien:</strong> ${packInfo.advantages.join(', ')}</li>`,
            )
        }

        if (sections.length === 0) {
            return `
                <div style="background-color: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                    <strong>⚠️ Warnung:</strong> Keine Kompendien konfiguriert! Bitte konfigurieren Sie die zu verwendenden Kompendien in den Welteinstellungen.
                </div>
            `
        }

        return `
            <div style="background-color: #e3f2fd; border: 1px solid #2196f3; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                <strong>📚 Verwendete Kompendien:</strong>
                <ul style="margin-left: 20px; margin-bottom: 0; margin-top: 8px;">
                    ${sections.join('')}
                </ul>
            </div>
        `
    }

    /**
     * Generate warning section for missing items
     * @param {Object} analysis - The analysis from analyzeImportData
     * @returns {string} HTML string for missing items warning
     */
    static generateMissingItemsWarning(analysis) {
        const missingItems = []

        if (analysis.skills.missing.length > 0) {
            missingItems.push(
                `<li><strong>Fertigkeiten:</strong> ${analysis.skills.missing.join(', ')}</li>`,
            )
        }

        if (analysis.talents.missing.length > 0) {
            missingItems.push(
                `<li><strong>Talente:</strong> ${analysis.talents.missing.join(', ')}</li>`,
            )
        }

        if (analysis.advantages.missing.length > 0) {
            missingItems.push(
                `<li><strong>Vorteile:</strong> ${analysis.advantages.missing.join(', ')}</li>`,
            )
        }

        if (analysis.supernaturalSkills.missing.length > 0) {
            missingItems.push(
                `<li><strong>Übernatürliche Fertigkeiten:</strong> ${analysis.supernaturalSkills.missing.join(
                    ', ',
                )}</li>`,
            )
        }

        if (analysis.weapons.missing.length > 0) {
            missingItems.push(
                `<li><strong>Waffen:</strong> ${analysis.weapons.missing.join(', ')}</li>`,
            )
        }

        if (analysis.armors.missing.length > 0) {
            missingItems.push(
                `<li><strong>Rüstungen:</strong> ${analysis.armors.missing.join(', ')}</li>`,
            )
        }

        if (missingItems.length === 0) {
            return `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #2e7d32; margin-bottom: 8px;">✅ Perfekte Übereinstimmung!</h4>
                    <p style="margin-left: 20px; margin-bottom: 0; color: #2e7d32;">Alle Items wurden in den Kompendien gefunden.</p>
                </div>
            `
        }

        return `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #f57c00; margin-bottom: 8px;">⚠️ Nicht gefunden:</h4>
                <ul style="margin-left: 20px; margin-bottom: 0; color: #f57c00;">
                    ${missingItems.join('')}
                </ul>
            </div>
        `
    }

    /**
     * Show file upload dialog for XML import
     * @returns {Promise<Actor|null>} The imported actor or null if cancelled
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
                        // Import the XmlCharacterImporter dynamically to avoid circular imports
                        const { XmlCharacterImporter } = await import('./xml_character_importer.js')
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
     * @returns {Promise<Actor|null>} The updated actor or null if cancelled
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
                        // Import the XmlCharacterImporter dynamically to avoid circular imports
                        const { XmlCharacterImporter } = await import('./xml_character_importer.js')
                        const importer = new XmlCharacterImporter()
                        const updatedActor = await importer.updateActorFromXml(
                            actor,
                            e.target.result,
                            file.name,
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
