# System Architecture: Gemini LifeOS

Gemini LifeOS is a full-stack personal AI operating system designed around cryptographic data privacy, real-time multi-turn intelligence, voice reflection, and actionable goal execution.

---

## 1. High-Level Flowchart

```
                 ┌─────────────────────┐
                 │      React UI       │
                 │   Gemini LifeOS     │
                 └──────────┬──────────┘
                            │
                     Firebase Auth
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Secure Backend/API  │
                 └──────────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        Gemini API      Firestore     Secret Manager
             │              │
             ▼              ▼
        AI Engine       User Data
             │
       ┌─────┼─────┬─────────┐
       ▼     ▼     ▼         ▼
    Journal Memory Goals    Tasks
       │     │     │         │
       └─────┴─────┴─────────┘
                    │
                    ▼
               AI INSIGHTS
```

---

## 2. Component Hierarchy & Flow

```
Gemini LifeOS (Root)
│
├── AuthProvider (Firebase Auth Client + Dev Sandbox)
│   └── LifeOSProvider (User-Scoped State, AI State & Notifications)
│       │
│       ├── AppLayout (3-Column Futuristic Command Center)
│       │   ├── Left Sidebar (Navigation Core & Cryptographic UID Shield)
│       │   ├── Center Stage (Dynamic Panel Routing)
│       │   │   ├── Dashboard (Animated 3D AI Orb + Quick Transmit Bar + Metric Cards)
│       │   │   ├── AI Chat (Streaming Multi-Turn, Persona Modes, Task Extraction)
│       │   │   ├── Journal (Markdown Editor, Moods, Tags, AI Refine/Analyze)
│       │   │   ├── Ask My Journal (Semantic RAG Search over Personal Vault)
│       │   │   ├── Morning Brief (Executive Daily Trajectory Synthesis)
│       │   │   ├── Daily Reflection (4-Step Evening Introspection Engine)
│       │   │   ├── Memories (Long-Term Cognitive Memory Manager)
│       │   │   ├── Goals (Milestone Decomposition & Progress Bars)
│       │   │   ├── Tasks (AI-Extracted & Manual Action Checklists)
│       │   │   ├── AI Insights (Recharts Analytics: Mood, Topics, Velocity)
│       │   │   ├── Search (Universal Personal Search with Multi-Filters)
│       │   │   └── Settings (Model Select, Memory Toggle, JSON/CSV Export, Purge)
│       │   │
│       │   └── Right Telemetry HUD (Live Mood State, Goals Trajectory, Urgent Tasks)
│       │
│       ├── VoiceJournalModal (Web Speech API + Real-Time Audio Canvas Visualizer)
│       └── NotificationToasts (Floating Holographic Status Alerts)
```

---

## 3. Database Schema (Cloud Firestore)

All documents are strictly scoped under the authenticated user's UID:

| Path | Document Contents | Access Control |
| :--- | :--- | :--- |
| `users/{uid}` | Profile, preferences, morning brief | `request.auth.uid == uid` |
| `users/{uid}/conversations/{cId}` | Title, mode, summary, message count | `request.auth.uid == uid` |
| `users/{uid}/conversations/{cId}/messages/{mId}` | Role, content, timestamp, extracted tasks | `request.auth.uid == uid` |
| `users/{uid}/journalEntries/{eId}` | Title, rawContent, formattedContent, mood, emotions, keyEvents, gratitude, tags, date | `request.auth.uid == uid` |
| `users/{uid}/memories/{mId}` | Category (preference/goal/fact), content, confidence, source | `request.auth.uid == uid` |
| `users/{uid}/goals/{gId}` | Title, description, category, progress %, milestones array | `request.auth.uid == uid` |
| `users/{uid}/tasks/{tId}` | Title, deadline, priority, status (pending/completed), source | `request.auth.uid == uid` |
| `users/{uid}/reflections/{rId}` | Went well, challenged, learned, tomorrow, growthScore | `request.auth.uid == uid` |

---

## 4. AI Engine Service Pipeline

1. **Streaming Multi-Turn Chat (`/api/ai/chat/stream`)**:
   - Accepts conversation history, selected persona mode (`GENERAL`, `JOURNAL`, `BRAINSTORM`, `REFLECTION`, `GOALS`, `STUDY`, `PLANNING`), and injected user memories.
   - Streams chunks via Server-Sent Events (SSE).
2. **Journal Analysis (`/api/ai/journal/analyze`)**:
   - Parses raw input / audio transcripts into structured JSON: evocative title, cleaned markdown, mood valence, emotion tags, key events, lessons, and gratitude points.
3. **Task Extraction (`/api/ai/tasks/extract`)**:
   - Scans natural conversation text for actionable commitments, extracting title, deadline, and priority.
4. **Knowledge Retrieval / RAG (`/api/ai/ask-journal`)**:
   - Retrieves user's private journal records and answers inquiries with document citations.
5. **Goal Decomposition (`/api/ai/goals/decompose`)**:
   - Deconstructs long-term aspirations into progressive milestones, daily micro-habits, and potential obstacle mitigations.
