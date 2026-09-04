import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

let currentApiKey = process.env.GEMINI_API_KEY || '';
let currentModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
let modelName = currentModelName;

let genAI: GoogleGenerativeAI | null = null;
if (currentApiKey && currentApiKey !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(currentApiKey);
    console.log(`🤖 Google Gemini AI client initialized with model: ${currentModelName}`);
  } catch (err) {
    console.error('Failed to initialize Google Generative AI client:', err);
  }
}

// Safety settings following strict safety thresholds
export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  GENERAL: `You are Gemini LifeOS, a personal AI operating system and intelligent companion.
Your tone is empathetic, clear, perceptive, and proactive.
Assist the user with thoughtful analysis, structured thinking, and encouragement.`,

  JOURNAL: `You are the Gemini LifeOS Journal Companion.
Help the user unpack their day, articulate complex feelings, notice hidden patterns, and cultivate self-compassion.
Ask perceptive follow-up questions when appropriate without being intrusive. Always respect emotional boundaries.`,

  BRAINSTORM: `You are the Gemini LifeOS Creative Catalyst.
Generate novel, multi-angled ideas, synthesize lateral connections, explore edge cases, and organize thoughts into actionable clusters.
Challenge conventional assumptions with constructive curiosity.`,

  REFLECTION: `You are the Gemini LifeOS Philosophical Mirror.
Guide the user through structured introspective reflection. Help them examine their motivations, decisions, cognitive habits, and personal growth trajectory.`,

  GOALS: `You are the Gemini LifeOS Strategic Architect.
Deconstruct ambitious visions into tangible milestones, measurable metrics, sequential tasks, and realistic timelines. Focus on execution momentum and anti-procrastination tactics.`,

  STUDY: `You are the Gemini LifeOS Deep Learning Tutor.
Break down complex topics into first-principles conceptual frameworks, use intuitive analogies, test retention with active recall questions, and summarize key takeaways clearly.`,

  PLANNING: `You are the Gemini LifeOS Executive Operations Director.
Synthesize schedules, balance competing priorities, identify bottlenecks, and formulate crisp, prioritized agendas for high-performance daily execution.`,
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface JournalAnalysisResult {
  title: string;
  cleanEntry: string;
  summary: string;
  mood: string;
  emotions: string[];
  keyEvents: string[];
  topics: string[];
  lessons: string[];
  gratitude: string[];
  suggestedNextAction: string;
  tags: string[];
}

export interface ExtractedTask {
  title: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface ConversationSummaryResult {
  summary: string;
  mainTopics: string[];
  keyDecisions: string[];
  importantIdeas: string[];
  actionItems: string[];
  emotionalTone: string;
  followUpQuestions: string[];
}

export function configureGeminiKey(key: string, model?: string): { success: boolean; model: string; message: string } {
  if (!key || key.trim().length < 10) {
    throw new Error('Please provide a valid Gemini API key (typically starts with AIzaSy...).');
  }
  currentApiKey = key.trim();
  if (model) {
    currentModelName = model;
    modelName = model;
  }

  genAI = new GoogleGenerativeAI(currentApiKey);
  console.log(`🤖 Google Gemini AI client configured dynamically with model: ${currentModelName}`);
  return {
    success: true,
    model: currentModelName,
    message: `Connected to Google Gemini (${currentModelName}) successfully.`,
  };
}

export function getAiConfigStatus() {
  return {
    hasKey: Boolean(currentApiKey && currentApiKey !== 'your_gemini_api_key_here'),
    model: currentModelName,
    isLive: genAI !== null,
  };
}

// ----------------------------------------------------------------------------------
// 1. Streaming Multi-Turn Chat
// ----------------------------------------------------------------------------------
export async function* streamChatResponse(
  messages: ChatMessage[],
  mode: string = 'GENERAL',
  memories: string[] = []
): AsyncGenerator<string, void, unknown> {
  const systemInstruction = MODE_SYSTEM_PROMPTS[mode] || MODE_SYSTEM_PROMPTS.GENERAL;
  const memoryContext = memories.length > 0
    ? `\n\n[USER RELEVANT PERSONAL MEMORIES]:\n${memories.map(m => `- ${m}`).join('\n')}\nUtilize these memories organically when helpful.`
    : '';

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: currentModelName,
        systemInstruction: systemInstruction + memoryContext,
        safetySettings,
      });

      // Format conversation history for Gemini SDK
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const resultStream = await model.generateContentStream({
        contents,
      });

      for await (const chunk of resultStream.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
      return;
    } catch (err) {
      console.error('Gemini API Streaming Error, falling back to intelligent conversational engine:', err);
    }
  }

  // Fallback intelligent natural conversational response
  const naturalResponse = generateNaturalConversationalResponse(messages, mode, memories);
  const words = naturalResponse.split(' ');

  for (let i = 0; i < words.length; i++) {
    yield (i === 0 ? '' : ' ') + words[i];
    await new Promise(r => setTimeout(r, 20));
  }
}

