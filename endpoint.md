# 📡 Business Profile Platform — Backend API Endpoints Documentation

This document describes all **8 core backend endpoints**, their purpose, parameters, request/response formats, status codes, and `curl` examples.

---

## 📑 Summary of Endpoints

| # | Method | Endpoint | Purpose | Auth Required |
|---|--------|----------|---------|---------------|
| **1** | `GET` | `/api/templates` | Fetch list of all available templates & field counts | ❌ No |
| **2** | `GET` | `/api/templates/:templateId` | Fetch complete JSON schema of a specific template | ❌ No |
| **3** | `GET` | `/api/profiles/check-subdomain/:subdomain` | Live subdomain availability checker | ❌ No |
| **4** | `POST` | `/api/profiles` | Create new business profile with validated master data | ❌ No |
| **5** | `GET` | `/api/profiles/:subdomain` | Load public business profile data & template design | ❌ No |
| **6** | `POST` | `/api/profiles/:id/verify` | Verify edit password and generate short-lived JWT edit token | ❌ No |
| **7** | `GET` | `/api/profiles/:id/edit` | Retrieve full existing master data for edit session | 🔒 Yes (JWT) |
| **8** | `PATCH` | `/api/profiles/:id` | Update profile data / switch template (preserves master data) | 🔒 Yes (JWT) |

---

## 1. GET `/api/templates`
**काम (Purpose):** सभी उपलब्ध (available) templates की summary सूची प्राप्त करना। Frontend का `TemplateSelector` इस API से templates दिखाता है।

### Query Parameters (Optional)
- `category` (string): Filter templates by category (e.g. `?category=Food%20%26%20Beverage`)

### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 5,
  "templates": [
    {
      "templateId": "template-01",
      "name": "Minimal Digital Card",
      "category": "Personal & Professional",
      "description": "Clean, modern single-card profile with avatar, bio, headline, and direct contact buttons.",
      "previewImage": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      "theme": {
        "accentColor": "#4F46E5",
        "layout": "centered-card"
      },
      "fieldCount": 7,
      "requiredFields": [
        { "key": "name", "label": "Full Name / Title", "type": "text" },
        { "key": "avatar", "label": "Profile Picture / Avatar URL", "type": "image" }
      ]
    },
    {
      "templateId": "template-02",
      "name": "Product & Store Showcase",
      "category": "E-Commerce & Retail",
      "description": "Showcase featured products, direct pricing, hero promotional image, and catalog items.",
      "previewImage": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      "theme": {
        "accentColor": "#059669",
        "layout": "grid-catalog"
      },
      "fieldCount": 7,
      "requiredFields": [
        { "key": "name", "label": "Store / Product Name", "type": "text" },
        { "key": "image", "label": "Hero Banner / Product Image URL", "type": "image" },
        { "key": "price", "label": "Starting / Featured Price (₹ or $)", "type": "number" }
      ]
    }
  ]
}
```

#### cURL Example:
```bash
curl -X GET http://localhost:3000/api/templates
```

---

## 2. GET `/api/templates/:templateId`
**काम (Purpose):** किसी एक specific template का पूरा JSON Schema प्राप्त करना। Frontend का `DynamicForm` इसी schema को पढ़कर dynamic form fields generate करता है।

### URL Parameters
- `templateId` (string, required): e.g. `template-02`, `template-07`

### Success Response (`200 OK`)
```json
{
  "success": true,
  "template": {
    "templateId": "template-02",
    "name": "Product & Store Showcase",
    "category": "E-Commerce & Retail",
    "description": "Showcase featured products, direct pricing, hero promotional image, and catalog items.",
    "previewImage": "https://images.unsplash.com/...",
    "theme": {
      "accentColor": "#059669",
      "layout": "grid-catalog"
    },
    "fields": {
      "name": {
        "type": "text",
        "label": "Store / Product Name",
        "placeholder": "e.g. ABC Shop - Mobile & Accessories",
        "required": true,
        "validation": { "minLength": 2, "maxLength": 100 }
      },
      "image": {
        "type": "image",
        "label": "Hero Banner / Product Image URL",
        "required": true,
        "validation": { "isUrl": true }
      },
      "price": {
        "type": "number",
        "label": "Starting / Featured Price (₹ or $)",
        "required": true,
        "validation": { "min": 0, "max": 10000000 }
      },
      "products": {
        "type": "product-list",
        "label": "Product Catalog Items",
        "required": false,
        "limits": { "maxItems": 50 }
      }
    }
  }
}
```

### Error Response (`404 Not Found`)
```json
{
  "success": false,
  "error": "Template with ID \"template-99\" not found"
}
```

#### cURL Example:
```bash
curl -X GET http://localhost:3000/api/templates/template-02
```

---

## 3. GET `/api/profiles/check-subdomain/:subdomain`
**काम (Purpose):** Subdomain की उपलब्धता (availability) live check करना। जब user form में subdomain type करता है, frontend debounce करके इस endpoint को call करता है।

### URL Parameters
- `subdomain` (string, required): e.g. `abcshop`, `royalbistro`

### Response Case A: Available (`200 OK`)
```json
{
  "success": true,
  "available": true,
  "subdomain": "abcshop",
  "status": "available",
  "message": "Subdomain \"abcshop\" is available for registration"
}
```

### Response Case B: Already Taken (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "subdomain": "abcshop",
  "status": "taken",
  "reason": "Subdomain \"abcshop\" is already registered"
}
```

