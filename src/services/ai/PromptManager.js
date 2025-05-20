class PromptManager {
  static getEmbeddingPrompt(text, section) {
    return `
### Texte Original ###
${text}

### Contexte de Section ###
Section: ${section}

### Objectif ###
Extraction des concepts clés et du contexte sémantique pour une recherche pertinente.

### Points d'Attention ###
- Mots-clés essentiels
- Relations sémantiques
- Contexte professionnel
- Spécificités techniques si présentes`;
  }

  static getResponsePrompt(question, context, section) {
    return `Contexte: ${context}

Question: ${question}

Instructions: ${this._getResponseInstructions(section)}

Répondez de manière claire et concise en français.`;
  }

  static _getSectionContext(section) {
    const contexts = {
      about: "Section de présentation personnelle et professionnelle",
      skills: "Section technique détaillant les compétences et expertises",
      projects: "Section présentant les réalisations et projets significatifs",
      contact: "Section pour les informations de contact et réseaux"
    };
    return contexts[section] || "Section générale du portfolio";
  }

  static _getResponseInstructions(section) {
    const instructions = {
      about: "- Adoptez un ton professionnel mais personnel\n- Mettez en avant le parcours et les motivations",
      skills: "- Utilisez un vocabulaire technique précis\n- Quantifiez les compétences quand possible",
      projects: "- Décrivez les projets de manière structurée\n- Soulignez les technologies utilisées",
      contact: "- Restez formel et direct\n- Précisez les moyens de contact disponibles"
    };
    return instructions[section] || "- Adaptez le ton au contexte\n- Restez professionnel et précis";
  }
}

export default PromptManager; 