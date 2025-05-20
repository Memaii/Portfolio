import { HuggingFaceAPI } from './huggingface';
import PromptManager from './PromptManager';

class EmbeddingService {
  constructor() {
    this.huggingFaceAPI = new HuggingFaceAPI();
    this.cache = new Map();
    this.similarityThreshold = 0.65;
    this.maxResults = 3;
  }

  async getEmbedding(text) {
    if (!text || typeof text !== 'string') {
      console.warn('❌ Texte invalide reçu:', text);
      throw new Error('Le texte doit être une chaîne non vide');
    }

    const cleanText = text.trim();
    if (cleanText === '') {
      throw new Error('Le texte ne peut pas être vide après nettoyage');
    }

    const cacheKey = this._generateCacheKey(cleanText);
    if (this.cache.has(cacheKey)) {
      console.log('✨ Utilisation du cache pour:', cleanText.slice(0, 50));
      return this.cache.get(cacheKey);
    }

    try {
      const embedding = await this.huggingFaceAPI.getEmbedding(cleanText);
      this.cache.set(cacheKey, embedding);
      return embedding;
    } catch (error) {
      console.error('Erreur d\'embedding:', error);
      throw error;
    }
  }

  async findMostRelevantContent(query, contentArray) {
    console.log('\n=== Début de la recherche de contenu pertinent ===');
    
    if (!Array.isArray(contentArray) || contentArray.length === 0) {
      console.error('❌ contentArray invalide');
      return [];
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      console.warn('⚠️ Query vide après nettoyage');
      throw new Error('La requête ne peut pas être vide');
    }

    try {
      const queryEmbedding = await this.getEmbedding(cleanQuery);
      
      const scoredContent = await Promise.all(
        contentArray.map(async (item) => {
          if (!item?.content) return null;
          
          try {
            const contentText = typeof item.content === 'string' 
              ? item.content 
              : item.content.join(' ');

            const embeddingPrompt = PromptManager.getEmbeddingPrompt(contentText, item.section);
            const contentEmbedding = await this.getEmbedding(embeddingPrompt);
            
            const similarity = this.calculateCosineSimilarity(queryEmbedding, contentEmbedding);
            const sectionWeight = this._getSectionWeight(item.section);
            
            return {
              ...item,
              similarity,
              score: similarity * sectionWeight,
              contentText
            };
          } catch (error) {
            console.warn('⚠️ Erreur pour item:', error.message);
            return null;
          }
        })
      );
      return scoredContent
        .filter(item => item && item.similarity >= this.similarityThreshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, this.maxResults);
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      return [];
    }
  }

  _getSectionWeight(section) {
    const weights = {
      skills: 1.2,
      projects: 1.1,
      about: 1.0,
      contact: 0.9
    };
    return weights[section] || 1;
  }

  _generateCacheKey(text) {
    return `${text.slice(0, 100)}_${text.length}`;
  }

  calculateCosineSimilarity(embedding1, embedding2) {
    if (typeof embedding1 === 'number' || typeof embedding2 === 'number') {
      console.log('📊 Utilisation de la similarité directe');
      return Math.max(
        typeof embedding1 === 'number' ? embedding1 : 0,
        typeof embedding2 === 'number' ? embedding2 : 0
      );
    }

    const vec1 = this._extractEmbeddingVector(embedding1);
    const vec2 = this._extractEmbeddingVector(embedding2);

    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      console.error('❌ Vecteurs d\'embedding invalides');
      return 0;
    }

    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (norm1 === 0 || norm2 === 0) {
      console.warn('⚠️ Vecteur d\'embedding nul détecté');
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  _extractEmbeddingVector(embedding) {
    if (Array.isArray(embedding)) {
      return embedding;
    }

    if (embedding && typeof embedding === 'object') {
      for (const key of Object.keys(embedding)) {
        if (Array.isArray(embedding[key])) {
          return embedding[key];
        }
      }
    }

    console.error('Format d\'embedding non reconnu:', embedding);
    throw new Error('Format d\'embedding non valide');
  }
}

export default new EmbeddingService(); 