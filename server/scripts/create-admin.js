const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { connectToMongoDB, disconnectFromMongoDB } = require('../database/mongodb');

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await disconnectFromMongoDB();
      return;
    }

    // Create default admin
    const admin = new Admin({
      username: 'admin',
      email: 'admin@razzwars.com',
      password_hash: 'admin123' // Will be hashed by pre-save middleware
    });

    await admin.save();
    console.log('Default admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@razzwars.com');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await disconnectFromMongoDB();
  }
}

// Run the script
createDefaultAdmin();



