import { Filter, CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onFilter: () => void;
}

// Helper to parse DD/MM/YYYY to Date object
function parseDate(dateStr: string): Date | undefined {
  try {
    return parse(dateStr, "dd/MM/yyyy", new Date());
  } catch {
    return undefined;
  }
}

// Helper to format Date to DD/MM/YYYY
function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

export function DashboardHeader({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFilter,
}: DashboardHeaderProps) {
  const startDateValue = parseDate(startDate);
  const endDateValue = parseDate(endDate);

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold font-heading text-foreground">Dashboard</h1>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-36 justify-start text-left font-normal bg-card border-border",
                  !startDateValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDateValue ? format(startDateValue, "dd/MM/yyyy") : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDateValue}
                onSelect={(date) => date && onStartDateChange(formatDate(date))}
                initialFocus
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-36 justify-start text-left font-normal bg-card border-border",
                  !endDateValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDateValue ? format(endDateValue, "dd/MM/yyyy") : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDateValue}
                onSelect={(date) => date && onEndDateChange(formatDate(date))}
                initialFocus
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button onClick={onFilter} className="mt-5 bg-foreground text-background hover:bg-foreground/90 gap-2">
          <Filter className="h-4 w-4" />
          Filtrar Período
        </Button>
      </div>
    </div>
  );
}
