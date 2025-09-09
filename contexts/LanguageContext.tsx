import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { translations } from '../translations';

type Language = 'it' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const storedLang = localStorage.getItem('language');
        return (storedLang === 'it' || storedLang === 'en') ? storedLang : 'it';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let translation = translations[language]?.[key] || translations['it']?.[key] || key;
        if (params) {
            Object.keys(params).forEach(paramKey => {
                translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
            });
        }
        return translation;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
