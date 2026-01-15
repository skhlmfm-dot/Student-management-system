import { useLanguage } from "@/contexts/LanguageContext";
import { ReactNode } from "react";

interface LocalizedChartProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function LocalizedChart({
  children,
  title,
  description,
}: LocalizedChartProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const isChinese = language === "zh";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
      className={`
        w-full
        ${isRTL ? "text-right" : "text-left"}
        ${isChinese ? "text-sm" : ""}
      `}
    >
      {title && (
        <h3
          className={`
            text-lg font-bold mb-2
            ${isRTL ? "text-right" : "text-left"}
            ${isChinese ? "font-semibold" : ""}
          `}
        >
          {title}
        </h3>
      )}
      {description && (
        <p
          className={`
            text-sm text-slate-600 mb-4
            ${isRTL ? "text-right" : "text-left"}
          `}
        >
          {description}
        </p>
      )}
      <div className="w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

// Helper component for chart tooltips with language support
export function LocalizedTooltip({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string;
  unit?: string;
}) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <div
      className={`
        bg-white p-2 rounded border border-slate-200 shadow-lg
        ${isRTL ? "text-right" : "text-left"}
      `}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-sm text-slate-600">
        {value}
        {unit && ` ${unit}`}
      </p>
    </div>
  );
}
