import rateLimit from 'express-rate-limit';

// Standard rate limiter for general AI operations
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RateLimitExceeded',
    message: 'Too many AI requests from this origin. Please wait a few moments before trying again.',
  },
});

// Stricter rate limiter for heavy generation tasks (summarization, deep insights)
export const heavyAiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RateLimitExceeded',
    message: 'Rate limit reached for heavy synthesis. Please try again shortly.',
  },
});
