import InputValidator from './InputValidator';
import RateLimiter from './RateLimiter';
import SecurityLogger from './SecurityLogger';

class SecurityManager {
  constructor() {
    this.inputValidator = new InputValidator();
    this.rateLimiter = new RateLimiter();
    this.securityLog = new SecurityLogger();
  }

  async processUserInput(input, userId) {
    try {
      await this.rateLimiter.checkLimit(userId);
      const validatedInput = this.inputValidator.validateInput(input);
      this.securityLog.logAttempt(userId, input, 'SUCCESS');
      return validatedInput;
    } catch (error) {
      this.securityLog.logAttempt(userId, input, 'FAILED', error);
      throw error;
    }
  }
}

export default new SecurityManager(); 