import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            {languages.find((l) => l.code === language)?.name || "Language"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as any)}
            className={language === lang.code ? "bg-blue-100" : ""}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
            {language === lang.code && <span className="ml-2">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
