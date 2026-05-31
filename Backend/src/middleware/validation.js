/**
 * Request Validation Middleware
 * 
 * Validates incoming request data against Zod schemas
 * - Validates req.body, req.params, and req.query
 * - Returns 400 with detailed error messages on failure
 * - Short-circuits on validation failure
 */

const { AppError } = require('./errorHandler');

/**
 * Create a validation middleware for a given schema
 * 
 * @param {ZodSchema} schema - Zod validation schema
 * @param {string} source - Where to validate: 'body', 'params', or 'query'
 * @returns {Function} Express middleware
 * 
 * Usage:
 * router.post('/resume', 
 *   validateRequest(ResumeSchema, 'body'),
 *   controller.saveResume
 * )
 */
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];

      if (!dataToValidate) {
        return next(
          new AppError(
            `No ${source} data provided`,
            400,
            'MISSING_DATA'
          )
        );
      }

      const validated = schema.parse(dataToValidate);
      req[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] = validated;

      next();
    } catch (error) {
      // Zod validation error - already caught by errorHandler
      next(error);
    }
  };
};

/**
 * Validate multiple sources at once
 * 
 * Usage:
 * router.post('/resume',
 *   validateMultiple({
 *     body: ResumeSchema,
 *     query: QuerySchema
 *   }),
 *   controller.saveResume
 * )
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    try {
      const validated = {};

      for (const [source, schema] of Object.entries(schemas)) {
        const dataToValidate = req[source];
        
        if (!dataToValidate) {
          return next(
            new AppError(
              `No ${source} data provided`,
              400,
              'MISSING_DATA'
            )
          );
        }

        validated[source] = schema.parse(dataToValidate);
      }

      req.validated = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Sanitize request data to prevent XSS
 * Removes HTML/script tags from string fields
 * 
 * Usage:
 * router.post('/resume', sanitizeInput, controller.saveResume)
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(v => sanitizeObject(v));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};

/**
 * Validate required fields in request body
 * 
 * Usage:
 * router.post('/resume',
 *   requireFields(['name', 'email', 'phone']),
 *   controller.saveResume
 * )
 */
const requireFields = (fields = []) => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return next(
        new AppError(
          `Missing required fields: ${missingFields.join(', ')}`,
          400,
          'MISSING_FIELDS'
        )
      );
    }

    next();
  };
};

/**
 * Rate limiting validation - prevent spam
 * Simple in-memory rate limiter
 * 
 * Usage:
 * router.post('/improve', rateLimit(10, '1h'), controller.improve)
 */
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 10, timeWindow = '1h') => {
  const windowMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  }[timeWindow] || 60 * 1000;

  return (req, res, next) => {
    const key = `${req.user?.id || req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Initialize or get existing requests
    const requests = rateLimitMap.get(key) || [];
    
    // Remove old requests outside window
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      return next(
        new AppError(
          `Too many requests. Try again later.`,
          429,
          'RATE_LIMIT_EXCEEDED'
        )
      );
    }

    // Add current request
    recentRequests.push(now);
    rateLimitMap.set(key, recentRequests);

    // Cleanup old entries periodically
    if (rateLimitMap.size > 1000) {
      const keysToDelete = [];
      for (const [mapKey, mapRequests] of rateLimitMap.entries()) {
        const fresh = mapRequests.filter(time => time > windowStart);
        if (fresh.length === 0) {
          keysToDelete.push(mapKey);
        }
      }
      keysToDelete.forEach(key => rateLimitMap.delete(key));
    }

    next();
  };
};

module.exports = {
  validateRequest,
  validateMultiple,
  sanitizeInput,
  requireFields,
  rateLimit
};
