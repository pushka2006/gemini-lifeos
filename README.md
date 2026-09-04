# Gemini LifeOS — Personal AI Journal & Operating System

> **A production-grade, security-first personal AI operating system and intelligent journal powered by Google Gemini and Cloud Firestore.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpushka2006%2Fgemini-lifeos)

---

## 🌟 Overview

**Gemini LifeOS** re-imagines journaling as an interactive cognitive command center. Designed with an obsidian cyberpunk glassmorphism aesthetic, Gemini LifeOS serves as an intelligent companion for daily journaling, multi-turn brainstorms, voice reflection, memory retention, goal decomposition, and personal behavioral insights.

Every byte of user data is cryptographically isolated using **Cloud Firestore Security Rules** scoped strictly to the authenticated user's UID (`request.auth.uid == uid`). Secret API credentials (including the Google Gemini API key and Firebase Admin credentials) are never exposed to the client or browser.

---

## 🚀 Key Features

### 1. 🤖 Central 3D AI Orb & Futuristic HUD
- Interactive Canvas/WebGL AI Core responding dynamically across 6 operational states:
  - `IDLE`: Tranquil cyan breathing glow with orbiting quantum satellites.
  - `LISTENING`: Reactive high-frequency neon soundwave oscillation.
  - `THINKING`: Electric violet vortex with accelerating planetary synapsing.
  - `RESPONDING`: Shimmering aurora waves blending emerald and cyan.
  - `SAVING`: Golden amber shimmer converging during encryption.
  - `ERROR`: Crimson alert pulse.

### 2. 🎙️ Voice Journaling with Live Visualizer
- Web Speech API speech-to-text recording with real-time audio visualizer frequency bars.
- Live states: `Listening...` &rarr; `Transcribing...` &rarr; `Analyzing...` &rarr; `Review & Save`.
- Client-side transcription privacy guarantee: No audio is recorded or stored on remote servers without explicit user consent.

### 3. ✍️ AI Journal Mode & Psychological Insight
- Rich Markdown editor with live preview toggle.
- Gemini automatically extracts:
  - Evocative entry title & clean formatted prose
  - Executive summary
  - Mood valence (Energetic, Optimistic, Focused, Calm, Reflective, Stressed, Overwhelmed, Grateful)
  - Specific emotion tags & key events
  - Lessons learned & gratitude anchors
  - Suggested next constructive action

### 4. 💬 ChatGPT-Style Multi-Turn Streaming Chat
- Server-Sent Events (SSE) streaming multi-turn chat.
- Configurable persona modes:
  - `GENERAL`, `JOURNAL`, `BRAINSTORM`, `REFLECTION`, `GOALS`, `STUDY`, `PLANNING`
- Contextual personal memory injection.
- Automatic conversation summarization after configurable length.
- Session management: New session, rename, delete, copy, regenerate, stop streaming.

### 5. 🔍 Ask My Journal (Semantic Personal Search)
- Grounded RAG search querying the user's private personal history.
- Answers inquiries (e.g., *"What did I say about my startup last month?"*, *"What were my recurring stressors?"*) with exact date and entry citations.

### 6. ⚡ AI Task Extraction
- Automatically detects actionable commitments in conversations and journal entries (e.g. *"I need to finish the frontend by Friday"*).
- Interactive card with one-click **Add Task**, **Edit**, or **Ignore** controls.

### 7. 🎯 Goals & Milestone Decomposition
- Converts visionary aspirations into sequential milestones, target days, and subtasks.
- Progress bar and milestone completion checklists.

### 8. 🧠 Personal Memory Vault
- Long-term memory manager for verified preferences, personal facts, and project anchors.
- Complete user control: view, edit, delete, toggle active state, or clear all vectors.

### 9. 🌅 AI Morning Brief
- Executive daily trajectory synthesis: yesterday's recap, top priority focus, active goal milestones, urgent tasks, and motivational boost.

### 10. 🌇 AI Daily Reflection
- Guided 4-question evening debrief:
  1. *What went well today?*
  2. *What challenged or drained you?*
  3. *What did you learn today?*
  4. *What would you like to improve tomorrow?*
