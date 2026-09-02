# 📦 Business Profile Platform - Architecture & Package Setup Guide

This project follows an **Industry Standard Decoupled Architecture**, where the `backend/` and `frontend/` are completely self-contained, independent packages with zero code coupling.

---

## 📂 Directory Structure Overview

```text
├── backend/                      # Standalone Backend (Port 5000)
│   ├── .env.example              # Backend Environment Variables
│   ├── .gitignore                # Backend-specific ignore rules
│   ├── package.json              # Backend Dependencies & Scripts
│   ├── server.js                 # Backend Server Entry Point
│   └── src/
│       ├── config/
│       │   └── db.js             # MongoDB & In-Memory Fallback Connection
│       ├── dataCollection/
│       │   ├── dataController.js # Core Business Logic (CRUD, Auth)
│       │   ├── dataMiddleware.js # Validation, Subdomain Security, JWT
│       │   ├── dataModel.js      # Single Dynamic MongoDB Schema + Memory Store
│       │   ├── dataRoutes.js     # API Route Declarations (/api/*)
│       │   └── uploadController.js # ImgBB API & Local Upload Handler
│       ├── dns.js                # DNS & Port 5000 Subdomain Resolver
│       └── templates/
│           ├── template-01.json  # Minimal Digital Card JSON Definition
│           ├── template-02.json  # Product Catalog Showcase JSON Definition
│           ├── template-03.json  # Creative Agency Studio JSON Definition
│           ├── template-05.json  # Local Business & WhatsApp Store JSON Definition
│           ├── template-07.json  # Restaurant & Food Menu JSON Definition
│           └── templateLoader.js # Dynamic Template Registry Engine
│
├── frontend/                     # Standalone Frontend (Port 3000)
│   ├── .env.example              # Frontend Environment Variables
│   ├── .gitignore                # Frontend-specific ignore rules
│   ├── package.json              # Frontend Dependencies & Scripts
│   ├── index.html                # Main UI & Dynamic Form/Preview Application
│   └── src/
│       ├── dns.js                # Frontend DNS & Backend URL (localhost:5000) Resolver
│       ├── modules/
│       │   ├── apiClient.js      # Centralized HTTP Client with Auth Injection
│       │   ├── formBuilder.js    # Dynamic Form Generator from JSON Schemas
│       │   ├── profileManager.js # Profile Creation & Editing Operations
│       │   ├── subdomainChecker.js # Real-time Subdomain Availability Checker
│       │   └── toast.js          # Toast Notifications Component
│       └── templates/
│           ├── template-01.js    # Minimal Digital Card UI Renderer
│           ├── template-02.js    # Product Catalog Showcase UI Renderer
│           ├── template-03.js    # Creative Agency Studio UI Renderer
│           ├── template-05.js    # Local Business & WhatsApp Store UI Renderer
│           ├── template-07.js    # Restaurant & Cafe Menu UI Renderer
│           └── templateEngine.js # Dynamic Template Dispatch Engine
│
└── package.json                  # Root Monorepo Orchestration Scripts
```

---

## 🛠️ Package Installation & Commands

### 1. Backend Package (`backend/`)
Navigate to `backend/` and install dependencies:
```bash
cd backend
npm install
```

#### 📦 Backend Dependencies:
| Package Name | Purpose |
| :--- | :--- |
| `express` | Core Web Server Framework |
| `mongoose` | MongoDB ODM for document persistence |
| `dotenv` | Environment variable loader from `.env` |
| `cors` | Cross-Origin Resource Sharing middleware |
| `helmet` | HTTP Security header protection |
| `express-rate-limit` | Rate limiting to prevent DDoS/abuse |
| `bcryptjs` | Password hashing for edit access protection |
| `jsonwebtoken` | JWT token signing for authenticated edit sessions |
| `multer` | Multipart file upload parsing for images |

#### 🚀 Backend Commands:
- **Start Production Server**: `npm start` (Runs on `http://localhost:5000`)
- **Start Dev Mode**: `npm run dev` (Node watch mode)

---

### 2. Frontend Package (`frontend/`)
Navigate to `frontend/` and install dependencies:
```bash
cd frontend
npm install
```

#### 📦 Frontend Dependencies:
| Package Name | Purpose |
| :--- | :--- |
| `vite` | Ultra-fast Frontend Dev Server & Bundler |
| `lucide` | Clean icon library for UI components |
| `tailwindcss` | Utility-first CSS styling framework |

#### 🚀 Frontend Commands:
- **Start Dev Server**: `npm run dev` (Runs on `http://localhost:3000`)
- **Build for Production**: `npm run build`
- **Preview Production Build**: `npm run preview`

---

## 🌐 Port & DNS Configuration

- **Frontend Application**: `http://localhost:3000`
- **Backend API Server**: `http://localhost:5000`
- **DNS Resolver**: `frontend/src/dns.js` points to `http://localhost:5000` by default and allows overriding via `localStorage` or URL query (`?api=...`).
