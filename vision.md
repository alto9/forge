# Forge - Vision

## Mission

Forge is a comprehensive toolkit for structured context engineering in AI-assisted development. We transform ad-hoc prompting into a systematic, session-driven workflow that helps engineers design software with complete context, then distills those designs into minimal, actionable implementation stories that AI agents can execute with precision.

## Core Purpose

**Why Forge exists**: Traditional AI-assisted development relies on ad-hoc prompts that often miss critical context, leading to incomplete implementations, rework, and frustration. Engineers need a systematic way to build comprehensive context, track design decisions, and generate well-structured prompts that ensure AI agents have everything they need to implement features correctly the first time.

**The Meta-Project**: Forge is built using Forge itself, demonstrating the power of session-driven context engineering. This creates a comprehensive reference implementation and validates the approach through real-world usage.

## Long-Term Vision

### The Context Engineering System We're Building

Forge will become the **standard toolkit for structured context engineering in AI-assisted development**, providing:

1. **Systematic Context Building**: Link features, specs, actors, and contexts to create comprehensive understanding
2. **Session-Driven Design**: Track design changes systematically during focused design sessions
3. **Minimal Implementation Stories**: Distill complex designs into small, focused stories (< 30 minutes each)
4. **Complete Context Prompts**: Generate prompts with all necessary linkages automatically followed
5. **Visual Design Interface**: Forge Studio provides intuitive UI for managing all Forge files and sessions
6. **Multi-Platform Support**: VSCode extension and MCP server enable Forge workflows across different tools

### Strategic Goals

**Short-Term (6-12 months)**
- Establish Forge as the leading context engineering toolkit for AI-assisted development
- Build a thriving community of developers using Forge in their projects
- Create comprehensive documentation and examples
- Refine the session-driven workflow based on real-world usage
- Expand Forge Studio capabilities for better user experience

**Medium-Term (1-2 years)**
- Expand beyond VSCode to other IDEs (JetBrains, Neovim, Emacs)
- Build a plugin ecosystem for extensibility
- Integrate with popular AI development tools and platforms
- Develop visualization tools for feature/spec/context relationships
- Create templates and frameworks for different project types

**Long-Term (2+ years)**
- Become the standard approach for context engineering in AI-assisted development
- Enable AI agents to automatically discover and use Forge-structured documentation
- Build a marketplace for shared contexts, actors, and design patterns
- Provide analytics and insights on context engineering effectiveness
- Support team collaboration and shared context libraries

## Key Principles

### 1. Features Are Directive
- Features drive code changes and are tracked in sessions at scenario-level
- Features represent the desired state of user-facing functionality
- Changes to features during design sessions are systematically tracked
- Features link to specs, contexts, and actors to build complete understanding

### 2. Specs/Diagrams/Actors/Contexts Are Informative
- These documents provide guidance and context but are NOT tracked in sessions
- Always editable - can be updated at any time without session requirements
- Support the design process but don't drive session tracking
- Build foundational vocabulary and technical guidance

### 3. Session-Driven Design
- Design work happens in focused sessions with clear problem statements
- Sessions track feature changes at scenario-level granularity
- Sessions progress through explicit phases: design → scribe → development → completed
- Historical record of what was designed and when

### 4. Minimal Story Size
- Each implementation story targets < 30 minutes of work
- Small, focused stories lead to better AI agent execution
- Complex changes are broken into multiple stories
- Stories link to features, specs, and contexts for complete context

### 5. The Linkage System
- Files link to each other through IDs (feature_id, spec_id, context_id, actor_id)
- Linkages enable systematic context gathering
- Distillation follows all linkages to discover complete context
- No overload - only relevant context is included in prompts

### 6. Nestable Organization
- All folders (except docs) are nestable to maximize contextual structure
- Organize related concepts in hierarchical folders
- Features folder structure can inform automated test organization
- Logical abstraction through folder nesting

## What Makes Forge Unique

### Competitive Advantages

1. **Session-Driven Approach**: Only Forge tracks design changes systematically during focused sessions
2. **Linkage System**: Automatic context discovery through file linkages ensures complete prompts
3. **Minimal Story Size**: Focused stories (< 30 minutes) lead to better AI execution
4. **Visual Studio Interface**: Forge Studio provides intuitive UI for managing all Forge files
5. **Meta-Project Validation**: Built using Forge itself, demonstrating real-world effectiveness
6. **Multi-Platform**: VSCode extension and MCP server support different workflows

### Differentiation from Competitors

