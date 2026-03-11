# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainers directly with details of the vulnerability
3. Include steps to reproduce, impact assessment, and any suggested fixes

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Practices

- All dependencies are monitored via Dependabot
- No secrets or credentials are committed to the repository
- Environment-specific configuration is managed via `.env` files (see `.env.example`)
- Authentication tokens should use `httpOnly` cookies, never `localStorage`
