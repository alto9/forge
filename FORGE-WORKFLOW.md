# Forge GitHub Issue Workflow

This workflow integrates Forge commands with GitHub Issues and Project Boards to manage the complete lifecycle from issue refinement through implementation and review.

## PHASE 1: PRODUCT MANAGER (Refinement)

1. Move the issue to **Refinement** status on the GitHub Project Board.
2. Create a branch for the issue from `main`.
3. Run the `forge-refine` command (Cursor) or use `@forge-refine` persona (VSCode):
   - Paste the GitHub issue link
   - The AI will help refine the issue by analyzing existing code
   - Ensure all required fields are completed:
     - Problem Statement
     - Business Value
     - Testing Procedures (BAU perspective)
     - Definition of Success
     - Definition of Failure
   - Once satisfied with the refinement, proceed to Scribe mode

**Goal**: Get the original ticket in the most informed state possible, excluding technical implementation details. The business value must be clearly spelled out and accurate. Testing procedures should be filled out from a BAU (Business As Usual) perspective. Clear definitions of success and failure are required.

## PHASE 2: PRODUCT MANAGER (Scribe)

4. Use `forge-scribe` command (Cursor) or `@forge-scribe` persona (VSCode), passing in the primary issue URL.
   - The AI will analyze the refined issue and either:
     - Add technical implementation and test details directly to the issue (if small enough), OR
     - Create sub-issues with technical implementation steps and test procedures
   - Each sub-issue should be focused and represent < 30 minutes of work
   - Sub-issues are automatically linked to the parent issue

5. Once satisfied with the issue and/or sub-issues, move the parent issue to **Ready** status on the project board.

**Goal**: Create sub-issues populated with accurate technical implementation steps and test procedures. If the issue is small enough, no sub-issues should be created—work will proceed on the primary issue directly.

## PHASE 3: DEVELOPER (Build)

6. Move your issue to **In Progress** status.

### For Issues WITH Sub-Issues

7. For each sub-issue, perform the following steps:

   7.a. Move the sub-issue to **In Progress** and create a branch using GitHub UI. The branch target **MUST** be the branch on the parent ticket (not `main`).
   
   7.b. **Switch to Plan Mode** in Cursor. Use the `forge-build` command (Cursor) or `@forge-build` persona (VSCode), passing in the GitHub issue URL.
   
   7.c. Review the implementation plan, then execute it. The AI will:
      - Analyze the issue and existing codebase
      - Implement the changes as described
      - Write tests based on the test procedures
      - Run lint, test, and validation scripts
   
   7.d. Verify that all test, lint, and build scripts are succeeding.
   
   7.e. Complete the acceptance criteria on the issue and validate that the code does what it was supposed to do.
   
   7.f. Commit and push your changes, then create a **Pull Request** from your sub-issue branch into the **PARENT ISSUE BRANCH** (not `main`).
   
   7.g. Once all pull request checks succeed, send a DM to the team notifying them that a PR is ready for review.
   
   7.h. Once an approval is received, merge your own pull request into the parent issue branch.

8. **After all sub-issues are completed**:
   
   8.a. Check out the parent issue branch locally.
   
   8.b. Verify all changes from sub-issues are present and the branch builds successfully.
   
   8.c. Create a **Pull Request** from the **PARENT ISSUE BRANCH** to the **MAIN** branch.
   
   8.d. Move the parent issue to **In Review** status.
   
   8.e. Send a DM to the team notifying them that the parent PR is ready for review.

### For Issues WITHOUT Sub-Issues

7. For the issue you were given, perform the following steps:

   7.a. Check out the branch for the issue.
   
   7.b. **Switch to Plan Mode** in Cursor. Use the `forge-build` command (Cursor) or `@forge-build` persona (VSCode), passing in the GitHub issue URL.
   
   7.c. Review the implementation plan, then execute it. The AI will:
      - Analyze the issue and existing codebase
      - Implement the changes as described
      - Write tests based on the test procedures
      - Run lint, test, and validation scripts
   
   7.d. Verify that all test, lint, and build scripts are succeeding.
   
   7.e. Complete the acceptance criteria on the issue and validate that the code does what it was supposed to do.
   
   7.f. Commit and push your changes, then create a **Pull Request** from your issue branch into `main`.
   
   7.g. Move the issue to **In Review** status.
   
   7.h. Once all pull request checks succeed, send a DM to the team notifying them that a PR is ready for review.

## PHASE 4: PRODUCT MANAGER (Review)

9. Pull the primary branch down locally.

10. Run the following commands and verify all succeed:
    - `npm install`
    - `npm run test`
    - `npm run lint`
    - `npm run build`

11. Test the changes locally to ensure they work as expected.

12. Review the code changes in GitHub.

13. Approve the Pull Request in GitHub.

14. Merge the Pull Request (this moves the ticket to **Done** and may trigger a new release).

---

## Notes

- **Plan Mode**: In Cursor, Plan Mode allows you to review the AI's implementation plan before it executes changes. This is recommended for all `forge-build` commands.
- **Branch Strategy**: Sub-issues branch from the parent issue branch, not from `main`. Only the final parent PR merges into `main`.
- **Testing**: All tests, lint checks, and build scripts must pass before marking work as complete.
- **Communication**: Always notify the team via DM when PRs are ready for review.
