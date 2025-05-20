class SecurityLogger {
  constructor() {
    this.suspiciousActivities = new Map();
    this.maxFailedAttempts = 3;
    this.banDuration = 300000; // 5 minutes
  }

  logAttempt(userId, input, status, error = null) {
    const logEntry = {
      timestamp: new Date(),
      input,
      status,
      error: error?.message,
      userAgent: navigator.userAgent
    };

    if (status === 'FAILED') {
      this._handleFailedAttempt(userId, logEntry);
    }

    this._sendToConsole(logEntry);
    this._saveToLocalStorage(userId, logEntry);
  }

  _handleFailedAttempt(userId, logEntry) {
    const userAttempts = this.suspiciousActivities.get(userId) || [];
    userAttempts.push(logEntry);
    this.suspiciousActivities.set(userId, userAttempts);

    if (this._shouldBanUser(userId)) {
      this._banUser(userId);
    }
  }

  _shouldBanUser(userId) {
    const attempts = this.suspiciousActivities.get(userId) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp < this.banDuration
    );
    return recentAttempts.length >= this.maxFailedAttempts;
  }

  _banUser(userId) {
    localStorage.setItem(`banned_${userId}`, Date.now().toString());
    console.log(`Utilisateur ${userId} a été banni.`); // Log pour indiquer que l'utilisateur est banni
    throw new SecurityError('USER_BANNED');
  }

  _sendToConsole(logEntry) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Security Log]', logEntry);
    }
  }

  _saveToLocalStorage(userId, logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('security_logs') || '{}');
      logs[userId] = logs[userId] || [];
      logs[userId].push(logEntry);
      
      // Garder seulement les 100 derniers logs
      if (logs[userId].length > 100) {
        logs[userId] = logs[userId].slice(-100);
      }
      
      localStorage.setItem('security_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des logs:', error);
    }
  }
}

export default SecurityLogger; 