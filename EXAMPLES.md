# Forge File Format Examples

This document provides concrete examples of each Forge file type to help you get started.

## Context File Example

**File**: `ai/contexts/typescript-best-practices.context.md`

```markdown
---
context_id: typescript-best-practices
---

# TypeScript Best Practices Context

GIVEN we are working within Forge files
WHEN information is needed about TypeScript implementation
THEN read the document at `ai/docs/typescript_coding_standards.md`
AND use that information to guide implementation decisions
AND follow the principles of type safety and explicit typing

GIVEN a developer is implementing TypeScript code
WHEN dealing with asynchronous operations
THEN use async/await syntax over Promise chains
AND properly handle errors with try-catch blocks
AND ensure all promises have error handlers
```

## Decision File Example

**File**: `ai/decisions/add-user-authentication.decision.md`

```markdown
---
decision_id: add-user-authentication
date: 2025-10-01
status: proposed
---

# Add User Authentication System

## Status
Proposed

## Context
Our application currently has no authentication mechanism. Users can access all features without any identity verification. As we prepare to launch, we need a secure authentication system to protect user data and enable personalized features.

Market research shows 85% of users expect social login options in addition to traditional email/password authentication.

## Decision
We will implement a JWT-based authentication system with the following components:
- Email/password registration and login
- Social authentication (Google, GitHub)
- JWT tokens with 1-hour expiration
- Refresh token mechanism for extended sessions
- Password reset via email

The authentication service will be built using Node.js with Express, and will integrate with our existing PostgreSQL database.

## Alternatives Considered

### Alternative 1: Session-based Authentication
- **Pros**: Simpler to implement, easier to invalidate sessions
- **Cons**: Doesn't scale well, requires server-side session storage, not suitable for mobile apps
- **Verdict**: Not chosen due to scalability concerns

### Alternative 2: OAuth2 Provider (Auth0, Cognito)
- **Pros**: Fully managed, enterprise-grade security, less maintenance
- **Cons**: Additional cost (~$200/month), vendor lock-in, less control
- **Verdict**: Not chosen for initial launch, may reconsider for enterprise tier

### Alternative 3: Passwordless (Magic Links)
- **Pros**: Better UX, no password management burden
- **Cons**: Requires reliable email service, users may not understand the flow
- **Verdict**: Consider for future enhancement

## Consequences

### Positive
- Users can create accounts and protect their data
- Enables personalized features based on user identity
- Social login improves conversion rates
- JWT tokens enable stateless authentication for mobile apps

### Negative
- Adds complexity to the application architecture
- Requires secure storage of refresh tokens
- Need to implement password reset flow
- Must handle token expiration gracefully in the UI

### Risks
- Security vulnerabilities if not implemented correctly
- GDPR compliance requirements for storing user data
- Need to implement rate limiting to prevent brute force attacks

## Implementation Notes
- Use bcrypt with cost factor 12 for password hashing
- Store refresh tokens in database with user association
- Implement email verification for new accounts
- Add rate limiting: 5 failed login attempts = 15 minute lockout
- All authentication endpoints must be over HTTPS

## References
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- Related Decision: None (first authentication decision)
```

## Feature File Example

**File**: `ai/features/user-login.feature.md`

