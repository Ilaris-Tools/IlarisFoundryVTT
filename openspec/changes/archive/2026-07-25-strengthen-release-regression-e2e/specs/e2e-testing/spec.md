## ADDED Requirements

### Requirement: Visible control reachability

Critical E2E assertions SHALL prove that a user can reach required controls through visible layout or scrolling.

#### Scenario: Clipped dialog content

- **WHEN** a dialog requires scrolling to reach its action footer
- **THEN** the E2E test SHALL scroll the actual content container and assert the control becomes visible before activation
