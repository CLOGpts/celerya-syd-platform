import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface DocumentSplitViewProps {
  originalFileUrl?: string | null;
  children: ReactNode;
  className?: string;
}

const DocumentSplitView: React.FC<DocumentSplitViewProps> = ({
  originalFileUrl,
  children,
  className = ''
}) => {
  const [leftWidth, setLeftWidth] = useState(50); // Percentuale larghezza pannello sinistro
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Rileva se è mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Gestione drag del divisore
  const handleMouseDown = useCallback(() => {
    if (!isMobile) {
      setIsDragging(true);
    }
  }, [isMobile]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || isMobile) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

    // Limita tra 20% e 80%
    const clampedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
    setLeftWidth(clampedWidth);
  }, [isDragging, isMobile]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event listeners per mouse
  useEffect(() => {
    if (isDragging && !isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, isMobile]);

  // Rendering condizionale per mobile
  if (isMobile) {
    return (
      <div className={`bg-gray-900 h-full flex flex-col ${className}`}>
        {/* Vista mobile: stack verticale */}
        {originalFileUrl && (
          <div className="h-64 border-b border-gray-700">
            <div className="h-full p-2">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Documento Originale</h3>
              <embed
                src={originalFileUrl}
                type="application/pdf"
                className="w-full h-48 border border-gray-700 rounded bg-gray-800"
                title="Documento originale"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Output Elaborato</h3>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Vista desktop: split orizzontale
  return (
    <div
      ref={containerRef}
      className={`bg-gray-900 h-full flex ${className}`}
      style={{ minHeight: '500px' }}
    >
      {/* Pannello Sinistro - Documento Originale */}
      <div
        className="flex flex-col border-r border-gray-700 bg-gray-900"
        style={{ width: `${leftWidth}%` }}
      >
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">Documento Originale</h3>
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          {originalFileUrl ? (
            <div className="h-full flex flex-col">
              <embed
                src={originalFileUrl}
                type="application/pdf"
                className="flex-1 w-full border border-gray-700 rounded bg-gray-800"
                title="Documento originale"
                style={{ minHeight: '400px' }}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">Nessun documento caricato</p>
                <p className="text-gray-500 text-xs mt-1">Il documento originale apparirà qui</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divisore Draggable */}
      <div
        className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors relative group ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Pannello Destro - Output Elaborato */}
      <div
        className="flex flex-col bg-gray-900"
        style={{ width: `${100 - leftWidth}%` }}
      >
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">Output Elaborato</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DocumentSplitView;