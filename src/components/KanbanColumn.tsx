"use client";

import type { ApplicationData } from "@/types";
import ApplicationCard from "./ApplicationCard";

interface Props {
  status: string;
  label: string;
  color: string;
  applications: ApplicationData[];
  onCardClick: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  isDragTarget: boolean;
}

const HEADER_STYLES: Record<string, string> = {
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
  blue:   "bg-blue-50 border-blue-200 text-blue-700",
  amber:  "bg-amber-50 border-amber-200 text-amber-700",
  green:  "bg-green-50 border-green-200 text-green-700",
  rose:   "bg-rose-50 border-rose-200 text-rose-700",
  slate:  "bg-slate-50 border-slate-200 text-slate-600",
};

const COUNT_STYLES: Record<string, string> = {
  indigo: "bg-indigo-200 text-indigo-800",
  blue:   "bg-blue-200 text-blue-800",
  amber:  "bg-amber-200 text-amber-800",
  green:  "bg-green-200 text-green-800",
  rose:   "bg-rose-200 text-rose-800",
  slate:  "bg-slate-200 text-slate-700",
};

const EMPTY_ICONS: Record<string, string> = {
  bookmarked:    "🔖",
  applied:       "📨",
  interview:     "🤝",
  offer:         "🎉",
  not_interested: "🚫",
  rejected:      "📭",
};

export default function KanbanColumn({
  status,
  label,
  color,
  applications,
  onCardClick,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}: Props) {
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border ${HEADER_STYLES[color] ?? HEADER_STYLES.slate}`}>
        <span className="font-semibold text-sm">{label}</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${COUNT_STYLES[color] ?? COUNT_STYLES.slate}`}>
          {applications.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, status)}
        className={`flex-1 min-h-[200px] rounded-b-xl border border-t-0 p-2 space-y-2 transition-colors ${
          isDragTarget
            ? "border-blue-400 bg-blue-50/60"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-center">
            <span className="text-2xl mb-1">{EMPTY_ICONS[status] ?? "📋"}</span>
            <p className="text-xs text-gray-400">
              {isDragTarget ? "Drop here" : "No applications"}
            </p>
          </div>
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onClick={() => onCardClick(app.id)}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}
