import { HuggingFaceAPI } from '../ai/huggingface';
import embeddingService from '../ai/EmbeddingService';
import ContentExtractor from '../content/ContentExtractor';
import securityManager from '../security/SecurityManager';
import SecurityError from '../security/SecurityError';
import { v4 as uuidv4 } from 'uuid';
import { chatConfig } from '../../config/chatConfig';
import PromptManager from '../ai/PromptManager';

/**
 * Types d'erreurs personnalisés pour une meilleure gestion
 */
const ErrorTypes = {
  INITIALIZATION: 'INITIALIZATION_ERROR',
  CONTENT: 'CONTENT_ERROR',
  SECURITY: 'SECURITY_ERROR',
  API: 'API_ERROR',
  EMBEDDING: 'EMBEDDING_ERROR'
};

/**
 * ChatbotService - Service principal pour la gestion des interactions du chatbot
 * Implémente le pattern Singleton pour assurer une instance unique
 */
class ChatbotService {
  /**
   * Constructeur - Initialise ou retourne l'instance unique du service
   */
  constructor() {
    if (ChatbotService.instance) {
      return ChatbotService.instance;
    }
    
    // Initialisation des propriétés
    this.context = '';              // Contexte de conversation actuel
    this.messageHistory = [];       // Historique des messages
    this.userId = this._initUserId(); // ID unique de l'utilisateur
    this.initialized = false;       // État d'initialisation
    this.debug = true;              // Mode debug pour les logs détaillés
    this.embeddingService = embeddingService; // Utilisation de l'instance existante
    this.huggingFaceAPI = new HuggingFaceAPI();
    
    // Ajout des propriétés de logging
    this.logs = [];
    this.maxLogs = 100;
    
    ChatbotService.instance = this;
  }

  /**
   * Initialise ou récupère l'ID utilisateur depuis le localStorage
   * @returns {string} ID utilisateur unique
   * @private
   */
  _initUserId() {
    const storedId = localStorage.getItem('chat_user_id');
    if (storedId) return storedId;
    
    const newId = uuidv4();
    localStorage.setItem('chat_user_id', newId);
    return newId;
  }

  /**
   * Ajoute un log avec timestamp
   * @param {string} message - Message de log
   * @param {string} level - Niveau de log (info, warn, error)
   * @private
   */
  _addLog(message, level = 'info') {
    const log = {
      timestamp: new Date().toISOString(),
      message,
      level
    };
    
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (this.debug) {
      const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
      console.log(`${emoji} ${log.timestamp}: ${message}`);
    }
  }

  /**
   * Gère une erreur de manière appropriée
   * @param {Error} error - Erreur à gérer
   * @param {string} context - Contexte de l'erreur
   * @throws {Error} Erreur enrichie avec contexte
   * @private
   */
  _handleError(error, context) {
    let errorType = ErrorTypes.CONTENT;
    let message = error.message;

    if (error instanceof SecurityError) {
      errorType = ErrorTypes.SECURITY;
    } else if (error.name === 'HuggingFaceAPIError') {
      errorType = ErrorTypes.API;
    }

    const enrichedError = new Error(`[${errorType}] ${context}: ${message}`);
    enrichedError.originalError = error;
    enrichedError.type = errorType;

    this._addLog(`Erreur: ${enrichedError.message}`, 'error');
    throw enrichedError;
  }

  /**
   * Valide le format des données avant traitement
   * @param {Array} content - Contenu à valider
   * @returns {boolean} True si les données sont valides
   * @private
   */
  _validateDataFormat(content) {
    if (!Array.isArray(content)) {
      this._addLog('Le contenu doit être un tableau', 'error');
      return false;
    }

    const isValid = content.every(item => 
      item && typeof item === 'object' && 
      (typeof item.content === 'string' || Array.isArray(item.content))
    );

    if (!isValid) {
      this._addLog('Format de contenu invalide', 'error');
      return false;
    }

    return true;
  }

