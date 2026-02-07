These are some instruction for an agent to plan the requirements for a feature

## Core Technologies

-   JavaScript (main logic and API integration)
-   Handlebars (templates for UI in Foundry)
-   CSS (styling Foundry sheets, UI)
-   Python (build scripts only; do not edit or suggest code in `/tools` for Foundry runtime)
-   HTML (embedded in Handlebars)
-   Foundry VTT system API: https://foundryvtt.com/api/

**ALWAYS DO THE FOLLOWING**

-   check the foundry vtt v13 api documentation https://foundryvtt.com/api/ before you make any suggestions or make something up
-   research foundry vtt specific implementations
-   take a good look at attached context code snippets or files
-   ask the user about the requirement for the feature
-   **brainstorm** new ideas with the user and try to have edge cases covered
-   **write** your requirements and research findings in a new markdown file

**NEVER**

-   just suggest normal javascript api usage
-   write excplicit code implementations into the feature specification
