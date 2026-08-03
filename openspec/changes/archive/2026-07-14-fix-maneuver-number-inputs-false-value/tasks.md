## 1. Template Fix

- [x] 1.1 Change `value="{{manoever.inputValue.value}}"` to `value="{{#if manoever.inputValue.value}}{{manoever.inputValue.value}}{{/if}}"` in `scripts/combat/templates/dialogs/uebernatuerlich.hbs` (line ~121)
- [x] 1.2 Run `npm test` to confirm no regressions
- [x] 1.3 Run `npm run lint` to confirm code style
- [ ] 1.4 Manual test: open übernatürlich dialog, select target, set maneuvers, cast — verify no "false cannot be parsed" errors and maneuvers apply correctly
