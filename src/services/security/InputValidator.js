import SecurityError from './SecurityError';

class InputValidator {
  constructor() {
    this.suspiciousPatterns = [
      /ignore previous instructions/i,
      /forget (your|all) (instructions|training)/i,
      /new system prompt/i,
      /you (are|will be|should be) now/i,
      /\{|\}|\$|\[|\]|<|>/g,
      /(sudo|admin|root|system|prompt|override)/i,
      /instructions?:|prompt:/i,
      /you must now/i,
      /disregard|bypass|hack/i
    ];
    
    this.dangerousCommands = new Set([
      "reset", "override", "sudo", "admin",
      "system", "prompt", "initialize", "configure"
    ]);
  }

  validateInput(input) {
    if (typeof input !== 'string') {
      throw new SecurityError('INVALID_INPUT_TYPE');
    }

    if (input.length > 500) {
      throw new SecurityError('INPUT_TOO_LONG');
    }

    if (this._containsSuspiciousPatterns(input)) {
      throw new SecurityError('SUSPICIOUS_PATTERN_DETECTED');
    }

    if (this._containsDangerousCommands(input)) {
      throw new SecurityError('DANGEROUS_COMMAND_DETECTED');
    }

    return this._sanitizeInput(input);
  }

  _containsSuspiciousPatterns(input) {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  _containsDangerousCommands(input) {
    const words = input.toLowerCase().split(/\s+/);
    return words.some(word => this.dangerousCommands.has(word));
  }

  _sanitizeInput(input) {
    return input
      .replace(/[<>{}[\]]/g, '')
      .replace(/\\/g, '')
      .trim();
  }
}

export default InputValidator; 