  /**
   * Traite une question de l'utilisateur et génère une réponse appropriée
   * @param {string} input - Question de l'utilisateur
   * @param {string} section - Section du site concernée ('all' par défaut)
   * @returns {Promise<string>} Réponse générée
   */
  async getResponseFromSection(input, section) {
    try {
      const normalizedSection = this._normalizeSection(section);
      const content = await this._getContentForSection(normalizedSection);
      
      if (!content || !Array.isArray(content)) {
        return "Je ne peux pas accéder au contenu de cette section pour le moment.";
      }

      // Utilisation du PromptManager pour l'embedding
      const embeddingPrompt = PromptManager.getEmbeddingPrompt(input, normalizedSection);
      const relevantContext = await this.embeddingService.findMostRelevantContent(
        embeddingPrompt,
        this._formatContentBySection(content, normalizedSection)
      );

      if (!relevantContext || relevantContext.length === 0) {
        return "Je ne trouve pas d'informations pertinentes pour répondre à votre question.";
      }

      const contextText = this._prepareContext(relevantContext, normalizedSection);
      
      // Utilisation du PromptManager pour la génération
      const response = await this.huggingFaceAPI.queryWithFlanT5(
        input,
        contextText,
        normalizedSection
      );
      
      return response || "Je suis désolé, je ne parviens pas à formuler une réponse appropriée.";
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la requête:', error);
      return "Une erreur s'est produite lors du traitement de votre demande.";
    }
  }

  _prepareContext(relevantContext, section) {
    console.log('\n=== Préparation du contexte ===');
    console.log('📚 Contexte pertinent reçu:', relevantContext);
    console.log('🔍 Section:', section);

    const contextText = relevantContext
      .map(item => item.content)
      .join('\n\n');

    const sectionIntro = {
      'about': 'À propos de moi:',
      'skills': 'Mes compétences techniques:',
      'projects': 'Concernant mes projets:',
      'contact': 'Informations de contact:'
    }[section] || '';

    const finalContext = `${sectionIntro}\n${contextText}`;
    console.log('✨ Contexte final préparé:', finalContext);
    
    return finalContext;
  }

  // Méthode pour formater le contenu selon le type de section
  _formatContentBySection(content, section) {
    switch (section) {
      case 'skills':
        return content.map(item => {
          if (item.type === 'skill') {
            return {
              content: `${item.name} (Niveau de maîtrise: ${item.displayValue})`,
              type: 'skill',
              section: 'skills'
            };
          }
          return item;
        });
      case 'projects':
        return content.map(item => ({
          content: Array.isArray(item.content) ? item.content.join(' - ') : item.content,
          type: item.type,
          section: 'projects'
        }));
      default:
        return content.map(item => ({
          content: Array.isArray(item.content) ? item.content.join(' ') : item.content,
          type: item.type,
          section
        }));
    }
  }

  // Méthode pour enrichir le contexte
  _enrichContext(context, section) {
    switch (section) {
      case 'skills':
        return `Mes compétences techniques incluent : ${context}`;
      case 'projects':
        return `Dans mon portfolio de projets : ${context}`;
      default:
        return context;
    }
  }

  // Méthode pour enrichir la réponse
  async _enrichResponse(initialResponse, context, question) {
    try {
      const enrichmentPrompt = `
        Améliore et enrichis cette réponse en la rendant plus naturelle et détaillée :
        
        Réponse initiale: ${initialResponse}
        Contexte additionnel: ${context}
        Question originale: ${question}
        
        Nouvelle réponse:`;

      const enrichedResponse = await this.huggingFaceAPI.query(enrichmentPrompt, context);
      return enrichedResponse || initialResponse;
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement de la réponse:', error);
      return initialResponse;
    }
  }

  /**
   * Normalise et valide la section demandée
   * @param {string} section - Section à normaliser
   * @returns {string} Section normalisée
   * @private
   */
  _normalizeSection(section) {
    // Gestion des sections invalides
    if (!section || typeof section !== 'string' || Array.isArray(section)) {
      this._addLog('Section invalide, utilisation de "about"', 'warn');
      return 'about'; // Section par défaut
    }

    const normalizedSection = section.toLowerCase().trim();
    
    // Vérification dans la configuration
    if (!chatConfig.sections[normalizedSection]) {
      this._addLog(`Section "${normalizedSection}" non trouvée, utilisation de "about"`, 'warn');
      return 'about';
    }

    return normalizedSection;
  }

