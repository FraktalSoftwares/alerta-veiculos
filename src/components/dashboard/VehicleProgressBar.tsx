import { cn } from "@/lib/utils";

interface ProgressBarProps {
  label: string;
  value: number;
  color: "green" | "gray" | "yellow" | "red" | "muted";
}

const colorStyles: Record<string, string> = {
  green: "bg-green-500",
  gray: "bg-gray-700",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  muted: "bg-gray-300",
};

export function VehicleProgressBar({ label, value, color }: ProgressBarProps) {
  const maxValue = 600;
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-foreground w-12 text-right">{value}</span>
    </div>
  );
}
