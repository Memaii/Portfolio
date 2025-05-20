import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopButton = ({ aboutRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const main = document.querySelector('main');

    const handleScroll = () => {
      if (main) {
        setIsVisible(main.scrollTop > 300);
      }
    };

    if (main) {
      main.addEventListener('scroll', handleScroll);
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToAbout = () => {
    const section = aboutRef?.current;
    const main = document.querySelector('main');

    if (section && main) {
      const offsetTop = section.offsetTop - 80; // nav height
      main.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToAbout}
      className={`
        fixed bottom-6 left-6 z-50 p-4 rounded-full 
        animate-pulse transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        bg-blue-500 hover:bg-blue-600 text-white
        shadow-[0_0_10px_rgba(96,165,250,0.5)] backdrop-blur-md
      `}
      aria-label="Remonter en haut"
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
};

export default ScrollToTopButton;
