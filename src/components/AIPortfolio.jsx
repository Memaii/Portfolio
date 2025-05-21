import React, { useState, useRef, useEffect } from 'react';
import { CircleUser, Cpu, Code, Database, Box, Volume2, Github, Linkedin, MessagesSquare, ExternalLink, Menu} from 'lucide-react'; // ExternalLink supprimé
import { useActiveSection } from '../hooks/useActiveSection';
import { MenuMobile } from './MenuMobile'; // Correction ici
import AIChat, { ChatToggleButton } from './Chatbot/AIChat';
import ContentExtractor from '../services/content/ContentExtractor';
import ScrollToTopButton from './ScrollToTopButton';
import BubblesBackground from './BubblesBackground';


// Navigation principale
const MENU_ITEMS = [
  { id: 'about', icon: CircleUser, label: 'A propos' },
  { id: 'skills', icon: Cpu, label: 'Compétences' },
  { id: 'projects', icon: Code, label: 'Projets' },
  { id: 'contact', icon: MessagesSquare, label: 'Contact' }
];

const SOCIAL_LINKS = [
  {
    href: 'https://github.com/Memaii',
    icon: Github,
    label: 'GitHub'
  },
  {
    href: 'https://linkedin.com/in/blackliss',
    icon: Linkedin,
    label: 'LinkedIn'
  }
];


