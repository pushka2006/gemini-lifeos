import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebaseAdmin } from './middleware/auth.js';
import { aiRouter } from './routes/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or curl requests with no origin in development
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Gemini LifeOS Secure Gateway',
    timestamp: new Date().toISOString(),
    aiReady: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
  });
});

// Mount AI Routes
app.use('/api/ai', aiRouter);

// Serve frontend client if built (e.g. in containerized Cloud Run deployment)
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 Handler for undefined API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested API endpoint does not exist.',
  });
});

// Centralized Error Handler - Never expose stack traces or secrets
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as Error;
  console.error('Unhandled Server Error:', error.message);
  
  res.status(500).json({
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred while processing your request.' 
      : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`🌌 Gemini LifeOS API Server running on port ${PORT}`);
  console.log(`🔒 Security: Strict authentication, CORS, rate limiting, and sanitized error boundaries enabled.`);
});

export default app;
