require('dotenv').config();
const mongoose = require('mongoose');

async function testDB() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB!');
    
    const User = require('./src/models/User.model');
    
    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${userCount}`);
    
    // List all users (without passwords)
    const users = await User.find().select('name email role isEmailVerified createdAt');
    console.log('\n👥 Users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Role: ${user.role} - Verified: ${user.isEmailVerified}`);
    });
    
    // Check for the specific user trying to login
    const testEmail = 'mmm@gmail.com';
    const testUser = await User.findOne({ email: testEmail });
    if (testUser) {
      console.log(`\n✅ User ${testEmail} exists!`);
      console.log(`   Name: ${testUser.name}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Email Verified: ${testUser.isEmailVerified}`);
      console.log(`   Active: ${testUser.isActive}`);
    } else {
      console.log(`\n❌ User ${testEmail} NOT FOUND in database!`);
      console.log('   You need to register this user first.');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDB();
