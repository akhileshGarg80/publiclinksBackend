/**
 * Main Express Backend Entry Point
 * Business Profile Platform
 * 
 * Pipeline:
 * Express -> Security (Helmet, CORS) -> Rate Limiting -> Body Limits -> Subdomain Identification -> API Routes -> Error Handler
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB, { getDatabaseStatus } from './config/db.js';
import { PORT, CORS_ORIGIN, extractSubdomain, MAIN_DOMAIN, FRONTEND_URL, BACKEND_URL } from './dns.js';
import dataRoutes from './src/dataCollection/dataRoutes.js';
import { getAllTemplateDefinitions } from './src/templates/templateLoader.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================================================
// 1. Security & Headers Middleware
// ============================================================================
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible API testing & iframe preview
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

// ============================================================================
// 2. Request Parsing & Body Size Limits
// ============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// ============================================================================
// 3. Rate Limiting (Protects API from Abuse & Brute-Force)
// ============================================================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.'
  }
});

app.use('/api/', apiLimiter);

// Specific stricter rate limit for password verification (brute-force protection)
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Max 20 attempts per 15 min
  message: {
    success: false,
    error: 'Too many password verification attempts. Please wait 15 minutes before trying again.'
  }
});
app.use('/api/profiles/:id/verify', verifyLimiter);

// ============================================================================
// 4. Subdomain Identification Middleware
// ============================================================================
app.use((req, res, next) => {
  const subdomain = extractSubdomain(req);
  req.detectedSubdomain = subdomain;
  if (subdomain) {
    res.setHeader('X-Detected-Subdomain', subdomain);
  }
  next();
});

// ============================================================================
// 5. System Health & Status Endpoints
// ============================================================================
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    config: {
      port: PORT,
      mainDomain: MAIN_DOMAIN,
      corsOrigin: CORS_ORIGIN,
      templatesCount: getAllTemplateDefinitions().length
    }
  });
});

// ============================================================================
// 6. Mount Core Data Collection API Routes
// ============================================================================
app.use('/api', dataRoutes);

// Direct route to serve the standalone mainsite.html client
app.get('/mainsite.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'mainsite.html'));
});

// ============================================================================
// 7. Wildcard Subdomain Routing Fallback Handler
// ============================================================================
// If an incoming request hits a custom subdomain on the root path (e.g. abcshop.yourdomain.com/),
// it automatically returns the profile JSON or public profile payload
app.get('/', async (req, res, next) => {
  const subdomain = req.detectedSubdomain;
  if (subdomain) {
    // Forward internally to getPublicProfile handler logic
    req.params.subdomain = subdomain;
    return dataRoutes.handle(req, res, next);
  }
  next();
});

// ============================================================================
// 8. Serve Frontend / Interactive API Console
// ============================================================================
// Integrate Vite in development or serve static build in production
async function setupFrontendOrApiUI() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite middleware could not be loaded, serving fallback API dashboard.', err.message);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// ============================================================================
// 9. Centralized Error Handling Middleware
// ============================================================================
app.use((err, req, res, next) => {
  console.error('✕ [Unhandled Server Error]:', err);

  // Body parser JSON syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload in request body',
      details: err.message
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid format for resource identifier: ${err.value}`
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
});

// ============================================================================
// 10. Start Server & Connect Database
// ============================================================================
async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Setup UI / Vite
  await setupFrontendOrApiUI();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================================');
    console.log(`🚀 Business Profile Platform Backend is Running!`);
    console.log(`📍 Port: http://localhost:${PORT}`);
    console.log(`🌐 Base API: http://localhost:${PORT}/api`);
    console.log(`📑 Health Status: http://localhost:${PORT}/api/health`);
    console.log(`📋 Templates API: http://localhost:${PORT}/api/templates`);
    console.log(`🏷️ Main Domain: ${MAIN_DOMAIN}`);
    console.log('====================================================');
  });

  return server;
}

startServer();

export default app;
