#!/usr/bin/env node

/**
 * Verify Security Patches
 * 
 * This script verifies that all security patches have been properly applied.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 CodeInsight AI - Security Patch Verification\n');
console.log('='.repeat(60));

let allPassed = true;
const results = [];

// Helper function to check file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

// Helper function to check file contains text
function fileContains(filePath, searchText) {
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    return content.includes(searchText);
  } catch (error) {
    return false;
  }
}

// Helper function to check file does NOT contain text
function fileNotContains(filePath, searchText) {
  return !fileContains(filePath, searchText);
}

// Test function
function test(name, condition, fix = '') {
  const passed = condition;
  results.push({ name, passed, fix });
  if (!passed) allPassed = false;
  return passed;
}

console.log('\n📋 Running Security Checks...\n');

// Check 1: New security files exist
test(
  '✓ Audit middleware created',
  fileExists('server/src/middleware/audit.middleware.js'),
  'File should exist: server/src/middleware/audit.middleware.js'
);

test(
  '✓ Ownership middleware created',
  fileExists('server/src/middleware/ownership.middleware.js'),
  'File should exist: server/src/middleware/ownership.middleware.js'
);

test(
  '✓ Security documentation created',
  fileExists('docs/SECURITY.md'),
  'File should exist: docs/SECURITY.md'
);

test(
  '✓ Secret generation script created',
  fileExists('scripts/generate-secrets.js'),
  'File should exist: scripts/generate-secrets.js'
);

// Check 2: Secrets removed
test(
  '✓ OpenAI API key removed from .env',
  fileNotContains('ai-service/.env', 'sk-proj-'),
  'Remove real OpenAI API key from ai-service/.env'
);

test(
  '✓ MongoDB credentials removed from .env',
  fileNotContains('server/.env', 'mongodb+srv://Surya:'),
  'Remove real MongoDB credentials from server/.env'
);

test(
  '✓ Gmail credentials removed from .env',
  fileNotContains('server/.env', 'sangameshwaran2007@gmail.com'),
  'Remove real Gmail credentials from server/.env'
);

// Check 3: Password validation strengthened
test(
  '✓ Password minimum length is 12',
  fileContains('server/src/middleware/validation.middleware.js', 'min: 12'),
  'Update password validation to require 12 characters'
);

test(
  '✓ Password complexity required',
  fileContains('server/src/middleware/validation.middleware.js', 'matches'),
  'Add password complexity validation'
);

test(
  '✓ Bcrypt rounds increased to 14',
  fileContains('server/src/models/User.model.js', 'genSalt(14)'),
  'Increase bcrypt rounds to 14 in User model'
);

// Check 4: Rate limiting
test(
  '✓ Auth rate limiter configured',
  fileContains('server/src/app.js', 'authLimiter'),
  'Add auth rate limiter to app.js'
);

test(
  '✓ Auth rate limiter applied to routes',
  fileContains('server/src/app.js', "app.use('/api/auth', authLimiter"),
  'Apply auth rate limiter to auth routes'
);

// Check 5: Security middleware
test(
  '✓ Mongo sanitize added',
  fileContains('server/src/app.js', 'mongoSanitize'),
  'Add express-mongo-sanitize to app.js'
);

test(
  '✓ Enhanced helmet configuration',
  fileContains('server/src/app.js', 'contentSecurityPolicy'),
  'Add enhanced helmet configuration'
);

test(
  '✓ HSTS enabled',
  fileContains('server/src/app.js', 'hsts'),
  'Enable HSTS in helmet configuration'
);

// Check 6: Error handling
test(
  '✓ Production error handling',
  fileContains('server/src/middleware/errorHandler.js', "NODE_ENV === 'production'"),
  'Add production-specific error handling'
);

test(
  '✓ Audit logging in error handler',
  fileContains('server/src/middleware/errorHandler.js', 'logger.error'),
  'Add audit logging to error handler'
);

// Check 7: Docker security
test(
  '✓ Server Dockerfile uses non-root user',
  fileContains('server/Dockerfile', 'USER nodejs'),
  'Add non-root user to server Dockerfile'
);

test(
  '✓ AI Dockerfile uses non-root user',
  fileContains('ai-service/Dockerfile', 'USER appuser'),
  'Add non-root user to ai-service Dockerfile'
);

test(
  '✓ Server Dockerfile has health check',
  fileContains('server/Dockerfile', 'HEALTHCHECK'),
  'Add health check to server Dockerfile'
);

test(
  '✓ AI Dockerfile has health check',
  fileContains('ai-service/Dockerfile', 'HEALTHCHECK'),
  'Add health check to ai-service Dockerfile'
);

// Check 8: Input validation
test(
  '✓ Code size limit reduced to 50KB',
  fileContains('server/src/middleware/validation.middleware.js', 'max: 50000'),
  'Reduce code size limit to 50KB'
);

test(
  '✓ Input sanitization added',
  fileContains('server/src/middleware/validation.middleware.js', 'customSanitizer'),
  'Add input sanitization to validation'
);

// Check 9: Sandbox security
test(
  '✓ Enhanced blocked patterns',
  fileContains('ai-service/app/services/sandbox_service.py', '__builtins__'),
  'Add enhanced blocked patterns to sandbox'
);

// Check 10: Request timeouts
test(
  '✓ OpenAI timeout configured',
  fileContains('ai-service/app/services/llm_service.py', 'timeout'),
  'Add timeout to OpenAI requests'
);

// Check 11: Package dependencies
test(
  '✓ express-mongo-sanitize in package.json',
  fileContains('server/package.json', 'express-mongo-sanitize'),
  'Add express-mongo-sanitize to package.json'
);

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 Results:\n');

let passed = 0;
let failed = 0;

results.forEach(result => {
  if (result.passed) {
    console.log(`✅ ${result.name}`);
    passed++;
  } else {
    console.log(`❌ ${result.name}`);
    if (result.fix) {
      console.log(`   Fix: ${result.fix}`);
    }
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📈 Score: ${passed}/${passed + failed} checks passed`);

if (allPassed) {
  console.log('\n🎉 All security patches verified successfully!\n');
  console.log('Next steps:');
  console.log('1. Run: node scripts/generate-secrets.js');
  console.log('2. Update your .env files with generated secrets');
  console.log('3. Install dependencies: cd server && npm install');
  console.log('4. Start the application: npm start');
  console.log('\nSee SETUP_AFTER_PATCHES.md for detailed instructions.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some security patches are missing or incomplete.\n');
  console.log('Please review the failed checks above and apply the fixes.\n');
  console.log('See SECURITY_PATCHES.md for detailed patch information.\n');
  process.exit(1);
}
