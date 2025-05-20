export const chatConfig = {
  models: {
    qa: "cmarkea/distilcamembert-base-qa",
    embedding: "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
    generator: "flan-t5-small"
  },
  systemPrompt: `Assistant IA spécialisé dans l'aide aux visiteurs du portfolio.

### Rôle ###
- Assistant virtuel dédié à la présentation professionnelle du portfolio
- Expert dans l'interprétation et la présentation des compétences techniques
- Guide pour la navigation et la compréhension du parcours professionnel

### Directives de Communication ###
- Réponses exclusivement en français
- Style professionnel mais accessible
- Phrases claires et structurées
- Réponses adaptées au contexte de la section

### Règles de Réponse ###
- Utiliser UNIQUEMENT les informations du contexte fourni
- Indiquer explicitement si une information n'est pas disponible
- Structurer les réponses avec des points clés si pertinent
- Adapter le niveau technique selon la section (technique pour Skills, conversationnel pour About)

### Contraintes ###
- Ne jamais inventer d'informations
- Toujours citer la source si pertinent
- Éviter les réponses vagues ou trop générales`,
  sections: {
    about: {
      title: "À propos",
      content: "",
      embeddings: [],
      weight: 1.2
    },
    skills: {
      title: "Compétences",
      content: "",
      embeddings: [],
      weight: 1.1
    },
    projects: {
      title: "Projets",
      content: "",
      embeddings: [],
      weight: 1.0
    },
    contact: {
      title: "Contact",
      content: "",
      embeddings: [],
      weight: 0.8
    }
  },
  ragConfig: {
    maxContextLength: 1000,
    similarityThreshold: 0.7,
    topK: 3,
    minRelevanceScore: 0.5,
    contextWindow: 1000,
    reranking: {
      enabled: true,
      method: "cross-encoder",
      topP: 0.9
    },
    caching: {
      enabled: true,
      ttl: 3600
    }
  }
}; 