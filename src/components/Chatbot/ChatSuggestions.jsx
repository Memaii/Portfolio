import React, { useState } from 'react';

const ChatSuggestions = ({ questions, onSelect }) => {
  const [frequencies, setFrequencies] = useState({}); // Pour stocker la fréquence d'utilisation des suggestions

  const handleSelect = (question) => {
    // Mettre à jour la fréquence d'utilisation
    setFrequencies(prev => ({ 
      ...prev, 
      [question]: (prev[question] || 0) + 1 
    }));

    onSelect(question); // Passe la question au parent
  };

  // Trier les questions par fréquence décroissante
  const sortedQuestions = [...questions].sort((a, b) => (frequencies[b] || 0) - (frequencies[a] || 0));

  return (
    <div className="flex flex-wrap gap-2">
      {sortedQuestions.map((question, index) => (
        <button
          key={index}
          onClick={() => handleSelect(question)}
          className="text-sm px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 
                     rounded-full text-gray-300 hover:text-white transition-colors"
        >
          {question}
        </button>
      ))}
    </div>
  );
};

export default ChatSuggestions; 