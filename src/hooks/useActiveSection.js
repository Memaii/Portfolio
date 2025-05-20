import { useState, useEffect } from 'react';

const useActiveSection = (sectionRefs = {}) => {
  const [activeSection, setActiveSection] = useState(Object.keys(sectionRefs)[0] || '');

  useEffect(() => {
    const handleScroll = () => {
      if (Object.keys(sectionRefs).length === 0) return;
      
      const mainElement = sectionRefs[Object.keys(sectionRefs)[0]].current?.closest('main');
      if (!mainElement) return;

      const scrollPosition = mainElement.scrollTop + 100;

      for (const sectionId of Object.keys(sectionRefs)) {
        const section = sectionRefs[sectionId].current;
        if (!section) continue;

        const offsetTop = section.offsetTop;
        const offsetBottom = offsetTop + section.offsetHeight;

        if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
          setActiveSection(sectionId);
          break;
        }
      }
    };

    const mainElement = sectionRefs[Object.keys(sectionRefs)[0]]?.current?.closest('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [sectionRefs]);

  return [activeSection, setActiveSection];
};

export { useActiveSection };
