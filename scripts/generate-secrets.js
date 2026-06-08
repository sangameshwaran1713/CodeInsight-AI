#!/usr/bin/env node

/**
 * Generate Secure Secrets for CodeInsight AI
 * 
 * This script generates cryptographically secure random strings
 * for use as JWT secrets, session secrets, and other sensitive values.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('\n🔐 CodeInsight AI - Secure Secrets Generator\n');
console.log('='.repeat(50));

// Generate secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const sessionSecret = crypto.randomBytes(64).toString('hex');

console.log('\n✅ Generated Secure Secrets:\n');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('\nSESSION_SECRET:');
console.log(sessionSecret);
console.log('\n' + '='.repeat(50));

// Ask if user wants to update .env files
console.log('\n📝 Next Steps:\n');
console.log('1. Copy the secrets above');
console.log('2. Update your .env files:');
console.log('   - server/.env');
console.log('   - ai-service/.env (if needed)');
console.log('\n3. NEVER commit these secrets to version control!');
console.log('4. Use different secrets for development, staging, and production');

// Optionally create a secrets file (not committed)
const secretsDir = path.join(__dirname, '..', '.secrets');
const secretsFile = path.join(secretsDir, 'generated-secrets.txt');

try {
  if (!fs.existsSync(secretsDir)) {
    fs.mkdirSync(secretsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const content = `# Generated Secrets - ${timestamp}
# DO NOT COMMIT THIS FILE TO VERSION CONTROL
# Store these securely and delete this file after copying to .env

JWT_SECRET=${jwtSecret}
SESSION_SECRET=${sessionSecret}

# MongoDB Connection String Template
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# OpenAI API Key Template
# OPENAI_API_KEY=sk-proj-your-key-here

# SMTP Configuration Template
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-specific-password
`;

  fs.writeFileSync(secretsFile, content);
  console.log(`\n💾 Secrets saved to: ${secretsFile}`);
  console.log('⚠️  Remember to delete this file after copying to .env!');
} catch (error) {
  console.log('\n⚠️  Could not save secrets file (this is okay)');
}

console.log('\n' + '='.repeat(50) + '\n');

// Additional security tips
console.log('🛡️  Security Tips:\n');
console.log('• Use different secrets for each environment');
console.log('• Rotate secrets regularly (every 90 days)');
console.log('• Never share secrets via email or chat');
console.log('• Use a password manager or secrets vault');
console.log('• Enable 2FA on all service accounts');
console.log('• Monitor for unauthorized access');
console.log('\n' + '='.repeat(50) + '\n');
