import type { Request, Response, NextFunction } from 'express';
import { RateLimiterAbstract, RateLimiterMemory } from 'rate-limiter-flexible';

// a rate limiter that allows 1 use per 30 seconds per IP address
// used for signUp and resetPassword requests
export const signupAndResetLimiter = new RateLimiterMemory({
  points: 1,
  duration: 30
});

// a rate limiter that allows 5 use per 30 seconds per IP address
// used for signIn requests
export const signinLimiter = new RateLimiterMemory({
  points: 5,
  duration: 30
});

// a method to use a rateLimiter as a middleware
export const makeRateLimiterMiddleware = (rateLimiter: RateLimiterAbstract) => (req: Request, res: Response, next: NextFunction) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send('Too Many Requests');
    });
};
