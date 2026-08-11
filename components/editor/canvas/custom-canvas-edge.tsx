"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
	BaseEdge,
	EdgeLabelRenderer,
	EdgeProps,
	getSmoothStepPath,
} from "@xyflow/react";
import { useMutation } from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";

// ── Connector label data model ──────────────────────────────────────────────
// One edge owns zero or one label string. No multi-label concept.
// Position is always derived from React Flow's current edge geometry
// (labelX/labelY from getSmoothStepPath) — never stored as coordinates.

type LiveEdgeData = LiveObject<{
	data: LiveObject<{
		label?: string;
	}>;
}>;

// ── Component ────────────────────────────────────────────────────────────────

export function CustomCanvasEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	selected,
	data,
	markerEnd,
}: EdgeProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [draftLabel, setDraftLabel] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const updateEdgeLabel = useMutation(
		({ storage }, label: string) => {
			const edges = storage.get("flow").get("edges");
			const edge = (edges as unknown as LiveMap<string, LiveEdgeData>).get(id);
			if (!edge) return;
			edge.get("data").set("label", label);
		},
		[id]
	);

	const labelOffset = (data as { labelOffset?: { dx?: number; dy?: number; pathOffset?: number } })?.labelOffset;
	const pathOffset = typeof labelOffset?.pathOffset === "number" ? labelOffset.pathOffset : 0;

	// Offset source/target anchors for parallel path separation.
	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX: sourcePosition === 'left' || sourcePosition === 'right' ? sourceX : sourceX + pathOffset,
		sourceY: sourcePosition === 'top' || sourcePosition === 'bottom' ? sourceY : sourceY + pathOffset,
		sourcePosition,
		targetX: targetPosition === 'left' || targetPosition === 'right' ? targetX : targetX + pathOffset,
		targetY: targetPosition === 'top' || targetPosition === 'bottom' ? targetY : targetY + pathOffset,
		targetPosition,
		borderRadius: 8,
	});

	const offsetX = typeof labelOffset?.dx === "number" ? labelOffset.dx : 0;
	const offsetY = typeof labelOffset?.dy === "number" ? labelOffset.dy : 0;
	const labelTransform = `translate(-50%, -50%) translate(${labelX + offsetX}px, ${labelY + offsetY}px)`;

	// ── Single optional label string ────────────────────────────────────────
	// ONLY 'label' string is supported. Legacy 'labels' array ignored.
	const label = typeof data?.label === "string" ? data.label.trim() : undefined;

	const isActive = selected || isHovered || isEditing;
	const stroke = isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)";

	// ── Double-click: open editor for this edge ───────────────────────────
	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			setIsEditing(true);
			setDraftLabel(label ?? "");
		},
		[label]
	);

	// ── Commit / cancel ────────────────────────────────────────────────────
	const commitEdit = useCallback(() => {
		const trimmed = draftLabel.trim();
		updateEdgeLabel(trimmed);
		setIsEditing(false);
	}, [draftLabel, updateEdgeLabel]);

	const cancelEdit = useCallback(() => {
		setIsEditing(false);
		setDraftLabel("");
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			e.stopPropagation();
			if (e.key === "Enter") {
				e.preventDefault();
				e.currentTarget.blur();
			} else if (e.key === "Escape") {
				e.preventDefault();
				cancelEdit();
			}
		},
		[cancelEdit]
	);

	// Focus input when editing starts.
	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	return (
		<>
			<path
				d={edgePath}
				fill="none"
				stroke="transparent"
				strokeWidth={20}
				className="cursor-pointer"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onDoubleClick={handleDoubleClick}
			/>
			<BaseEdge
				path={edgePath}
				markerEnd={markerEnd}
				style={{
					stroke,
					strokeWidth: 1.5,
					strokeLinecap: "round",
					transition: "stroke 0.15s",
				}}
			/>
			<EdgeLabelRenderer>
				{isEditing ? (
					<input
						ref={inputRef}
						autoFocus
						value={draftLabel}
						onChange={(e) => setDraftLabel(e.target.value)}
						onBlur={commitEdit}
						onKeyDown={handleKeyDown}
						onClick={(e) => e.stopPropagation()}
						onMouseDown={(e) => e.stopPropagation()}
						onPointerDown={(e) => e.stopPropagation()}
						style={{
							position: "absolute",
							transform: labelTransform,
							width: `${Math.max((draftLabel.length + 2) * 8, 64)}px`,
							background: "var(--color-bg-surface)",
							color: "var(--color-text-primary)",
							border: "1px solid rgba(255,255,255,0.25)",
							borderRadius: 6,
							padding: "2px 8px",
							fontSize: 12,
							outline: "none",
							textAlign: "center",
						}}
					/>
				) : label ? (
					<div
						style={{
							position: "absolute",
							transform: labelTransform,
							pointerEvents: "all",
						}}
						className="nodrag nopan"
						onMouseDown={(e) => e.stopPropagation()}
						onPointerDown={(e) => e.stopPropagation()}
						onDoubleClick={handleDoubleClick}
					>
						<div
							style={{
								background: "var(--color-bg-surface)",
								color: "var(--color-text-primary)",
								border: "1px solid rgba(255,255,255,0.15)",
								borderRadius: 9999,
								padding: "2px 10px",
								fontSize: 12,
								cursor: "pointer",
								whiteSpace: "nowrap",
								userSelect: "none",
							}}
						>
							{label}
						</div>
					</div>
				) : selected && !isEditing ? (
					<div
						style={{
							position: "absolute",
							transform: labelTransform,
							pointerEvents: "all",
						}}
						className="nodrag nopan"
						onMouseDown={(e) => e.stopPropagation()}
						onPointerDown={(e) => e.stopPropagation()}
						onDoubleClick={handleDoubleClick}
					>
						<div
							style={{
								color: "rgba(255,255,255,0.3)",
								fontSize: 11,
								cursor: "pointer",
								padding: "2px 8px",
								userSelect: "none",
							}}
						>
							double-click to label
						</div>
					</div>
				) : null}
			</EdgeLabelRenderer>
		</>
	);
}