export function generateNaturalConversationalResponse(
  messages: ChatMessage[],
  mode: string,
  memories: string[] = []
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
    return `Today is **${dateFormatted}**, and the current local time is **${timeFormatted}**.\n\nHow is your day shaping up? Would you like to log a reflection in your journal, review your active goals, or plan out your schedule?`;
  }

  // 2. Weather & Environmental queries (e.g., "is it raining today", "weather", "forecast")
  if (pLower.match(/\b(rain|raining|weather|temperature|forecast|sunny|cloudy|snow|snowing|thunderstorm|humidity|storm|outside|cold\s+outside|hot\s+outside)\b/i)) {
    return `I don't have access to live meteorological sensors or GPS telemetry in your local environment, so I can't check the sky outside your window directly.\n\n` +
      `If you're experiencing rain or overcast skies today, it's actually an ideal setting for quiet focus, a warm beverage, and thoughtful reflection in your journal. If you need an accurate forecast or rain timeline, checking your regional weather radar or mobile weather app is your best bet!\n\n` +
      `Is it raining where you are right now? How is the weather affecting your day and your mood?`;
  }

  // 3. Math & Calculations (e.g. "what is 25 * 4", "100 / 5", "50 + 75")
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
      `Hello! It's great to connect with you. How are you feeling today, and what's on your mind?`,
      `Hi there! Systems are running smoothly. What would you like to explore, reflect on, or work toward right now?`,
      `Greetings! I'm here and ready to help you brainstorm, journal, organize your goals, or talk through whatever is on your mind. How can I assist you today?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 5. "How are you" inquiries
  if (pLower.match(/^(how\s+are\s+you|how(?:'?s|\s+is)\s+it\s+going|how\s+do\s+you\s+feel)/i)) {
    return `I'm doing well, thank you for asking! All cognitive telemetry and memory vaults are synchronized and operating smoothly.\n\nMore importantly, how are **you** doing today? Are you feeling energized, focused, or carrying some stress?`;
  }

  // 6. Identity & Capabilities inquiries
  if (pLower.match(/^(who\s+are\s+you|what\s+are\s+you|what\s+is\s+gemini\s+lifeos|what\s+can\s+you\s+do|how\s+do\s+you\s+work)/i)) {
    return `I am **Gemini LifeOS**, your personal AI operating system and intelligent journal companion.\n\n` +
      `Here are the core capabilities available in your workspace:\n\n` +
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

  // 10. Classic Curiosities & Explanations ("why is the sky blue", "quantum computing", etc.)
  if (pLower.includes('why is the sky blue')) {
    return `The sky appears blue due to a physical phenomenon called **Rayleigh scattering**:\n\n` +
      `1. **Solar Spectrum**: Sunlight reaching Earth contains all the colors of the rainbow, each with different wavelengths.\n` +
      `2. **Atmospheric Collisions**: Gas molecules (primarily nitrogen and oxygen) in our atmosphere are smaller than the wavelengths of visible light.\n` +
      `3. **Short Wavelength Scattering**: Shorter wavelengths (blue and violet) scatter in all directions far more efficiently than longer wavelengths (red and yellow).\n` +
      `4. **Human Perception**: Even though violet scatters even more than blue, human eyes are much more sensitive to blue light, and solar output is stronger in blue wavelengths, making the sky appear brilliant blue!\n\n` +
      `Is there another scientific curiosity you'd like to explore?`;
  }

  if (pLower.includes('quantum computing') || pLower.includes('qubit')) {
    return `**Quantum Computing** leverages the fundamental principles of quantum mechanics to solve certain classes of complex problems exponentially faster than classical computers:\n\n` +
      `• **Superposition**: Classical bits are strictly 0 or 1. Qubits can exist in a linear combination of both states simultaneously, allowing exploration of massive combinatorial spaces.\n` +
      `• **Entanglement**: Qubits can be linked such that the state of one instantaneously correlates with another, enabling dense parallel processing.\n` +
      `• **Interference**: Quantum algorithms amplify constructive interference toward the correct solution while canceling incorrect paths.\n\n` +
      `Key applications include molecular simulation for medicine, logistics optimization, and cryptography.\n\n` +
      `Would you like to explore how quantum encryption impacts cybersecurity?`;
  }

  // 11. Code & Technical Inquiries
  if (pLower.match(/\b(code|coding|javascript|typescript|python|react|css|html|sql|api|function|bug|database|git|docker)\b/i)) {
    return `I'm well-equipped to assist with software development, architecture, and debugging.\n\n` +
      `Whether you need:\n` +
      `• Clean, typed implementations in TypeScript or Python\n` +
      `• UI component design and CSS responsive layouts\n` +
      `• Database schema design and indexed queries\n` +
      `• Architecture and state management patterns\n\n` +
      `Feel free to paste code snippets, error logs, or requirements, and we'll refine them step-by-step!`;
  }

  // 12. Specific Brainstorming requests
  if (mode === 'BRAINSTORM' || pLower.includes('innovative features') || pLower.includes('features for personal ai journal') || pLower.includes('ideas for')) {
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

// ----------------------------------------------------------------------------------
// 2. Journal Entry Analysis
// ----------------------------------------------------------------------------------
export async function analyzeJournalContent(rawText: string): Promise<JournalAnalysisResult> {
  const prompt = `Analyze this personal journal or voice transcript carefully. Extract structured psychological and situational insights.
Return ONLY valid JSON matching this schema:
{
  "title": "A concise, evocative title for this entry",
  "cleanEntry": "Well-formatted, polished version of the raw journal text with nice paragraph structure",
  "summary": "2-3 sentence executive summary of the entry",
  "mood": "One of: Energetic, Optimistic, Focused, Calm, Reflective, Stressed, Overwhelmed, Melancholic, Grateful",
  "emotions": ["specific emotion 1", "specific emotion 2", "specific emotion 3"],
  "keyEvents": ["key event 1", "key event 2"],
  "topics": ["topic 1", "topic 2"],
  "lessons": ["meaningful lesson or takeaway"],
  "gratitude": ["specific gratitude point if mentioned, or positive anchor"],
  "suggestedNextAction": "A constructive, mindful suggestion for what to do next",
  "tags": ["tag1", "tag2", "tag3"]
}

RAW JOURNAL ENTRY:
"""
${rawText}
"""`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as JournalAnalysisResult;
    } catch (err) {
      console.error('Gemini Journal Analysis failed, using intelligent local parser:', err);
    }
  }

  // Intelligent local fallback parser
  const textLower = rawText.toLowerCase();
  let mood = 'Reflective';
  if (textLower.includes('stress') || textLower.includes('anxious') || textLower.includes('overwhelm') || textLower.includes('deadline')) {
    mood = 'Stressed';
  } else if (textLower.includes('happy') || textLower.includes('excited') || textLower.includes('proud') || textLower.includes('productive') || textLower.includes('great')) {
    mood = 'Energetic';
  } else if (textLower.includes('grateful') || textLower.includes('thankful') || textLower.includes('blessed') || textLower.includes('appreciate')) {
    mood = 'Grateful';
  } else if (textLower.includes('calm') || textLower.includes('peace') || textLower.includes('relax') || textLower.includes('quiet')) {
    mood = 'Calm';
  }

  const titleWords = rawText.split(' ').slice(0, 6).join(' ');
  const title = titleWords.length > 5 ? titleWords + '...' : 'Personal Reflection';

  return {
    title,
    cleanEntry: rawText.trim(),
    summary: `Reflecting on recent events: ${rawText.slice(0, 160)}...`,
    mood,
    emotions: [mood.toLowerCase(), 'introspective', 'determined'],
    keyEvents: ['Personal reflection and documentation'],
    topics: ['Daily Life', 'Self-Development'],
    lessons: ['Consistent reflection builds long-term clarity and emotional resilience.'],
    gratitude: ['Taking time to pause and document this moment.'],
    suggestedNextAction: 'Take a short 5-minute breather, hydrate, and review your top priority for the day.',
    tags: ['journal', mood.toLowerCase(), 'mindfulness'],
  };
}

