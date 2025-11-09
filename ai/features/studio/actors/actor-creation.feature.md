---
feature_id: actor-creation
name: Actor Creation
description: User experience for creating new actors in Forge Studio
spec_id:
  - actor-creation-ui
  - actor-templates
model_id:
  - actor-creation
  - studio-state
context_id:
  - theme
  - vsce
---
```gherkin
Scenario: Create actor at any time
  Given I am in the Actors section
  When I want to create a new actor
  Then I should be able to click "New Actor" button
  And I should be prompted for actor name
  And I should be able to select actor type (user, system, external)
  And I should be able to enter actor description
  And I should be able to save the actor
  And the actor should be created with proper template
  And I should be taken to edit the new actor
  And no active session is required
```

```gherkin
Scenario: Create actor without active session
  Given I do not have an active session
  And I am in the Actors section
  When I create a new actor
  Then the actor should be created successfully
  And the actor file should be saved on disk
  And the actor should NOT be tracked in any session
  And actors are foundational and do not require sessions
```

```gherkin
Scenario: Create actor with active session
  Given I have an active design session
  And I am in the Actors section
  When I create a new actor
  Then the actor should be created successfully
  And the actor file should be saved on disk
  And the actor should NOT be tracked in the session's changed_files
  And actors are foundational and not session-tracked
```

```gherkin
Scenario: Create actor in specific folder
  Given I have selected a subfolder in the actors list
  When I want to create a new actor
  Then I should be able to click "New Actor" button
  And the new actor should be created in the selected folder
  And I should be prompted for actor details
  And the actor should be saved in the correct location
  And no active session is required
```

```gherkin
Scenario: Fill actor creation form
  Given I am creating a new actor
  When I fill out the actor creation form
  Then I should be able to enter actor ID (auto-generated from name)
  And I should be able to select actor type from dropdown
  And I should be able to enter actor name
  And I should be able to enter actor description
  And I should see validation for required fields
  And I should be able to save or cancel
```

```gherkin
Scenario: Validate actor creation form
  Given I am filling out the actor creation form
  When I try to save with missing required fields
  Then I should see validation errors
  And I should not be able to save until errors are fixed
  And I should see which fields are required
```

```gherkin
Scenario: Auto-generate actor ID
  Given I am creating a new actor
  When I enter the actor name
  Then the actor ID should be auto-generated in kebab-case
  And I should be able to modify the actor ID if needed
  And the actor ID should be validated for uniqueness
```

```gherkin
Scenario: Apply actor template
  Given I am creating a new actor
  When the actor is created
  Then it should have proper frontmatter with actor_id and type
  And it should have template content with sections for:
  And the template should include helpful placeholder text
  And I should be able to edit all sections
```

```gherkin
Scenario: Template based on actor type
  Given I am creating an actor
  When I select different actor types
  Then the template should adapt to the actor type
  And user actors should have user-specific template sections
  And system actors should have system-specific template sections
  And external actors should have external-specific template sections
```
