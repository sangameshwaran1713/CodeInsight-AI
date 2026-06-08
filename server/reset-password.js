require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB!');
    
    const User = require('./src/models/User.model');
    
    const email = 'mmm@gmail.com';
    const newPassword = 'SecurePass123!'; // Strong password that meets new requirements
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User ${email} not found!`);
      process.exit(1);
    }
    
    console.log(`\n🔄 Resetting password for: ${email}`);
    console.log(`   New password: ${newPassword}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(14);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Save without running validation
    await user.save({ validateBeforeSave: false });
    
    console.log('\n✅ Password reset successfully!');
    console.log('\nYou can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
