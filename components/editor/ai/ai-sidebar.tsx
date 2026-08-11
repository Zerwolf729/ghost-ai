import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scrollarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, X, FileText, Send, Loader2, User, Download, Trash2 } from "lucide-react";
import { useAIStatus } from "./ai-status-context";
import { AIStatusRoomListener } from "./ai-status-room-listener";
import { useChat } from "./chat-context";
import { useRealtimeRun } from "@/hooks/use-realtime-run";
import { useEventListener } from "@liveblocks/react";
import { useUser } from "@clerk/nextjs";

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  projectId?: string;
  canvasStateRef?: React.MutableRefObject<{ nodes: unknown[]; edges: unknown[] }>;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export const AISidebar: React.FC<AISidebarProps> = ({ isOpen, onClose, roomId, projectId, canvasStateRef }) => {
  const pid = projectId ?? roomId;
  const { status: aiStatus, text, setStatus: setAIStatus } = useAIStatus();
  const { messages: chatMessages, sendMessage: sendLiveMessage, isWorking } = useChat();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"architect" | "specs">("architect");
  const [inputValue, setInputValue] = useState("");
  const [sendError, setSendError] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [specRunId, setSpecRunId] = useState<string | null>(null);
  const [specToken, setSpecToken] = useState<string | null>(null);
  const [specs, setSpecs] = useState<{ id: string; createdAt: string; filePath: string }[]>([]);
  const [previewSpec, setPreviewSpec] = useState<{ id: string; createdAt: string } | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; createdAt: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Local loading flag for the spec button — true from click until realtime
  // stream attaches (isSpecActive flips true) or the run settles. Prevents
  // the button from appearing idle during the trigger+token round-trip.
  const [specStarting, setSpecStarting] = useState(false);

  const senderName = user?.firstName ?? "Guest";

  const { isActive } = useRealtimeRun(
    activeRunId ?? "",
    activeToken ?? undefined,
    (run, err) => {
      // Trigger-side terminal reset — safety net in case the Liveblocks
      // AI_STATUS broadcast is missed. Clears run identity and returns the
      // shared status to idle exactly once per settled run.
      setActiveRunId(null);
      setActiveToken(null);
      setAIStatus("idle");
      if (err) setRunError("AI run failed");
    }
  );

  const { isActive: isSpecActive } = useRealtimeRun(
    specRunId ?? "",
    specToken ?? undefined,
    (run, err) => {
      setSpecRunId(null);
      setSpecToken(null);
      setSpecStarting(false);
      if (err) {
        setRunError("Spec generation failed");
        return;
      }
      // Completion — refresh the persisted spec list so the new spec appears
      // without depending on a transient realtime event.
      fetch(`/api/projects/${pid}/specs`)
        .then((r) => r.json())
        .then((d) => {
          const specsData = d as { specs?: unknown };
          if (Array.isArray(specsData.specs)) setSpecs(specsData.specs as { id: string; createdAt: string; filePath: string }[]);
        })
        .catch(() => {});
    }
  );

  const triggerSpecGeneration = useCallback(async () => {
    if (!pid || !canvasStateRef?.current) return;
    // Enter loading immediately — realtime status may lag the button click
    // by the time of the trigger + token round-trips.
    setSpecStarting(true);
    setRunError(null);
    try {
      const { nodes, edges } = canvasStateRef.current;
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: pid, nodes, edges }),
      });
      if (!res.ok) throw new Error("Failed to trigger spec");
      const { runId } = await res.json();

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (!tokenRes.ok) throw new Error("Failed to get token");
      const { token } = await tokenRes.json();
      setSpecRunId(runId);
      setSpecToken(token);
    } catch (err) {
      console.error(err);
      setRunError("Spec generation failed");
      setSpecStarting(false);
    }
  }, [pid, canvasStateRef]);

  // AI_STATUS listener only runs inside a RoomProvider (workspace pages).
  // On the editor home page there is no room, so this component is not mounted.
  const statusListener = pid ? (
    <AIStatusRoomListener
      onReset={(message) => {
        setActiveRunId(null);
        setActiveToken(null);
        setAIStatus("idle");
        if (message) setRunError(message);
      }}
    />
  ) : null;

  // Track whether a fetch is in-flight to ignore stale results
  const fetchSeq = useRef(0);
  useEffect(() => {
    if (activeTab !== "specs" || !isOpen || !pid) return;
    const seq = ++fetchSeq.current;
    // Use functional update to avoid referencing external setRunError
    setRunError(null);
    fetch(`/api/projects/${pid}/specs`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load specs");
        }
        return res.json();
      })
      .then((data) => {
        if (seq !== fetchSeq.current) return; // stale
        const specsData = data as { specs?: unknown };
        if (Array.isArray(specsData.specs)) {
          setSpecs(specsData.specs as { id: string; createdAt: string; filePath: string }[]);
        }
      })
      .catch((err) => {
        if (seq !== fetchSeq.current) return; // stale
        console.error("Load specs error:", err);
        setRunError(err instanceof Error ? err.message : "Failed to load specs");
      });
  }, [activeTab, isOpen, pid]);

  const handleDownload = (e: React.MouseEvent, specId: string) => {
    e.stopPropagation();
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = `/api/projects/${pid}/specs/${specId}/download`;
  };

  const handleDelete = async (specId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${pid}/specs/${specId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete spec");
      setSpecs((prev) => prev.filter((s) => s.id !== specId));
      setDeleteCandidate(null);
      if (previewSpec?.id === specId) {
        setPreviewSpec(null);
        setPreviewContent(null);
      }
    } catch (err) {
      console.error("Delete spec error:", err);
      setRunError("Failed to delete spec");
    } finally {
      setIsDeleting(false);
    }
  };

  const openPreview = async (spec: { id: string; createdAt: string }) => {
    setPreviewSpec(spec);
    setIsLoadingPreview(true);
    setPreviewContent(null);
    try {
      const res = await fetch(`/api/projects/${pid}/specs/${spec.id}`);
      if (!res.ok) throw new Error("Failed to fetch spec");
      const data = await res.json();
      setPreviewContent(typeof data.content === "string" ? data.content : "No content");
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewContent("Failed to load spec");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const execSend = useCallback(async (text: string) => {
    if (!text || isWorking || isActive) return;
    setSendError(false);
    setRunError(null);
    setAIStatus("started");

    try {
      // 1. Broadcast chat message to room
      sendLiveMessage(text);

      // 2. Call design API
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId, projectId: pid }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const { runId } = data as { runId: string };

      // 3. Fetch public token scoped to this run
      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get run token");
      }

      const tokenData = await tokenRes.json();
      setActiveRunId(runId);
      setActiveToken(tokenData.token);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Something went wrong");
      setSendError(true);
      setAIStatus("idle");
    }
  }, [isWorking, isActive, sendLiveMessage, roomId, pid]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    await execSend(text);
  }, [inputValue, execSend]);

  const handleChipClick = useCallback(async (chip: string) => {
    setInputValue("");
    await execSend(chip.trim());
  }, [execSend]);

  if (!isOpen) return null;

  // Any non-terminal AI status counts as thinking. Checking only "started"
  // dropped the spinner during the long "processing" phase, which is where
  // the run actually spends its time.
  const headerThinking =
    aiStatus === "started" || aiStatus === "processing" || isActive;

  return (
    <aside
      className={cn(
        "fixed right-0 top-14 z-30 h-[calc(100vh-56px)] w-80 flex flex-col border-l border-border-default bg-bg-surface shadow-xl transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {statusListener}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default bg-bg-elevated px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {headerThinking ? (
            <Loader2 className="size-4 text-accent-primary animate-spin" />
          ) : (
            <Bot className="size-5 text-accent-primary" />
          )}
          <h2 className="text-sm font-semibold text-text-primary">
            {headerThinking ? "Ghost AI" : "Ghost AI"}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="size-7 hover:bg-bg-subtle rounded-full">
          <X className="size-4 text-text-muted" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="p-2 shrink-0">
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl bg-bg-subtle p-1">
          <button
            onClick={() => setActiveTab("architect")}
            className={cn(
              "flex justify-center w-full rounded-lg text-xs font-medium py-1.5 transition-all",
              activeTab === "architect"
                ? "bg-bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            AI Architect
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={cn(
              "flex justify-center w-full rounded-lg text-xs font-medium py-1.5 transition-all",
              activeTab === "specs"
                ? "bg-bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            Specs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "architect" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <>
                  {/* Welcome message bubble */}
                  <div className="flex gap-3">
                    <div className="size-7 shrink-0 rounded-full bg-accent-primary/10 flex items-center justify-center">
                      <Bot className="size-4 text-accent-primary" />
                    </div>
                    <div className="bg-bg-elevated border border-border-default rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                      <p className="text-xs text-text-primary leading-relaxed">
                        Hi! I&#39;m Ghost AI. I can help you design your architecture. What would you like to build?
                      </p>
                    </div>
                  </div>

                  {/* Starter prompts */}
                  <div className="pl-10 space-y-2">
                    {STARTER_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleChipClick(chip)}
                        className="w-full text-left px-3 py-2 text-xs rounded-xl border border-border-default bg-bg-elevated text-text-primary hover:border-accent-primary hover:bg-accent-primary/5 transition-all"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.sender === senderName && "flex-row-reverse")}>
                    <div className={cn("size-7 shrink-0 rounded-full flex items-center justify-center bg-accent-primary/10")}>
                      <User className="size-4 text-accent-primary" />
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 max-w-[85%] text-xs leading-relaxed",
                        msg.sender === senderName
                          ? "bg-accent-primary text-black rounded-tr-md"
                          : "bg-bg-elevated border border-border-default rounded-tl-md text-text-primary"
                      )}
                    >
                      <p className="font-semibold text-[10px] mb-0.5">{msg.sender}</p>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Run status strip - visible only during active design runs.
                Combines Trigger.dev realtime status (isActive) with the
                Liveblocks AI_STATUS broadcast so the spinner stops the
                moment the design agent broadcasts "completed"/"failed",
                even if the Trigger.dev run has not yet settled. */}
            {isActive && (aiStatus === "completed" || aiStatus === "failed") === false && (
              <div className="flex items-center gap-2 border-b border-border-default bg-bg-elevated/50 px-3 py-2 shrink-0">
                <Loader2 className="size-3 text-accent-primary animate-spin" />
                <span className="text-[10px] text-text-muted">{text || "AI run in progress…"}</span>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border-default px-3 py-3 shrink-0">
              <div className="flex items-end gap-2 rounded-xl border border-accent-primary/60 px-3 py-2 transition-colors focus-within:border-accent-primary">
                <Textarea
                  placeholder={isActive ? "AI is thinking..." : isWorking ? "AI is thinking..." : "Ask anything..."}
                  disabled={isWorking || isActive}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className={cn("flex-1 min-h-[40px] max-h-[120px] resize-none bg-transparent border-none p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-text-muted text-text-primary", sendError && "border-red-500")}
                />
                <Button
                  type="button"
                  disabled={isWorking || isActive || !inputValue.trim()}
                  size="icon"
                  onClick={handleSend}
                  className="size-8 shrink-0 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-black disabled:opacity-30"
                >
                  {isWorking || isActive ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
              {sendError && (
                <p className="text-[10px] text-red-500 text-center mt-1">Failed to send</p>
              )}
              {runError && (
                <p className="text-[10px] text-red-500 text-center mt-1">{runError}</p>
              )}
              <p className="text-[10px] text-text-muted text-center mt-2">Ghost AI may make mistakes</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              <button
                type="button"
                onClick={triggerSpecGeneration}
                disabled={isSpecActive || specStarting}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl border border-accent-primary/40 bg-accent-primary/5 text-accent-primary hover:bg-accent-primary/10 transition-all disabled:opacity-50"
              >
                {isSpecActive || specStarting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileText className="size-3.5" />
                )}
                {isSpecActive || specStarting ? "Generating spec..." : "Generate Spec"}
              </button>
              {runError ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <p className="text-xs text-state-error">{runError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRunError(null);
                      setSpecs([]);
                      fetch(`/api/projects/${pid}/specs`)
                        .then(async (res) => {
                          if (!res.ok) throw new Error("Failed to load specs");
                          return res.json();
                        })
                        .then((data) => {
                          const specsData = data as { specs?: unknown };
                          if (Array.isArray(specsData.specs)) {
                            setSpecs(specsData.specs as { id: string; createdAt: string; filePath: string }[]);
                          }
                        })
                        .catch((err) => {
                          console.error("Load specs error:", err);
                          setRunError(err instanceof Error ? err.message : "Failed to load specs");
                        });
                    }}
                    className="text-xs text-accent-primary hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : specs.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No specs generated yet</p>
              ) : (
                specs.map((spec) => (
                  <div key={spec.id} className="p-3 rounded-xl border border-border-default bg-bg-elevated space-y-2 group cursor-pointer hover:border-accent-primary/50 transition-colors" onClick={() => openPreview(spec)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="size-4 text-accent-primary shrink-0" />
                        <span className="text-xs font-medium text-text-primary truncate">{new Date(spec.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="size-6 hover:bg-bg-subtle rounded-md" onClick={(e) => handleDownload(e, spec.id)}>
                          <Download className="size-3.5 text-text-muted" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-6 hover:bg-bg-subtle rounded-md hover:text-error" onClick={(e) => { e.stopPropagation(); setDeleteCandidate(spec); }}>
                          <Trash2 className="size-3.5 text-text-muted" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Preview Modal */}
            <Dialog open={!!previewSpec} onOpenChange={() => {setPreviewSpec(null); setPreviewContent(null);}}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-bg-surface border-border-default">
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold text-text-primary">Spec Preview</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-4 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="size-6 text-accent-primary animate-spin" />
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {previewContent || "No content"}
                    </ReactMarkdown>
                  )}
                </div>
                <div className="p-4 border-t border-border-default flex justify-end">
                   <Button size="sm" onClick={(e) => previewSpec && handleDownload(e, previewSpec.id)}>
                      <Download className="size-4 mr-2" />
                      Download
                   </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteCandidate} onOpenChange={(open) => { if (!open && !isDeleting) setDeleteCandidate(null); }}>
              <DialogContent className="max-w-sm bg-bg-surface border-border-default p-6 gap-4">
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold text-text-primary">Delete generated specification?</DialogTitle>
                </DialogHeader>
                <p className="text-xs text-text-secondary">
                  This will permanently remove the spec file and its metadata. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="ghost" disabled={isDeleting} onClick={() => setDeleteCandidate(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="destructive" disabled={isDeleting} onClick={() => deleteCandidate && handleDelete(deleteCandidate.id)}>
                    {isDeleting ? <Loader2 className="size-4 animate-spin mr-1" /> : <Trash2 className="size-4 mr-1" />}
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </ScrollArea>
        )}
      </div>
    </aside>
  );
};
