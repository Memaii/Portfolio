class SecurityError extends Error {
  constructor(code, message = null) {
    super(message || SecurityError.getMessageForCode(code));
    this.name = 'SecurityError';
    this.code = code;
  }

  static getMessageForCode(code) {
    const messages = {
      'INVALID_INPUT_TYPE': 'Type d\'entrée invalide',
      'INPUT_TOO_LONG': 'Message trop long',
      'SUSPICIOUS_PATTERN_DETECTED': 'Motif suspect détecté',
      'DANGEROUS_COMMAND_DETECTED': 'Commande dangereuse détectée',
      'RATE_LIMIT_EXCEEDED': 'Trop de messages envoyés',
      'USER_BANNED': 'Accès temporairement bloqué',
      'PROMPT_INTEGRITY_COMPROMISED': 'Erreur d\'intégrité',
    };
    return messages[code] || 'Erreur de sécurité inconnue';
  }
}

export default SecurityError; 