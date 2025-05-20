import { chatConfig } from '../../config/chatConfig';

/**
 * ContentExtractor - Classe responsable de l'extraction intelligente du contenu
 * pour le système de chat. Cette classe utilise une approche hybride combinant
 * la détection par sélecteurs CSS et l'analyse contextuelle du contenu.
 */
class ContentExtractor {
  constructor() {
    // État d'initialisation de l'extracteur
    this.initialized = false;
    
    // Éléments à exclure lors de l'extraction
    this.excludedElements = [
      'button', 'svg', 'img', 'input', 'textarea', 
      'script', 'style', '.chat-container', '.mobile-menu',
      'nav', 'footer', '[role="navigation"]'
    ];
    
    // Configuration pour la détection des compétences
    this.skillConfig = {
      // Classes CSS qui peuvent indiquer une compétence
      classIndicators: ['skill', 'competence', 'progress'],
      // Sélecteurs spécifiques pour notre site
      selectors: {
        name: '.text-gray-300',
        value: '.text-blue-400'
      },
      // Motifs pour la détection des valeurs numériques
      valuePatterns: [
        /^\d+%?$/,
        /^[0-9.,]+$/
      ]
    };

    // Activation du mode debug en développement
    this.debug = process.env.NODE_ENV === 'development';
  }

  /**
   * Calcule le niveau hiérarchique d'un nœud dans le document
   * en prenant en compte sa position et son contexte
   */
  calculateNodeLevel(node, baseLevel = 0) {
    // Traitement direct des titres HTML
    if (node.tagName?.match(/^H[1-6]$/i)) {
      return parseInt(node.tagName[1]);
    }

    let level = baseLevel;
    let current = node;
    let depth = 0;
    const maxDepth = 10; // Limite pour éviter les boucles infinies

    // Parcours des parents pour déterminer le niveau contextuel
    while (current.parentElement && depth < maxDepth) {
      const parent = current.parentElement;
      
      // Ajustement selon le type d'élément parent
      if (parent.tagName?.match(/^H[1-6]$/i)) {
        level = Math.max(level, parseInt(parent.tagName[1]));
      } else if (parent.classList.contains('section')) {
        level += 1;
      }

      // Prise en compte des attributs ARIA
      if (parent.getAttribute('role') === 'heading') {
        const ariaLevel = parseInt(parent.getAttribute('aria-level'));
        if (!isNaN(ariaLevel)) {
          level = Math.max(level, ariaLevel);
        }
      }

      current = parent;
      depth++;
    }

    return level;
  }

  /**
   * Extrait le contenu d'une section spécifique
   * @param {string} sectionId - Identifiant de la section
   * @returns {string} Contenu JSON structuré
   */
  extractSectionContent(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
      this.log(`Section ${sectionId} non trouvée dans le DOM`);
      return '';
    }

    // Clonage et nettoyage de la section
    const clone = section.cloneNode(true);
    this.excludedElements.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Extraction du contenu structuré
    const structuredContent = this.extractStructuredContent(clone);
    this.log(`Contenu extrait pour la section ${sectionId}:`, structuredContent);
    
