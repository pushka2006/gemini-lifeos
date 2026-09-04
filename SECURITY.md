# Security Architecture & Policies: Gemini LifeOS

Gemini LifeOS is designed from the ground up with a **Security-First Architecture** to protect personal cognitive data, private reflections, and secret credentials.

---

## 1. Threat Model & Security Principles

1. **Zero Client-Side Secrets**:
   - Neither the Google Gemini API key nor Firebase Admin service credentials ever touch client code or browser memory.
   - All AI interactions pass through the authenticated backend gateway (`/api/ai/*`).

2. **Strict Cryptographic User Data Isolation**:
   - Every Firestore document is strictly rooted under `users/{uid}/*`.
   - Client requests carry a signed Firebase Auth JSON Web Token (JWT).
   - Firestore Security Rules verify `request.auth.uid == userId` for every read, list, create, update, and delete operation.
   - Cross-user data leakage is provably impossible at both the Firestore rules engine level and backend service layer.

3. **No Unauthenticated Execution**:
   - Protected API routes enforce the `authenticate` middleware, extracting and validating tokens against Firebase Admin SDK.
   - Client routes enforce authentication guards and redirect unauthenticated sessions to `/login`.

4. **Input Sanitization & Zod Schema Validation**:
   - Every API payload is validated against strict Zod schemas on the server before processing.
   - Text inputs are checked for maximum lengths and malformed characters to mitigate prompt injection and buffer attacks.

5. **Rate Limiting & Denial of Service Protection**:
   - `express-rate-limit` enforces rate windows on AI routes (100 requests per 15 minutes for standard calls; 40 requests per 10 minutes for heavy generative tasks).

6. **Audio & Voice Privacy**:
   - Speech-to-text operates locally via the browser's Web Speech API.
   - No audio stream or microphone recording is stored on servers without explicit user consent.

---

## 2. Firestore Security Rules Architecture

Located at [`firebase/firestore.rules`](file:///c:/Users/Pushkar/OneDrive/Documents/gemini/firebase/firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Explicit default deny
    match /{document=**} {
      allow read, write: if false;
    }

    // User-scoped isolation: users/{userId}/**
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /conversations/{conversationId} {
        allow read, write: if isOwner(userId);
        match /messages/{messageId} {
          allow read, write: if isOwner(userId);
        }
      }

      match /journalEntries/{entryId} {
        allow read, write: if isOwner(userId);
      }

      match /memories/{memoryId} {
        allow read, write: if isOwner(userId);
      }

      match /goals/{goalId} {
        allow read, write: if isOwner(userId);
      }

      match /tasks/{taskId} {
        allow read, write: if isOwner(userId);
      }

      match /insights/{insightId} {
        allow read, write: if isOwner(userId);
      }

      match /reflections/{reflectionId} {
        allow read, write: if isOwner(userId);
      }

      match /settings/{settingId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

## 3. Secret Management & Production Hardening

- In production, server environment variables should be provisioned via **Google Cloud Secret Manager**:
  - `GEMINI_API_KEY`: Injected directly into the Cloud Run / Cloud Functions runtime environment.
  - `FIREBASE_PRIVATE_KEY`: Encrypted service account credentials.
- In local development, credentials are stored in git-ignored `.env` files.
- Helmet security headers are applied to enforce `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and Content Security Policy directives.
- Centralized error handlers strip internal stack traces and server internals, returning sanitized generic error codes (`InternalServerError`, `Unauthorized`, `ValidationError`).

---

## 4. Cross-User Data Isolation Verification

Automated security tests located in [`tests/security/isolation.test.ts`](file:///c:/Users/Pushkar/OneDrive/Documents/gemini/tests/security/isolation.test.ts) verify:
- User A writes a confidential document to `users/usr_alpha/journalEntries/entry_1`.
- User B queries `getJournalEntries('usr_bravo')`.
- Assert that User B receives **0 results** matching User A.
- Missing UID throws explicit security violation exceptions.
- User A deletion operations do not impact User B.