```markdown
---
feature_id: user-login
spec_id: [authentication-spec, session-management-spec]
decision_id: add-user-authentication
---

# User Login Feature

## Overview
Allow registered users to log into the application using their credentials.

## Scenarios

### Scenario 1: Successful Login with Email and Password
GIVEN a user with email "user@example.com" and password "SecurePass123!"
AND the user is registered in the system
WHEN the user submits their credentials on the login page
THEN the system validates the credentials
AND generates a JWT access token
AND generates a refresh token
AND returns the tokens to the user
AND redirects the user to their dashboard

### Scenario 2: Failed Login with Invalid Password
GIVEN a registered user with email "user@example.com"
WHEN the user submits their email with an incorrect password
THEN the system rejects the login attempt
AND displays an error message "Invalid email or password"
AND increments the failed login attempt counter
AND does not generate any tokens

### Scenario 3: Account Lockout After Multiple Failed Attempts
GIVEN a user with email "user@example.com"
AND the user has failed to log in 4 times in the last 15 minutes
WHEN the user attempts to log in again with any password
THEN the system blocks the login attempt
AND displays an error message "Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
AND does not check the password

### Scenario 4: Successful Social Login with Google
GIVEN a user who has not previously logged in
WHEN the user clicks "Continue with Google"
AND completes Google's OAuth flow
AND grants permissions to our application
THEN the system creates a new user account with Google profile data
AND generates JWT access and refresh tokens
AND redirects the user to the onboarding flow

### Scenario 5: Remember Me Functionality
GIVEN a user on the login page
WHEN the user enters valid credentials
AND checks the "Remember me" checkbox
AND submits the login form
THEN the system generates tokens with extended expiration (30 days)
AND stores the refresh token in a secure cookie
AND logs the user in

## Acceptance Criteria
- [ ] Login form accepts email and password
- [ ] Social login buttons for Google and GitHub are visible
- [ ] Error messages are user-friendly and don't expose security details
- [ ] Rate limiting prevents brute force attacks
- [ ] Successful login redirects to the appropriate page based on user role
- [ ] Failed login attempts are logged for security monitoring
- [ ] UI shows loading state during authentication
- [ ] Tokens are stored securely (httpOnly cookies or secure storage)
```

## Spec File Example

**File**: `ai/specs/authentication-spec.spec.md`

```markdown
---
spec_id: authentication-spec
feature_id: [user-login, user-registration, password-reset]
decision_id: add-user-authentication
---

# Authentication System Specification

## Overview
Technical specification for the JWT-based authentication system.

## Architecture

\`\`\`nomnoml
#direction: down
#padding: 10

[Client] -> [API|POST /auth/login (credentials)]
[API] -> [AuthService|validateCredentials()]
[AuthService] -> [Database|getUserByEmail()]
[Database] -> [AuthService|User record]
[AuthService] -> [AuthService|comparePassword()]
[AuthService] -> [AuthService|generateTokens()]
[AuthService] -> [API|{accessToken, refreshToken}]
[API] -> [Client|200 OK + tokens]
\`\`\`

## Components

### 1. Authentication Service (`AuthService`)

**Responsibilities:**
- Validate user credentials
- Generate JWT tokens
- Verify JWT tokens
- Manage refresh tokens
- Handle password hashing

**Methods:**
\`\`\`typescript
interface IAuthService {
  login(email: string, password: string): Promise<AuthTokens>;
  register(userData: RegistrationData): Promise<User>;
  refreshTokens(refreshToken: string): Promise<AuthTokens>;
  verifyToken(token: string): Promise<TokenPayload>;
  revokeRefreshToken(token: string): Promise<void>;
}
\`\`\`

### 2. JWT Token Structure

**Access Token Payload:**
\`\`\`json
{
  "sub": "user-id-uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1633024800,
  "exp": 1633028400
}
\`\`\`

**Expiration:**
- Access Token: 1 hour
- Refresh Token: 7 days (30 days with "Remember me")

### 3. Database Schema

**users table:**
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

**refresh_tokens table:**
\`\`\`sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

**login_attempts table:**
\`\`\`sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  attempted_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## API Endpoints

### POST /auth/register
**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": false
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
\`\`\`

### POST /auth/login
**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
\`\`\`

**Error Response (401):**
\`\`\`json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
\`\`\`

### POST /auth/refresh
**Request:**
\`\`\`json
{
  "refreshToken": "refresh-token"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "accessToken": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
\`\`\`

## Security Requirements

1. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **Password Hashing:**
   - Use bcrypt with cost factor 12
   - Salt is automatically generated by bcrypt

3. **Token Security:**
   - Access tokens signed with RS256 algorithm
   - Refresh tokens stored as SHA-256 hash in database
   - Tokens should be transmitted only over HTTPS

4. **Rate Limiting:**
   - Login endpoint: 5 attempts per 15 minutes per IP
   - Registration endpoint: 3 attempts per hour per IP
   - Refresh endpoint: 10 attempts per hour per user

5. **Session Management:**
   - Refresh tokens are single-use (rotated on each refresh)
   - Old refresh token is invalidated immediately
   - All refresh tokens can be revoked by user action

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Account locked |
| AUTH_003 | Token expired |
| AUTH_004 | Invalid token |
| AUTH_005 | Email already registered |
| AUTH_006 | Weak password |
| AUTH_007 | Rate limit exceeded |

## Testing Requirements

1. Unit tests for all AuthService methods
2. Integration tests for authentication flow
3. Security tests for common vulnerabilities (SQL injection, XSS)
4. Load tests for concurrent login attempts
5. End-to-end tests for complete user journey

## Dependencies

- `bcrypt` (v5.1.0) - Password hashing
- `jsonwebtoken` (v9.0.0) - JWT generation and verification
- `express-rate-limit` (v6.7.0) - Rate limiting middleware
- `passport` (v0.6.0) - OAuth integration
- `passport-google-oauth20` (v2.0.0) - Google OAuth
- `passport-github2` (v0.1.12) - GitHub OAuth
```

