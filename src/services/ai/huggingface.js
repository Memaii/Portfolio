import { chatConfig } from '../../config/chatConfig';
import PromptManager from './PromptManager';

export class HuggingFaceAPI {
  constructor() {
    this.baseUrl = import.meta.env.REACT_APP_HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models';
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    this.embeddingModel = 'google/flan-t5-small';
    this.qaModelPrimary = 'google/flan-t5-small';
    this.qaModelFallback = 'nadav/camembert-base-squad-fr';
  }

  async getEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Le texte pour les embeddings doit être une chaîne non vide.');
    }

    const response = await fetch(`${this.baseUrl}/sentence-transformers/paraphrase-multilingual-mpnet-base-v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          source_sentence: text,
          sentences: [text]
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 400) {
        console.error('❌ Mauvais format pour l\'embedding. Vérifiez vos données:', errorData);
      }
      throw new Error(`Erreur API Embedding : ${response.status} - ${errorData.error || 'Erreur inconnue'}`);
    }

    const result = await response.json();
    
    // Si le résultat est un tableau de similarités
    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'number') {
      console.log('📊 Similarité reçue:', result[0]);
      return result[0];
    }
    
    // Si nous recevons un objet avec des embeddings
    if (result && typeof result === 'object') {
      return result;
    }

    throw new Error('Format de réponse inattendu de l\'API');
  }

  async queryWithFlanT5(question, context, section) {
    if (!question || !context) {
      throw new Error('La question et le contexte ne peuvent pas être vides.');
    }

    const formattedPrompt = PromptManager.getResponsePrompt(question, context, section);
    const response = await this._sendPromptToAPI(formattedPrompt, question, context);
    return this._formatResponse(response);
  }

  async _sendPromptToAPI(prompt, originalQuestion = '', originalContext = '') {
    console.log('\n=== Début queryWithFlanT5 ===');
    console.log('📝 Prompt formaté:', prompt);

    const response = await fetch(`${this.baseUrl}/${this.qaModelPrimary}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 500,
          min_length: 30,
          top_p: 0.95,
          temperature: 0.4,
          repetition_penalty: 6
        },
        options: {
          use_cache: true,
          wait_for_model: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Erreur API avec Flan-T5: ${response.status}`, errorData);
      throw new Error(errorData.error || 'Erreur inconnue');
    }

    const result = await response.json();
    console.log('✨ Réponse brute du modèle:', result);
    
    const formattedResponse = this._formatResponse(result);
    
    console.log('🔍 Réponse formatée:', formattedResponse);
    
    const invalidResponseMarkers = [
      'Instructions',
      'Répondez',
      'Utilisez',
      '###',
      'Contexte',
      'Question',
      'Format de Réponse',
      'Contraintes'
    ];
    
    const isInvalidResponse = !formattedResponse || 
      formattedResponse.length < 10 ||
      invalidResponseMarkers.some(marker => formattedResponse.includes(marker));

    if (isInvalidResponse) {
      console.log('❌ Raisons de l\'invalidation:');
      if (!formattedResponse) console.log('- Réponse vide');
      if (formattedResponse?.length < 10) console.log('- Réponse trop courte');
      invalidResponseMarkers.forEach(marker => {
        if (formattedResponse?.includes(marker)) {
          console.log(`- Contient le marqueur invalide: ${marker}`);
        }
      });
    }

    if (isInvalidResponse) {
      console.warn('⚠️ Réponse invalide détectée, utilisation du modèle de secours');
      return await this.queryWithFallbackModel(originalQuestion, originalContext);
    }
    
    return formattedResponse;
  }

  _formatResponse(result) {
    console.log('📝 Format de la réponse brute:', typeof result, Array.isArray(result));
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('📝 Premier élément:', result[0]);
      return result[0]?.generated_text || result[0];
    }
    if (typeof result === 'object') {
      console.log('📝 Propriétés de l\'objet:', Object.keys(result));
      return result.generated_text || result[0]?.generated_text;
    }
    if (typeof result === 'string') {
      return result;
    }
    return "Je suis désolé, je n'ai pas pu générer une réponse appropriée.";
  }

  async query(question, context, section = 'general') {
    try {
      console.log('🔍 Envoi de la requête au modèle principal:', this.qaModelPrimary);
      return await this.queryWithFlanT5(question, context, section);
    } catch (error) {
      console.warn('⚠️ Problème avec le modèle principal:', error.message);
      console.log('🔄 Tentative avec le modèle de secours:', this.qaModelFallback);
      return await this.queryWithFallbackModel(question, context, section);
    }
  }

  async queryWithFallbackModel(question, context, section = 'general') {
    const formattedPrompt = PromptManager.getResponsePrompt(question, context, section);
    const response = await fetch(`${this.baseUrl}/${this.qaModelFallback}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          question: formattedPrompt,
          context: context
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Erreur API (fallback): ${response.status} - ${errorData.error || 'Erreur inconnue'}`);
      throw new Error(`Erreur API (fallback): ${response.status} - ${errorData.error || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    return data.answer;
  }
}

export default new HuggingFaceAPI(); 