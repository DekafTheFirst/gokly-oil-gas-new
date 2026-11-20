import { useState } from "react";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

type Period = "AM" | "PM";

function parseTime(value: string): { hour: number; minute: number; period: Period } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value || "");
  if (!match) return null;
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour24 > 23 || minute > 59) return null;
  return {
    hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute,
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

function toTimeValue(hour: number, minute: number, period: Period) {
  const hour24 = (hour % 12) + (period === "PM" ? 12 : 0);
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatLabel(value: string) {
  const parsed = parseTime(value);
  if (!parsed) return value || "";
  const suffix = parsed.period === "PM" ? "PM" : "AM";
  return `${parsed.hour}:${String(parsed.minute).padStart(2, "0")} ${suffix}`;
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TimePicker({
  id,
  value,
  onChange,
  className,
  triggerClassName,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = parseTime(value);
  const [hour, setHour] = useState<number | null>(parsed?.hour ?? null);
  const [minute, setMinute] = useState<number | null>(parsed?.minute ?? null);
  const [period, setPeriod] = useState<Period>(parsed?.period ?? "AM");

  const commit = (h: number | null, m: number | null, p: Period) => {
    if (h !== null && m !== null) onChange(toTimeValue(h, m, p));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          const current = parseTime(value);
          setHour(current?.hour ?? null);
          setMinute(current?.minute ?? null);
          setPeriod(current?.period ?? "AM");
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={id}
          aria-haspopup="dialog"
          className={cn(
            "h-auto min-w-0 justify-start rounded-lg border-0 bg-white px-2 py-2 text-left text-xs font-normal text-[#121c2a] shadow-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1b7a43]",
            triggerClassName,
          )}
        >
          <Clock3 className="mr-1.5 h-3.5 w-3.5 shrink-0 text-[#3f4940]" />
          {value ? (
            formatLabel(value)
          ) : (
            <span className="text-muted-foreground/70">Select time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-64 p-3", className)}>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["AM", "PM"] as Period[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setPeriod(option);
                commit(hour, minute, option);
              }}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
                period === option
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <select
            aria-label="Hour"
            className={selectClass}
            value={hour ?? ""}
            onChange={(event) => {
              const next = Number(event.target.value);
              setHour(next);
              commit(next, minute, period);
            }}
          >
            <option value="" disabled>
              Hour
            </option>
            {HOURS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-sm font-semibold text-muted-foreground">:</span>
          <select
            aria-label="Minute"
            className={selectClass}
            value={minute ?? ""}
            onChange={(event) => {
              const next = Number(event.target.value);
              setMinute(next);
              commit(hour, next, period);
            }}
          >
            <option value="" disabled>
              Min
            </option>
            {MINUTES.map((option) => (
              <option key={option} value={option}>
                {String(option).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        {value && (
          <div className="mt-3 border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear time
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
