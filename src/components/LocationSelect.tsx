import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type LocationOption = { value: string; label: string };

type LocationSelectProps = {
  id: string;
  value: string;
  options: LocationOption[];
  placeholder: string;
  searchPlaceholder: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

const defaultClassName =
  "h-10 w-full rounded-lg border-0 bg-[#eff4ff] px-3 text-sm text-[#121c2a] shadow-none focus:ring-2 focus:ring-[#006030]/20";

const LocationSelect = ({
  id,
  value,
  options,
  placeholder,
  searchPlaceholder,
  loading = false,
  disabled = false,
  className = defaultClassName,
  onChange,
}: LocationSelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={`${className} justify-between text-left font-normal`}
        >
          <span className={value ? "truncate" : "truncate text-[#6f7a6f]"}>
            {options.find((option) => option.value === value)?.label || value || placeholder}
          </span>
          <ChevronRight className="ml-2 h-4 w-4 shrink-0 rotate-90 text-[#6f7a6f]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading options…</div>
            ) : (
              <>
                <CommandEmpty>No matching locations.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default LocationSelect;
