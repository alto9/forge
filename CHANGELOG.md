## 3.29.0 (2026-06-10)

* Merge pull request #65 from alto9/feature/issue-22 ([a05794a](https://github.com/alto9/forge/commit/a05794a)), closes [#65](https://github.com/alto9/forge/issues/65) [#22](https://github.com/alto9/forge/issues/22)
* feat(worker): add Cursor SDK agent activity adapter for Temporal ([a46ad02](https://github.com/alto9/forge/commit/a46ad02))
* feat(worker): map workflow retry and timeout policies to Temporal activities ([710645c](https://github.com/alto9/forge/commit/710645c))
* fix(ci): verify @cursor/sdk without package.json subpath resolve ([9d0143b](https://github.com/alto9/forge/commit/9d0143b))

## 3.28.0 (2026-06-10)

* Merge pull request #64 from alto9/feature/issue-21 ([1f73252](https://github.com/alto9/forge/commit/1f73252)), closes [#64](https://github.com/alto9/forge/issues/64) [#21](https://github.com/alto9/forge/issues/21)
* fix(temporal): share workflow run index store across recovery surfaces ([bae6f4e](https://github.com/alto9/forge/commit/bae6f4e))
* feat(temporal): automatic recovery scan on combined readiness (#44) ([8f6d5f9](https://github.com/alto9/forge/commit/8f6d5f9)), closes [#44](https://github.com/alto9/forge/issues/44)
* feat(temporal): persist window-scoped workflow run index (#43) ([5f9de42](https://github.com/alto9/forge/commit/5f9de42)), closes [#43](https://github.com/alto9/forge/issues/43)
* feat(temporal): surface recovery states and basic recovery actions (#45) ([43c9dd9](https://github.com/alto9/forge/commit/43c9dd9)), closes [#45](https://github.com/alto9/forge/issues/45)

## 3.27.0 (2026-06-09)

* Merge pull request #63 from alto9/feature/issue-20 ([d8a4a29](https://github.com/alto9/forge/commit/d8a4a29)), closes [#63](https://github.com/alto9/forge/issues/63) [#20](https://github.com/alto9/forge/issues/20)
* feat(temporal): add out-of-host worker supervisor and packaged entry (#40) ([4f2af62](https://github.com/alto9/forge/commit/4f2af62)), closes [#40](https://github.com/alto9/forge/issues/40)
* feat(temporal): gate workflow runs on worker config and poll readiness (#41) ([70abe32](https://github.com/alto9/forge/commit/70abe32)), closes [#41](https://github.com/alto9/forge/issues/41)
* feat(temporal): surface worker health in Output, status bar, and notifications (#42) ([2c24670](https://github.com/alto9/forge/commit/2c24670)), closes [#42](https://github.com/alto9/forge/issues/42)

## <small>3.26.3 (2026-06-09)</small>

* docs(ai): refine issue #27 contract updates ([cf5397a](https://github.com/alto9/forge/commit/cf5397a)), closes [#27](https://github.com/alto9/forge/issues/27)

## <small>3.26.2 (2026-06-09)</small>

* docs(ai): refine issue #26 contract updates ([62e590c](https://github.com/alto9/forge/commit/62e590c)), closes [#26](https://github.com/alto9/forge/issues/26)

## <small>3.26.1 (2026-06-09)</small>

* docs(ai): refine issue #25 contract updates ([1f880c7](https://github.com/alto9/forge/commit/1f880c7)), closes [#25](https://github.com/alto9/forge/issues/25)

## 3.26.0 (2026-06-09)

* Merge pull request #56 from alto9/feature/issue-19 ([67c443b](https://github.com/alto9/forge/commit/67c443b)), closes [#56](https://github.com/alto9/forge/issues/56) [#19](https://github.com/alto9/forge/issues/19)
* feat(temporal): add external configuration and mode-aware validation (#37) ([9e0e89c](https://github.com/alto9/forge/commit/9e0e89c)), closes [#37](https://github.com/alto9/forge/issues/37)
* feat(temporal): add external preflight gate and health surfaces (#39) ([21873ff](https://github.com/alto9/forge/commit/21873ff)), closes [#39](https://github.com/alto9/forge/issues/39)
* feat(temporal): bind external API keys in VS Code SecretStorage (#38) ([b727501](https://github.com/alto9/forge/commit/b727501)), closes [#38](https://github.com/alto9/forge/issues/38)

## 3.25.0 (2026-06-08)

* Merge pull request #54 from alto9/feature/issue-17 ([699120e](https://github.com/alto9/forge/commit/699120e)), closes [#54](https://github.com/alto9/forge/issues/54) [#33](https://github.com/alto9/forge/issues/33)
* Merge pull request #55 from alto9/feature/issue-18 ([74ab542](https://github.com/alto9/forge/commit/74ab542)), closes [#55](https://github.com/alto9/forge/issues/55) [#18](https://github.com/alto9/forge/issues/18)
* feat(temporal): add managed-local dev server supervisor (#34) ([ea9f98d](https://github.com/alto9/forge/commit/ea9f98d)), closes [#34](https://github.com/alto9/forge/issues/34)
* feat(temporal): add managed-local settings and readiness gate (#35) ([e1d3c11](https://github.com/alto9/forge/commit/e1d3c11)), closes [#35](https://github.com/alto9/forge/issues/35)
* feat(temporal): surface managed-local health in Output, status bar, and notifications (#36) ([2c94f28](https://github.com/alto9/forge/commit/2c94f28)), closes [#36](https://github.com/alto9/forge/issues/36)
* test(workflows): add refine-issue pre-run and phase mapping fixtures ([e9f17a9](https://github.com/alto9/forge/commit/e9f17a9))

## 3.24.0 (2026-06-08)

* Merge pull request #53 from alto9/feature/issue-16 ([695c340](https://github.com/alto9/forge/commit/695c340)), closes [#53](https://github.com/alto9/forge/issues/53) [#16](https://github.com/alto9/forge/issues/16)
* Merge pull request #53 from alto9/feature/issue-16 ([a2ed09b](https://github.com/alto9/forge/commit/a2ed09b)), closes [#53](https://github.com/alto9/forge/issues/53) [#16](https://github.com/alto9/forge/issues/16)
* feat(workflows): add domain validation for workflow definitions ([5788e22](https://github.com/alto9/forge/commit/5788e22)), closes [#31](https://github.com/alto9/forge/issues/31)
* feat(workflows): add pre-run validation orchestrator and run gate ([effb141](https://github.com/alto9/forge/commit/effb141)), closes [#32](https://github.com/alto9/forge/issues/32)
* feat(workflows): export pre-run validator scope and public module index ([e4e9565](https://github.com/alto9/forge/commit/e4e9565)), closes [#16](https://github.com/alto9/forge/issues/16)

## 3.23.0 (2026-06-08)

* Merge pull request #52 from alto9/feature/issue-15 ([badd523](https://github.com/alto9/forge/commit/badd523)), closes [#52](https://github.com/alto9/forge/issues/52) [#15](https://github.com/alto9/forge/issues/15) [#29](https://github.com/alto9/forge/issues/29) [#30](https://github.com/alto9/forge/issues/30)
* feat(workflows): add structural JSON Schema validation for workflow definitions ([d318cd7](https://github.com/alto9/forge/commit/d318cd7)), closes [#29](https://github.com/alto9/forge/issues/29)
* feat(workflows): add workspace workflow definition discovery index ([7c0a126](https://github.com/alto9/forge/commit/7c0a126))

## <small>3.22.12 (2026-06-08)</small>

* docs(ai): refine issue #24 contract updates ([dd55986](https://github.com/alto9/forge/commit/dd55986)), closes [#24](https://github.com/alto9/forge/issues/24)

## <small>3.22.11 (2026-06-08)</small>

* docs(ai): refine issue #23 contract updates ([97949da](https://github.com/alto9/forge/commit/97949da)), closes [#23](https://github.com/alto9/forge/issues/23)

## <small>3.22.10 (2026-06-08)</small>

* docs(ai): refine issue #22 contract updates ([9d6a611](https://github.com/alto9/forge/commit/9d6a611)), closes [#22](https://github.com/alto9/forge/issues/22)

## <small>3.22.9 (2026-06-08)</small>

* docs(ai): refine issue #21 contract updates ([46d1126](https://github.com/alto9/forge/commit/46d1126)), closes [#21](https://github.com/alto9/forge/issues/21)

## <small>3.22.8 (2026-06-08)</small>

* docs(ai): refine issue #20 contract updates ([d280f24](https://github.com/alto9/forge/commit/d280f24)), closes [#20](https://github.com/alto9/forge/issues/20)

## <small>3.22.7 (2026-06-08)</small>

* docs(ai): refine issue #19 contract updates ([540bdad](https://github.com/alto9/forge/commit/540bdad)), closes [#19](https://github.com/alto9/forge/issues/19)

## <small>3.22.6 (2026-06-08)</small>

* docs: update project board ([aa4aa45](https://github.com/alto9/forge/commit/aa4aa45))
* docs(ai): refine issue #18 contract updates ([8fd6141](https://github.com/alto9/forge/commit/8fd6141)), closes [#18](https://github.com/alto9/forge/issues/18)

## <small>3.22.5 (2026-06-08)</small>

* docs(ai): refine issue #17 contract updates ([2f2ba96](https://github.com/alto9/forge/commit/2f2ba96)), closes [#17](https://github.com/alto9/forge/issues/17)

## <small>3.22.4 (2026-06-08)</small>

* docs(ai): refine issue #16 contract updates ([53133a0](https://github.com/alto9/forge/commit/53133a0)), closes [#16](https://github.com/alto9/forge/issues/16)

## <small>3.22.3 (2026-06-08)</small>

* docs(ai): refine issue #15 contract updates ([5d95f01](https://github.com/alto9/forge/commit/5d95f01)), closes [#15](https://github.com/alto9/forge/issues/15)

## <small>3.22.2 (2026-06-08)</small>

* docs(ai): forge workflow temporal refactor contract updates ([e839190](https://github.com/alto9/forge/commit/e839190))

## <small>3.22.1 (2026-05-27)</small>

* docs: forge to ai migration ([7bbd276](https://github.com/alto9/forge/commit/7bbd276))

## 3.22.0 (2026-05-13)

* feat(submodules): add submodule superrepo support ([d8ad498](https://github.com/alto9/forge/commit/d8ad498))

## <small>3.21.2 (2026-04-29)</small>

* chore(release): 3.23.0 ([2e1c03e](https://github.com/alto9/forge/commit/2e1c03e))

## <small>3.21.1 (2026-04-29)</small>

* chore(release): 3.22.0 ([0bfa4fc](https://github.com/alto9/forge/commit/0bfa4fc))

## 3.22.0 (2026-04-28)

* feat: skill registry **1.5.9** — orchestration workflows moved from `resources/workflow/commands/*.md` to **`resources/workflow/skills/<id>/SKILL.md`** (invoke with **`/<skill-name>`** in Agent chat); removed **`commit`** and **`push-branch`** script skills in favor of direct git guidance; **Initialize Cursor Agents** prunes stale Forge-managed **`~/.cursor/commands/*.md`** on upgrade.
* fix: **`gh-project-set-status`** — set **`GH_PROMPT_DISABLED=1`** and optional **`FORGE_GH_PROJECT_DEBUG=1`** for phase logging; expanded troubleshooting for apparent hangs.

## 3.21.0 (2026-04-23)

* feat: update skill registry to version 1.5.8 and introduce workflow retrospective skill ([f212a80](https://github.com/alto9/forge/commit/f212a80))

## <small>3.20.1 (2026-04-18)</small>

* docs: adjustments based on feedback ([f82b5ee](https://github.com/alto9/forge/commit/f82b5ee))

## 3.20.0 (2026-04-17)

* feat: update skill registry to version 1.5.5 and enhance Engineer agent workflow ([e5f8437](https://github.com/alto9/forge/commit/e5f8437))

## 3.19.0 (2026-04-17)

* feat: update skill registry and enhance GitHub integration ([bc09d6b](https://github.com/alto9/forge/commit/bc09d6b))

## 3.18.0 (2026-04-16)

* feat: enhance issue refinement and building processes ([feed8ad](https://github.com/alto9/forge/commit/feed8ad))

## <small>3.17.1 (2026-04-15)</small>

* docs: update contributing guidelines, package description, and README for clarity ([92faf32](https://github.com/alto9/forge/commit/92faf32))

## 3.17.0 (2026-04-13)

* feat: implement Forge Roadmap command and webview integration ([de2c3e0](https://github.com/alto9/forge/commit/de2c3e0))

## <small>3.16.2 (2026-03-31)</small>

* chore: update skill registry to version 1.5.2 and add new skill ([a573d3d](https://github.com/alto9/forge/commit/a573d3d))

## <small>3.16.1 (2026-03-29)</small>

* chore: update icon path in package.json ([1e251bf](https://github.com/alto9/forge/commit/1e251bf))
* chore: update package.json and add new logo asset ([3463157](https://github.com/alto9/forge/commit/3463157))

## 3.16.0 (2026-03-29)

* refactor: update project sync mechanism to prompt users for updates ([1a05041](https://github.com/alto9/forge/commit/1a05041))
* feat: add link-subissue-to-issue skill and update skill registry ([dc7144f](https://github.com/alto9/forge/commit/dc7144f))

## <small>3.15.1 (2026-03-28)</small>

* refactor: enhance documentation for issue refinement process ([271af9e](https://github.com/alto9/forge/commit/271af9e))

## 3.15.0 (2026-03-28)

* feat: implement automated project sync feature ([b9a769c](https://github.com/alto9/forge/commit/b9a769c))

## <small>3.14.3 (2026-03-28)</small>

* refactor: update agent documentation and clarify `.forge` editing roles ([8aae053](https://github.com/alto9/forge/commit/8aae053))

## <small>3.14.2 (2026-03-27)</small>

* refactor: enhance `.forge` documentation and clarify editing roles ([6f892b1](https://github.com/alto9/forge/commit/6f892b1))

## <small>3.14.1 (2026-03-26)</small>

* refactor: consolidate Slack notification workflow into main release workflow ([7557625](https://github.com/alto9/forge/commit/7557625))

## 3.14.0 (2026-03-26)

* feat: add GitHub Actions workflow for Slack notifications on release ([af16fd1](https://github.com/alto9/forge/commit/af16fd1))

## <small>3.13.7 (2026-03-26)</small>

* refactor: enhance agent documentation and clarify `.forge` editing roles ([baeba93](https://github.com/alto9/forge/commit/baeba93))

## <small>3.13.6 (2026-03-26)</small>

* refactor: update cursor command documentation and streamline skills ([fe7767b](https://github.com/alto9/forge/commit/fe7767b))

## <small>3.13.5 (2026-03-26)</small>

* refactor: update technical writer documentation and remove obsolete refine persona ([6fa0ac1](https://github.com/alto9/forge/commit/6fa0ac1))

## <small>3.13.4 (2026-03-26)</small>

* refactor: enhance agent documentation and clarify responsibilities in Forge workflow ([606c401](https://github.com/alto9/forge/commit/606c401))

## <small>3.13.3 (2026-03-25)</small>

* refactor: migrate scripts from JavaScript to Bash for improved performance and usability ([8775b4b](https://github.com/alto9/forge/commit/8775b4b))

## <small>3.13.2 (2026-03-25)</small>

* refactor: streamline skill registry and update validation processes ([3cc2641](https://github.com/alto9/forge/commit/3cc2641))

## <small>3.13.1 (2026-03-25)</small>

* docs: update chat participants in README ([98e5c02](https://github.com/alto9/forge/commit/98e5c02))

## 3.13.0 (2026-03-25)

* feat: introduce Forge Help persona and related commands ([a58b1be](https://github.com/alto9/forge/commit/a58b1be))

## 3.12.0 (2026-03-25)

* feat: add initialization commands for Cursor agents and project setup ([e495011](https://github.com/alto9/forge/commit/e495011))

## <small>3.11.4 (2026-03-25)</small>

* refactor: update agent roles and knowledge map structure ([f0926a9](https://github.com/alto9/forge/commit/f0926a9))

## <small>3.11.3 (2026-03-24)</small>

* chore: update dependencies ([2ce6eff](https://github.com/alto9/forge/commit/2ce6eff))

## <small>3.11.2 (2026-03-22)</small>

* fix(release): update release workflow to trigger on CI completion ([f397c0e](https://github.com/alto9/forge/commit/f397c0e))

## <small>3.11.1 (2026-03-22)</small>

* fix: update release workflow ([c475635](https://github.com/alto9/forge/commit/c475635))

## 3.11.0 (2026-03-22)

* feat(release): add Open VSX marketplace publishing step to workflow ([4c52189](https://github.com/alto9/forge/commit/4c52189))

## <small>3.10.1 (2026-03-22)</small>

* chore(release): 3.10.1 ([2ba7d6d](https://github.com/alto9/forge/commit/2ba7d6d))
* refactor: enhance agent workflows and documentation for issue refinement and building ([4c00f25](https://github.com/alto9/forge/commit/4c00f25))
* refactor: update Technical Writer and Engineer agent workflows and documentation ([6f843f7](https://github.com/alto9/forge/commit/6f843f7))
* Merge origin/main with workflow conflict resolution ([b6888fe](https://github.com/alto9/forge/commit/b6888fe))

## 3.10.0 (2026-03-18)

* feat: introduce Quality Assurance and Technical Writer agents, update workflow documentation ([16a6845](https://github.com/alto9/forge/commit/16a6845))

## 3.9.0 (2026-03-17)

* feat(tests): support conditional webview build configuration ([60bbd1b](https://github.com/alto9/forge/commit/60bbd1b))

## 3.8.0 (2026-03-17)

* feat(tests): support conditional webview build configuration ([9c4d463](https://github.com/alto9/forge/commit/9c4d463))
* refactor: update command structure and remove deprecated files ([12b2afe](https://github.com/alto9/forge/commit/12b2afe))
* refactor: update project setup and enhance workflow documentation ([9adf7b8](https://github.com/alto9/forge/commit/9adf7b8))
* Merge branch 'main' of github.com:alto9/forge ([79c63b1](https://github.com/alto9/forge/commit/79c63b1))

## 3.7.0 (2026-03-16)

* feat: introduce comprehensive vision document and enhance agent workflows ([467e620](https://github.com/alto9/forge/commit/467e620))
* refactor: remove legacy cursor command and update documentation for new skills ([0324670](https://github.com/alto9/forge/commit/0324670))
* refactor: update roadmap management to use GitHub as the single source of truth ([1ac5e44](https://github.com/alto9/forge/commit/1ac5e44))

## 3.6.0 (2026-03-15)

* feat(new-agent-flow): new agents and skills ([6379ab5](https://github.com/alto9/forge/commit/6379ab5))

## 3.5.0 (2026-03-01)

* Merge pull request #14 from alto9/refineSkills ([7eaee99](https://github.com/alto9/forge/commit/7eaee99)), closes [#14](https://github.com/alto9/forge/issues/14)
* feat: update skills ([87f6de4](https://github.com/alto9/forge/commit/87f6de4))

## 3.4.0 (2026-02-19)

* Merge pull request #13 from alto9/cursorProjects ([75dca1c](https://github.com/alto9/forge/commit/75dca1c)), closes [#13](https://github.com/alto9/forge/issues/13)
* feat(skills): add new skills and metadata ([0b0edfa](https://github.com/alto9/forge/commit/0b0edfa))

## 3.3.0 (2026-02-18)

* Merge pull request #12 from alto9/milestoneManager ([ae5f78d](https://github.com/alto9/forge/commit/ae5f78d)), closes [#12](https://github.com/alto9/forge/issues/12)
* feat(milestonemanager): addition ([a70b696](https://github.com/alto9/forge/commit/a70b696))
* chore: milestone manager in progress ([24b851c](https://github.com/alto9/forge/commit/24b851c))

## <small>3.2.3 (2026-02-05)</small>

* Merge branch 'main' of github.com:alto9/forge ([3643fd8](https://github.com/alto9/forge/commit/3643fd8))
* chore: refine refinement commands ([b464220](https://github.com/alto9/forge/commit/b464220))

## <small>3.2.2 (2026-02-05)</small>

* Merge pull request #11 from alto9/forgePullRename ([4add1d8](https://github.com/alto9/forge/commit/4add1d8)), closes [#11](https://github.com/alto9/forge/issues/11)
* fix: update refinement and pull request ([ba4d4d4](https://github.com/alto9/forge/commit/ba4d4d4))

## <small>3.2.1 (2026-02-05)</small>

* Merge pull request #10 from alto9/forgeRefinement ([21a3d0f](https://github.com/alto9/forge/commit/21a3d0f)), closes [#10](https://github.com/alto9/forge/issues/10)
* fix: refinement instructions ([a96dbc3](https://github.com/alto9/forge/commit/a96dbc3))

## 3.2.0 (2026-02-05)

* Merge pull request #9 from alto9/forgePullRequest ([be9d27e](https://github.com/alto9/forge/commit/be9d27e)), closes [#9](https://github.com/alto9/forge/issues/9)
* feat(commands): add forge-pull command for PR creation with conventional commit validation ([3e77b81](https://github.com/alto9/forge/commit/3e77b81))

## 3.1.0 (2026-02-05)

* Merge pull request #8 from alto9/forgeCommit ([e831554](https://github.com/alto9/forge/commit/e831554)), closes [#8](https://github.com/alto9/forge/issues/8)
* test: update projectReadiness tests for 5 commands ([abb92e5](https://github.com/alto9/forge/commit/abb92e5))
* feat: commit and push commands ([4056153](https://github.com/alto9/forge/commit/4056153))

## 3.0.0 (2026-02-01)

* feat!: release v2.0.0 - GitHub issue workflow migration ([21c84a9](https://github.com/alto9/forge/commit/21c84a9))


### BREAKING CHANGE

* This release migrates from design session workflow to GitHub issue workflow. Removed Forge Studio UI, design session commands, and forge-design command. Added forge-refine and forge-scribe commands for GitHub issue workflow.

## 2.0.0 (2026-02-01)

* chore: latest changes ([2c40403](https://github.com/alto9/forge/commit/2c40403))
* chore: latest code ([32c45ec](https://github.com/alto9/forge/commit/32c45ec))
* chore: remove old webview ([50e9d80](https://github.com/alto9/forge/commit/50e9d80))
* chore: stage all v2 changes so far ([bae9808](https://github.com/alto9/forge/commit/bae9808))
* chore: trigger release workflow ([2175868](https://github.com/alto9/forge/commit/2175868))
* chore: v2 latest updates ([589f1b7](https://github.com/alto9/forge/commit/589f1b7))
* feat!: migrate to GitHub issue workflow ([e8404b4](https://github.com/alto9/forge/commit/e8404b4))
* Merge pull request #7 from alto9/v2poc ([f807a7a](https://github.com/alto9/forge/commit/f807a7a)), closes [#7](https://github.com/alto9/forge/issues/7)


### BREAKING CHANGE

* Removed Forge Studio UI and design session workflow.
Replaced with GitHub issue-based workflow using forge-refine and forge-scribe commands.

- Remove Forge Studio tree provider and webview
- Remove design session commands (BuildStoryCommand, DistillSessionCommand)
- Remove forge-design command
- Add forge-refine command for issue refinement
- Add forge-scribe command for technical breakdown
- Remove Work Issue command and webview
- Simplify extension architecture
- Update workflow documentation

## <small>1.1.3 (2025-12-10)</small>

* fix: adjust cursor commands ([734970e](https://github.com/alto9/forge/commit/734970e))

## <small>1.1.2 (2025-12-09)</small>

* ci: fix package name for marketplace ([a49fe02](https://github.com/alto9/forge/commit/a49fe02))

## <small>1.1.1 (2025-12-09)</small>

* feat!: remove mcp server and refine extension code ([727fa4e](https://github.com/alto9/forge/commit/727fa4e))
* Merge pull request #6 from alto9/5-migrate-mcp-server-functionality-to-cursor-commands-and-simplify- ([554eb32](https://github.com/alto9/forge/commit/554eb32)), closes [#6](https://github.com/alto9/forge/issues/6)
* ci: fix unit tests ([f9bc700](https://github.com/alto9/forge/commit/f9bc700))

# [1.1.0](https://github.com/alto9/forge/compare/v1.0.1...v1.1.0) (2025-12-07)


### Features

* **actors:** add actors to diagrams ([a57028d](https://github.com/alto9/forge/commit/a57028d71d66740bb046a3cb9e6006b6d71f64bd))

## [1.0.1](https://github.com/alto9/forge/compare/v1.0.0...v1.0.1) (2025-12-05)

# 1.0.0 (2025-12-05)


### Bug Fixes

* **extension:** remove ai/contexts from REQUIRED_FOLDERS ([aac9e0a](https://github.com/alto9/forge/commit/aac9e0aa32acedb0e56a7c9636c64c3b1ca7b500))
* **mcp:** remove context from schema_type enum ([43fd532](https://github.com/alto9/forge/commit/43fd5326919e72ef17337c7cd587a4dedbdcf93d))

# Changelog

All notable changes to the Forge extension will be documented in this file.

## [0.1.0] - 2025-10-01

### Added
- Initial release of Forge extension
- `Forge: New Decision` command with webview form
- `Forge: Distill Decision into Features and Specs` command
- `Forge: Convert Decision to Tasks` command
- Intelligent prompt generation with context awareness
- Frontmatter parsing for Forge file formats
- Right-click context menu integration
- Output panel for displaying generated prompts
- Support for decision, feature, spec, context, and task file formats

### Features
- Webview-based form for creating new decisions
- Automatic discovery of related files (features, specs, contexts)
- File format validation for .decision.md files
- Quick pick menus for file selection
- Comprehensive prompt generation with full context inclusion

## [Unreleased]

### Added
- **Cursor Command Management System** - Forge now automatically manages Cursor command files (`.cursor/commands/*.md`) during project initialization
  - `forge-design.md` command for design session workflows
  - `forge-build.md` command for story implementation workflows
  - Hash-based validation ensures command files stay up-to-date
  - Automatic detection and updating of outdated command files
  - Visual indicators in Welcome Screen for command status (missing, outdated, or valid)
  - Commands provide context-aware guidance to AI agents for proper Forge workflow adherence

### Technical
- Added command template storage system in `packages/vscode-extension/src/templates/cursorCommands.ts`
- Implemented SHA-256 hash validation for command file integrity
- Enhanced project readiness checks to include command file validation
- Updated initialization flow to create/update command files alongside folder structure
- Command files include embedded hash comments for version tracking
- Integration tests for command validation and initialization flow

### Documentation
- Updated README.md with Cursor command management section
- Added explanation of hash-based validation system
- Documented command update workflow for users
- Included troubleshooting guidance for outdated commands

### Planned
- Direct Cursor Agent CLI integration
- Custom template support
- Prompt history and versioning
- File format validation and linting
- Relationship visualization
- Batch operations for multiple files
