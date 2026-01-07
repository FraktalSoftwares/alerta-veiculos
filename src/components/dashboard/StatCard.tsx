import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardVariant = "blue" | "green" | "red" | "yellow";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  variant: StatCardVariant;
}

const variantStyles: Record<StatCardVariant, { bg: string; iconBg: string; iconColor: string }> = {
  blue: {
    bg: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-500",
    iconColor: "text-blue-600",
  },
  green: {
    bg: "bg-green-50 border-green-200",
    iconBg: "bg-green-500",
    iconColor: "text-green-600",
  },
  red: {
    bg: "bg-red-50 border-red-200",
    iconBg: "bg-red-400",
    iconColor: "text-red-600",
  },
  yellow: {
    bg: "bg-yellow-50 border-yellow-200",
    iconBg: "bg-yellow-500",
    iconColor: "text-yellow-600",
  },
};

export function StatCard({ icon: Icon, label, value, variant }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn("rounded-xl border p-6 flex flex-col items-center text-center", styles.bg)}>
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", styles.iconBg)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className={cn("text-sm font-medium mb-1", styles.iconColor)}>{label}</p>
      <p className={cn("text-2xl font-bold", styles.iconColor)}>{value}</p>
    </div>
  );
}
