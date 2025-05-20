import SecurityError from './SecurityError';

class RateLimiter {
  constructor() {
    this.requestMap = new Map();
    this.maxRequests = 10; // Maximum de requêtes par minute
    this.windowMs = 60000; // Fenêtre d'une minute
    this.cleanupInterval = setInterval(() => this._cleanup(), this.windowMs);
  }

  async checkLimit(userId) {
    const now = Date.now();
    const userRequests = this.requestMap.get(userId) || [];
    
    // Nettoyer les anciennes requêtes
    const recentRequests = userRequests.filter(
      time => now - time < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      throw new SecurityError('RATE_LIMIT_EXCEEDED');
    }

    recentRequests.push(now);
    this.requestMap.set(userId, recentRequests);
  }

  _cleanup() {
    const now = Date.now();
    for (const [userId, requests] of this.requestMap.entries()) {
      const validRequests = requests.filter(time => now - time < this.windowMs);
      if (validRequests.length === 0) {
        this.requestMap.delete(userId);
      } else {
        this.requestMap.set(userId, validRequests);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

export default RateLimiter; 