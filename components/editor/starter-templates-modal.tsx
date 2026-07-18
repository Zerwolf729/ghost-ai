"use client";

import { CanvasTemplate, CANVAS_TEMPLATES } from "./starter-templates";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleImport = () => {
    if (selectedTemplate) {
      const template = CANVAS_TEMPLATES.find((t) => t.id === selectedTemplate);
      if (template) {
        // Restore template with full metadata
        const enrichedTemplate = {
          ...template,
          nodes: template.nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              connectionCount: 0,
              lastEdited: new Date().toISOString(),
            },
            position: { ...n.position },
            style: { ...n.style },
          })),
          edges: template.edges.map(e => ({
            ...e,
            data: {
              ...e.data,
              persistent: true,
              created: new Date().toISOString(),
            },
          })),
        };
        onImport(enrichedTemplate);
        onOpenChange(false);
        setSelectedTemplate(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Choose from pre-built canvas templates for common architectures
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-4">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === template.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <h3 className="font-medium text-sm mb-2">{template.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {template.description}
              </p>
              <TemplatePreview template={template} />
              <div className="text-xs text-muted-foreground mt-2">
                {template.nodes.length} nodes • {template.edges.length} edges
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6 px-4 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!selectedTemplate}>
            Import Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const width = 180;
  const height = 100;

  const xs = template.nodes.map((n) => n.position.x);
  const ys = template.nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs) + (template.nodes[0]?.style?.width || 120);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys) + (template.nodes[0]?.style?.height || 60);
  const padding = 20;
  const scaleX = (width - padding * 2) / Math.max(maxX - minX, 1);
  const scaleY = (height - padding * 2) / Math.max(maxY - minY, 1);
  const scale = Math.min(scaleX, scaleY, 1);

  const offsetX = padding + ((width - padding * 2) - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = padding + ((height - padding * 2) - (maxY - minY) * scale) / 2 - minY * scale;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-24 bg-[#111114] rounded-md border border-[#2a2a30]"
    >
      {template.edges.map((e) => {
        const src = template.nodes.find((n) => n.id === e.source);
        const tgt = template.nodes.find((n) => n.id === e.target);
        if (!src || !tgt) return null;
        const sx = src.position.x + ((src.style?.width || 120) / 2);
        const sy = src.position.y + ((src.style?.height || 60) / 2);
        const tx = tgt.position.x + ((tgt.style?.width || 120) / 2);
        const ty = tgt.position.y + ((tgt.style?.height || 60) / 2);
        return (
          <line
            key={e.id}
            x1={sx * scale + offsetX}
            y1={sy * scale + offsetY}
            x2={tx * scale + offsetX}
            y2={ty * scale + offsetY}
            stroke="#505060"
            strokeWidth={1.5}
          />
        );
      })}
      {template.nodes.map((n) => {
        const x = n.position.x * scale + offsetX;
        const y = n.position.y * scale + offsetY;
        const w = (n.style?.width || 120) * scale;
        const h = (n.style?.height || 60) * scale;
        return (
          <rect
            key={n.id}
            x={x}
            y={y}
            width={w}
            height={h}
            fill={n.data.color}
            stroke={n.data.color === "#111114" ? "#2a2a30" : n.data.color}
            strokeWidth={0.5}
            rx={2}
          />
        );
      })}
    </svg>
  );
}
