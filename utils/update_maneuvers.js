import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing the maneuver source files
const sourceDir = path.join(__dirname, '..', 'packs', 'manover', '_source');

// Get all JSON files in the directory
const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.json'));

console.log(`Found ${files.length} maneuver files to process.`);

// Process each file
let updated = 0;
files.forEach(file => {
  const filePath = path.join(sourceDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Check if the file has a gruppe field
  if (data.system && data.system.gruppe !== undefined) {
    const oldGruppe = data.system.gruppe;
    
    // Update gruppe values according to the new structure
    // Gruppe 0 stays as 0 (Nahkampf Angriff) - the user can manually change some to 1 (Nahkampf Verteidigung) later
    // Gruppe 1, 2, 3 are shifted by +1
    if (oldGruppe === "1") {
      data.system.gruppe = "2"; // Fernkampf moved from 1 to 2
      updated++;
    } else if (oldGruppe === "2") {
      data.system.gruppe = "3"; // Magie moved from 2 to 3
      updated++;
    } else if (oldGruppe === "3") {
      data.system.gruppe = "4"; // Karma moved from 3 to 4
      updated++;
    }
    
    // Save the updated file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});

console.log(`Updated ${updated} maneuver files.`); 