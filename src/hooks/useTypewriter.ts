import { useState, useEffect } from 'react';

interface UseTypewriterProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  startDelay?: number;
}

export const useTypewriter = ({
  texts,
  typingSpeed = 60,
  deletingSpeed = 35,
  pauseDuration = 2500,
  startDelay = 400,
}: UseTypewriterProps) => {
  const [isMobile] = useState(() => window.innerWidth < 768);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isMobile || !texts || texts.length === 0) return;

    let timeout: ReturnType<typeof setTimeout>;
    const currentFullText = texts[currentIndex];

    const handleTyping = () => {
      if (isTyping) {
        if (displayText.length < currentFullText.length) {
          // Still typing
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
          timeout = setTimeout(handleTyping, typingSpeed);
        } else {
          // Finished typing, wait before deleting
          setIsTyping(false);
          timeout = setTimeout(handleTyping, pauseDuration);
        }
      } else {
        if (displayText.length > 0) {
          // Still deleting
          setDisplayText(currentFullText.slice(0, displayText.length - 1));
          timeout = setTimeout(handleTyping, deletingSpeed);
        } else {
          // Finished deleting, move to next text and start typing
          setIsTyping(true);
          setCurrentIndex((prev) => (prev + 1) % texts.length);
        }
      }
    };

    if (displayText === '' && isTyping) {
      timeout = setTimeout(handleTyping, startDelay);
    } else {
      timeout = setTimeout(handleTyping, isTyping ? typingSpeed : deletingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentIndex, texts, typingSpeed, deletingSpeed, pauseDuration, startDelay, isMobile]);

  return isMobile ? { displayText: '', isTyping: false } : { displayText, isTyping };
};
