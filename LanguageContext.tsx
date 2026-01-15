import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Language, getTranslation } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage
    const saved = localStorage.getItem("language") as Language | null;
    return saved || "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    applyLanguageStyles(lang);
  };

  // Apply language styles on mount and when language changes
  useEffect(() => {
    applyLanguageStyles(language);
  }, [language]);

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function applyLanguageStyles(lang: Language) {
  const html = document.documentElement;
  
  // Set direction and language
  if (lang === "ar") {
    html.dir = "rtl";
    html.lang = "ar";
    html.style.fontFamily = "'Noto Sans AR', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  } else if (lang === "zh") {
    html.dir = "ltr";
    html.lang = "zh";
    html.style.fontFamily = "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  } else {
    html.dir = "ltr";
    html.lang = "en";
    html.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";
  }
  
  // Apply language-specific attributes to body
  document.body.setAttribute("lang", lang);
  document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
