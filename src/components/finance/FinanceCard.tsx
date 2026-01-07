import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FinanceCardVariant = "blue" | "green" | "red";

interface FinanceCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  variant: FinanceCardVariant;
}

const variantStyles: Record<FinanceCardVariant, { bg: string; iconBg: string; textColor: string }> = {
  blue: {
    bg: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-500",
    textColor: "text-blue-600",
  },
  green: {
    bg: "bg-green-50 border-green-200",
    iconBg: "bg-green-500",
    textColor: "text-green-600",
  },
  red: {
    bg: "bg-red-50 border-red-200",
    iconBg: "bg-red-400",
    textColor: "text-red-500",
  },
};

export function FinanceCard({ icon: Icon, label, value, variant }: FinanceCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn("rounded-xl border p-6 flex flex-col items-center text-center", styles.bg)}>
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", styles.iconBg)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className={cn("text-sm font-medium mb-1", styles.textColor)}>{label}</p>
      <p className={cn("text-xl font-bold", styles.textColor)}>{value}</p>
    </div>
  );
}