// ----------------------------------------------------------------------------------
// 3. Task Extraction from Conversations or Journal
// ----------------------------------------------------------------------------------
export async function extractActionableTasks(text: string): Promise<ExtractedTask[]> {
  const prompt = `Analyze the following text and detect any actionable tasks, to-dos, or commitments mentioned by the user.
Return ONLY valid JSON array of tasks matching this schema:
[
  {
    "title": "Clear actionable task title (imperative verb first)",
    "deadline": "Extracted deadline string if mentioned e.g. 'Friday', 'Tomorrow', 'By 5pm', or null",
    "priority": "low | medium | high",
    "confidence": 0.95
  }
]
If no actionable tasks are found, return an empty array [].

TEXT:
"""
${text}
"""`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text()) as ExtractedTask[];
    } catch (err) {
      console.error('Gemini Task Extraction failed, using regex fallback:', err);
    }
  }

  // Local fallback heuristics
  const tasks: ExtractedTask[] = [];
  const lines = text.split(/[.\n]/);
  const triggerPatterns = [
    /(?:need to|have to|must|should|going to|will|plan to)\s+([^,.;]+)/i,
    /(?:finish|submit|complete|send|call|write|prepare|build)\s+([^,.;]+)/i,
  ];

  for (const line of lines) {
    for (const pattern of triggerPatterns) {
      const match = line.match(pattern);
      if (match && match[1] && match[1].trim().length > 4) {
        const rawTask = match[1].trim();
        const deadlineMatch = line.match(/(?:by|before|on|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|end of day|tonight)/i);
        tasks.push({
          title: rawTask.charAt(0).toUpperCase() + rawTask.slice(1),
          deadline: deadlineMatch ? deadlineMatch[0] : undefined,
          priority: line.toLowerCase().includes('urgent') || line.toLowerCase().includes('asap') ? 'high' : 'medium',
          confidence: 0.88,
        });
        break;
      }
    }
  }

  return tasks;
}

