# Security Policy

## Reporting

Do NOT open a public issue for security vulnerabilities.

Email: aneeshg@zeto.studio or use GitHub's private vulnerability reporting.

We will respond within 72 hours and patch within 14 days.

## Scope

- Authentication bypass
- Session fixation or hijacking
- Challenge replay attacks
- Credential ID spoofing
- SQL injection in SQLite queries

## Out of scope

- Vulnerabilities in @simplewebauthn/server itself (report upstream)
- Social engineering

## Security design

- All cryptographic verification is server-side via @simplewebauthn/server
- Challenges expire in 5 minutes
- Sessions expire in 7 days
- HttpOnly, Secure, SameSite=Strict cookies only
- No browser storage of any kind
- For Mac: tested against Safari WebAuthn implementation
