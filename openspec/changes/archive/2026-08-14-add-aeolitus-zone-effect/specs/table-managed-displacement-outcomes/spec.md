## ADDED Requirements

### Requirement: Resistance failure can require table-managed displacement

The system SHALL allow an enabled resistance failure result to define
`tableManagedDisplacement.enabled: true`. The result SHALL require an enabled
marker with stable id and German label. After materializing that failed result,
the system SHALL retain the standard
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
marker and send one whispered German instruction through
[ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html)
to the affected target owner and active GM(s). The instruction SHALL state that
the GM resolves movement manually; it SHALL not update the
[TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html).

#### Scenario: Failed resistance creates a visible manual displacement outcome

- **WHEN** a target fails a resistance whose failure result enables a
  `zurueckgestossen` marker and table-managed displacement
- **THEN** the target SHALL receive a visible marker effect with full spell,
  selected-form, caster, cast-skill, and target-Token provenance
- **AND** the target owner and active GM(s) SHALL receive one German manual
  reposition instruction

#### Scenario: No automatic movement occurs

- **WHEN** a table-managed displacement outcome is materialized
- **THEN** the system SHALL not call a Token update, teleport, pathfinding, or
  movement-blocking API
