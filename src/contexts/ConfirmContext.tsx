import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MobileBottomSheet } from '../components/ui/MobileBottomSheet';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver({ resolve });
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver.resolve(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver.resolve(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        isMobile ? (
          <MobileBottomSheet isOpen={isOpen} onClose={handleCancel} maxHeight="50vh" showDragHandle={false}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-full ${options.isDanger ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
                  <AlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-heading font-bold text-main">{options.title}</h2>
              </div>
              <p className="text-muted leading-relaxed mb-6">{options.message}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-main bg-base hover:bg-border-subtle transition-colors"
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-white transition-colors shadow-sm ${
                    options.isDanger ? 'bg-danger hover:bg-[#cc0000]' : 'bg-primary hover:bg-primary-hover'
                  }`}
                >
                  {options.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </MobileBottomSheet>
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-full ${options.isDanger ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <h2 className="text-xl font-heading font-bold text-main">{options.title}</h2>
                </div>
                <p className="text-muted leading-relaxed mb-6">{options.message}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-main bg-base hover:bg-border-subtle transition-colors"
                  >
                    {options.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-white transition-colors shadow-sm ${
                      options.isDanger ? 'bg-danger hover:bg-[#cc0000]' : 'bg-primary hover:bg-primary-hover'
                    }`}
                  >
                    {options.confirmText || 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </ConfirmContext.Provider>
  );
};
