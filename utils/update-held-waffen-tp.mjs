/**
 * Aktualisiert system.tp aller nahkampfwaffe/fernkampfwaffe-Items in den Held-JSONs
 * mit den Werten aus dem Waffen-Compendium. Matching erfolgt über den Namen.
 *
 * Strategie:
 * 1. Exakter Name-Match
 * 2. Falls kein exakter Match: Basis-Name (ohne Klammern-Suffix) + Typ-Match
 *    → bei mehreren Treffern: nur übernehmen wenn alle denselben tp-Wert haben
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const WAFFEN_DIR = path.join(ROOT, "comp_packs", "waffen", "_source");
const HELDEN_DIR = path.join(ROOT, "comp_packs", "beispiel-helden", "_source");
const WEAPON_TYPES = new Set(["nahkampfwaffe", "fernkampfwaffe"]);

// ── 1. Waffen-Lookup aufbauen ─────────────────────────────────────────────────

/** @type {Map<string, {name: string, tp: string, type: string}[]>} name → entries */
const byExactName = new Map();

for (const file of fs.readdirSync(WAFFEN_DIR).filter((f) => f.endsWith(".json"))) {
  const data = JSON.parse(fs.readFileSync(path.join(WAFFEN_DIR, file), "utf8"));
  if (!WEAPON_TYPES.has(data.type)) continue;
  const entry = { name: data.name, tp: data.system?.tp ?? "", type: data.type };
  if (!byExactName.has(data.name)) byExactName.set(data.name, []);
  byExactName.get(data.name).push(entry);
}

/** Gibt den tp-Wert für ein Item zurück, oder null wenn kein eindeutiger Match */
function lookupTp(itemName, itemType) {
  // 1. Exakter Match
  if (byExactName.has(itemName)) {
    const matches = byExactName.get(itemName).filter((e) => e.type === itemType);
    if (matches.length === 1) return { tp: matches[0].tp, matchedName: itemName };
    if (matches.length > 1) {
      const tps = [...new Set(matches.map((e) => e.tp))];
      if (tps.length === 1) return { tp: tps[0], matchedName: itemName };
      console.warn(`  MEHRDEUTIG (exakt): "${itemName}" → [${tps.join(", ")}]`);
      return null;
    }
  }

  // 2. Basis-Name: letzten Klammerausdruck entfernen (oder itemName selbst falls kein Ausdruck)
  const baseName = itemName.replace(/\s*\([^)]*\)\s*$/, "").trim() || itemName;

  // Waffen-Einträge suchen: exakter Name = baseName ODER Name beginnt mit "baseName ("
  // (verhindert Falsch-Matches wie "Speerschleuder" bei Basis "Speer")
  const candidates = [];
  for (const [wName, entries] of byExactName) {
    if (wName === baseName || wName.startsWith(baseName + " (")) {
      for (const e of entries) {
        if (e.type === itemType) candidates.push(e);
      }
    }
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return { tp: candidates[0].tp, matchedName: candidates[0].name };

  const tps = [...new Set(candidates.map((e) => e.tp))];
  if (tps.length === 1) return { tp: tps[0], matchedName: candidates.map((e) => e.name).join(" | ") };

  console.warn(`  MEHRDEUTIG (Basis "${baseName}"): "${itemName}" → [${tps.join(", ")}]`);
  return null;
}

// ── 2. Helden-JSONs aktualisieren ─────────────────────────────────────────────

let totalUpdated = 0;
let totalSkipped = 0;
let totalNoMatch = 0;

for (const file of fs.readdirSync(HELDEN_DIR).filter((f) => f.endsWith(".json"))) {
  const filePath = path.join(HELDEN_DIR, file);
  const held = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!Array.isArray(held.items)) continue;

  let fileChanged = false;
  for (const item of held.items) {
    if (!WEAPON_TYPES.has(item.type)) continue;

    const result = lookupTp(item.name, item.type);
    if (!result) {
      console.warn(`  KEIN MATCH: "${item.name}" (${item.type}) in ${file}`);
      totalNoMatch++;
      continue;
    }

    const currentTp = item.system?.tp ?? "";
    if (currentTp === result.tp) {
      totalSkipped++;
      continue;
    }

    console.log(
      `  UPDATE: "${item.name}" (${item.type}) in ${file}: "${currentTp}" → "${result.tp}"  [via "${result.matchedName}"]`
    );
    item.system.tp = result.tp;
    fileChanged = true;
    totalUpdated++;
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(held, null, 2) + "\n", "utf8");
  }
}

console.log(`\nFertig: ${totalUpdated} aktualisiert, ${totalSkipped} unverändert, ${totalNoMatch} kein Match.`);
