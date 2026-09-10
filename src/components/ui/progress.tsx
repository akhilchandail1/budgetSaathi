import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(150, value));
  const isOver = value > 100;
  const isNear = value > 85 && value <= 100;

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-100", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          isOver ? "bg-red-500" : isNear ? "bg-amber-500" : "bg-emerald-500"
        )}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}
