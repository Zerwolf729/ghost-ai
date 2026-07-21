import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, X, FileText, Send } from "lucide-react";

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export const AISidebar: React.FC<AISidebarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        "fixed right-0 top-14 z-30 h-[calc(100vh-56px)] w-80 flex flex-col border-l border-border-default bg-surface shadow-lg transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default p-4 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
            <Bot className="size-4 text-accent-primary" />
            AI Workspace
          </h2>
          <p className="text-xs text-muted">Collaborate with Ghost AI</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
          <X className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 p-1 shrink-0">
          <TabsTrigger value="architect">AI Architect</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
        </TabsList>

        {/* AI Architect tab */}
        <TabsContent data-value="architect" className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable messages area (empty state shown for now) */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              {/* Empty state */}
              <div className="flex flex-col items-center justify-center text-center gap-3 py-10">
                <Bot className="size-8 text-muted" />
                <p className="text-sm text-primary">Design your architecture with Ghost AI</p>
                <p className="text-xs text-muted">Pick a starter prompt or write your own below</p>
                <div className="flex flex-col gap-2 mt-2 w-full">
                  {STARTER_CHIPS.map((chip) => (
                    <span
                      key={chip}
                      className="px-3 py-1.5 text-xs rounded-full bg-subtle text-accent-primary text-center cursor-pointer hover:opacity-80 transition"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-border-default p-3 shrink-0 space-y-2">
            <Textarea
              placeholder="Ask Ghost AI..."
              className="min-h-[72px] max-h-[160px] resize-none bg-elevated border-border-default"
            />
            <Button
              type="submit"
              className="w-full bg-accent-primary text-black flex items-center justify-center gap-2"
            >
              <Send className="size-4" />
              Send
            </Button>
          </div>
        </TabsContent>

        {/* Specs tab */}
        <TabsContent data-value="specs" className="flex-1 overflow-y-auto p-4 space-y-3">
          <Button className="w-full bg-accent-primary text-black">Generate Spec</Button>

          {/* Demo spec card */}
          <div className="p-3 rounded-lg border border-border-default bg-elevated space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-accent-primary" />
              <span className="text-sm font-medium text-primary">demo-spec.md</span>
            </div>
            <p className="text-xs text-muted line-clamp-2">
              # Demo Spec<br />A short snippet describing the generated architecture spec...
            </p>
            <Button disabled className="w-full">
              Download
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
};
