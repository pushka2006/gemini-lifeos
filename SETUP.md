# Gemini LifeOS Setup & Deployment Guide

This guide walks through configuring and running Gemini LifeOS in local development and production environments.

---

## 1. Prerequisites

- **Node.js**: v18+ (tested on Node v22 and v24)
- **npm**: v9+
- **Google Gemini API Key**: from [Google AI Studio](https://aistudio.google.com/)
- **Firebase Project**: from [Firebase Console](https://console.firebase.google.com/)

---

## 2. Environment Configuration

### Client Environment Configuration (`.env`)
In the project root, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Populate the Firebase Client credentials:
```ini
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef

VITE_API_URL=http://localhost:5000
VITE_ENABLE_DEV_MOCK=true
```

> **Note**: If you want to test the application immediately without configuring a Firebase project right away, leaving `VITE_FIREBASE_API_KEY` empty will cause Gemini LifeOS to launch automatically in **Secure Dev Sandbox Mode** with local user isolation and mock credentials!

### Backend Server Environment Configuration (`server/.env`)
In the `server/` directory, copy `.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Populate backend secrets:
```ini
PORT=5000
NODE_ENV=development

# Google Gemini API Key
GEMINI_API_KEY=AIzaSyYourSecretGeminiKeyHere
GEMINI_MODEL=gemini-1.5-flash

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----\n"

# CORS origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 3. Running in Development

### Install Dependencies
```bash
# Install root (client & test) dependencies
npm install

# Install backend server dependencies
npm --prefix server install
```

### Start the Servers
Open two terminal windows:

**Terminal 1 (Backend API Server):**
```bash
npm run server
# Starts backend server on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev
# Starts Vite dev server on http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser.

---

## 4. Deploying Firestore Security Rules

Install the Firebase CLI and deploy the strict isolation rules:
```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

---

## 5. Running Automated Tests

Run the Vitest test suite to verify cross-user isolation and AI parsers:
```bash
npm test
```
