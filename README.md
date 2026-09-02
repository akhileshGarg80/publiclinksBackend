# 🏢 Business Profile Platform — Backend Architecture & Setup Guide

Multi-tenant, Dynamic Template-Based Business Profile System.

---

## 🌟 Core Architecture Principles

1. **1 Flexible MongoDB Model (`Profile`)**: All user and business profiles store their data under a unified, schema-flexible `data` dictionary (Master Data). Multiple database collections are not required for different templates.
2. **Dynamic Server-Side Template System (`src/templates/*.json`)**: The server maintains trusted JSON files defining available fields, data types, required constraints, and validation rules.
3. **Master Data Preservation**: When switching templates (e.g. `template-02` ➔ `template-07`), existing master data is preserved and merged so previous attributes (e.g. price, logo, location) are not lost.
4. **Custom DNS Server Configuration**: Integrated with `dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])` in `config/db.js` for ultra-reliable MongoDB Atlas SRV resolution.
5. **Security & Authentication**:
   - Subdomain validation & system reserved word checking.
   - Password hashing with `bcrypt` (plain passwords never stored).
   - Short-lived JWT edit sessions issued upon password verification.
   - Express rate limiting and Helmet protection.

---

## 📂 Project Directory Structure

```text
business-profile-platform/
├── .env                     # Environment variables (secrets, Mongo URI, JWT)
├── .env.example             # Template environment variables for setup
├── package.json             # NPM dependencies, scripts, configuration
├── dns.js                   # Central URL, Host, & Subdomain resolution
├── server.js                # Main Express backend server entry point
├── endpoint.md              # Detailed documentation of all 8 core API endpoints
├── README.md                # Installation & setup guide (this file)
├── config/
│   └── db.js                # MongoDB connection manager with custom DNS servers
└── src/
    ├── templates/           # Trusted server-side template schemas
    │   ├── template-01.json # Minimal Digital Business Card
    │   ├── template-02.json # Product & Store Showcase
    │   ├── template-03.json # Agency & Studio
    │   ├── template-05.json # Local Business & WhatsApp Store
    │   ├── template-07.json # Food, Cafe & Restaurant Menu
    │   └── templateLoader.js# Dynamic filesystem template reader & validator
    └── dataCollection/      # Core profile backend module
        ├── dataModel.js     # Single Mongoose profile schema + fallback store
        ├── dataMiddleware.js# Subdomain, template, data, & JWT middlewares
        ├── dataController.js# Handlers for all 8 profile & template endpoints
        └── dataRoutes.js    # Express router definitions
```

---

## 📦 Required NPM Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | `^4.21.2` | Fast, unopinionated web framework for Node.js |
| `mongoose` | `^9.9.4` | MongoDB object modeling and schema management |
| `bcryptjs` | `^3.0.3` | Password hashing and verification |
| `jsonwebtoken` | `^9.0.3` | Secure short-lived JWT edit session tokens |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing handling |
| `helmet` | `^8.3.0` | HTTP security headers protection |
| `express-rate-limit` | `^8.7.0` | Rate limiting to prevent brute-force attacks |
| `dotenv` | `^17.2.3` | Loads environment variables from `.env` file |
| `tsx` | `^4.21.0` | TypeScript & Modern ESM execution engine |

---

## 🚀 Local Installation & Setup Guide

Follow these steps to run the backend on your local machine:

### Step 1: Clone or Copy the Code
Ensure your project files match the directory structure shown above.

### Step 2: Install All Dependencies
Run this command in the project root:
```bash
npm install
```

Or install explicitly:
```bash
npm install express mongoose bcryptjs jsonwebtoken cors helmet express-rate-limit dotenv
npm install -D tsx @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors
```

### Step 3: Configure Environment Variables
Create a `.env` file in the project root by copying `.env.example`:
```bash
cp .env.example .env
```

Open `.env` and fill in your values:
```env
PORT=3000
NODE_ENV=development

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/business_profiles?retryWrites=true&w=majority

# Secret for JWT edit tokens (min 32 chars)
JWT_SECRET=super_secret_jwt_key_business_profile_platform_2026_secure
JWT_EXPIRES_IN=2h

# Domain & URLs
MAIN_DOMAIN=yourdomain.com
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
CORS_ORIGIN=*
```

### Step 4: Run the Backend Server
Start in development mode (with live reload):
```bash
npm run dev
```

You will see:
```text
✓ Custom DNS servers configured: [8.8.8.8, 8.8.4.4, 1.1.1.1]
✓ [MongoDB] Connected successfully to host: cluster0...
🚀 Business Profile Platform Backend is Running!
📍 Port: http://localhost:3000
🌐 Base API: http://localhost:3000/api
📑 Health Status: http://localhost:3000/api/health
📋 Templates API: http://localhost:3000/api/templates
```

---

## 🔄 Complete Backend Flow Overview

### 1. Create Profile Flow
```text
User fills Form (Frontend)
   │
   ├─► GET /api/templates/:templateId (Loads trusted field requirements)
   │
   ├─► GET /api/profiles/check-subdomain/:subdomain (Live availability check)
   │
   ├─► ImgBB upload (Image URL returned: https://i.ibb.co/...)
   │
   └─► POST /api/profiles
         │
         ├── Server validates subdomain (syntax + reserved list check)
         ├── Server loads trusted template JSON from src/templates/*.json
         ├── Validates data against template fields
         ├── Hashes password with bcrypt
         └── Stores into MongoDB with unique subdomain index
```

### 2. Edit Profile Flow
```text
User enters subdomain to edit
   │
   ├─► POST /api/profiles/:id/verify (Submits password)
   │     └── Server verifies with bcrypt ➔ Returns JWT edit token (2h)
   │
   ├─► GET /api/profiles/:id/edit (with Bearer Token)
   │     └── Returns full Master Data
   │
   └─► PATCH /api/profiles/:id (with Bearer Token)
         ├── Supports switching templateId
         ├── Merges new data into existing master data (preserves historical keys)
         └── Updates MongoDB
```

---

## ➕ How to Add a New Template in the Future

To add **Template 51** (`template-51`), simply create a single JSON file:
`src/templates/template-51.json`

```json
{
  "templateId": "template-51",
  "name": "Luxury Real Estate & Villa",
  "category": "Real Estate",
  "previewImage": "https://...",
  "theme": { "accentColor": "#B45309" },
  "fields": {
    "name": { "type": "text", "required": true },
    "logo": { "type": "image", "required": true },
    "price": { "type": "number", "required": true },
    "location": { "type": "location", "required": true },
    "whatsapp": { "type": "social-links", "required": true },
    "properties": { "type": "product-list", "required": false }
  }
}
```

**Zero changes needed in backend code!**
The backend automatically reads the new template on the fly and starts validating submissions for `template-51`.
