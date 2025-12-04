---
feature_id: wysiwyg-markdown-editor
name: WYSIWYG Markdown Editor
description: Rich text editing experience for markdown content in Forge Studio
spec_id: [wysiwyg-editor-implementation]
model_id: []
---

# WYSIWYG Markdown Editor

## Feature: Rich Text Markdown Editing

```gherkin
Feature: WYSIWYG Markdown Editor
  As a developer
  I want to edit markdown with rich text formatting
  So that I can create and modify content without learning markdown syntax

  Scenario: Visual formatting toolbar
    Given I am editing a markdown field in Studio
    When I have an active session
    Then I should see a formatting toolbar above the editor
    And the toolbar should include bold, italic, strikethrough buttons
    And the toolbar should include heading level buttons (H1-H6)
    And the toolbar should include list buttons (bullet, numbered)
    And the toolbar should include link and image buttons
    And the toolbar should include code block and inline code buttons
    And the toolbar should include blockquote button

  Scenario: Apply bold formatting
    Given I am editing text in the WYSIWYG editor
    When I select text and click the bold button
    Then the selected text should appear bold
    And the underlying markdown should use **text** syntax
    When I click the bold button again
    Then the bold formatting should be removed

  Scenario: Apply italic formatting
    Given I am editing text in the WYSIWYG editor
    When I select text and click the italic button
    Then the selected text should appear italic
    And the underlying markdown should use *text* syntax

  Scenario: Apply heading formatting
    Given I have a paragraph of text
    When I click on the heading level button
    Then I should see a dropdown with H1, H2, H3, H4, H5, H6 options
    When I select H2
    Then the paragraph should become a heading
    And the underlying markdown should use ## syntax

  Scenario: Create bulleted list
    Given I am editing text in the WYSIWYG editor
    When I click the bullet list button
    Then the current line should become a list item
    And pressing Enter should create a new list item
    And the underlying markdown should use - syntax

  Scenario: Create numbered list
    Given I am editing text in the WYSIWYG editor
    When I click the numbered list button
    Then the current line should become a numbered list item
    And pressing Enter should create a new numbered item with auto-increment
    And the underlying markdown should use 1. 2. 3. syntax

  Scenario: Insert link
    Given I am editing text in the WYSIWYG editor
    When I select text and click the link button
    Then I should see a dialog prompting for URL
    When I enter a URL and confirm
    Then the text should become a clickable link
    And the underlying markdown should use [text](url) syntax
    When I click the link
    Then I should be able to edit or remove it

  Scenario: Insert image
    Given I am editing text in the WYSIWYG editor
    When I click the image button
    Then I should see a dialog prompting for image URL and alt text
    When I provide the details and confirm
    Then an image should be inserted at cursor position
    And the underlying markdown should use ![alt](url) syntax

  Scenario: Insert code block
    Given I am editing text in the WYSIWYG editor
    When I click the code block button
    Then I should see a dialog prompting for language
    When I specify the language
    Then a code block should be inserted with syntax highlighting
    And the underlying markdown should use ```language syntax

  Scenario: Insert inline code
    Given I am editing text in the WYSIWYG editor
    When I select text and click the inline code button
    Then the text should appear in monospace font
    And the underlying markdown should use `text` syntax

  Scenario: Insert blockquote
    Given I am editing text in the WYSIWYG editor
    When I click the blockquote button
    Then the current paragraph should become a blockquote
    And the underlying markdown should use > syntax
    And the text should appear with quote styling
```

## Feature: Keyboard Shortcuts

```gherkin
Feature: Keyboard Shortcuts for Formatting
  As a developer
  I want to use keyboard shortcuts for formatting
  So that I can work efficiently without using the mouse

  Scenario: Bold shortcut
    Given I am editing text in the WYSIWYG editor
    When I select text and press Cmd+B (Mac) or Ctrl+B (Windows/Linux)
    Then the text should become bold

  Scenario: Italic shortcut
    Given I am editing text in the WYSIWYG editor
    When I select text and press Cmd+I or Ctrl+I
    Then the text should become italic

  Scenario: Link shortcut
    Given I am editing text in the WYSIWYG editor
    When I select text and press Cmd+K or Ctrl+K
    Then the link dialog should open

  Scenario: Code shortcut
    Given I am editing text in the WYSIWYG editor
    When I select text and press Cmd+E or Ctrl+E
    Then the text should become inline code

  Scenario: Heading shortcuts
    Given I am editing text in the WYSIWYG editor
    When I press Cmd+1 or Ctrl+1
    Then the current line should become H1
    When I press Cmd+2 or Ctrl+2
    Then the current line should become H2