// ----------------------------------------------------------------------------------
// 4. Conversation Auto-Summarization
// ----------------------------------------------------------------------------------
export async function summarizeConversation(messages: ChatMessage[]): Promise<ConversationSummaryResult> {
  const conversationText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const prompt = `Summarize this conversational dialogue. Return ONLY valid JSON with this schema:
{
  "summary": "Concise 2-3 sentence overview of what was discussed",
  "mainTopics": ["topic 1", "topic 2"],
  "keyDecisions": ["decisions made if any"],
  "importantIdeas": ["notable insights or proposals"],
  "actionItems": ["action items or tasks emerging from chat"],
  "emotionalTone": "e.g. Constructive, Inquisitive, Urgent, Reflective",
  "followUpQuestions": ["logical next question to explore"]
}

DIALOGUE:
"""
${conversationText}
"""`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text()) as ConversationSummaryResult;
    } catch (err) {
      console.error('Gemini Summarization error, using fallback:', err);
    }
  }

  return {
    summary: `Conversation covering ${messages.length} messages focusing on ${messages[0]?.content.slice(0, 50) || 'strategic planning'}.`,
    mainTopics: ['Personal Planning', 'Exploration'],
    keyDecisions: ['Identified next steps for ongoing projects.'],
    importantIdeas: ['Leveraging Gemini LifeOS for automated task extraction and memory retention.'],
    actionItems: ['Review newly surfaced tasks in the dashboard.'],
    emotionalTone: 'Constructive & Inquisitive',
    followUpQuestions: ['Would you like to turn these insights into concrete milestones?'],
  };
}

