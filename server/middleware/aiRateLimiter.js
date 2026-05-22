import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : ipKeyGenerator(req.ip),
  message: { error: 'AI rate limit exceeded. Max 20 requests per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