### Response Case C: Reserved or Invalid Format (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "subdomain": "admin",
  "status": "invalid",
  "reason": "The subdomain \"admin\" is a reserved system keyword and cannot be used"
}
```

#### cURL Example:
```bash
curl -X GET http://localhost:3000/api/profiles/check-subdomain/abcshop
```

---

## 4. POST `/api/profiles`
**काम (Purpose):** नया Business Profile create करना। 
- Server-side trusted template JSON से data validate होता है।
- Subdomain uniqueness दुबारा check होती है।
- Password को `bcrypt` से hash करके store किया जाता है। Plain password कभी database में नहीं जाता।

### Request Headers
`Content-Type: application/json`

### Request Body
```json
{
  "templateId": "template-02",
  "subdomain": "abcshop",
  "data": {
    "name": "ABC Shop - Mobile & Accessories",
    "description": "Premium gadgets and mobile repairs in Satna",
    "image": "https://i.ibb.co/example/banner.jpg",
    "price": 599,
    "location": "Civil Lines, Satna",
    "whatsapp": "+919876543210",
    "products": [
      { "title": "Wireless Earbuds Pro", "price": 1299 },
      { "title": "Fast Charger 65W", "price": 699 }
    ]
  },
  "password": "mySecurePassword123",
  "isPublished": true
}
```

### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Business profile created successfully",
  "profile": {
    "id": "65e8a9d123456789abcdef01",
    "templateId": "template-02",
    "subdomain": "abcshop",
    "data": {
      "name": "ABC Shop - Mobile & Accessories",
      "description": "Premium gadgets and mobile repairs in Satna",
      "image": "https://i.ibb.co/example/banner.jpg",
      "price": 599,
      "location": "Civil Lines, Satna",
      "whatsapp": "+919876543210",
      "products": [
        { "title": "Wireless Earbuds Pro", "price": 1299 },
        { "title": "Fast Charger 65W", "price": 699 }
      ]
    },
    "passwordEnabled": true,
    "isPublished": true,
    "createdAt": "2026-09-02T04:40:00.000Z",
    "updatedAt": "2026-09-02T04:40:00.000Z"
  },
  "urls": {
    "subdomainUrl": "http://abcshop.yourdomain.com",
    "directUrl": "http://localhost:3000/profile/abcshop",
    "apiEndpoint": "/api/profiles/abcshop"
  }
}
```

### Validation Error (`422 Unprocessable Entity`)
```json
{
  "success": false,
  "error": "Data validation failed for the selected template",
  "details": [
    "Field \"price\" (Starting / Featured Price) is required for Product & Store Showcase"
  ]
}
```

#### cURL Example:
```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template-02",
    "subdomain": "abcshop",
    "data": {
      "name": "ABC Shop",
      "image": "https://i.ibb.co/banner.jpg",
      "price": 599
    },
    "password": "mypassword123"
  }'
```

---

## 5. GET `/api/profiles/:subdomain`
**काम (Purpose):** Public Profile render करने के लिए profile data और selected template metadata load करना। (Sensitive fields जैसे `passwordHash` कभी return नहीं होते)।

### URL Parameters
- `subdomain` (string, required): e.g. `abcshop`

### Success Response (`200 OK`)
```json
{
  "success": true,
  "profile": {
    "id": "65e8a9d123456789abcdef01",
    "subdomain": "abcshop",
    "templateId": "template-02",
    "data": {
      "name": "ABC Shop - Mobile & Accessories",
      "description": "Premium gadgets and mobile repairs in Satna",
      "image": "https://i.ibb.co/example/banner.jpg",
      "price": 599,
      "location": "Civil Lines, Satna",
      "whatsapp": "+919876543210",
      "products": []
    },
    "passwordEnabled": true,
    "isPublished": true,
    "createdAt": "2026-09-02T04:40:00.000Z",
    "updatedAt": "2026-09-02T04:40:00.000Z"
  },
  "template": {
    "templateId": "template-02",
    "name": "Product & Store Showcase",
    "category": "E-Commerce & Retail",
    "theme": {
      "accentColor": "#059669",
      "layout": "grid-catalog"
    }
  }
}
```

### Error Response (`404 Not Found`)
```json
{
  "success": false,
  "error": "Profile for \"unknownshop\" not found"
}
```

