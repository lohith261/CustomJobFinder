"use client";

import { useState } from "react";

interface Props {
  jobTitle: string;
  company: string;
  onConfirm: (appliedAt: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ApprovalGateModal({
  jobTitle,
  company,
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  const [appliedAt, setAppliedAt] = useState(
    new Date().toISOString().split("T")[0]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">
          Confirm Application Sent
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          You're marking that you've submitted an application for:
        </p>

        {/* Job info */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-center">
          <p className="font-semibold text-gray-900">{jobTitle}</p>
          <p className="text-sm text-gray-500">{company}</p>
        </div>

        {/* Applied date */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date applied
          </label>
          <input
            type="date"
            value={appliedAt}
            onChange={(e) => setAppliedAt(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(appliedAt)}
            disabled={loading || !appliedAt}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              "✓ Confirm Application Sent"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