## Task File Example

**File**: `ai/tasks/implement-login-endpoint.task.md`

```markdown
---
task_id: implement-login-endpoint
decision_id: add-user-authentication
feature_id: [user-login]
spec_id: [authentication-spec]
context_id: [typescript-best-practices]
status: pending
priority: high
dependencies: []
---

# Implement Login API Endpoint

## Description
Create the POST /auth/login endpoint that validates user credentials and returns JWT tokens.

## Context
This endpoint is part of the authentication system decided in the `add-user-authentication` decision. It implements the core login functionality described in the `user-login` feature and follows the technical specifications in `authentication-spec`.

Key considerations from the authentication spec:
- Use bcrypt to verify passwords
- Generate both access and refresh tokens
- Implement rate limiting (5 attempts per 15 minutes)
- Store refresh tokens in the database
- Track login attempts for security monitoring

## Implementation Steps

1. **Create route handler** (`src/routes/auth.routes.ts`)
   - Set up POST /auth/login route
   - Add rate limiting middleware (5 attempts/15min per IP)
   - Add request validation middleware

2. **Implement request validation** (`src/validators/auth.validator.ts`)
   - Validate email format
   - Ensure password is provided
   - Sanitize inputs to prevent injection

3. **Create AuthService.login method** (`src/services/auth.service.ts`)
   - Query database for user by email
   - Return generic error if user not found (don't reveal user existence)
   - Use bcrypt.compare to verify password
   - Check if account is locked (failed attempts)
   - Generate access token (1 hour expiration)
   - Generate refresh token (7 days expiration)
   - Hash refresh token before storing
   - Store refresh token in database
   - Log successful login attempt
   - Return tokens and user info

4. **Add login attempt tracking** (`src/services/loginAttempts.service.ts`)
   - Log each login attempt (success/failure)
   - Check failed attempt count in last 15 minutes
   - Lock account after 5 failed attempts
   - Clear failed attempts on successful login

5. **Create error handling**
   - Return 401 for invalid credentials
   - Return 429 for rate limit exceeded
   - Return 423 for locked account
   - Use error codes from spec (AUTH_001, AUTH_002, AUTH_007)

6. **Add integration tests** (`tests/integration/auth.test.ts`)
   - Test successful login
   - Test invalid password
   - Test invalid email
   - Test rate limiting
   - Test account lockout
   - Test token generation
   - Test refresh token storage

## Acceptance Criteria

- [ ] POST /auth/login endpoint responds on correct path
- [ ] Endpoint validates email and password presence
- [ ] Endpoint returns 401 for invalid credentials
- [ ] Endpoint returns JWT tokens on successful login
- [ ] Access token expires after 1 hour
- [ ] Refresh token expires after 7 days
- [ ] Refresh token is stored hashed in database
- [ ] Rate limiting blocks after 5 failed attempts
- [ ] Account locks for 15 minutes after 5 failures
- [ ] Login attempts are logged with IP address
- [ ] Error messages don't reveal whether email exists
- [ ] All tests pass with >80% code coverage
- [ ] API documentation is updated

## Related Documentation

- Decision: [add-user-authentication](../decisions/add-user-authentication.decision.md)
- Feature: [user-login](../features/user-login.feature.md)
- Spec: [authentication-spec](../specs/authentication-spec.spec.md)
- Context: [typescript-best-practices](../contexts/typescript-best-practices.context.md)

## Notes

- Ensure HTTPS is enforced in production
- Consider adding 2FA in future iteration
- Monitor failed login attempts for security threats
- Set up alerts for unusual login patterns
```

---

These examples demonstrate the complete Forge workflow from decision to implementation task, showing how each document type builds upon the others with proper linking and context.