    return JSON.stringify(structuredContent);
  }

  /**
   * Détecte et extrait les informations d'une compétence
   * @param {HTMLElement} element - Élément à analyser
   * @returns {Object|null} Informations de la compétence ou null
   */
  processSkillElement(element) {
    // Tentative avec les sélecteurs spécifiques
    const nameEl = element.querySelector(this.skillConfig.selectors.name);
    const valueEl = element.querySelector(this.skillConfig.selectors.value);

    if (nameEl && valueEl) {
      const name = nameEl.textContent.trim();
      const valueText = valueEl.textContent.trim();
      const value = parseInt(valueText);

      if (name && !isNaN(value)) {
        return {
          type: 'skill',
          name: name,
          value: value,
          displayValue: `${value}%`,
          level: this.calculateNodeLevel(element)
        };
      }
    }

    // Analyse alternative du contenu
    let name = null;
    let value = null;

    const processNode = (node) => {
      if (node.nodeType === 3) { // Nœud texte
        const text = node.textContent.trim();
        if (!text) return;

        // Recherche de valeurs numériques
        if (this.skillConfig.valuePatterns.some(pattern => pattern.test(text))) {
          value = parseInt(text);
        } 
        // Texte non numérique considéré comme nom
        else if (text.length > 1 && !name) {
          name = text;
        }
      } else if (node.nodeType === 1) {
        Array.from(node.childNodes).forEach(processNode);
      }
    };

    processNode(element);

    if (name && typeof value === 'number') {
      return {
        type: 'skill',
        name: name,
        value: value,
        displayValue: `${value}%`,
        level: this.calculateNodeLevel(element)
      };
    }

    return null;
  }

  /**
   * Extrait le contenu structuré d'un élément
   * @param {HTMLElement} element - Élément racine
   * @param {number} baseLevel - Niveau hiérarchique de base
   * @returns {Array} Contenu structuré
   */
  extractStructuredContent(element, baseLevel = 0) {
    let content = [];
    let currentSection = null;

    const processNode = (node, level) => {
      if (!node) return;

      // Traitement des éléments HTML
      if (node.nodeType === 1) {
        const nodeLevel = this.calculateNodeLevel(node, level);
        
        // Détection des compétences
        if (node.classList.contains('space-y-2')) {
          const skill = this.processSkillElement(node);
          if (skill) {
            content.push(skill);
            return;
          }
        }

        // Gestion des sections et titres
        if (node.tagName?.match(/^H[1-6]$/i)) {
          if (currentSection) {
            content.push(currentSection);
          }
          currentSection = {
            type: 'section',
            level: nodeLevel,
            content: [node.textContent.trim()]
          };
          return;
        }

        // Traitement récursif des enfants
        Array.from(node.childNodes).forEach(child => {
          processNode(child, nodeLevel);
        });
      }
      // Traitement des nœuds texte
      else if (node.nodeType === 3) {
        const text = node.textContent.trim();
        if (text && !node.parentElement?.closest('.space-y-2')) {
          if (currentSection) {
            currentSection.content.push(text);
          } else {
            content.push({
              type: 'text',
              content: text,
              level: level
            });
          }
        }
      }
    };

    processNode(element, baseLevel);

    // Ajout de la dernière section
    if (currentSection && currentSection.content.length > 0) {
      content.push(currentSection);
    }

    return this.cleanContent(content);
  }

  /**
   * Nettoie et valide le contenu extrait
   * @param {Array} content - Contenu brut
   * @returns {Array} Contenu nettoyé et validé
   */
  cleanContent(content) {
    return content
      .filter(item => {
        if (item.type === 'skill') {
          return item.name && typeof item.value === 'number' && item.displayValue;
        }
        return item.content && item.content.length > 0;
      })
      .map(item => {
        if (item.type === 'skill') {
          return {
            ...item,
            section: item.section || 'skills',
            type: 'skill',
            content: `${item.name}: ${item.displayValue}`
          };
        } else if (item.type === 'section') {
          return {
            section: item.section || 'unknown',
            parentSection: item.parentSection || 'unknown',
            type: 'section',
            level: item.level || 1,
            content: item.content
              .filter(text => text.length > 0)
              .map(text => text.replace(/\s+/g, ' ').trim())
          };
        } else {
          return {
            section: item.section || 'unknown',
            type: 'text',
            content: item.content
          };
        }
      })
      .filter(item => item.content !== undefined && item.content.length > 0);
  }

  /**
   * Met à jour la configuration du chat avec le contenu extrait
   * @returns {boolean} Succès de la mise à jour
   */
  updateChatConfig() {
    if (this.initialized) {
      this.log('ContentExtractor déjà initialisé');
      return true;
    }

    this.log('Début de updateChatConfig');

    // Vérification de la présence des sections
    const allSectionsFound = Object.keys(chatConfig.sections).every(sectionId => {
      const found = document.getElementById(sectionId);
      this.log(`Recherche section ${sectionId}:`, found ? 'trouvée' : 'non trouvée');
      return found;
    });

    if (!allSectionsFound) {
      this.log('Sections manquantes dans le DOM');
      return false;
    }

    // Extraction et mise à jour du contenu
    Object.keys(chatConfig.sections).forEach(sectionId => {
      const content = this.extractSectionContent(sectionId);
      if (content) {
        chatConfig.sections[sectionId].content = content;
      }
    });

    this.initialized = true;
    this.log('Initialisation terminée avec succès');
    return true;
  }

  /**
   * Vérifie si l'extracteur est initialisé
   * @returns {boolean} État d'initialisation
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Gère les logs de debug
   * @param  {...any} args Arguments à logger
   */
  log(...args) {
    if (this.debug) {
      console.log('[ContentExtractor]', ...args);
    }
  }
}

export default new ContentExtractor();