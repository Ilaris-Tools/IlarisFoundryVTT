## ADDED Requirements

### Requirement: Structured forms can override complete Zone lifecycle data

The effective-form resolver SHALL merge a selected form's Zone lifecycle, duration-source, and trigger values with the source Item's Zone profile before normalization. A form that omits these values SHALL retain the base Zone values. Form selection SHALL remain dialog-local.

#### Scenario: Langer Atem overrides only ongoing Zone behavior

- **WHEN** an instant base Zone selects a form that overrides lifecycle, duration, and triggers but uses `effectMode: "inherit"`
- **THEN** the resolved Zone SHALL use the form's persistent behavior
- **AND** the resolved Pre-Effect list SHALL remain the base list
