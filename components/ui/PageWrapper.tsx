import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Wrapper per garantire consistenza visiva IDENTICA a SYD Cyber
 * Ogni pagina DEVE usare questo wrapper
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-full">
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
          {subtitle && <p className="text-slate-400">{subtitle}</p>}
        </div>
      )}

      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

/**
 * Card con stili ESATTI di SYD Cyber
 */
export const SydCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`bg-gray-900/50 rounded-xl p-6 shadow-2xl border border-gray-800/30 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
};

/**
 * Sezione con titolo
 */
export const SydSection: React.FC<{
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, children, actions }) => {
  return (
    <SydCard>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </SydCard>
  );
};

export default PageWrapper;