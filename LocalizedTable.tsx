import { useLanguage } from "@/contexts/LanguageContext";
import { ReactNode } from "react";

interface LocalizedTableProps {
  children: ReactNode;
  className?: string;
}

export default function LocalizedTable({
  children,
  className = "",
}: LocalizedTableProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const isChinese = language === "zh";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
      className={`
        w-full overflow-x-auto
        ${isChinese ? "text-sm" : ""}
        ${className}
      `}
    >
      <table
        className={`
          w-full border-collapse
          ${isRTL ? "rtl" : "ltr"}
        `}
      >
        {children}
      </table>
    </div>
  );
}

interface LocalizedTableHeaderProps {
  children: ReactNode;
}

export function LocalizedTableHeader({
  children,
}: LocalizedTableHeaderProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <thead
      className={`
        bg-slate-100 border-b border-slate-200
        ${isRTL ? "text-right" : "text-left"}
      `}
    >
      {children}
    </thead>
  );
}

interface LocalizedTableCellProps {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

export function LocalizedTableCell({
  children,
  align = "left",
  className = "",
}: LocalizedTableCellProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  let textAlign = align;
  if (isRTL && align === "left") {
    textAlign = "right";
  } else if (isRTL && align === "right") {
    textAlign = "left";
  }

  return (
    <td
      className={`
        px-4 py-2 border-b border-slate-200
        text-${textAlign}
        ${className}
      `}
      style={{ textAlign }}
    >
      {children}
    </td>
  );
}

interface LocalizedTableHeaderCellProps {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

export function LocalizedTableHeaderCell({
  children,
  align = "left",
  className = "",
}: LocalizedTableHeaderCellProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  let textAlign = align;
  if (isRTL && align === "left") {
    textAlign = "right";
  } else if (isRTL && align === "right") {
    textAlign = "left";
  }

  return (
    <th
      className={`
        px-4 py-3 font-semibold text-slate-900
        text-${textAlign}
        ${className}
      `}
      style={{ textAlign }}
    >
      {children}
    </th>
  );
}
