import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, duration) {
    let expiry = null;
    if (mode === 'EX' && duration) {
      expiry = Date.now() + duration * 1000;
    }
    this.cache.set(key, { value, expiry });
    return 'OK';
  }

  async del(key) {
    return this.cache.delete(key) ? 1 : 0;
  }

  async flushall() {
    this.cache.clear();
    return 'OK';
  }
}

let redisClient;
const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis reconnection failed after 3 tries. Falling back to in-memory cache.');
          return null;
        }
        return Math.min(times * 100, 2000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis server successfully.');
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis connection warning: ${err.message}. Using fallback in-memory cache.`);
      redisClient = new MemoryCache();
    });
  } catch (err) {
    logger.warn(`Redis initialization error: ${err.message}. Using fallback in-memory cache.`);
    redisClient = new MemoryCache();
  }
} else {
  logger.info('No REDIS_URL provided. Using high-performance in-memory cache for development.');
  redisClient = new MemoryCache();
}

export const cache = redisClient;
