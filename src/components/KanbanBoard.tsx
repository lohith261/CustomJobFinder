"use client";

import { useState } from "react";
import type { ApplicationData } from "@/types";
import { KANBAN_COLUMNS } from "@/types";
import KanbanColumn from "./KanbanColumn";

interface Props {
  applications: ApplicationData[];
  onMove: (appId: string, newStatus: string) => void;
  onCardClick: (id: string) => void;
}

export default function KanbanBoard({ applications, onMove, onCardClick }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTargetStatus, setDragTargetStatus] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("applicationId", id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    const id = e.dataTransfer.getData("applicationId") || draggingId;
    if (!id) return;

    const app = applications.find((a) => a.id === id);
    if (!app || app.status === newStatus) {
      setDraggingId(null);
      setDragTargetStatus(null);
      return;
    }

    onMove(id, newStatus);
    setDraggingId(null);
    setDragTargetStatus(null);
  }

  function handleDragEnter(status: string) {
    setDragTargetStatus(status);
  }

  function handleDragLeave() {
    setDragTargetStatus(null);
  }

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]"
      onDragEnd={() => {
        setDraggingId(null);
        setDragTargetStatus(null);
      }}
    >
      {KANBAN_COLUMNS.map(({ status, label, color }) => {
        const colApps = applications.filter((a) => a.status === status);
        return (
          <div
            key={status}
            onDragEnter={() => handleDragEnter(status)}
            onDragLeave={handleDragLeave}
          >
            <KanbanColumn
              status={status}
              label={label}
              color={color}
              applications={colApps}
              onCardClick={onCardClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragTarget={dragTargetStatus === status && draggingId !== null}
            />
          </div>
        );
      })}
    </div>
  );
}