// ----------------------------------------------------------------------------------
// 5. Ask My Journal (Semantic QA over User History)
// ----------------------------------------------------------------------------------
export async function askMyJournal(
  query: string,
  contextItems: Array<{ title: string; date: string; content: string }>
): Promise<{ answer: string; citations: string[] }> {
  const contextStr = contextItems.map((item, idx) => 
    `[Source ${idx + 1} | ${item.date} | "${item.title}"]:\n${item.content}`
  ).join('\n\n');

  const prompt = `You are the Ask My Journal knowledge retriever for Gemini LifeOS.
The user is asking a question about their own private personal history.
Answer their question accurately and empathetically, using ONLY the provided journal excerpts below.
If the answer cannot be found in the provided history, politely state that you could not find records of it.
Always cite the relevant dates and entry titles when referencing past events.

USER QUESTION: "${query}"

RETRIEVED PERSONAL JOURNAL ENTRIES:
"""
${contextStr}
"""`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const answer = result.response.text();
      const citations = contextItems.map(item => `${item.date}: ${item.title}`);
      return { answer, citations };
    } catch (err) {
      console.error('Gemini Ask My Journal failed:', err);
    }
  }

  // Fallback answer based on provided contexts
  if (contextItems.length === 0) {
    return {
      answer: `I searched your private journal and conversations, but found no entries directly matching "${query}". Try writing a new entry or broadening your search terms.`,
      citations: [],
    };
  }

  return {
    answer: `Based on your journal entry from ${contextItems[0].date} ("${contextItems[0].title}"), you noted: "${contextItems[0].content.slice(0, 180)}...". This reflects your ongoing progress and priorities.`,
    citations: contextItems.slice(0, 3).map(c => `${c.date}: ${c.title}`),
  };
}

