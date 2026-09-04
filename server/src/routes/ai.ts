import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authenticate } from '../middleware/auth.js';
import { aiRateLimiter, heavyAiRateLimiter } from '../middleware/rateLimiter.js';
import {
  streamChatResponse,
  analyzeJournalContent,
  extractActionableTasks,
  summarizeConversation,
  askMyJournal,
  generateMorningBrief,
  generateDailyReflectionSummary,
  decomposeGoal,
  configureGeminiKey,
  getAiConfigStatus,
} from '../ai/gemini.js';

export const aiRouter = Router();

// Apply authentication to all AI routes
aiRouter.use(authenticate);

// ----------------------------------------------------------------------------------
// 1. Streaming Multi-Turn Chat (Server-Sent Events)
// ----------------------------------------------------------------------------------
const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1).max(20000),
    })
  ).min(1),
  mode: z.enum(['GENERAL', 'JOURNAL', 'BRAINSTORM', 'REFLECTION', 'GOALS', 'STUDY', 'PLANNING']).optional().default('GENERAL'),
  memories: z.array(z.string()).optional().default([]),
});

aiRouter.post('/chat/stream', aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = chatSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', details: parseResult.error.format() });
    return;
  }

  const { messages, mode, memories } = parseResult.data;

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const stream = streamChatResponse(messages, mode, memories);
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Stream interrupted', message: err.message })}\n\n`);
    res.end();
  }
});

// ----------------------------------------------------------------------------------
// 2. Journal Entry Analysis
// ----------------------------------------------------------------------------------
const journalAnalyzeSchema = z.object({
  text: z.string().min(3).max(50000),
});

aiRouter.post('/journal/analyze', aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = journalAnalyzeSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', details: parseResult.error.format() });
    return;
  }

  try {
    const analysis = await analyzeJournalContent(parseResult.data.text);
    res.json({ success: true, data: analysis });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: 'AnalysisFailed', message: err.message });
  }
});

// ----------------------------------------------------------------------------------
// 3. Task Extraction
// ----------------------------------------------------------------------------------
const taskExtractSchema = z.object({
  text: z.string().min(2).max(10000),
});

aiRouter.post('/tasks/extract', aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = taskExtractSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', details: parseResult.error.format() });
    return;
  }

  try {
    const tasks = await extractActionableTasks(parseResult.data.text);
    res.json({ success: true, data: tasks });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: 'ExtractionFailed', message: err.message });
  }
});

// ----------------------------------------------------------------------------------
// 4. Conversation Auto-Summarization
// ----------------------------------------------------------------------------------
const summarizeSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ).min(2),
});

aiRouter.post('/summarize', heavyAiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = summarizeSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', details: parseResult.error.format() });
    return;
  }

  try {
    const summary = await summarizeConversation(parseResult.data.messages);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: 'SummarizationFailed', message: err.message });
  }
});

// ----------------------------------------------------------------------------------
// 5. Ask My Journal (Semantic Search & QA)
// ----------------------------------------------------------------------------------
const askJournalSchema = z.object({
  query: z.string().min(2).max(1000),
  contextEntries: z.array(
    z.object({
      title: z.string(),
      date: z.string(),
      content: z.string(),
    })
  ).max(20),
});

aiRouter.post('/ask-journal', aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = askJournalSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', details: parseResult.error.format() });
    return;
  }

  const { query, contextEntries } = parseResult.data;
  try {
    const result = await askMyJournal(query, contextEntries);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: 'SearchFailed', message: err.message });
  }
});

// ----------------------------------------------------------------------------------
// 6. Morning Brief Generator
// ----------------------------------------------------------------------------------
const morningBriefSchema = z.object({
  userName: z.string().optional(),
  yesterdaySummary: z.string().optional(),
  goals: z.array(z.string()).optional().default([]),
  tasks: z.array(z.string()).optional().default([]),
});

aiRouter.post('/morning-brief', heavyAiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = morningBriefSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', details: parseResult.error.format() });
    return;
  }

  try {
    const brief = await generateMorningBrief(parseResult.data);
    res.json({ success: true, data: brief });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: 'MorningBriefFailed', message: err.message });
  }
});

// ----------------------------------------------------------------------------------
// 7. Daily Reflection Synthesizer
// ----------------------------------------------------------------------------------
const dailyReflectionSchema = z.object({
  wentWell: z.string().min(1),
  challenged: z.string().min(1),
  learned: z.string().min(1),
  tomorrow: z.string().min(1),
});

aiRouter.post('/daily-reflection', heavyAiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = dailyReflectionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', details: parseResult.error.format() });
    return;
  }

  try {
    const reflection = await generateDailyReflectionSummary(parseResult.data);
    res.json({ success: true, data: reflection });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: 'ReflectionFailed', message: err.message });
  }
});

// ----------------------------------------------------------------------------------
// 8. Goal Decomposition
// ----------------------------------------------------------------------------------
const goalDecomposeSchema = z.object({
  goalTitle: z.string().min(3).max(500),
  description: z.string().optional(),
});

aiRouter.post('/goals/decompose', aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = goalDecomposeSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', details: parseResult.error.format() });
    return;
  }

  try {
    const breakdown = await decomposeGoal(parseResult.data.goalTitle, parseResult.data.description);
    res.json({ success: true, data: breakdown });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: 'DecompositionFailed', message: err.message });
  }
});

// Configure Gemini API Key dynamically
const configKeySchema = z.object({
  apiKey: z.string().min(10),
  model: z.string().optional(),
});

aiRouter.post('/config/key', (req: AuthenticatedRequest, res: Response) => {
  const parseResult = configKeySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'ValidationError', message: 'Valid Gemini API key required.' });
    return;
  }

  try {
    const result = configureGeminiKey(parseResult.data.apiKey, parseResult.data.model);
    res.json({ ...result });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(400).json({ error: 'ConfigurationFailed', message: error.message });
  }
});

aiRouter.get('/config/key', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: getAiConfigStatus() });
});

// Status check
aiRouter.get('/status', (req: AuthenticatedRequest, res: Response) => {
  const status = getAiConfigStatus();
  res.json({
    status: 'online',
    model: status.model,
    hasKey: status.hasKey,
    isLive: status.isLive,
    authenticatedUser: req.user?.uid,
    timestamp: new Date().toISOString(),
  });
});
