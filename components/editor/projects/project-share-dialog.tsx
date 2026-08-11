"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────

interface CollaboratorEntry {
  email: string;
  name: string;
  avatarUrl: string | null;
  joinedAt?: string;
}

interface OwnerEntry {
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface CollaboratorsApiResponse {
  collaborators: CollaboratorEntry[];
  owner: OwnerEntry | null;
  isOwner: boolean;
}

interface ApiErrorResponse {
  error: string;
}

// ── helpers ────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 2) || "?";
}

// ── user card ──────────────────────────────────────────────────────────

function UserCard({
  name,
  email,
  avatarUrl,
  rightAction,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  rightAction?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-bg-subtle px-3 py-2.5">
      <Avatar className="h-8 w-8 shrink-0">
        {avatarUrl && (
          <AvatarImage src={avatarUrl} alt={name} />
        )}
        <AvatarFallback className="bg-accent-primary-dim text-accent-primary text-xs">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid gap-0.5 min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        <p className="text-xs text-text-muted truncate">{email}</p>
      </div>
      {rightAction}
    </div>
  );
}

// ── dialog ─────────────────────────────────────────────────────────────

interface ProjectShareDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
}

export function ProjectShareDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
  isOwner,
}: ProjectShareDialogProps) {
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>([]);
  const [owner, setOwner] = useState<OwnerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [origin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(body.error || "Failed to fetch collaborators");
      }

      const data: CollaboratorsApiResponse = await response.json();
      setCollaborators(data.collaborators || []);
      setOwner(data.owner || null);
    } catch (err: unknown) {
      setError(ErrorMessage(err));
      console.error("Fetch collaborators error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !projectId) return;

    const runEffect = async () => {
      await fetchCollaborators();
      setEmail("");
      setError(null);
      setSuccess(null);
    };

    void runEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  const handleInvite = async () => {
    if (!email.trim() || !isOwner) return;
    setError(null);
    setSuccess(null);

    try {
      setInviting(true);
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error("error" in data ? (data as ApiErrorResponse).error : "Failed to invite collaborator");
      }

      setEmail("");
      setSuccess("Invited successfully");
      await fetchCollaborators();
    } catch (err: unknown) {
      setError(ErrorMessage(err));
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (emailToRemove: string) => {
    if (!isOwner) return;
    setError(null);
    setSuccess(null);

    try {
      setRemoving(emailToRemove);
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToRemove }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error("error" in data ? (data as ApiErrorResponse).error : "Failed to remove collaborator");
      }

      setSuccess("Removed successfully");
      await fetchCollaborators();
    } catch (err: unknown) {
      setError(ErrorMessage(err));
    } finally {
      setRemoving(null);
    }
  };

  const handleCopyLink = () => {
    if (!origin) return;
    const projectUrl = `${origin}/editor/${projectId}`;
    void navigator.clipboard.writeText(projectUrl);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl bg-bg-surface border-border-default p-6">
        <DialogHeader className="px-0 pt-0 pb-2">
          <DialogTitle className="text-text-primary text-lg">Share Project</DialogTitle>
          <DialogDescription className="text-text-secondary text-sm">
            Invite collaborators to {projectName}
          </DialogDescription>
        </DialogHeader>

        {/* Copy project link */}
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="text"
            value={origin ? `${origin}/editor/${projectId}` : ""}
            readOnly
            className="flex-1 bg-bg-subtle border-border-subtle text-text-primary"
          />
          <Button
            size="sm"
            onClick={handleCopyLink}
            disabled={copyStatus === "copied"}
            className="gap-1 shrink-0"
          >
            {copyStatus === "copied" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copyStatus === "copied" ? "Copied!" : "Copy"}</span>
          </Button>
        </div>

        {/* Invite form (owner only) */}
        {isOwner && (
          <div className="mt-4 space-y-2">
            <label htmlFor="collaborator-email" className="text-sm font-medium text-text-secondary">
              Invite by email
            </label>
            <div className="flex gap-2">
              <Input
                id="collaborator-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="flex-1 bg-bg-subtle border-border-subtle text-text-primary"
                disabled={inviting}
              />
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || inviting}
                className="gap-1 shrink-0"
              >
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>Invite</span>
              </Button>
            </div>
          </div>
        )}

        {/* Feedback messages */}
        {error && (
          <p className="mt-2 text-sm text-state-error">{error}</p>
        )}
        {success && (
          <p className="mt-2 text-sm text-state-success">{success}</p>
        )}

        {/* Owner section */}
        {owner && (
          <div className="mt-5">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Owner</h3>
            <UserCard
              name={owner.name}
              email={owner.email}
              avatarUrl={owner.avatarUrl ?? null}
            />
          </div>
        )}

        {/* Collaborators list */}
        <div className="mt-5 max-h-72 overflow-y-auto">
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Collaborators
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              No collaborators yet
            </p>
          ) : (
            <ul className="space-y-3">
              {collaborators.map((c, index) => (
                <li key={`${c.email}-${index}`}>
                  <UserCard
                    name={c.name}
                    email={c.email}
                    avatarUrl={c.avatarUrl}
                    rightAction={
                      isOwner ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(c.email)}
                          disabled={removing === c.email}
                          className="h-8 w-8 p-0 text-text-muted hover:text-state-error shrink-0"
                        >
                          {removing === c.email ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Remove {c.email}</span>
                        </Button>
                      ) : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {!isOwner && (
          <p className="text-xs text-text-muted text-center pt-2">
            Only the project owner can manage collaborators
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── utils ──────────────────────────────────────────────────────────────

/** Narrow an unknown error value to a user-facing message string. */
function ErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
}