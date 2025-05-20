import React from 'react';

const ParticleBackground = () => {
  // Crée un tableau de 200 éléments pour générer les bulles
  const circles = Array.from({ length: 200 }, (_, i) => (
    <div key={i} className="circle-container">
      <div className="circle"></div>
    </div>
  ));

  return (
    // Le conteneur principal de l'animation
    // Il prendra la place du div .container de l'HTML d'origine
    // Nous allons l'adapter pour qu'il ne définisse que la position et la taille de l'animation
    <div className="particle-animation-container">
      {circles}
    </div>
  );
};

export default ParticleBackground;