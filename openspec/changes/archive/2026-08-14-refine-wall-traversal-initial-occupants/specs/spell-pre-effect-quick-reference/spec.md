## ADDED Requirements

### Requirement: The Zone guide documents wall traversal boundary behavior

The German Zone automation quick reference SHALL state that _Wand aus Dornen_
uses the wall-specific traversal lifecycle rather than generic Region entry.
It SHALL explain that placing a wall over an already-contained Token has no
automatic consequence; a later normal movement into or out of the wall causes
the reviewed `2W6 TP` and GE 16 resistance flow. It SHALL retain the statement
that failed movement remains GM-managed and does not automatically reposition a
Token.

#### Scenario: A GM checks an initially contained Token

- **WHEN** a GM reads the Zone guide before placing _Wand aus Dornen_ over a Token
- **THEN** the guide SHALL state that placement alone neither damages the Token nor opens a resistance prompt
- **AND** it SHALL state that a later normal outbound movement is one traversal attempt
