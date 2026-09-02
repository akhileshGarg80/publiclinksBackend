/**
 * Database Connection & In-Memory Fallback Engine
 * Business Profile Platform - Backend
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '' || uri === 'mongodb://localhost:27017/business_profiles' || uri.includes('your_username')) {
    console.log('ℹ️  MongoDB URI not configured. Active in-memory store activated.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✓ MongoDB Connected to Host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection error: ${error.message}. Running on in-memory store.`);
    isConnected = false;
    return false;
  }
}

export function getDatabaseStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    stateCode: mongoose.connection.readyState,
    statusText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    isUriConfigured: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_username')
  };
}

export default connectDB;
