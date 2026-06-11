import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { marked } from 'marked';
import { useNavigate } from 'react-router-dom';
import { useWhatsNewStore } from '../../stores/whatsNewStore';
import { formatReleaseDate } from '../../lib/github';
import { MobileBottomSheet } from './MobileBottomSheet';

export const WhatsNewModal: React.FC = () => {
  const { shouldShow, latestRelease, allReleases, markAsSeen } = useWhatsNewStore();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (shouldShow && latestRelease) {
      setIsRendered(true);
      // Small delay for entrance animation
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, latestRelease]);

  if (!isRendered || !latestRelease) return null;

  const handleRemindLater = () => {
    useWhatsNewStore.setState({ shouldShow: false });
  };

  const handleSeeAll = () => {
    useWhatsNewStore.setState({ shouldShow: false });
    navigate('/settings', { state: { tab: 'about' } });
  };

  const parsedBody = latestRelease.body ? marked.parse(latestRelease.body) : '';

  const modalContent = (
    <>
        {/* Header - Gradient */}
        <div 
          className="h-[80px] shrink-0 flex items-center justify-between px-6"
          style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }}
        >
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={20} className="text-white" />
            <h2 className="font-heading font-bold text-xl text-white m-0 leading-none">What's New</h2>
          </div>
          <button 
            onClick={handleRemindLater}
            className="text-white/80 hover:text-white p-1 rounded-full transition-colors bg-black/10 hover:bg-black/20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Header - Meta */}
        <div className="bg-surface px-6 py-3 border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="bg-primary/15 text-primary rounded-full px-3 py-1 text-sm font-mono font-medium">
            {latestRelease.tagName}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-faint text-sm">{formatReleaseDate(latestRelease.publishedAt)}</span>
            <span className="text-border-subtle text-sm">|</span>
            <a 
              href={latestRelease.htmlUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-primary text-sm hover:underline"
            >
              View on GitHub ↗
            </a>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {parsedBody ? (
            <div 
              className="release-notes"
              dangerouslySetInnerHTML={{ __html: parsedBody as string }}
            />
          ) : (
            <p className="text-muted text-sm text-center py-4">No release notes for this version.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle shrink-0 flex items-center justify-between bg-surface">
          <div>
            {allReleases.length > 1 && (
              <button 
                onClick={handleSeeAll}
                className="text-primary text-sm hover:underline"
              >
                See all releases ↗
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRemindLater}
              className="px-4 py-2 text-muted text-sm hover:text-main hover:bg-elevated rounded-xl transition-colors"
            >
              Remind me later
            </button>
            <button 
              onClick={markAsSeen}
              className="px-5 py-2 bg-primary text-on-primary text-sm font-medium rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              Got it! 🎉
            </button>
          </div>
        </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <MobileBottomSheet isOpen={isVisible} onClose={handleRemindLater} maxHeight="90vh">
          <div className="flex flex-col h-full w-full bg-base overflow-hidden relative" style={{ minHeight: '60vh' }}>
            {modalContent}
          </div>
        </MobileBottomSheet>
        <style>{`
          .release-notes h1, .release-notes h2, .release-notes h3 {
            font-family: var(--font-heading, inherit);
            font-weight: 700;
            color: var(--color-main);
            margin-top: 16px;
            margin-bottom: 8px;
          }
          .release-notes h2 { font-size: 1.125rem; }
          .release-notes h3 { font-size: 1rem; }
          .release-notes p {
            color: var(--color-muted);
            font-size: 0.875rem;
            line-height: 1.7;
            margin-bottom: 12px;
          }
          .release-notes ul, .release-notes ol {
            color: var(--color-muted);
            font-size: 0.875rem;
            padding-left: 1.25rem;
            margin-bottom: 12px;
          }
          .release-notes ul { list-style-type: disc; }
          .release-notes ol { list-style-type: decimal; }
          .release-notes li {
            font-size: 0.875rem;
            margin-bottom: 4px;
          }
          .release-notes li::marker {
            color: var(--color-primary);
          }
          .release-notes strong {
            color: var(--color-main);
            font-weight: 600;
          }
          .release-notes code {
            background-color: var(--color-bg-elevated);
            border-radius: 6px;
            padding: 2px 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.75rem;
            color: var(--color-primary);
          }
          .release-notes pre {
            background-color: var(--color-bg-elevated);
            border-radius: 12px;
            padding: 16px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.75rem;
            overflow-x: auto;
            margin-bottom: 12px;
          }
          .release-notes pre code {
            background-color: transparent;
            padding: 0;
            color: var(--color-main);
          }
          .release-notes a {
            color: var(--color-primary);
            text-decoration: none;
          }
          .release-notes a:hover {
            text-decoration: underline;
          }
          .release-notes hr {
            border: 0;
            border-top: 1px solid var(--color-border-subtle);
            margin: 16px 0;
          }
          .release-notes blockquote {
            border-left: 4px solid var(--color-primary);
            padding-left: 16px;
            color: var(--color-muted);
            font-style: italic;
            margin: 12px 0;
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleRemindLater}
      />

      {/* Modal Container */}
      <div 
        className={`relative w-[95vw] sm:w-[560px] max-h-[80vh] bg-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {modalContent}
      </div>
      
      {/* Scoped Styles for Markdown */}
      <style>{`
        .release-notes h1, .release-notes h2, .release-notes h3 {
          font-family: var(--font-heading, inherit);
          font-weight: 700;
          color: var(--color-main);
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .release-notes h2 { font-size: 1.125rem; }
        .release-notes h3 { font-size: 1rem; }
        .release-notes p {
          color: var(--color-muted);
          font-size: 0.875rem;
          line-height: 1.7;
          margin-bottom: 12px;
        }
        .release-notes ul, .release-notes ol {
          color: var(--color-muted);
          font-size: 0.875rem;
          padding-left: 1.25rem;
          margin-bottom: 12px;
        }
        .release-notes ul { list-style-type: disc; }
        .release-notes ol { list-style-type: decimal; }
        .release-notes li {
          font-size: 0.875rem;
          margin-bottom: 4px;
        }
        .release-notes li::marker {
          color: var(--color-primary);
        }
        .release-notes strong {
          color: var(--color-main);
          font-weight: 600;
        }
        .release-notes code {
          background-color: var(--color-bg-elevated);
          border-radius: 6px;
          padding: 2px 6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.75rem;
          color: var(--color-primary);
        }
        .release-notes pre {
          background-color: var(--color-bg-elevated);
          border-radius: 12px;
          padding: 16px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.75rem;
          overflow-x: auto;
          margin-bottom: 12px;
        }
        .release-notes pre code {
          background-color: transparent;
          padding: 0;
          color: var(--color-main);
        }
        .release-notes a {
          color: var(--color-primary);
          text-decoration: none;
        }
        .release-notes a:hover {
          text-decoration: underline;
        }
        .release-notes hr {
          border: 0;
          border-top: 1px solid var(--color-border-subtle);
          margin: 16px 0;
        }
        .release-notes blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: 16px;
          color: var(--color-muted);
          font-style: italic;
          margin: 12px 0;
        }
      `}</style>
    </div>
  );
};
