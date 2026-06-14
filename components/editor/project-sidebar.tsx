"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectRow {
  id: string;
  name: string;
}

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects?: ProjectRow[];
  sharedProjects?: ProjectRow[];
  onNewProject?: () => void;
  onRename?: (project: ProjectRow) => void;
  onDelete?: (project: ProjectRow) => void;
  activeProjectId?: string;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects = [],
  sharedProjects = [],
  onNewProject,
  onRename,
  onDelete,
  activeProjectId,
}: ProjectSidebarProps) {
  console.log('ProjectSidebar render:', isOpen);
  const initialTab = sharedProjects.some((project) => project.id === activeProjectId)
    ? "shared"
    : "my-projects";
  const [activeTab, setActiveTab] = useState<"my-projects" | "shared">(initialTab);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-bg-base/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-border-default bg-bg-surface transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-default px-4">
          <span className="text-sm font-medium text-text-primary">Projects</span>
          <button
            type="button"
            className="rounded-md p-1 hover:bg-subtle flex items-center"
            onClick={() => { console.log('X button clicked'); onClose(); }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-3">
          <Tabs key={`${activeProjectId ?? "home"}-${initialTab}`} className="flex flex-1 flex-col">
            <TabsList className="w-full">
              <TabsTrigger
                value="my-projects"
                className="flex-1"
                onClick={() => setActiveTab("my-projects")}
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1" onClick={() => setActiveTab("shared")}>
                Shared
              </TabsTrigger>
            </TabsList>

            {activeTab === "my-projects" ? (
              <div className="flex-1 overflow-y-auto mt-2">
                {ownedProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-text-muted">No projects yet.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {ownedProjects.map((project) => (
                      <li key={project.id}>
                        <ProjectItem
                          project={project}
                          active={project.id === activeProjectId}
                          onRename={onRename}
                          onDelete={onDelete}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto mt-2">
                {sharedProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-text-muted">No shared projects.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {sharedProjects.map((project) => (
                      <li key={project.id}>
                        <ProjectItem
                          project={project}
                          active={project.id === activeProjectId}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Tabs>
        </div>

        {onNewProject && (
          <div className="shrink-0 p-3 border-t border-border-default">
            <Button
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onNewProject}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}

interface ProjectItemProps {
  project: ProjectRow;
  active?: boolean;
  onRename?: (project: ProjectRow) => void;
  onDelete?: (project: ProjectRow) => void;
}

function ProjectItem({ project, active = false, onRename, onDelete }: ProjectItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors",
        active
          ? "border-border-subtle bg-accent-primary-dim"
          : "border-transparent hover:bg-bg-subtle"
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full bg-border-subtle",
          active && "bg-accent-primary"
        )}
      />
      <Link
        href={`/editor/${project.id}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
        )}
      >
        {project.name}
      </Link>
      {onRename && onDelete && (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            className="rounded-md p-1 hover:bg-subtle"
            onClick={(e) => {
              e.preventDefault();
              onRename(project);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Rename</span>
          </Button>
          <Button
            className="rounded-md p-1 hover:bg-subtle"
            onClick={(e) => {
              e.preventDefault();
              onDelete(project);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      )}
    </div>
  );
}
