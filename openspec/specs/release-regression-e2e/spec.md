## Purpose

Ensure release-critical dialogs and generated Held sheets remain user-visible and renderable.

## Requirements

### Requirement: Reachable critical dialogs

Critical import and synchronization dialogs SHALL expose confirmation controls through visible or scrollable content.

### Requirement: Renderable generated Held sheets

Newly created and XML-imported Held actors SHALL render the Kampf sheet without template errors.

### Requirement: User-visible regression coverage

E2E tests SHALL verify visible layout, selected values, and rendered outcomes for critical controls.