  /**
   * Récupère le contenu structuré pour une section donnée
   * @param {string} section - Section à récupérer
   * @returns {Promise<Array>} Contenu structuré
   * @private
   */
  async _getContentForSection(section) {
    try {
      const content = ContentExtractor.extractSectionContent(section);
      if (!content) {
        console.log('❌ Pas de contenu trouvé pour la section:', section);
        return null;
      }

      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
        console.log('📚 Contenu structuré de la section:', parsedContent);
      } catch (error) {
        console.error('❌ Erreur de parsing du contenu:', error);
        return null;
      }

      return Array.isArray(parsedContent) ? parsedContent : [parsedContent];

    } catch (error) {
      console.error('❌ Erreur lors de la récupération du contenu:', error);
      return null;
    }
  }

  /**
   * Formate le contexte pour le modèle
   * @param {Array} context - Contexte à formater
   * @returns {string} Contexte formaté
   * @private
   */
  _formatContextForModel(context) {
    return context.map(c => c.content).join(' ');
  }

  /**
   * Ajoute un message à l'historique
   * @param {string} message - Message à ajouter
   * @param {boolean} isUser - Indique si le message vient de l'utilisateur
   */
  addToMessageHistory(message, isUser = true) {
    const newMessage = {
      content: message,
      isUser,
      timestamp: new Date().toISOString()
    };
    this.messageHistory.push(newMessage);
    console.log('📝 Historique mis à jour:', this.messageHistory);
  }

  /**
   * Récupère les logs récents
   * @param {number} limit - Nombre de logs à récupérer
   * @returns {Array} Logs récents
   */
  getLogs(limit = 10) {
    return this.logs.slice(0, limit);
  }

  /**
   * Efface les logs
   */
  clearLogs() {
    this.logs = [];
    this._addLog('Logs effacés');
  }

  /**
   * Recherche par mots-clés (méthode de secours)
   * @param {string} input - Question de l'utilisateur
   * @param {Array} content - Contenu à rechercher
   * @returns {Array} Contenu pertinent trouvé
   * @private
   */
  _fallbackKeywordSearch(input, content) {
    this._addLog('Utilisation de la recherche par mots-clés', 'info');
    
    // Préparation des mots-clés
    const keywords = input.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);  // Ignorer les mots trop courts

    if (keywords.length === 0) {
      return [];
    }

    // Score et tri du contenu
    const scoredContent = content.map(item => {
      const itemContent = typeof item.content === 'string' 
        ? item.content.toLowerCase()
        : item.content.join(' ').toLowerCase();

      const score = keywords.reduce((acc, keyword) => {
        return acc + (itemContent.includes(keyword) ? 1 : 0);
      }, 0);

      return { ...item, score };
    });

    // Retourner les éléments les plus pertinents
    return scoredContent
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score, ...item }) => item);
  }

  /**
   * Traite la requête de l'utilisateur et génère une réponse
   * @param {string} userInput - La question posée par l'utilisateur
   * @param {string} section - La section ciblée (optionnelle)
   * @returns {Promise<string>} - La réponse générée
   */
  async getResponse(userInput, section = null) {
    try {
      if (section) {
        return await this.getResponseFromSection(userInput, section);
      }

      const relevantContent = await this.embeddingService.findMostRelevantContent(
        userInput,
        chatConfig.contentArray
      );

      if (relevantContent.length === 0) {
        return 'Désolé, je n\'ai pas trouvé d\'information pertinente.';
      }

      const context = this._prepareContext(relevantContent, 'general');
      const response = await this.huggingFaceAPI.queryWithFlanT5(
        userInput,
        context,
        'general'
      );

      const conversationId = uuidv4();
      await this.updateConversationHistory(conversationId, userInput, response);

      return response;
    } catch (error) {
      if (error instanceof SecurityError) throw error;
      return 'Une erreur est survenue lors du traitement de votre demande.';
    }
  }
}

export default new ChatbotService(); 