import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubMenuItem {
  to: string;
  label: string;
}

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  subItems?: SubMenuItem[];
}

export function NavItem({ to, icon: Icon, label, subItems }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || subItems?.some(item => location.pathname === item.to);

  if (subItems && subItems.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[2px] outline-none",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            <ChevronDown className="h-3 w-3 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          sideOffset={4}
          className="min-w-[160px] bg-card border border-border rounded-md shadow-md z-50 py-1"
        >
          {subItems.map((item) => (
            <DropdownMenuItem key={item.to} asChild>
              <Link
                to={item.to}
                className={cn(
                  "w-full cursor-pointer px-3 py-2 text-sm transition-colors",
                  location.pathname === item.to 
                    ? "bg-muted text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[2px]",
        isActive
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