- Calculates a daily growth score (%) and emotional balance summary.

### 11. 📊 AI Personal Insights
- Recharts visualizations:
  - Mood valence over time
  - Top discussion topic distribution
  - Goal completion ratio
  - Qualitative AI pattern synthesis
- Strict ethical disclaimer: Not intended as medical or psychological diagnosis.

### 12. 📦 Sovereign Data Export & Account Purge
- Export complete personal vault in machine-readable **JSON**.
- Export journal archive in standard **CSV**.
- One-click cryptographic data purge for complete GDPR/privacy sovereignty.

---

## 🔒 Security Architecture

| Security Layer | Implementation Detail |
| :--- | :--- |
| **API Secret Protection** | Gemini API Key and Firebase Admin credentials remain strictly on backend server (`server/`). Never bundled into frontend. |
| **Data Isolation** | All Firestore queries are rooted under `users/{uid}/*`. Enforced by `firestore.rules` verifying `request.auth.uid == uid`. |
| **Token Verification** | Express backend verifies signed Firebase Auth JWT Bearer token on every `/api/ai/*` endpoint. |
| **Rate Limiting** | `express-rate-limit` mitigates denial of service and API abuse (100 req/15min). |
| **Input Validation** | Server-side Zod validation schemas reject oversized or malformed payloads. |
| **Headers & Sanitization**| Helmet security headers (`nosniff`, `DENY`, CSP) and sanitized error handlers prevent credential or stack leakage. |

Full security details are documented in [`SECURITY.md`](SECURITY.md).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React-Markdown, Remark-GFM
- **Backend API Server**: Node.js, Express, TypeScript, Firebase Admin SDK, Google Generative AI SDK, Zod, Helmet, Express-Rate-Limit
- **Authentication**: Firebase Authentication (Email/Password, Google OAuth, Session Persistence)
- **Database**: Cloud Firestore (Strictly Isolated Subcollections)
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`, configurable)
- **Testing**: Vitest, React Testing Library, JSDOM

---

## 🚦 Quick Start & Verification

### 1. Install Dependencies
```bash
npm install
npm --prefix server install
```

### 2. Run Automated Tests
```bash
npm test
```
Verifies cross-user isolation, task extraction, journal analysis, and AI Orb rendering.

### 3. Start Development Servers
```bash
# Terminal 1: Backend API Gateway
npm run server

# Terminal 2: Frontend Client
npm run dev
```

Visit `http://localhost:5173` to explore Gemini LifeOS.

---

## 📂 Project Structure

```
gemini/
├── src/
│   ├── components/
│   │   ├── chat/TaskExtractionCard.tsx
│   │   ├── layout/AppLayout.tsx
│   │   ├── orb/AiOrb.tsx
│   │   └── voice/VoiceJournalModal.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── LifeOSContext.tsx
│   ├── lib/firebase.ts
│   ├── pages/
│   │   ├── auth/ (Login, Signup, ForgotPassword, Onboarding)
│   │   ├── AskJournal.tsx
│   │   ├── Chat.tsx
│   │   ├── DailyReflection.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Goals.tsx
│   │   ├── Insights.tsx
│   │   ├── Journal.tsx
│   │   ├── Memories.tsx
│   │   ├── MorningBrief.tsx
│   │   ├── Search.tsx
│   │   ├── Settings.tsx
│   │   └── Tasks.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── storage.ts
│   ├── types/index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server/
│   ├── src/
│   │   ├── ai/gemini.ts
│   │   ├── middleware/ (auth.ts, rateLimiter.ts)
│   │   ├── routes/ai.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── firebase.json
├── tests/
│   ├── ai/
│   │   ├── journal-analysis.test.ts
│   │   └── task-extraction.test.ts
│   ├── components/ai-orb.test.tsx
│   ├── security/isolation.test.ts
│   └── setup.ts
├── ARCHITECTURE.md
├── SECURITY.md
├── SETUP.md
├── package.json
└── vite.config.ts
```

---

## 📜 License
MIT License &bull; Built for the Personal Gemini Journal Challenge.
