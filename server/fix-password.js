require('dotenv').config();
const mongoose = require('mongoose');

async function fixPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB!');
    
    const User = require('./src/models/User.model');
    
    const email = 'mmm@gmail.com';
    const newPassword = 'SecurePass123!';
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`❌ User ${email} not found!`);
      process.exit(1);
    }
    
    console.log(`\n🔄 Updating password for: ${email}`);
    console.log(`   Current password hash: ${user.password?.substring(0, 20)}...`);
    
    // Set password and let the pre-save hook hash it
    user.password = newPassword;
    await user.save();
    
    console.log(`   New password hash: ${user.password?.substring(0, 20)}...`);
    console.log('\n✅ Password updated successfully!');
    
    // Test the password
    const isMatch = await user.comparePassword(newPassword);
    console.log(`\n🧪 Password verification test: ${isMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    if (isMatch) {
      console.log('\n✅ You can now login with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('\n❌ Password verification failed! Something is wrong.');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixPassword();
