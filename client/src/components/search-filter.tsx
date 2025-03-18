import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SearchFilterProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchFilter({ value, onChange }: SearchFilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search projects..."
        className="pl-10"
      />
    </div>
  );
}
