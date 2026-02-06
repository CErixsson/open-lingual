import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Language {
  id: string;
  code: string;
  name: string;
  flag_emoji: string | null;
}

interface LanguageSelectorProps {
  languages: Language[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function LanguageSelector({ languages, selectedId, onSelect }: LanguageSelectorProps) {
  return (
    <Select value={selectedId || undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-[200px] bg-card border-border/50">
        <SelectValue placeholder="Välj språk…" />
      </SelectTrigger>
      <SelectContent>
        {languages.map(lang => (
          <SelectItem key={lang.id} value={lang.id}>
            <span className="flex items-center gap-2">
              <span>{lang.flag_emoji}</span>
              <span>{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