#### cURL Example:
```bash
curl -X GET http://localhost:3000/api/profiles/abcshop
```

---

## 6. POST `/api/profiles/:id/verify`
**काम (Purpose):** Profile edit करने से पहले password verify करना। अगर password सही है, तो backend एक short-lived JWT Edit Token return करता है जिसे अगले Edit API calls में भेजा जाएगा।

### URL Parameters
- `id` (string, required): MongoDB Profile `_id`

### Request Body
```json
{
  "password": "mySecurePassword123"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "2h",
  "profile": {
    "id": "65e8a9d123456789abcdef01",
    "subdomain": "abcshop",
    "templateId": "template-02"
  }
}
```

### Invalid Password (`401 Unauthorized`)
```json
{
  "success": false,
  "error": "Incorrect password. Access denied."
}
```

### Password Disabled Profile (`403 Forbidden`)
```json
{
  "success": false,
  "error": "Editing is locked: This profile was created without a password."
}
```

#### cURL Example:
```bash
curl -X POST http://localhost:3000/api/profiles/65e8a9d123456789abcdef01/verify \
  -H "Content-Type: application/json" \
  -d '{"password": "mySecurePassword123"}'
```

---

## 7. GET `/api/profiles/:id/edit`
**काम (Purpose):** Authenticated edit session के लिए existing profile का पूरा Master Data और available templates list प्राप्त करना।

### Request Headers
`Authorization: Bearer <JWT_TOKEN>`

### Success Response (`200 OK`)
```json
{
  "success": true,
  "profile": {
    "id": "65e8a9d123456789abcdef01",
    "subdomain": "abcshop",
    "templateId": "template-02",
    "data": {
      "name": "ABC Shop",
      "description": "Mobile & Accessories",
      "logo": "https://...",
      "price": 599,
      "location": "Satna",
      "whatsapp": "+919876543210",
      "products": []
    },
    "passwordEnabled": true,
    "isPublished": true,
    "createdAt": "2026-09-02T04:40:00.000Z",
    "updatedAt": "2026-09-02T04:40:00.000Z"
  },
  "currentTemplate": {
    "templateId": "template-02",
    "name": "Product & Store Showcase"
  },
  "availableTemplates": [
    { "templateId": "template-01", "name": "Minimal Digital Card" },
    { "templateId": "template-02", "name": "Product & Store Showcase" },
    { "templateId": "template-07", "name": "Food, Cafe & Restaurant Menu" }
  ]
}
```

#### cURL Example:
```bash
curl -X GET http://localhost:3000/api/profiles/65e8a9d123456789abcdef01/edit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 8. PATCH `/api/profiles/:id`
**काम (Purpose):** Existing Profile को update करना।
- **Template Switching:** User किसी भी नए template (e.g. `template-05` या `template-07`) में switch कर सकता है।
- **Master Data Preservation:** पुराना data delete नहीं होता। नया data merge होता है।
- Password update और `isPublished` toggle भी इसी endpoint से होता है।

### Request Headers
`Authorization: Bearer <JWT_TOKEN>`  
`Content-Type: application/json`

### Request Body (Example: Switching template to `template-07` and updating data)
```json
{
  "templateId": "template-07",
  "data": {
    "menu": [
      { "title": "Special Woodfired Pizza", "price": 349, "isVeg": true }
    ]
  },
  "isPublished": true
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Business profile updated successfully",
  "profile": {
    "id": "65e8a9d123456789abcdef01",
    "templateId": "template-07",
    "subdomain": "abcshop",
    "data": {
      "name": "ABC Shop",
      "description": "Mobile & Accessories",
      "image": "https://i.ibb.co/banner.jpg",
      "logo": "https://i.ibb.co/banner.jpg",
      "price": 599,
      "location": "Civil Lines, Satna",
      "whatsapp": "+919876543210",
      "menu": [
        { "title": "Special Woodfired Pizza", "price": 349, "isVeg": true }
      ]
    },
    "passwordEnabled": true,
    "isPublished": true,
    "updatedAt": "2026-09-02T04:45:00.000Z"
  }
}
```

### Missing Fields for New Template (`422 Unprocessable Entity`)
```json
{
  "success": false,
  "error": "Validation failed for template \"template-07\". Some required fields are missing.",
  "details": [
    "Field \"logo\" (Brand Logo / Facade URL) is required for Food, Cafe & Restaurant Menu"
  ]
}
```

#### cURL Example:
```bash
curl -X PATCH http://localhost:3000/api/profiles/65e8a9d123456789abcdef01 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template-07",
    "data": {
      "menu": [{ "title": "Special Pizza", "price": 349 }]
    }
  }'
```

---

## 9. System Endpoints

### `GET /api/health`
Checks database connectivity, server uptime, DNS settings, and active template count.

```bash
curl -X GET http://localhost:3000/api/health
```