- **vs. Ad-Hoc Prompting**: Systematic context building vs. manual prompt construction
- **vs. Generic Documentation Tools**: Session-driven design tracking vs. static documentation
- **vs. Project Management Tools**: Context engineering focus vs. task management focus
- **vs. AI Code Generators**: Structured context engineering vs. direct code generation
- **vs. Design Tools**: Implementation-focused vs. visual design-focused

## The Forge Workflow

### Phase 1: Define Foundational Elements (No Session Required)
- Create Actors to define system personas and roles
- Create Contexts to provide technical guidance and standards
- Build project vocabulary and foundational knowledge
- Browse existing Features and Specs for reference

### Phase 2: Start Design Session
- Begin a design session with a clear problem statement
- Session tracks all feature changes at scenario-level
- Specs, Actors, and Contexts remain editable but aren't tracked

### Phase 3: Design Changes (Session Required for Editing)
- Create and edit Features to define user-facing functionality
- Create and edit Specs to define technical implementation
- Link Features and Specs to relevant Contexts and Actors
- Continue editing Actors and Contexts as needed (always editable)

### Phase 4: Distill to Stories & Tasks
- Convert session into minimal implementation stories (< 30 min each)
- Generate external tasks for non-code work
- Stories organized in `ai/sessions/<session-id>/tickets/`
- All linkages followed to gather complete context

### Phase 5: Build Story Implementation
- Generate implementation prompts with complete context
- Includes linked features, specs, contexts, and actors
- AI agent receives everything needed for accurate implementation
- Stories link back to session and features for traceability

## Target Outcomes

### For Engineers
- **Better AI Results**: Complete context leads to accurate implementations
- **Reduced Rework**: Get it right the first time with comprehensive prompts
- **Systematic Design**: Track design decisions and rationale
- **Traceable Documentation**: Link features, specs, and implementations
- **Faster Development**: Well-structured prompts accelerate AI-assisted coding

### For Teams
- **Shared Understanding**: Common vocabulary through actors and contexts
- **Design History**: Session records preserve decision rationale
- **Consistent Structure**: Standardized file formats across projects
- **Onboarding**: New team members understand project structure quickly
- **Knowledge Preservation**: Design decisions and context preserved over time

### For Alto9
- **Market Leadership**: Become the standard for context engineering in AI-assisted development
- **Community Growth**: Build a thriving ecosystem of Forge users
- **Platform Foundation**: Forge becomes the foundation for other Alto9 tools
- **Validation**: Meta-project demonstrates real-world effectiveness
- **Innovation**: Continuous improvement based on using Forge to build Forge

## Success Metrics

### Adoption
- 10K+ developers using Forge in their projects
- 100+ open source projects using Forge structure
- 4.5+ star rating on VSCode Marketplace
- Active community contributions and discussions

### Quality
- < 2 second response time for all Forge Studio operations
- 99%+ accuracy in context gathering through linkages
- Zero data loss in session tracking
- Comprehensive test coverage (> 80%)

### Impact
- Users report 50%+ reduction in AI rework
- Average story implementation time < 30 minutes
- 90%+ user satisfaction with generated prompts
- Positive community feedback and case studies

## Future Possibilities

### Platform Expansion
- Extend to other IDEs (JetBrains, Neovim, Emacs, Cursor)
- Browser-based Forge Studio for non-IDE workflows
- CLI tool for terminal-based workflows
- Mobile app for reviewing sessions and stories on-the-go

### Advanced Features
- Real-time collaboration on design sessions
- AI-assisted content generation for features and specs
- Visualization of feature/spec/context relationship graphs
- Template library for different project types and frameworks
- Export to various documentation formats (PDF, Confluence, etc.)
- Integration with popular project management tools
- Story execution tracking and status updates
- Automated test generation from feature scenarios

### Ecosystem Development
- Plugin system for third-party extensions
- Marketplace for shared contexts, actors, and design patterns
- Integration with popular AI development platforms
- Community-contributed features and improvements
- Forge certification program for best practices

### AI Integration
- AI agents automatically discover and use Forge-structured documentation
- Intelligent context suggestions based on project history
- Automated linkage discovery and validation
- Predictive story sizing and estimation
- AI-assisted session distillation

## Core Values

1. **Systematic Excellence**: Structure and process lead to better outcomes
2. **Complete Context**: Never compromise on context completeness
3. **Developer Empowerment**: Give engineers the tools they need to succeed
4. **Transparency**: Clear workflows and visible processes
5. **Continuous Improvement**: Using Forge to build Forge drives innovation
6. **Community**: Build with and for the AI-assisted development community

---

**Built with ❤️ by Alto9 - Making AI-assisted development systematic and effective**

