# Waffeneigenschaften Migration Guide

This guide explains how to migrate weapons from the old eigenschaften format (object with boolean properties) to the new format (array of eigenschaft names).

## What Changed?

**Old Format:**

```json
{
    "eigenschaften": {
        "kopflastig": true,
        "zweihaendig": false,
        "schwer_4": true
    }
}
```

**New Format:**

```json
{
    "eigenschaften": ["Kopflastig", "Schwer (4)"]
}
```

## Migration Methods

### 1. Individual Weapon (In Item Sheet)

When you open a weapon item sheet that needs migration, you'll see a migration button:

**"🔄 Eigenschaften migrieren (alte → neue Format)"**

Simply click this button to migrate that specific weapon. The sheet will refresh and show the new eigenschaften format.

### 2. Console Commands (Batch Migration)

Open the browser console (F12) and use these commands:

#### Migrate all world items

```javascript
await IlarisMigration.migrateWorldWeapons()
```

#### Migrate all weapons on all actors

```javascript
await IlarisMigration.migrateActorWeapons()
```

#### Migrate a specific compendium pack

```javascript
await IlarisMigration.migrateCompendiumWeapons('Ilaris.waffen')
```

#### Migrate everything (world + actors + unlocked compendiums)

```javascript
await IlarisMigration.migrateAllWeapons()
```

### 3. System Waffen Pack (One-Time Developer Task)

For the system's built-in waffen compendium, run this special script:

```javascript
await migrateWaffenPack()
```

This will migrate all weapons in the `Ilaris.waffen` compendium.

## Property Mapping

The migration automatically maps old property names to new eigenschaft names:

| Old Property          | New Eigenschaft           |
| --------------------- | ------------------------- |
| kopflastig            | Kopflastig                |
| niederwerfen          | Niederwerfen              |
| niederwerfen_4        | Niederwerfen (4)          |
| niederwerfen_8        | Niederwerfen (8)          |
| parierwaffe           | Parierwaffe               |
| reittier              | Reittier                  |
| ruestungsbrechend     | Rüstungsbrechend          |
| schild                | Schild                    |
| schwer_4              | Schwer (4)                |
| schwer_8              | Schwer (8)                |
| stumpf                | Stumpf                    |
| unberechenbar         | Unberechenbar             |
| unzerstoerbar         | Unzerstörbar              |
| wendig                | Wendig                    |
| zerbrechlich          | Zerbrechlich              |
| zweihaendig           | Zweihändig                |
| kein_malus_nebenwaffe | kein Malus als Nebenwaffe |
| kein_reiter           | kein Reiter               |
| umklammern_212        | Umklammern (-2; 12)       |
| umklammern_416        | Umklammern (-4; 16)       |
| umklammern_816        | Umklammern (-8; 16)       |
| stationaer            | stationär                 |
| magazin               | Magazin                   |

## Backward Compatibility

The system maintains backward compatibility during the transition:

-   **Old format weapons** will continue to work using legacy calculation code
-   **New format weapons** use the data-driven WaffeItem calculation system
-   You'll see console warnings for weapons still using the old format
-   Mixed formats (some weapons old, some new) are fully supported

## Migration Statistics

After running a migration command, you'll see a notification with statistics:

-   **Migrated**: Number of weapons successfully converted
-   **Skipped**: Number of weapons already in new format
-   **Errors**: Number of weapons that failed to migrate

## Troubleshooting

### Migration button doesn't appear

-   The weapon is already in the new format
-   Refresh the sheet to see updated status

### Migration fails with error

-   Check the console for detailed error messages
-   Ensure the weapon item is not read-only
-   Make sure the compendium pack is unlocked

### Weapon still shows old format after migration

-   Refresh the sheet (close and reopen)
-   Check if the weapon was actually migrated (look at console logs)

## For Module/World Developers

If you distribute custom weapons in modules or adventure packs:

1. **Before release**: Run migration on your compendium packs
2. **For users**: Include migration instructions in your README
3. **Testing**: Test with both old and new format weapons

## Example Migration Workflow

### For System Maintainers:

```javascript
// 1. Migrate the system waffen pack
await migrateWaffenPack()

// 2. Verify migration
// Open a few weapon items and check they're in new format
```

### For World GMs:

```javascript
// 1. Backup your world first!

// 2. Migrate everything
await IlarisMigration.migrateAllWeapons()

// 3. Check your actors' weapons are working correctly
```

### For Players with Custom Weapons:

1. Open each custom weapon's item sheet
2. Click the migration button if it appears
3. Done!

## Technical Details

**Migration Script Location**: `scripts/common/waffen-migration.js`

**Functions Available**:

-   `migrateWeapon(weapon)` - Migrate single weapon
-   `migrateWeaponCollection(weapons)` - Migrate array/collection
-   `isOldEigenschaftenFormat(eigenschaften)` - Check format
-   `migrateEigenschaften(oldEigenschaften)` - Convert data structure

**Hook**: Migration commands registered on `ready` hook via `scripts/hooks/waffen-migration.js`
