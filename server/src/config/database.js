const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 6+ handles these options automatically
    });

    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error: ${err}`);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[MongoDB] Disconnected');
      isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.warn(`[MongoDB] Not available: ${error.message}`);
    console.warn('[MongoDB] Server running without database - auth/history features disabled');
    isConnected = false;
    // Don't exit - allow server to run without MongoDB
  }
};

const isDBConnected = () => isConnected;

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
