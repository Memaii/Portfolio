import React from 'react';
import { Menu } from 'lucide-react';

export const MenuMobile = ({ isOpen, onClose, activeSection, onSectionClick, menuItems }) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity z-40 
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-gray-800 border-l border-gray-700 
          transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-blue-400">Menu</h3>
        </div>
        
        <div className="py-4">
          {menuItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                onSectionClick(id);
                onClose();
              }}
              className={`w-full flex items-center space-x-2 px-4 py-3 transition-colors
                ${activeSection === id ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