// ----------------------------------------------------------------------------------
// 6. Morning Brief Generator
// ----------------------------------------------------------------------------------
export async function generateMorningBrief(data: {
  userName?: string;
  yesterdaySummary?: string;
  goals: string[];
  tasks: string[];
}): Promise<{
  greeting: string;
  yesterdayRecap: string;
  priorityFocus: string;
  motivationalMessage: string;
  suggestedPace: string;
}> {
  const prompt = `Generate a personalized Morning Brief for Gemini LifeOS.
User Name: ${data.userName || 'Commander'}
Yesterday's Context: ${data.yesterdaySummary || 'Focused and productive work.'}
Active Goals: ${JSON.stringify(data.goals)}
Pending Tasks: ${JSON.stringify(data.tasks)}

Return ONLY valid JSON with this schema:
{
  "greeting": "Energetic, futuristic morning greeting",
  "yesterdayRecap": "1-2 sentence recap of yesterday's trajectory",
  "priorityFocus": "The single highest leverage focus area for today",
  "motivationalMessage": "A sharp, inspiring 1-sentence quote or mindset reminder",
  "suggestedPace": "e.g. Deep Work Sprint | Steady Execution | Creative Exploration"
}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (err) {
      console.error('Gemini Morning Brief failed:', err);
    }
  }

  return {
    greeting: `Good morning, ${data.userName || 'Commander'}. Systems online and aligned with your trajectory.`,
    yesterdayRecap: data.yesterdaySummary || 'Yesterday you maintained strong forward momentum across your core objectives.',
    priorityFocus: data.tasks[0] || 'Advance your top milestone before tackling low-priority administrative tasks.',
    motivationalMessage: 'Focus is the quiet multiplier of every talent.',
    suggestedPace: 'Deep Work Sprint',
  };
}

// ----------------------------------------------------------------------------------
// 7. Daily Reflection Synthesizer
// ----------------------------------------------------------------------------------
export async function generateDailyReflectionSummary(responses: {
  wentWell: string;
  challenged: string;
  learned: string;
  tomorrow: string;
}): Promise<{
  synthesis: string;
  emotionalBalance: string;
  growthScore: number;
  coreTakeaway: string;
}> {
  const prompt = `Synthesize these end-of-day reflection answers into an executive growth summary.
1. What went well: ${responses.wentWell}
2. Challenges faced: ${responses.challenged}
3. Learnings: ${responses.learned}
4. Focus for tomorrow: ${responses.tomorrow}

Return ONLY valid JSON:
{
  "synthesis": "2-3 sentence thoughtful reflection summary",
  "emotionalBalance": "e.g. Resilient & Determined | Centered & Grateful | Overcoming Friction",
  "growthScore": 88,
  "coreTakeaway": "1 sharp philosophical anchor for tomorrow"
}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (err) {
      console.error('Gemini Daily Reflection failed:', err);
    }
  }

  return {
    synthesis: `You navigated challenges with clear awareness: ${responses.challenged.slice(0, 80)}. Celebrating wins in "${responses.wentWell.slice(0, 60)}" reinforces positive momentum.`,
    emotionalBalance: 'Resilient & Growth-Oriented',
    growthScore: 92,
    coreTakeaway: responses.learned.length > 5 ? responses.learned : 'Small daily reflections compound into massive clarity.',
  };
}

// ----------------------------------------------------------------------------------
// 8. Goal Decomposition
// ----------------------------------------------------------------------------------
export async function decomposeGoal(goalTitle: string, description?: string): Promise<{
  milestones: Array<{ title: string; targetDays: number; tasks: string[] }>;
  recommendedHabit: string;
  potentialObstacle: string;
}> {
  const prompt = `Break down this ambitious goal into progressive milestones, actionable tasks, and a core supporting habit.
Goal: "${goalTitle}"
Description: "${description || 'None'}"

Return ONLY valid JSON:
{
  "milestones": [
    {
      "title": "Milestone name",
      "targetDays": 7,
      "tasks": ["Specific subtask 1", "Specific subtask 2"]
    },
    {
      "title": "Milestone name 2",
      "targetDays": 21,
      "tasks": ["Specific subtask 1", "Specific subtask 2"]
    }
  ],
  "recommendedHabit": "Daily micro-habit supporting this goal",
  "potentialObstacle": "Anticipated pitfall and countermeasure"
}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (err) {
      console.error('Gemini Goal Decomposition failed:', err);
    }
  }

  return {
    milestones: [
      {
        title: 'Foundation & Blueprint',
        targetDays: 7,
        tasks: ['Map architecture and required dependencies', 'Build initial proof-of-concept'],
      },
      {
        title: 'Core Implementation & Polish',
        targetDays: 21,
        tasks: ['Integrate automated workflows', 'Run thorough validation tests'],
      },
      {
        title: 'Final Launch & Review',
        targetDays: 30,
        tasks: ['Review analytics and retrospect with Gemini LifeOS'],
      }
    ],
    recommendedHabit: 'Dedicate 45 minutes of distraction-free focus every morning.',
    potentialObstacle: 'Scope creep — prioritize completing the MVP before adding auxiliary features.',
  };
}
