# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### Do NOT:
- Open a public GitHub issue
- Discuss the vulnerability publicly
- Share details on social media or forums

### Do:
1. **Email security@alto9.com** with details
2. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
   - Affected versions

### What to Expect:
- **Acknowledgment** within 48 hours
- **Regular updates** on progress (at least weekly)
- **Credit** in release notes (if desired)
- **Coordination** on disclosure timing

### Disclosure Timeline:
- We aim to address **critical vulnerabilities** within 7 days
- We aim to address **high severity** vulnerabilities within 30 days
- We will coordinate disclosure timing with you
- We follow **responsible disclosure** practices

## Security Best Practices

When using Forge:

### VSCode Extension
- **Trusted workspaces**: Only use Forge in trusted workspaces
- **File permissions**: Forge creates files in the `ai/` directory - ensure proper access controls
- **Cursor commands**: Review generated command files before execution

### MCP Server
- **Local execution**: MCP server runs locally and does not make external network calls
- **File access**: Server accesses only the guidance directory for spec objects
- **No sensitive data**: Do not store sensitive data in Forge files

### General
- **Review generated content**: Always review AI-generated content before committing
- **Access controls**: Use appropriate Git and filesystem permissions
- **Dependencies**: Keep dependencies updated (`npm audit`)

## Known Security Considerations

### File System Access
- Forge reads and writes files in your project directory
- The VSCode extension requires workspace trust
- MCP server reads guidance files from its installation directory

### Generated Content
- Forge generates prompts for AI agents
- Generated stories and tasks may contain project-specific information
- Review all generated content before sharing or committing

### Third-Party Dependencies
- Dependencies are managed via npm
- Run `npm audit` regularly to check for vulnerabilities
- Keep dependencies updated

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 0.1.1)
- Documented in CHANGELOG.md
- Announced via GitHub releases
- Tagged with security label

## Questions?

For security-related questions (not vulnerabilities), please use:
- GitHub Discussions (public questions)
- GitHub Issues (non-sensitive questions)

For vulnerabilities, always use: **security@alto9.com**

---

**Thank you for helping keep Forge secure!**

