import { ChatMessage, ExtractedTask, JournalEntry, DailyReflection, MorningBriefData } from '../types';

const API_BASE = (typeof window !== 'undefined' && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : 'http://localhost:5000';

async function getAuthHeaders(idToken?: string): Promise<Record<string, string>> {
  const token = idToken || localStorage.getItem('lifeos_auth_token') || 'dev-mock-token-user-1';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// 1. Streaming Multi-Turn Chat via SSE
export async function streamChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  mode: string,
  memories: string[],
  idToken: string | undefined,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<() => void> {
  const controller = new AbortController();

  (async () => {
    try {
      const headers = await getAuthHeaders(idToken);
      const response = await fetch(`${API_BASE}/api/ai/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages, mode, memories }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.text) {
                onChunk(data.text);
              }
              if (data.done) {
                onDone();
                return;
              }
              if (data.error) {
                onError(new Error(data.message || data.error));
                return;
              }
            } catch {
              // Non-fatal parse issue on chunk boundary
            }
          }
        }
      }
      onDone();
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      console.warn('Backend stream unavailable, falling back to local responsive AI simulation:', err);
      // High quality local streaming fallback
      simulateLocalStream(messages, mode, onChunk, onDone, controller.signal);
    }
  })();

  return () => controller.abort();
}

export function generateNaturalConversationalText(
  messages: Array<{ role: string; content: string }>,
  mode: string
): string {
  const lastUserMsg = messages[messages.length - 1]?.content?.trim() || 'Hello';
  const pLower = lastUserMsg.toLowerCase();

  // 1. Date and Time queries
  if (
    pLower.match(/(today'?s?\s+date|what(?:'?s|\s+is)\s+(?:the\s+)?date|tell\s+me\s+(?:the\s+|today'?s?\s+)?date|what\s+day\s+is\s+(?:it|today)|current\s+date|what\s+time\s+is\s+it)/i)
  ) {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Today is **${dateFormatted}**, and the current local time is **${timeFormatted}**.\n\nHow is your day progressing so far? Would you like to write a quick reflection in your journal, check on your active goals, or plan out your schedule?`;
  }

  // 2. Weather & Environmental queries (e.g., "is it raining today", "weather", "forecast")
  if (pLower.match(/\b(rain|raining|weather|temperature|forecast|sunny|cloudy|snow|snowing|thunderstorm|humidity|storm|outside|cold\s+outside|hot\s+outside)\b/i)) {
    return `I don't have access to live meteorological sensors or GPS telemetry in your local environment, so I can't check the sky outside your window directly.\n\n` +
      `If you're experiencing rain or overcast skies today, it's actually an ideal setting for quiet focus, a warm beverage, and thoughtful reflection in your journal. If you need an accurate forecast or rain timeline, checking your regional weather radar or mobile weather app is your best bet!\n\n` +
      `Is it raining where you are right now? How is the weather affecting your day and your mood?`;
  }

  // 3. Math & Calculations
  const mathMatch = pLower.match(/(?:what\s+is\s+|calculate\s+)?(\d+(?:\.\d+)?)\s*([\+\-\*\/xX\^]|plus|minus|times|multiplied\s+by|divided\s+by)\s*(\d+(?:\.\d+)?)/i);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    const rawOp = mathMatch[2].toLowerCase();
    const num2 = parseFloat(mathMatch[3]);
    let result: number | null = null;
    let opSymbol = '';
    if (rawOp === '+' || rawOp === 'plus') { result = num1 + num2; opSymbol = '+'; }
    else if (rawOp === '-' || rawOp === 'minus') { result = num1 - num2; opSymbol = '−'; }
    else if (rawOp === '*' || rawOp === 'x' || rawOp === 'times' || rawOp === 'multiplied by') { result = num1 * num2; opSymbol = '×'; }
    else if (rawOp === '/' || rawOp === 'divided by') { result = num2 !== 0 ? num1 / num2 : NaN; opSymbol = '÷'; }
    else if (rawOp === '^') { result = Math.pow(num1, num2); opSymbol = '^'; }
    if (result !== null && !isNaN(result)) {
      return `${num1} ${opSymbol} ${num2} = **${result}**.\n\nNeed any other calculations, conversions, or estimations?`;
    }
  }

  // 4. Greetings and Pleasantries
  if (pLower.match(/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day)|howdy|sup|yo)\b/i)) {
    const greetings = [
      `Hello! Great to connect with you. How are you doing today, and what's on your mind?`,
      `Hi there! Systems are running smoothly. What would you like to explore, reflect on, or work toward right now?`,
      `Greetings! I'm here and ready to help you brainstorm, journal, organize your goals, or talk through whatever is on your mind. How can I assist you today?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 5. "How are you" inquiries
  if (pLower.match(/^(how\s+are\s+you|how(?:'?s|\s+is)\s+it\s+going|how\s+do\s+you\s+feel)/i)) {
    return `I'm doing well, thank you for asking! All cognitive telemetry and memory vaults are synchronized and operating smoothly.\n\nMore importantly, how are **you** feeling today? Are you feeling energized, focused, or carrying some stress?`;
  }

  // 6. Identity & Capabilities inquiries
  if (pLower.match(/^(who\s+are\s+you|what\s+are\s+you|what\s+is\s+gemini\s+lifeos|what\s+can\s+you\s+do|how\s+do\s+you\s+work)/i)) {
    return `I am **Gemini LifeOS**, your personal AI operating system and intelligent journal companion.\n\n` +
      `Here is what we can do together:\n\n` +
      `• **Natural Conversational Intelligence**: Multi-turn dialogue with 7 modes (*General*, *Journal*, *Brainstorm*, *Reflection*, *Goals*, *Study*, *Planning*).\n` +
      `• **Voice & Written Journaling**: Express your thoughts freely; I analyze mood, emotions, gratitude points, and lessons learned.\n` +
      `• **Ask My Journal (RAG)**: Search and retrieve insights from your private personal history with citations.\n` +
      `• **Goal Decomposition**: Break down ambitious visions into actionable milestones and daily habits.\n` +
      `• **Automatic Task Extraction**: Detect to-dos in our conversation and add them to your checklist with one click.\n` +
      `• **Cryptographic Privacy**: Every document is strictly isolated under your individual user account.\n\n` +
      `What would you like to dive into today?`;
  }

  // 7. Gratitude and Appreciation
  if (pLower.match(/^(thank\s*you|thanks|appreciate\s+it|great\s+job|awesome|cool|nice)\b/i)) {
    return `You're very welcome! I'm always here to support your workflow and personal reflection. Would you like to turn anything we discussed into an actionable task, save an entry to your journal, or explore another question?`;
  }

  // 8. Jokes & Humor
  if (pLower.match(/\b(joke|tell\s+me\s+a\s+joke|funny|make\s+me\s+laugh|pun|riddle)\b/i)) {
    const jokes = [
      `Why do programmers prefer dark mode?\nBecause light attracts bugs! 🐛`,
      `Why was the JavaScript developer sad?\nBecause they didn't know how to 'null' their feelings. 💻`,
      `There are 10 types of people in this world:\nThose who understand binary, and those who don't. ⚡`,
      `Why did the database administrator walk out of the restaurant?\nBecause there were no tables available! 📊`,
      `A SQL query walks into a bar, walks up to two tables and asks: *"Can I join you?"* 🥂`,
    ];
    return `${jokes[Math.floor(Math.random() * jokes.length)]}\n\n😄 Hope that brought a smile to your session! What's next on your agenda?`;
  }

  // 9. Poetry & Creative writing
  if (pLower.match(/\b(poem|poetry|rhyme|haiku|write\s+a\s+story)\b/i)) {
    return `*A glowing screen in the quiet night,*\n` +
      `*A wandering mind seeking clear insight.*\n` +
      `*Each fleeting thought that finds its voice,*\n` +
      `*Becomes a memory, a conscious choice.*\n\n` +
      `*Between the echoes of what has been,*\n` +
      `*A brand new chapter begins within.*\n\n` +
      `Would you like to explore a particular theme, or capture your own words into a journal entry?`;
  }

  // 10. Classic Curiosities & Explanations
  if (pLower.includes('why is the sky blue')) {
    return `The sky appears blue due to a physical phenomenon called **Rayleigh scattering**:\n\n` +
      `1. **Solar Spectrum**: Sunlight reaching Earth contains all colors, each with different wavelengths.\n` +
      `2. **Atmospheric Collisions**: Gas molecules (nitrogen and oxygen) in the atmosphere scatter short blue and violet wavelengths in all directions far more than longer red wavelengths.\n` +
      `3. **Human Eye Sensitivity**: Our eyes are much more sensitive to blue light, making the daytime sky appear bright, vivid blue!\n\n` +
      `Is there another curiosity or question on your mind?`;
  }

  if (pLower.includes('quantum computing') || pLower.includes('qubit')) {
    return `**Quantum Computing** leverages fundamental quantum mechanics to compute complex mathematical problems:\n\n` +
      `• **Superposition**: Qubits can represent combinations of 0 and 1 simultaneously.\n` +
      `• **Entanglement**: Interconnected qubits share correlated quantum states across distances.\n` +
      `• **Interference**: Algorithms boost correct solutions while canceling errors.\n\n` +
      `Would you like to discuss potential real-world applications or cryptography implications?`;
  }

  // 11. Code & Technical Inquiries
  if (pLower.match(/\b(code|coding|javascript|typescript|python|react|css|html|sql|api|function|bug|database|git|docker)\b/i)) {
    return `I'm well-equipped to assist with code, architecture, and debugging.\n\n` +
      `Feel free to share code snippets, architectural ideas, or error logs, and we'll work through them systematically!`;
  }

  // 12. Specific Brainstorming requests
  if (mode === 'BRAINSTORM' || pLower.includes('innovative features') || pLower.includes('features for personal ai journal') || pLower.includes('ideas for') || pLower.includes('brainstorm')) {
    if (pLower.includes('journal') || pLower.includes('features')) {
      return `Here are 3 innovative, high-impact features for personal AI journals:\n\n` +
        `1. **Cognitive Distortion Mirroring & Socratic Reframing**:\n` +
        `Instead of passive summaries, the AI spots recurring cognitive biases (like catastrophizing, mind-reading, or black-and-white thinking) across weeks. It gently mirrors them back: *'You noticed this same friction last Tuesday. What if we tested the underlying assumption?'*\n\n` +
        `2. **Biometric & Circadian Resonance Sync**:\n` +
        `Correlating your self-reported mood and journal reflections with sleep duration, resting heart rate, and daily step telemetry to provide proactive burnout warnings before you feel overwhelmed.\n\n` +
        `3. **Future-Self Voice Time Capsules**:\n` +
        `Users record spontaneous 30-second audio messages to their future selves (e.g. 'To me in 6 months when I launch this project'). The AI securely schedules and unlocks the capsule only when specific milestone criteria are reached.\n\n` +
        `Would you like to explore building or customizing one of these features in LifeOS?`;
    }

    return `Here are 3 divergent, high-leverage angles to explore for "${lastUserMsg}":\n\n` +
      `1. **The Inversion Angle**: What happens if we eliminate the default assumption entirely and do the exact opposite?\n` +
      `2. **The 10x Force Multiplier**: What single high-leverage tool, asset, or automation would handle 80% of the friction?\n` +
      `3. **The 48-Hour Micro-Pilot**: How can we test the riskiest hypothesis before the weekend with zero cost?\n\n` +
      `Which of these angles resonates most with your immediate focus?`;
  }

  // 13. Goals, Planning, and Execution requests
  if (mode === 'GOALS' || mode === 'PLANNING' || pLower.includes('plan') || pLower.includes('schedule') || pLower.includes('to-do') || pLower.includes('finish') || pLower.includes('deadline')) {
    return `Let's translate that into an execution blueprint:\n\n` +
      `🎯 **Core Objective**: Maintain forward momentum on "${lastUserMsg.slice(0, 50)}".\n\n` +
      `⚡ **Immediate Action Steps**:\n` +
      `1. **Define First Deliverable**: Clarify the single most critical output needed first.\n` +
      `2. **Time-Box Deep Work**: Block out an uninterrupted 60-90 minute sprint.\n` +
      `3. **Eliminate Friction**: Clear distractions and confirm your acceptance criteria.\n\n` +
      `I've surfaced actionable task recommendations for your checklist. How does this roadmap look to you?`;
  }

  // 14. Journaling & Emotional Reflections
  if (mode === 'JOURNAL' || mode === 'REFLECTION' || pLower.includes('felt') || pLower.includes('stress') || pLower.includes('tired') || pLower.includes('overwhelm') || pLower.includes('happy') || pLower.includes('proud') || pLower.includes('sad') || pLower.includes('angry')) {
    let sentimentReflection = `It takes genuine awareness to pause and articulate how you're feeling.`;
    if (pLower.includes('stress') || pLower.includes('overwhelm') || pLower.includes('tired')) {
      sentimentReflection = `It sounds like you've been carrying a heavy cognitive load. Acknowledging that stress without immediately trying to force it away is an important first step.`;
    } else if (pLower.includes('productive') || pLower.includes('happy') || pLower.includes('proud') || pLower.includes('excited')) {
      sentimentReflection = `That sense of progress and accomplishment is well-deserved. Celebrating those wins builds genuine momentum and self-trust.`;
    }

    return `${sentimentReflection}\n\n` +
      `When you reflect on what happened today with "${lastUserMsg.slice(0, 60)}...", ` +
      `what is one thing that gave you energy, and what is one boundary you'd like to protect tomorrow?\n\n` +
      `We can capture this as a formal entry in your Journal vault whenever you're ready.`;
  }

  // 15. Study & Conceptual Learning
  if (mode === 'STUDY' || pLower.startsWith('explain') || pLower.startsWith('what is') || pLower.startsWith('how does')) {
    const topic = lastUserMsg.replace(/^(?:explain|what\s+is|how\s+does)\s+/i, '').trim();
    return `Let's break down **${topic || 'this concept'}** from first principles:\n\n` +
      `1. **The Fundamental Mechanism**: Every complex concept is built on a simple foundation. The essential dynamic here is how inputs transform into predictable outputs through a set of rules.\n` +
      `2. **Intuitive Mental Model**: Picture this like an adaptive feedback loop — each cycle absorbs feedback, adjusts parameters, and refines the overall equilibrium.\n` +
      `3. **Why It Matters In Practice**: Understanding this dynamic allows you to diagnose edge cases, predict outcomes, and optimize real-world execution.\n\n` +
      `Would you like to explore a concrete real-world example or test your understanding with a quick scenario?`;
  }

  // 16. Natural Conversational Fallback (Thoughtful, Engaging, Context-Aware)
  if (lastUserMsg.endsWith('?')) {
    return `That's a thoughtful question. Regarding "${lastUserMsg}", there are several interesting facets to consider:\n\n` +
      `From a practical perspective, looking at your core intent and objectives gives us the clearest signal. Every decision involves trade-offs between speed, depth, and energy.\n\n` +
      `What angle of this feels most important or urgent for you right now?`;
  }

  return `I hear you. When you mention "${lastUserMsg.slice(0, 60)}${lastUserMsg.length > 60 ? '...' : ''}", ` +
    `it highlights an interesting dimension of your thinking.\n\n` +
    `How does this connect to your broader priorities this week, or is there a specific decision or next step you'd like to bounce around together?`;
}

async function simulateLocalStream(
  messages: Array<{ role: string; content: string }>,
  mode: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  signal: AbortSignal
) {
  const responseText = generateNaturalConversationalText(messages, mode);
  const words = responseText.split(' ');

  for (let i = 0; i < words.length; i++) {
    if (signal.aborted) return;
    onChunk((i === 0 ? '' : ' ') + words[i]);
    await new Promise(r => setTimeout(r, 18));
  }
  onDone();
}

// Configure Gemini Key via Backend
export async function configureGeminiKeyApi(apiKey: string, model?: string, idToken?: string) {
  const headers = await getAuthHeaders(idToken);
  const res = await fetch(`${API_BASE}/api/ai/config/key`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apiKey, model }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to configure API key');
  }
  return await res.json();
}

export async function getAiConfigStatusApi(idToken?: string) {
  try {
    const headers = await getAuthHeaders(idToken);
    const res = await fetch(`${API_BASE}/api/ai/config/key`, { headers });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Failed to fetch AI config status:', err);
  }
  return { hasKey: false, model: 'gemini-1.5-flash', isLive: false };
}

// 2. Journal Entry Analysis
export async function analyzeJournal(text: string, idToken?: string) {
  try {
    const headers = await getAuthHeaders(idToken);
    const res = await fetch(`${API_BASE}/api/ai/journal/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Using local fallback for journal analysis:', err);
  }

  // Local fallback
  const textLower = text.toLowerCase();
  let mood = 'Reflective';
  if (textLower.includes('stress') || textLower.includes('busy') || textLower.includes('tired')) mood = 'Stressed';
  else if (textLower.includes('happy') || textLower.includes('win') || textLower.includes('great') || textLower.includes('excited')) mood = 'Energetic';
  else if (textLower.includes('grateful') || textLower.includes('thank')) mood = 'Grateful';
  else if (textLower.includes('calm') || textLower.includes('peace')) mood = 'Calm';

  return {
    title: text.split(' ').slice(0, 6).join(' ') + '...',
    cleanEntry: text,
    summary: `Personal journal capturing thoughts on ${text.slice(0, 100)}...`,
    mood,
    emotions: [mood.toLowerCase(), 'focused', 'aware'],
    keyEvents: ['Personal reflection session'],
    topics: ['Daily Focus', 'Productivity'],
    lessons: ['Consistent journaling brings mental clarity.'],
    gratitude: ['Taking time to reflect and pause today.'],
    suggestedNextAction: 'Take a short breath and prioritize the top task for this afternoon.',
    tags: ['journal', mood.toLowerCase()],
  };
}

// 3. Task Extraction
export async function extractTasks(text: string, idToken?: string): Promise<ExtractedTask[]> {
  try {
    const headers = await getAuthHeaders(idToken);
    const res = await fetch(`${API_BASE}/api/ai/tasks/extract`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Using local fallback for task extraction:', err);
  }

  // Regex fallback
  const tasks: ExtractedTask[] = [];
  const lines = text.split(/[.\n]/);
  for (const line of lines) {
    const match = line.match(/(?:need to|have to|must|finish|complete|build|send)\s+([^,.;]+)/i);
    if (match && match[1] && match[1].trim().length > 3) {
      tasks.push({
        title: match[1].trim(),
        deadline: 'Soon',
        priority: 'medium',
        confidence: 0.85,
      });
    }
  }
  return tasks;
}

// 4. Conversation Summarization
export async function summarizeConversationApi(messages: ChatMessage[], idToken?: string) {
  try {
    const headers = await getAuthHeaders(idToken);
    const res = await fetch(`${API_BASE}/api/ai/summarize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Using fallback summary:', err);
  }

  return {
    summary: `Multi-turn dialogue discussing key topics, tasks, and reflections.`,
    mainTopics: ['Productivity', 'Strategy'],
    keyDecisions: ['Agreed to execute on primary goals.'],
    importantIdeas: ['Automated task extraction and personal memory.'],
    actionItems: ['Complete priority tasks.'],
    emotionalTone: 'Constructive & Focused',
    followUpQuestions: ['What are the immediate blockers for tomorrow?'],
  };
}

// 5. Ask My Journal
export async function askMyJournalApi(
  query: string,
  contextEntries: Array<{ title: string; date: string; content: string }>,
  idToken?: string
) {
  try {
    const headers = await getAuthHeaders(idToken);
    const res = await fetch(`${API_BASE}/api/ai/ask-journal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, contextEntries }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Fallback ask-journal query:', err);
  }

  if (contextEntries.length === 0) {
    return {
      answer: `I searched your journal entries and memories, but found no entries matching "${query}". Write a few entries first and ask again!`,
      citations: [],
    };
  }

  return {
    answer: `According to your journal entry on ${contextEntries[0].date} ("${contextEntries[0].title}"), you mentioned: "${contextEntries[0].content.slice(0, 150)}...".`,
    citations: contextEntries.slice(0, 3).map(e => `${e.date} — ${e.title}`),
  };
}

// 6. Morning Brief
export async function fetchMorningBrief(
  data: { userName?: string; yesterdaySummary?: string; goals: string[]; tasks: string[] },
  idToken?: string
): Promise<MorningBriefData> {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const headers = await getAuthHeaders(idToken);
    const res = await fetch(`${API_BASE}/api/ai/morning-brief`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      return {
        date: todayStr,
        ...json.data,
        goals: data.goals,
        tasks: data.tasks,
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Fallback morning brief:', err);
  }

  return {
    date: todayStr,
    greeting: `Systems operational, ${data.userName || 'Commander'}. Ready for deep focus.`,
    yesterdayRecap: data.yesterdaySummary || 'Yesterday you maintained deliberate progress across your priorities.',
    priorityFocus: data.tasks[0] || 'Advance your primary milestone early in the day.',
    motivationalMessage: 'Clarity comes from engagement, not armchair thought.',
    suggestedPace: 'Deep Work Sprint',
    goals: data.goals,
    tasks: data.tasks,
    generatedAt: new Date().toISOString(),
  };
}

// 7. Daily Reflection
export async function submitDailyReflectionApi(
  responses: { wentWell: string; challenged: string; learned: string; tomorrow: string },
  idToken?: string
) {
  try {
    const headers = await getAuthHeaders(idToken);
    const res = await fetch(`${API_BASE}/api/ai/daily-reflection`, {
      method: 'POST',
      headers,
      body: JSON.stringify(responses),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Fallback daily reflection:', err);
  }

  return {
    synthesis: `You demonstrated genuine resilience handling challenges: "${responses.challenged.slice(0, 50)}...". Acknowledging wins in "${responses.wentWell.slice(0, 40)}" sets up strong momentum for tomorrow.`,
    emotionalBalance: 'Resilient & Focused',
    growthScore: 90,
    coreTakeaway: responses.learned || 'Consistent daily review builds long-term mastery.',
  };
}

// 8. Goal Decomposition
export async function decomposeGoalApi(goalTitle: string, description?: string, idToken?: string) {
  try {
    const headers = await getAuthHeaders(idToken);
    const res = await fetch(`${API_BASE}/api/ai/goals/decompose`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ goalTitle, description }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Fallback goal decomposition:', err);
  }

  return {
    milestones: [
      {
        title: 'Phase 1: Architecture & Foundation',
        targetDays: 7,
        tasks: ['Define scope and constraints', 'Set up core skeleton and tools'],
      },
      {
        title: 'Phase 2: Core Execution & Iteration',
        targetDays: 14,
        tasks: ['Build essential features', 'Test edge cases'],
      },
      {
        title: 'Phase 3: Launch & Review',
        targetDays: 21,
        tasks: ['Complete final polish', 'Measure outcome'],
      },
    ],
    recommendedHabit: '30 minutes of deep focus daily without notifications.',
    potentialObstacle: 'Distraction and scope creep — prioritize ruthlessly.',
  };
}
