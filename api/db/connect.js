// api/db/connect.js
const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return; // reuse existing connection in serverless

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set!');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,        // max 10 simultaneous DB connections
  minPoolSize: 2,         // keep 2 connections always ready
  socketTimeoutMS: 45000,
});
    isConnected = true;
    console.log('✅  MongoDB connected');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