// Composant carte avec effet néon et badge de statut (maintenant conditionnel)
const FeatureCard = ({ icon: Icon, title, description, status, url, imgSrc }) => {
  const CardContent = (
    <div className="relative group transform transition-all duration-300 hover:scale-105 h-full"> {/* h-full pour que toutes les cartes aient la même hauteur */}
      <div className="absolute -inset-0.5 bg-blue-500/10 blur-sm rounded-3xl group-hover:bg-blue-400/20" />
      
      {/* La carte interne avec le contenu */}
      <div className="relative bg-gray-800/90 rounded-2xl border border-gray-700 h-full flex flex-col overflow-hidden"> {/* overflow-hidden pour que l'image épouse les bords arrondis */}
        
        {/* L'image est affichée en haut de la carte si imgSrc est fourni */}
        {imgSrc && (
          // Conteneur de l'image avec une hauteur fixe et un fond pour les logos "containés"
          <div className="w-full h-40 flex-shrink-0 bg-gray-700/50 flex items-center justify-center">
            <img 
              src={imgSrc} 
              alt={title} 
              // object-contain pour s'assurer que l'image entière est visible
              // rounded-t-2xl pour les coins supérieurs arrondis de l'image qui épousent ceux de la carte
              className="object-contain w-full h-full rounded-t-2xl" 
            />
          </div>
        )}

        {/* Le contenu textuel de la carte */}
        <div className="p-6 flex flex-col flex-grow"> {/* Ajout de padding ici pour le texte */}
          <div className="flex items-center justify-between mb-4">
            {/* L'icône (si fournie) est affichée ici */}
            {Icon && (
              <div className="p-3 rounded-full bg-blue-500/20 w-fit">
                <Icon className="w-6 h-6 text-blue-400" />
              </div>
            )}
            {/* Le badge de statut s'affiche SEULEMENT si la prop 'status' est fournie et non vide */}
            {status && (
              <span className={`
                text-[11px] tracking-wide font-medium uppercase px-2 py-0.5 rounded
                ${status === 'En cours'
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  : 'bg-green-500/10 text-green-400 border border-green-500/30'}
              `}>
                {status}
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          {/* flex-grow assure que la description prend l'espace restant,
              ce qui aide à aligner les bas des cartes si les descriptions sont de longueurs différentes */}
          <p className="text-gray-400 flex-grow">{description}</p>
        </div>
      </div>
    </div>
  );

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      {CardContent}
    </a>
  ) : CardContent;
};


// Le composant SkillRadar est complètement supprimé
// car il n'est plus utilisé.


// Composant principal
const AIPortfolio = () => {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Étape 1 : Préparation des États React pour le Formulaire de Contact
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    privacyConsent: false,
    _gotcha: '' // Formspree honeypot field
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
  if (formSubmitted && (Object.keys(formErrors).length === 0 || formErrors.general)) {
    const timer = setTimeout(() => {
      setFormSubmitted(false);
      setFormErrors({}); // Réinitialiser aussi les erreurs
    }, 5000); // Le message disparaît après 5 secondes (5000 millisecondes)

    return () => clearTimeout(timer); // Nettoyage du timer si le composant est démonté ou si l'état change
  }
}, [formSubmitted, formErrors]);

  const sectionRefs = {
    about: useRef(null),
    skills: useRef(null),
    projects: useRef(null),
    contact: useRef(null)
  };

  const [activeSection, setActiveSection] = useActiveSection(sectionRefs);
  const scrollToSection = (sectionId) => {
    const section = sectionRefs[sectionId].current;
    if (section) {
      const mainElement = section.closest('main');
      const navHeight = 80;
      const targetPosition = section.offsetTop - navHeight;

      mainElement.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      setActiveSection(sectionId);
      setIsMobileMenuOpen(false);
    }
  };

  // Nouvelle structure pour les compétences avec images
  const skillsData = [
    {
      imgSrc: '/images/skills/html_css.png', // Chemin vers votre image HTML/CSS
      title: 'HTML/CSS',
      description: 'Maîtrise complète de HTML5 et CSS3 pour des interfaces web structurées et stylisées. Forte compétence en responsive design et SASS/LESS.',
    },
    {
      imgSrc: '/images/skills/php.png', // Chemin vers votre image PHP
      title: 'PHP',
      description: 'Développement backend robuste avec PHP, incluant la conception d\'APIs RESTful et la gestion de bases de données.',
    },
    {
      imgSrc: '/images/skills/javascript.png', // Chemin vers votre image JavaScript
      title: 'JavaScript',
      description: 'Expertise en JavaScript ES6+ pour le développement web interactif, incluant le DOM, AJAX, et les frameworks modernes.',
    },
    {
      imgSrc: '/images/skills/python.png', // Chemin vers votre image Python
      title: 'Python',
      description: 'Bonne connaissance de Python pour le scripting, l\'automatisation, le traitement de données et les bases en machine learning.',
    },
    {
      imgSrc: '/images/skills/sql.png', // Chemin vers votre image SQL
      title: 'SQL',
      description: 'Conception et optimisation de bases de données relationnelles (MySQL, PostgreSQL) avec SQL, gestion des requêtes complexes.',
    },
    {
      imgSrc: '/images/skills/laravel.png', // Chemin vers votre image Laravel
      title: 'Laravel',
      description: 'Développement d\'applications web avec le framework PHP Laravel, utilisation d\'Eloquent ORM et des fonctionnalités MVC.',
    },
    {
      imgSrc: '/images/skills/react_vite.png', // Chemin vers votre image React/Vite
      title: 'React/Vite',
      description: 'Développement d\'interfaces utilisateur modernes avec React.js, gestion des états, hooks et intégration avec Vite pour le tooling rapide.',
    },
    {
      imgSrc: '/images/skills/tensorflow_pytorch.png', // Chemin vers votre image TensorFlow/PyTorch
      title: 'TensorFlow / PyTorch',
      description: 'Initiation et exploration des librairies TensorFlow et PyTorch pour des projets de machine learning et deep learning.',
    },
    {
      imgSrc: '/images/skills/vscode.png', // Chemin vers votre image VSCode
      title: 'Visual Studio Code',
      description: 'Utilisation avancée de VS Code comme environnement de développement intégré, avec extensions et débogage efficaces.',
    },
    {
      imgSrc: '/images/skills/git.png', // Chemin vers votre image Git
      title: 'Git',
      description: 'Gestion de version avec Git et GitHub pour le travail collaboratif, le suivi des modifications et le déploiement.',
    },
    {
      imgSrc: '/images/skills/english.png', // Chemin vers votre image Anglais
      title: 'Anglais',
      description: 'Niveau d\'anglais intermédiaire, suffisant pour la lecture de documentation technique et la communication basique.',
    },
  ];

  useEffect(() => {
    const initializeContent = () => {
      if (!ContentExtractor.isInitialized()) {
        const success = ContentExtractor.updateChatConfig();
        if (!success) {
          setTimeout(initializeContent, 500);
        }
      }
    };

    initializeContent();
  }, []);

  // Étape 2.1 : handleChange (Gestion des changements d'input)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Réinitialiser l'erreur spécifique au champ modifié et le statut formSubmitted
    setFormErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    setFormSubmitted(false);
  };

  // Étape 2.2 : validateForm (Fonction de Validation)
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis.';
    }
    if (!formData.email.trim()) {
      errors.email = 'L\'adresse e-mail est requise.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'L\'adresse e-mail n\'est pas valide.';
    }
    if (!formData.message.trim()) {
      errors.message = 'Le message est requis.';
    }
    if (!formData.privacyConsent) {
      errors.privacyConsent = 'Vous devez accepter la politique de confidentialité.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Étape 2.3 : handleSubmit (Gestion de la Soumission du Formulaire)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Logique Honeypot de Formspree (_gotcha)
    // Ici, on vérifie si le champ _gotcha a été rempli. S'il l'est, c'est un bot.
    if (formData._gotcha) {
      console.log('Tentative de bot détectée et bloquée (honeypot Formspree).');
      // Pour les bots, on peut simuler un succès pour ne pas les alerter
      setFormSubmitted(true);
      setFormData({
        name: '',
        email: '',
        message: '',
        privacyConsent: false,
        _gotcha: ''
      });
      return;
    }

    if (!validateForm()) {
      setFormSubmitted(true); // Indique qu'une soumission a été tentée avec des erreurs
      setFormErrors(prev => ({
        ...prev,
        general: 'Veuillez corriger les erreurs dans le formulaire.'
      }));
      return;
    }

    setIsSubmitting(true);
    setFormErrors({}); // Clear any previous errors

    try {
      // Construction manuelle du FormData pour l'envoi à Formspree
      // On crée un objet FormData à partir du formulaire HTML.
      // Cela permet à Formspree de traiter les champs correctement.
      const data = new FormData(e.target);

      const response = await fetch('https://formspree.io/f/votre-id-unique-formspree', { // <-- REMPLACEZ CETTE URL PAR LA VÔTRE DE FORMSPREE !
        method: 'POST',
        body: data, // Formspree accepte FormData directement
        headers: {
          'Accept': 'application/json' // Demande une réponse JSON de Formspree
        }
      });

      if (response.ok) {
        setFormSubmitted(true);
        // Réinitialiser les champs du formulaire après succès
        setFormData({
          name: '',
          email: '',
          message: '',
          privacyConsent: false,
          _gotcha: '' // Réinitialiser le honeypot aussi
        });
        console.log('Formulaire soumis avec succès à Formspree !');
      } else {
        // Formspree peut renvoyer des erreurs (ex: validation, spam détecté côté Formspree)
        const result = await response.json();
        setFormSubmitted(true);
        setFormErrors({ general: result.errors ? result.errors.map(err => err.message).join(', ') : 'Une erreur est survenue lors de l\'envoi via Formspree.' });
        console.error('Erreur lors de la soumission à Formspree :', result);
      }
    } catch (error) {
      console.error('Erreur réseau lors de la soumission à Formspree :', error);
      setFormSubmitted(true);
      setFormErrors({ general: 'Impossible de se connecter au service d\'envoi. Veuillez réessayer plus tard.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen text-white bg-[#111827]">
      <BubblesBackground />
      {/* Contenu principal */}
      <div className="relative z-10">
        {/* Navigation fixe */}
        <nav className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-50 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-8">
                <span className="text-xl font-bold text-blue-400">Brice Chevalier</span>
                <div className="hidden md:flex items-center space-x-4">
                  {MENU_ITEMS.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => scrollToSection(id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300
                        ${activeSection === id ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="hidden md:flex items-center space-x-4">
                {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden lg:inline">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Sections principales */}
        <main className="h-screen overflow-y-scroll snap-mandatory snap-y scrollbar-none">
          {/* About Section */}
          <section
            ref={sectionRefs.about}
            id="about"
            className="min-h-screen flex items-center py-20 snap-start px-4 sm:px-0"
          >
            <div className="max-w-7xl mx-auto px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    Data Scientist & AI Engineer
                  </h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Passionné par l'intelligence artificielle et l'analyse de données,
                    j'espère développer des solutions innovantes qui transforment les données
                    en insights actionnables.
                  </p>
                </div>

                {/* Partie portrait simplifiée */}
                <div className="lg:col-start-2 flex justify-center">
                  {/* Affichage d'une image statique, sans animation */}
                  <div className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] relative">
                    <img
                      src="/images/AI_1.png"
                      alt="AI Portrait"
                      className="
                        w-full h-full object-cover rounded-full
                        border-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]
                        border-blue-500/30
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section
            ref={sectionRefs.skills}
            id="skills"
            className="min-h-screen flex items-center py-20 snap-start px-4 sm:px-0"
          >
            <div className="max-w-7xl mx-auto px-8">
              <h2 className="text-4xl font-bold text-center mb-12">Compétences Techniques</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Mapping sur skillsData pour afficher les cartes de compétences */}
                {skillsData.map((skill, index) => (
                  <FeatureCard
                    key={index} // Utilisez une clé unique, l'index est acceptable si la liste est statique
                    imgSrc={skill.imgSrc}
                    title={skill.title}
                    description={skill.description}
                    // Pas de prop 'status' ici, donc le badge ne s'affichera pas
                    // Pas de prop 'icon' non plus, car l'image est utilisée à la place
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Projects Section (INCHANGÉE, CONTINUE D'UTILISER 'icon' ET 'status') */}
          <section
            ref={sectionRefs.projects}
            id="projects"
            className="min-h-screen flex items-center py-20 snap-start px-4 sm:px-0"
          >
            <div className="max-w-7xl mx-auto px-8">
              <h2 className="text-4xl font-bold text-center mb-12">Projets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard
                  icon={Database}
                  title="Système R.A.G"
                  description="Pipeline de génération augmentée par récupération, combinant recherche vectorielle et LLM pour des réponses précises"
                  status="En cours" // Le statut est bien présent pour les projets
                />
                <FeatureCard
                  icon={Box}
                  title="Infrastructure Docker"
                  description="Conteneurisation et orchestration d'applications via Docker pour un déploiement léger et reproductible"
                  status="Terminé" // Le statut est bien présent pour les projets
                />
                <FeatureCard
                  icon={Volume2}
                  title="Soundboard en Rust"
                  description="Interface audio interactive développée en Rust, permettant de déclencher des sons avec faible latence"
                  status="En cours" // Le statut est bien présent pour les projets
                />
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section
            ref={sectionRefs.contact}
            id="contact"
            className="min-h-screen flex items-center py-20 snap-start px-4 sm:px-0"
          >
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-8">
              <h2 className="text-4xl font-bold text-center mb-12">Contact</h2>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-[2px]" />
                <form
                  className="relative space-y-8 p-8 sm:p-12 bg-gray-800/90 rounded-2xl border border-gray-700 backdrop-blur-sm"
                  onSubmit={handleSubmit}
                >
                  {/* Messages généraux de succès/erreur */}
                  {formSubmitted && Object.keys(formErrors).length === 0 && (
                    <div className="p-4 rounded-lg border border-green-500 bg-green-600/20 text-green-300">
                      Votre message a été envoyé avec succès !
                    </div>
                  )}
                  {formSubmitted && Object.keys(formErrors).length > 0 && formErrors.general && (
                    <div className="p-4 rounded-lg border border-red-500 bg-red-600/20 text-red-300">
                      {formErrors.general}
                    </div>
                  )}

                  {/* Champ Nom */}
                  <div className="space-y-3">
                    <label htmlFor="name" className="text-sm text-gray-400">Nom</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      className="w-full px-6 py-3 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    />
                    {formErrors.name && <p className="text-red-400 text-sm">{formErrors.name}</p>}
                  </div>

                  {/* Champ Email */}
                  <div className="space-y-3">
                    <label htmlFor="email" className="text-sm text-gray-400">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre.email@exemple.com"
                      className="w-full px-6 py-3 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    />
                    {formErrors.email && <p className="text-red-400 text-sm">{formErrors.email}</p>}
                  </div>

                  {/* Champ Message */}
                  <div className="space-y-3">
                    <label htmlFor="message" className="text-sm text-gray-400">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="6"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Votre message..."
                      className="w-full px-6 py-3 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    />
                    {formErrors.message && <p className="text-red-400 text-sm">{formErrors.message}</p>}
                  </div>

                  {/* Champ Honeypot (masqué) */}
                  {/* Pour le honeypot de Formspree, il doit être dans le DOM pour que FormData le capture */}
                  {/* On utilise une classe utilitaire Tailwind pour le masquer et le rendre inaccessible */}
                  <div className="absolute opacity-0 pointer-events-none -z-50">
                    <label htmlFor="_gotcha" className="sr-only">Ne remplissez pas ce champ</label>
                    <input
                      type="text"
                      id="_gotcha"
                      name="_gotcha"
                      value={formData._gotcha}
                      onChange={handleChange}
                      tabIndex="-1" // Empêche la mise au point par tabulation
                      autoComplete="off" // Empêche l'autocomplétion du navigateur
                    />
                  </div>

                  {/* Case à cocher RGPD */}
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      name="privacyConsent"
                      checked={formData.privacyConsent}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700/50 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="privacyConsent" className="text-gray-400 text-sm cursor-pointer">
                      J'accepte la politique de confidentialité et les conditions d'utilisation.
                    </label>
                  </div>
                  {formErrors.privacyConsent && <p className="text-red-400 text-sm">{formErrors.privacyConsent}</p>}

                  {/* Bouton Envoyer */}
                  <button
                    type="submit"
                    className={`w-full px-6 py-4 rounded-lg text-lg transition-all duration-300
                      ${!formData.privacyConsent || isSubmitting
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'}`}
                    disabled={!formData.privacyConsent || isSubmitting}
                  >
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>
        <ScrollToTopButton aboutRef={sectionRefs.about} />

        {/* Console IA et bouton toggle */}
        <ChatToggleButton
          onClick={() => setIsConsoleOpen(true)}
          isOpen={isConsoleOpen}
        />
        <AIChat
          isOpen={isConsoleOpen}
          onClose={() => setIsConsoleOpen(false)}
          onSendMessage={(message) => {
            // TODO: Implémenter la logique de traitement des messages
          }}
        />

        <MenuMobile
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeSection={activeSection}
          onSectionClick={scrollToSection}
          menuItems={MENU_ITEMS}
        />

      </div>
    </div>
  );
};

export default AIPortfolio;