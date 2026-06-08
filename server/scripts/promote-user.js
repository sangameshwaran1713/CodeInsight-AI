/**
 * Script to promote a user to admin or super_admin role
 * 
 * Usage:
 *   node scripts/promote-user.js <email> [role]
 * 
 * Examples:
 *   node scripts/promote-user.js user@example.com admin
 *   node scripts/promote-user.js user@example.com super_admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User.model');

const VALID_ROLES = ['user', 'moderator', 'admin', 'super_admin'];

async function promoteUser(email, role = 'admin') {
  try {
    // Validate role
    if (!VALID_ROLES.includes(role)) {
      console.error(`Invalid role: ${role}`);
      console.error(`Valid roles: ${VALID_ROLES.join(', ')}`);
      process.exit(1);
    }

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    // Update role
    const oldRole = user.role;
    user.role = role;
    await user.save();

    console.log(`\nUser role updated successfully!`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Old Role: ${oldRole}`);
    console.log(`  New Role: ${user.role}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Usage: node scripts/promote-user.js <email> [role]');
  console.log('');
  console.log('Arguments:');
  console.log('  email  - The email address of the user to promote');
  console.log('  role   - The new role (default: admin)');
  console.log('');
  console.log(`Valid roles: ${VALID_ROLES.join(', ')}`);
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/promote-user.js user@example.com admin');
  console.log('  node scripts/promote-user.js user@example.com super_admin');
  process.exit(1);
}

const email = args[0];
const role = args[1] || 'admin';

promoteUser(email, role);
