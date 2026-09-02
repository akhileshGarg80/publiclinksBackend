/**
 * Independent Express Backend Entry Point
 * Business Profile Platform - Backend Server (Default: Port 5000)
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB, { getDatabaseStatus } from './src/config/db.js';
import { PORT, CORS_ORIGIN, extractSubdomain, MAIN_DOMAIN, FRONTEND_URL, BACKEND_URL } from './src/dns.js';
import dataRoutes from './src/dataCollection/dataRoutes.js';
import { getAllTemplateDefinitions } from './src/templates/templateLoader.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Security & Headers Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-subdomain', 'x-edit-token'],
    credentials: true,
  })
);

// 2. Request Parsing & Body Size Limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// 3. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.'
  }
});
app.use('/api/', apiLimiter);

// 4. Subdomain Extraction Middleware
app.use((req, res, next) => {
  const subdomain = extractSubdomain(req);
  if (subdomain) {
    req.extractedSubdomain = subdomain;
  }
  next();
});

// 5. System Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const templates = getAllTemplateDefinitions();

  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    config: {
      port: PORT,
      mainDomain: MAIN_DOMAIN,
      corsOrigin: CORS_ORIGIN,
      templatesCount: templates.length
    }
  });
});

// 6. Mount Core Data Collection & Management API Routes
app.use('/api', dataRoutes);

// 7. 404 Handler for Unknown API Endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API Endpoint not found',
    endpoint: req.originalUrl,
    method: req.method
  });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error('✕ Uncaught Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// 9. Server Initialization
async function startServer() {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Business Profile Platform Backend is Running!`);
    console.log(`📡 Port: http://localhost:${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
    console.log(`🎨 Templates: http://localhost:${PORT}/api/templates`);
    console.log(`==================================================\n`);
  });
}

// Start standalone if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export default app;
