import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  showDragHandle?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  maxHeight = '90vh',
  showDragHandle = true,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setCurrentY(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 80) {
      onClose();
    } else {
      setCurrentY(0);
    }
    setStartY(null);
  };

  if (!isOpen) return null;

  const content = isMobile ? (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="relative bg-surface w-full rounded-t-2xl border-t border-border-subtle flex flex-col transition-transform duration-200 ease-out z-10"
        style={{ 
          maxHeight, 
          transform: `translateY(${currentY}px)`,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Drag Area */}
        <div 
          className="flex-shrink-0 w-full pt-3 pb-2 flex justify-center items-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {showDragHandle && (
            <div className="w-10 h-1 bg-muted rounded-full" />
          )}
        </div>
        
        {/* Close Button if desired or just content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
        </div>
      </div>
    </div>
  ) : (
    // Desktop Centered Modal
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative bg-surface rounded-xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh] w-full max-w-2xl z-10 animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
