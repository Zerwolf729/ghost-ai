"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react";

interface Collaborator {
  email: string;
  name?: string;
  avatarUrl?: string | null;
  isOwner?: boolean;
}

interface ProjectShareDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
}

/**
 * Share dialog for inviting/removing collaborators.
 * Owners: full access (invite, remove, copy link).
 * Collaborators: read-only view of collaborator list.
 */
export function ProjectShareDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
  isOwner,
}: ProjectShareDialogProps) {
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Fetch collaborators
  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!response.ok) throw new Error("Failed to fetch collaborators");

      const data = await response.json();
      setCollaborators(data.collaborators || []);
    } catch (err) {
      setError("Failed to load collaborators");
      console.error("Fetch collaborators error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && projectId) {
      fetchCollaborators();
      setEmail("");
      setError(null);
      setSuccess(null);
    }
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
      if (!response.ok) throw new Error(data.error || "Failed to invite collaborator");

      setEmail("");
      setSuccess("Invited successfully");
      await fetchCollaborators();
    } catch (err: any) {
      setError(err.message);
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
      if (!response.ok) throw new Error(data.error || "Failed to remove collaborator");

      setSuccess("Removed successfully");
      await fetchCollaborators();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRemoving(null);
    }
  };

  const handleCopyLink = () => {
    if (!origin) return;
    const projectUrl = `${origin}/editor/${projectId}`;
    navigator.clipboard.writeText(projectUrl);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-bg-surface border-border-default">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Share Project</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Invite collaborators to {projectName}
          </DialogDescription>
        </DialogHeader>

        {/* Copy project link */}
        <div className="flex items-center gap-2">
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

        {/* Collaborators list */}
        <div className="mt-4 max-h-64 overflow-y-auto">
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
              {collaborators.map((collab, index) => (
                <li key={`${collab.email}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      {collab.avatarUrl && (
                        <AvatarImage src={collab.avatarUrl} alt={collab.name || collab.email} />
                      )}
                      <AvatarFallback className="bg-accent-primary-dim text-accent-primary text-xs">
                        {collab.name ? collab.name.charAt(0).toUpperCase() : collab.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {collab.name || collab.email}
                        {collab.isOwner && <span className="text-xs text-text-faint"> (Owner)</span>}
                      </p>
                    </div>
                  </div>

                  {isOwner && !collab.isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(collab.email)}
                      disabled={removing === collab.email}
                      className="h-8 w-8 p-0 text-text-muted hover:text-state-error shrink-0"
                    >
                      {removing === collab.email ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Remove {collab.email}</span>
                    </Button>
                  )}
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
