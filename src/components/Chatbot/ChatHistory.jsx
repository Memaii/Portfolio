import React, { useEffect } from 'react';
import { User, Bot } from 'lucide-react';

const ChatHistory = ({ messages, messagesEndRef }) => {
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-96 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 ${
            message.isUser ? 'flex-row-reverse' : ''
          }`}
        >
          <div className={`p-2 rounded-full ${
            message.isUser ? 'bg-blue-500' : 'bg-gray-700'
          }`}>
            {message.isUser ? (
              <User className="w-5 h-5" />
            ) : (
              <Bot className="w-5 h-5" />
            )}
          </div>
          <div className={`flex-1 p-4 rounded-2xl ${
            message.isUser 
              ? 'bg-blue-500/20 text-blue-100' 
              : 'bg-gray-700/50 text-gray-100'
          }`}>
            {message.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory; 