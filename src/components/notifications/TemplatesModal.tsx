import { useState } from "react";
import { X, Search, ChevronDown, ChevronUp, Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotificationTemplates, useDeleteNotificationTemplate, getTargetLabel } from "@/hooks/useNotificationTemplates";
import { NotificationTemplateDisplay } from "@/types/notification";
import { cn } from "@/lib/utils";

interface TemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: NotificationTemplateDisplay) => void;
}

export function TemplatesModal({ open, onOpenChange, onSelectTemplate }: TemplatesModalProps) {
  const [searchValue, setSearchValue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: templates, isLoading } = useNotificationTemplates(searchValue);
  const deleteTemplate = useDeleteNotificationTemplate();

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id);
    if (expandedId === id) setExpandedId(null);
  };

  const handleUseTemplate = (template: NotificationTemplateDisplay) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[938px] p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Modelos de Notificações
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-11 w-11 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pt-4 pb-2 flex justify-end shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelo"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 bg-card border-border w-56"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pb-6 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !templates || templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bookmark className="h-12 w-12 mb-3 opacity-40" />
                <p>Nenhum modelo encontrado</p>
              </div>
            ) : (
              templates.map((template) => {
                const isExpanded = expandedId === template.id;

                return (
                  <div
                    key={template.id}
                    className="border border-border rounded-lg overflow-hidden bg-card shadow-sm"
                  >
                    <button
                      onClick={() => handleToggleExpand(template.id)}
                      className="w-full flex items-center gap-2 justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Bookmark className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold text-foreground text-left">
                          {template.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {template.date}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200",
                        isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {template.message}
                        </p>

                        <div className="border-t border-border pt-3">
                          <div className="flex gap-8 mb-4">
                            <div>
                              <span className="text-sm font-semibold text-foreground">Para: </span>
                              <span className="text-sm text-muted-foreground">
                                {getTargetLabel(template.targetType, template.targetUserType)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleDelete(template.id)}
                              disabled={deleteTemplate.isPending}
                              className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </button>
                            <Button
                              onClick={() => handleUseTemplate(template)}
                              className="gap-2 bg-foreground text-background hover:bg-foreground/90"
                            >
                              <Bookmark className="h-4 w-4" />
                              Usar Este Modelo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
