import { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RTLWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function RTLWrapper({ children, className = "" }: RTLWrapperProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const isChinese = language === "zh";

  return (
    <div
      className={`
        ${isRTL ? "rtl" : "ltr"}
        ${isChinese ? "font-chinese" : ""}
        ${className}
      `}
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      {children}
    </div>
  );
}

// Helper component for flex layouts that need to be reversed in RTL
export function RTLFlex({
  children,
  className = "",
  gap = "gap-2",
}: {
  children: ReactNode;
  className?: string;
  gap?: string;
}) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <div
      className={`flex ${gap} ${isRTL ? "flex-row-reverse" : "flex-row"} ${className}`}
    >
      {children}
    </div>
  );
}

// Helper component for grid layouts that need adjustment in RTL
export function RTLGrid({
  children,
  className = "",
  cols = "grid-cols-2",
}: {
  children: ReactNode;
  className?: string;
  cols?: string;
}) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <div
      className={`grid ${cols} ${isRTL ? "auto-cols-max" : ""} ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {children}
    </div>
  );
}

// Helper for text alignment based on language
export function RTLText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <div
      className={`
        ${isRTL ? "text-right" : "text-left"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
