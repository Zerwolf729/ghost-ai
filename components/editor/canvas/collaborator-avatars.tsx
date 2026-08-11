"use client";

import { useState } from "react";
import Image from "next/image";
import { useOthers } from "@liveblocks/react";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const MAX_VISIBLE = 4;

export function CollaboratorAvatars() {
  const { user } = useUser();
  const others = useOthers();
  const currentUserId = user?.id;
  const othersList = others.filter((o) => o.info?.id !== currentUserId);
  const visible = othersList.slice(0, MAX_VISIBLE);
  const overflow = othersList.length - MAX_VISIBLE;
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasAny = othersList.length > 0;

  return (
    <>
      <div className="flex items-center">
        {hasAny && (
          <>
            <div
              className="flex items-center cursor-pointer"
              onClick={() => setDialogOpen(true)}
            >
              <div className="flex items-center -space-x-2">
                {visible.map((other) => (
                  <div
                    key={other.connectionId}
                    title={other.info?.name ?? "Anonymous"}
                  >
                    <AvatarChip
                      name={other.info?.name ?? "Anonymous"}
                      avatar={other.info?.avatar}
                      color={other.info?.color ?? "#888888"}
                    />
                  </div>
                ))}
                {overflow > 0 && (
                  <div
                    title={`+${overflow} more collaborators`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-base bg-bg-elevated text-xs font-medium text-text-primary ring-1 ring-white/20"
                  >
                    +{overflow}
                  </div>
                )}
              </div>
            </div>
            <div className="mx-2 h-5 w-px bg-border-subtle" />
          </>
        )}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>

      {/* Full collaborator list dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-bg-surface border-border-default">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-text-primary">
              Collaborators
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted">
              {othersList.length + 1} total (
              {othersList.length > 0 ? `${othersList.length} others` : "only you"}
              )
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {/* Current user */}
            <div className="flex items-center gap-3 rounded-xl bg-bg-subtle px-3 py-2">
              <AvatarChip
                name={user?.fullName ?? user?.firstName ?? "You"}
                avatar={user?.imageUrl}
                color="#6457f9"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">
                  {user?.fullName ?? user?.firstName ?? "You"}
                </p>
                <p className="text-[10px] text-text-muted">(You)</p>
              </div>
            </div>

            {/* Other collaborators */}
            {othersList.map((other) => (
              <div
                key={other.connectionId}
                className="flex items-center gap-3 rounded-xl bg-bg-subtle px-3 py-2"
              >
                <AvatarChip
                  name={other.info?.name ?? "Anonymous"}
                  avatar={other.info?.avatar}
                  color={other.info?.color ?? "#888888"}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {other.info?.name ?? "Anonymous"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AvatarChip({
  name,
  avatar,
  color,
}: {
  name: string;
  avatar?: string;
  color: string;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 2);

  return (
    <div
      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-bg-base text-xs font-semibold text-white ring-1 ring-white/20"
      style={{ background: avatar ? undefined : color }}
    >
      {avatar ? (
        <Image
          src={avatar}
          alt={name}
          width={32}
          height={32}
          className="h-full w-full rounded-full object-cover"
          unoptimized
        />
      ) : (
        initials
      )}
    </div>
  );
}
