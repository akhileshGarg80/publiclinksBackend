/**
 * MongoDB Database Connection Manager
 * 
 * Uses Node.js DNS configuration to resolve Atlas SRV records smoothly:
 * dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
 */
import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Configure Google & Cloudflare DNS for reliable MongoDB Atlas SRV resolution
try {
  dns.setServers([
    '8.8.8.8',
    '8.8.4.4',
    '1.1.1.1',
  ]);
  console.log('✓ Custom DNS servers configured: [8.8.8.8, 8.8.4.4, 1.1.1.1]');
} catch (dnsErr) {
  console.warn('! Note: Could not set custom DNS servers:', dnsErr.message);
}

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '' || uri.includes('username:password')) {
    console.warn('⚠️ [MongoDB] MONGODB_URI is not configured in .env. Running in Hybrid/Memory-Fallback mode for testing & preview.');
    return {
      connected: false,
      mode: 'memory-fallback',
      message: 'MONGODB_URI is missing or placeholder. Running with in-memory persistence fallback until real URI is provided in .env.'
    };
  }

  if (isConnected) {
    console.log('✓ [MongoDB] Already connected.');
    return { connected: true, mode: 'mongodb' };
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = true;
    console.log(`✓ [MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`✓ [MongoDB] Database name: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('✕ [MongoDB] Connection error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ [MongoDB] Disconnected from database.');
      isConnected = false;
    });

    return { connected: true, mode: 'mongodb', host: conn.connection.host };
  } catch (error) {
    console.error('✕ [MongoDB] Connection failed:', error.message);
    console.warn('⚠️ [MongoDB] Falling back to local memory store so server remains operational.');
    return { connected: false, mode: 'memory-fallback', error: error.message };
  }
}

export function getDatabaseStatus() {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };

  return {
    connected: state === 1,
    stateCode: state,
    statusText: states[state] || 'unknown',
    isUriConfigured: Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password'))
  };
}

export default connectDB;