```

## Feature: Markdown Source Toggle

```gherkin
Feature: Toggle Between Visual and Source View During Edit Mode
  As a developer
  I want to switch between visual and markdown source views when editing
  So that I can use whichever editing mode suits my needs

  Background:
    Given I have an active design session
    And I am editing a markdown field in Studio

  Scenario: Toggle is visible only during active session
    Given I have an active session
    When I view a markdown editor
    Then I should see a toggle button with "Visual" and "Source" options
    And the toggle should follow the same pattern as Nomnoml diagrams

  Scenario: Toggle is hidden in read-only mode
    Given I do not have an active session
    When I view a markdown field
    Then I should NOT see a toggle button
    And the content should be displayed in rendered form (not source)
    And the content should not be editable

  Scenario: Switch to source view during editing
    Given I am editing in Visual (WYSIWYG) mode
    When I click the "Source" toggle button
    Then I should see the raw markdown source in an editable textarea
    And the formatting toolbar should be hidden
    And I should be able to edit the markdown directly

  Scenario: Switch back to visual mode
    Given I am editing markdown source
    When I click the "Visual" toggle button
    Then I should see the WYSIWYG editor
    And my changes should be preserved
    And the formatting toolbar should reappear
    And I should be able to edit with rich text controls

  Scenario: Edit in source mode
    Given I am in source view
    When I edit the markdown directly
    And I switch back to visual mode
    Then my changes should be rendered correctly
    And the visual formatting should reflect my markdown edits
```

## Feature: Gherkin Code Block Preservation

```gherkin
Feature: Preserve Gherkin Code Blocks
  As a developer
  I want Gherkin code blocks to remain intact in WYSIWYG editor
  So that the structured Gherkin editor can handle them separately

  Scenario: Display Gherkin blocks as code
    Given a feature file contains Gherkin code blocks
    When I open it in WYSIWYG editor
    Then Gherkin blocks should be displayed as code blocks
    And they should not be editable in WYSIWYG mode
    And they should show a label "Edited via Gherkin Editor"

  Scenario: Edit Gherkin via structured editor
    Given I am viewing a Gherkin code block in WYSIWYG mode
    When I want to edit the Gherkin
    Then I should use the structured Gherkin editor component
    And the Gherkin editor should handle the parsing and serialization
    And the WYSIWYG editor should display the result
```

## Feature: Read-Only Mode

```gherkin
Feature: Read-Only Rendered Display (Follows Nomnoml Pattern)
  As a developer
  I want to view markdown as rendered HTML when no session is active
  So that I can read content easily in its final form

  Rule: Same Pattern as Nomnoml Diagrams
    Given Nomnoml diagrams are rendered (not shown as source) in read-only mode
    When markdown fields are in read-only mode
    Then they should also be rendered (not shown as source)
    And no toggle should be visible

  Scenario: Display rendered content in read-only mode
    Given I do not have an active session
    When I view a markdown file
    Then I should see the content RENDERED with formatting
    And I should NOT see a Visual/Source toggle
    And I should NOT see the raw markdown source
    And I should NOT see a formatting toolbar
    And the content should not be editable
    And I should see a message to start a session to edit

  Scenario: Copy from read-only rendered view
    Given I am viewing content in read-only rendered mode
    When I select text
    Then I should be able to copy the formatted text
    But I should not be able to modify it

  Scenario: Read-only display matches Nomnoml behavior
    Given Nomnoml diagrams show as rendered SVG in read-only mode
    When I view markdown in read-only mode
    Then it should show as rendered HTML (not source)
    And this provides consistency across all content types in Studio
```

## Feature: Auto-Save Integration

```gherkin
Feature: Auto-Save WYSIWYG Changes
  As a developer
  I want my edits to be saved automatically
  So that I don't lose work if I navigate away

  Scenario: Debounced auto-save
    Given I am editing in WYSIWYG mode
    When I make changes
    Then a save should be triggered after 500ms of inactivity
    And the changes should be written to the file
    And the file should be tracked in the active session

  Scenario: Save markdown source
    Given I am editing in WYSIWYG mode
    When auto-save triggers
    Then the editor content should be converted to markdown
    And the markdown should be saved to disk
    And the frontmatter should be preserved
```

## Feature: Table Editing

```gherkin
Feature: WYSIWYG Table Editor
  As a developer
  I want to edit markdown tables visually
  So that I can create and modify tables easily

  Scenario: Insert table
    Given I am editing in WYSIWYG mode
    When I click the table button in the toolbar
    Then I should see a dialog for table dimensions
    When I specify rows and columns
    Then a table should be inserted
    And I should be able to edit cells directly

  Scenario: Add/remove rows
    Given I have a table in the editor
    When I right-click on a row
    Then I should see options to insert or delete rows
    When I insert a row above or below
    Then the table should update with the new row

  Scenario: Add/remove columns
    Given I have a table in the editor
    When I right-click on a column
    Then I should see options to insert or delete columns
    When I insert a column left or right
    Then the table should update with the new column
```

