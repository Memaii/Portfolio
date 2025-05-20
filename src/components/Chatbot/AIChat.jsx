import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import ChatSuggestions from './ChatSuggestions';
import ChatHistory from './ChatHistory';
import ChatbotService from '../../services/chat/ChatbotService';
import { useActiveSection } from '../../hooks/useActiveSection';
import SecurityError from '../../services/security/SecurityError';

// Configuration des questions suggérées (à déplacer vers chatConfig.js)
const SUGGESTED_QUESTIONS = [
  "Quel est ton parcours ?",
  "Parle-moi de tes projets en IA",
  "Quelles sont tes compétences techniques ?",
  "Comment puis-je te contacter ?"
];

// Ajouter après SUGGESTED_QUESTIONS
const sectionMappings = {
  "Quel est ton parcours ?": "about",
  "Parle-moi de tes projets en IA": "projects",
  "Quelles sont tes compétences techniques ?": "skills",
  "Comment puis-je te contacter ?": "contact"
};

export const ChatToggleButton = ({ onClick, isOpen }) => (
  <button
    onClick={onClick}
    className={`fixed bottom-8 right-8 p-4 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-all duration-300 transform ${isOpen ? 'scale-0' : 'scale-100'}`}
  >
    <MessageCircle className="w-6 h-6 text-white" />
  </button>
);

const AIChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const activeSection = useActiveSection();
  
  // Initialisation unique du service
  const chatbotServiceRef = useRef(null);
  
  useEffect(() => {
    if (!chatbotServiceRef.current) {
      chatbotServiceRef.current = ChatbotService;
    }

    // Gestionnaire de clic en dehors du chat
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      const newMessage = { content: userMessage, isUser: true };
      setMessages(prev => [...prev, newMessage]);

      // Détermination de la section cible
      let targetSection = 'all';
      if (sectionMappings[userMessage]) {
        targetSection = sectionMappings[userMessage];
      } else if (activeSection) {
        targetSection = activeSection;
      }
      
      console.log('🎯 Section ciblée:', targetSection);
      
      const response = await chatbotServiceRef.current.getResponseFromSection(
        userMessage,
        targetSection
      );

      if (response) {
        const botMessage = { content: response, isUser: false };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMessage = error instanceof SecurityError
        ? `Erreur de sécurité: ${error.message}`
        : "Désolé, je ne peux pas traiter votre demande pour le moment.";

      setMessages(prev => [...prev, {
        content: errorMessage,
        isUser: false,
        isError: true
      }]);
      
      console.error('Erreur lors du traitement du message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionSelect = (question) => {
    setInputValue(question);
  };

  return (
    <div 
      ref={chatRef}
      className={`fixed bottom-8 right-8 w-96 bg-gray-800/90 rounded-2xl border border-gray-700 backdrop-blur-sm overflow-hidden shadow-2xl transition-all duration-300 transform ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <ChatHistory messages={messages} messagesEndRef={messagesEndRef} />
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 px-4 py-2 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 text-white"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <ChatSuggestions questions={SUGGESTED_QUESTIONS} onSelect={handleSuggestionSelect} />
        </form>
      </div>
    </div>
  );
};

export default AIChat; 