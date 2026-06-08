# Security Guide

## Overview

This document outlines the security measures implemented in CodeInsight AI and best practices for deployment.

## Critical Security Fixes Applied

### 1. Secrets Management ✅

**Issue**: Exposed API keys, database credentials, and JWT secrets in `.env` files.

**Fix**:
- All sensitive credentials removed from `.env` files
- `.env` files properly listed in `.gitignore`
- Example files (`.env.example`) provided with placeholder values

**Action Required**:
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate a session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update your .env files with these values
```

### 2. Password Security ✅

**Improvements**:
- Minimum password length increased from 6 to 12 characters
- Password complexity requirements enforced (uppercase, lowercase, numbers, special characters)
- Bcrypt rounds increased from 12 to 14

**Password Requirements**:
- At least 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### 3. Rate Limiting ✅

**Implemented**:
- General API rate limiting: 100 requests per 15 minutes
- Strict auth rate limiting: 5 attempts per 15 minutes
- Prevents brute force attacks on login/register endpoints

**Configuration** (in `.env`):
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
```

### 4. Input Validation & Sanitization ✅

**Implemented**:
- NoSQL injection prevention with `express-mongo-sanitize`
- XSS protection in code input
- Code size limit reduced from 100KB to 50KB
- Input trimming and sanitization

### 5. Enhanced Security Headers ✅

**Helmet Configuration**:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- XSS Filter enabled

### 6. Error Handling ✅

**Improvements**:
- Stack traces hidden in production
- Generic error messages for external users
- Detailed logging server-side only
- Audit logging for sensitive operations

### 7. Docker Security ✅

**Improvements**:
- Non-root user execution
- Health checks added
- Resource limits configured
- Security options enabled

### 8. Code Execution Sandbox ✅

**Enhanced Security**:
- Expanded blocked patterns list
- Network isolation
- Memory and CPU limits
- Timeout enforcement
- Read-only filesystem

### 9. Authentication & Authorization ✅

**Improvements**:
- Health endpoints protected in production
- Ownership checks for resource access (IDOR prevention)
- Audit logging for auth events

### 10. Request Timeouts ✅

**Implemented**:
- OpenAI API timeout: 30 seconds
- Ollama API timeout: 30 seconds
- Prevents hanging requests

## Security Checklist for Deployment

### Before Deploying to Production

- [ ] Generate and set secure JWT_SECRET (64+ characters)
- [ ] Generate and set secure SESSION_SECRET (64+ characters)
- [ ] Update MongoDB connection string with production credentials
- [ ] Set up proper SMTP credentials (use app-specific passwords)
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable monitoring and alerting
- [ ] Review and update CORS_ORIGIN
- [ ] Rotate all API keys
- [ ] Set up secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)

### Environment Variables Security

**Never commit these to version control**:
- `JWT_SECRET`
- `SESSION_SECRET`
- `MONGODB_URI`
- `OPENAI_API_KEY`
- `SMTP_PASS`
- `GITHUB_TOKEN`

**Use environment-specific values**:
- Development: Use local MongoDB, test API keys
- Staging: Use staging database, limited API keys
- Production: Use production database, production API keys

### Database Security

**MongoDB Best Practices**:
1. Use strong passwords (20+ characters)
2. Enable authentication
3. Use IP whitelisting
4. Enable encryption at rest
5. Enable encryption in transit (TLS/SSL)
6. Regular backups
7. Audit logging enabled
8. Principle of least privilege for database users

### API Key Management

**OpenAI API Key**:
- Use separate keys for dev/staging/production
- Set usage limits
- Monitor usage regularly
- Rotate keys periodically
- Never log API keys

**GitHub Token** (if used):
- Use fine-grained personal access tokens
- Limit scope to read-only repository access
- Set expiration dates
- Rotate regularly

### Network Security

**Firewall Rules**:
```
Allow:
- Port 443 (HTTPS) from anywhere
- Port 80 (HTTP) from anywhere (redirect to HTTPS)
- Port 22 (SSH) from specific IPs only

Deny:
- Direct database access from internet
- All other ports
```

**CORS Configuration**:
```javascript
// Production
CORS_ORIGIN=https://yourdomain.com

// Development
CORS_ORIGIN=http://localhost:3000
```

### Monitoring & Logging

**What to Monitor**:
- Failed login attempts
- Rate limit violations
- Error rates
- API response times
- Database connection issues
- Unusual traffic patterns

**What to Log**:
- Authentication events (login, logout, password reset)
- Authorization failures
- Data access (create, read, update, delete)
- Admin actions
- Errors and exceptions
- Security events

**What NOT to Log**:
- Passwords (even hashed)
- API keys
- JWT tokens
- Credit card numbers
- Personal identification numbers

### Incident Response

**If a Security Breach Occurs**:

1. **Immediate Actions**:
   - Rotate all secrets (JWT, API keys, database passwords)
   - Review audit logs
   - Identify affected users
   - Block suspicious IPs

2. **Investigation**:
   - Determine breach scope
   - Identify vulnerability
   - Document timeline

3. **Remediation**:
   - Patch vulnerability
   - Deploy fixes
   - Notify affected users
   - Update security documentation

4. **Prevention**:
   - Conduct security review
   - Update security policies
   - Implement additional monitoring
   - Train team on security best practices

## Security Testing

### Recommended Tools

**Dependency Scanning**:
```bash
# Node.js
npm audit
npm audit fix

# Python
pip-audit
safety check
```

**Static Analysis**:
```bash
# Node.js
npm install -g eslint-plugin-security
eslint --plugin security src/

# Python
bandit -r ai-service/
```

**Container Scanning**:
```bash
docker scan codeinsight-server:latest
docker scan codeinsight-ai:latest
```

### Penetration Testing

Consider hiring a professional security firm to conduct:
- Penetration testing
- Security audit
- Code review
- Infrastructure review

## Compliance

### GDPR Considerations

If handling EU user data:
- Implement data deletion endpoints
- Add consent management
- Provide data export functionality
- Update privacy policy
- Implement data retention policies

### Data Protection

**User Data**:
- Passwords: Bcrypt hashed (14 rounds)
- Email: Stored in plaintext (needed for communication)
- Analysis history: Associated with user ID
- Tokens: SHA-256 hashed

**Data Retention**:
- Define retention policies
- Implement automatic cleanup
- Provide user data deletion

## Additional Security Measures to Consider

### Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - TOTP-based 2FA
   - SMS-based 2FA
   - Backup codes

2. **API Key Authentication**
   - Allow users to generate API keys
   - Rate limiting per API key
   - Key rotation

3. **Web Application Firewall (WAF)**
   - Cloudflare
   - AWS WAF
   - ModSecurity

4. **DDoS Protection**
   - Cloudflare
   - AWS Shield
   - Rate limiting at edge

5. **Security Headers**
   - Implement all OWASP recommended headers
   - Regular security header audits

6. **Dependency Management**
   - Automated dependency updates
   - Vulnerability scanning in CI/CD
   - Lock file verification

7. **Secrets Management**
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault

8. **Database Encryption**
   - Field-level encryption for sensitive data
   - Transparent data encryption (TDE)

## Security Contacts

**Report Security Issues**:
- Email: security@yourdomain.com
- Bug Bounty: (if applicable)

**Response Time**:
- Critical: 24 hours
- High: 72 hours
- Medium: 1 week
- Low: 2 weeks

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## Version History

- v1.0.0 (2024-03-09): Initial security implementation
  - Secrets removed
  - Password requirements strengthened
  - Rate limiting implemented
  - Input validation enhanced
  - Docker security improved
  - Audit logging added
  - Error handling secured
