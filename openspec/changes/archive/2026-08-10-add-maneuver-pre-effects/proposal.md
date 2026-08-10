## Why

Combat maneuvers currently support only immediate dialog modifications such as
AT, VT, and TP changes. Rules such as Binden, Niederwerfen, and Umklammern
need persistent, resistible effects after a combat outcome, but must not create
a second effect lifecycle beside the established spell and liturgy pre-effect
system.

## What Changes

- Add `preEffects` to maneuver Items. The existing name and payload are reused:
  spells activate them after a successful cast, while maneuvers activate them
  after a configured combat outcome.
- Add maneuver activation points `onConfirmedHit` and `onSuccessfulDefense`.
  Maneuver pre-effects use the combat dialog's existing selected targets: an
  attack selects defenders and a defense automatically selects the attacker.
- Generalize the pre-effect application and resistance flow so spell and
  maneuver sources create the same native Foundry ActiveEffects, Ilaris
  modifiers, duration data, and provenance metadata.
- Add an effect-row action for an opposed escape ending. It stores the
  maneuver user's Actor UUID on the effect, lets the affected Actor choose GE
  or KK, prompts the maneuver user for the counter-check, and deletes only the
  linked effect when the escape succeeds.
- Author the first maneuver data: Binden applies a one-owner-turn VT penalty
  to the attacker after a successful defense; Niederwerfen and Umreißen apply
  Liegend after their configured failed resistance; Umklammern applies its
  persistent penalties and the opposed escape action; Entwaffnen uses a normal
  maneuver dropdown to choose Hauptwaffe or Nebenwaffe and clears that target
  weapon selection after a failed KK resistance.
- Keep weapon-property `targetEffect` data out of scope. It is neither
  migrated nor connected to this lifecycle in this change.
- Keep runtime-generated spell/liturgy maneuvers parsed from
  `system.modifikationen` out of scope. They are not persisted maneuver Items
  and will be designed separately.

The change is additive for maneuver data and effect actions. It modifies
combat outcome handling and the generic pre-effect implementation, while
preserving existing spell, liturgy, and Anrufung behavior.

## Capabilities

### New Capabilities

- `maneuver-pre-effects`: Author, activate, resolve, and end persistent
  effects created by selected combat maneuvers.

### Modified Capabilities

- `active-effects`: ActiveEffects expose and resolve a source-linked opposed
  escape action.
- `combat`: Melee combat outcome resolution activates selected maneuver
  pre-effects against the dialog's selected targets.

## Impact

- Affected code: maneuver data model and sheet; `AngriffDialog` and its
  defense-resolution flow; pre-effect processor and resist handler; ActiveEffect
  model, row rendering, and timing/action hooks; Binden, Niederwerfen,
  Umreißen, Umklammern, and Entwaffnen compendium `_source/` JSON; general
  maneuver selector input in item and combat dialogs.
- Foundry APIs and hooks: [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html),
  [Actor#createEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#createEmbeddedDocuments),
  [Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments),
  [ChatMessage#create](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html#create),
  [Hooks#on](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html#on),
  the existing `Ilaris.postSkillRoll` hook, and `foundry.utils.randomID`,
  `foundry.utils.deepClone`, and `foundry.utils.expandObject`.
- No dependency changes. Compendium data changes require `npm run pack-all`.

## Testing Impact

- Add unit coverage for maneuver activation filtering, source-neutral effect
  creation, resistance serialization, and opposed-escape resolution/deletion.
- Update pre-effect processor and resist-handler specs, ActiveEffect-row tests,
  maneuver sheet/data-model tests, and melee combat-dialog tests.
- Add E2E coverage for Binden after a successful defense, Niederwerfen and
  Umreißen after failed resistance, Entwaffnen's selected-slot update, and
  Umklammern's GE/KK selection and counter-check. The existing Foundry E2E
  world must provide a GM and controllable actors for the maneuver user and
  target; any repeated chat-prompt setup should be promoted to `e2e/shared/`
  if it proves reusable.
