"use client";

import { useState, useEffect, useCallback } from "react";
import ResumeUploader from "@/components/ResumeUploader";
import ResumeCard from "@/components/ResumeCard";
import JobPickerModal from "@/components/JobPickerModal";
import { useRouter } from "next/navigation";
import type { ResumeData } from "@/types";

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [analyzingForResume, setAnalyzingForResume] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes");
      const data = await res.json();
      setResumes(Array.isArray(data) ? data : []);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  async function handleUpload(file: File, name: string) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);

      const res = await fetch("/api/resumes", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      const newResume = await res.json();
      setResumes((prev) => [newResume, ...prev]);
      showToast(`"${newResume.name}" uploaded successfully!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
      throw err;
    } finally {
      setUploading(false);
    }
  }

  async function handleTogglePrimary(id: string, currentPrimary: boolean) {
    setMutating(true);
    try {
      await fetch(`/api/resumes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: !currentPrimary }),
      });
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          isPrimary: r.id === id ? !currentPrimary : currentPrimary ? false : r.isPrimary,
        }))
      );
    } catch {
      showToast("Failed to update primary resume", "error");
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete(id: string) {
    const resume = resumes.find((r) => r.id === id);
    if (!resume) return;
    if (!confirm(`Delete "${resume.name}"? This will also delete all analyses.`)) return;

    setMutating(true);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setResumes((prev) => prev.filter((r) => r.id !== id));
      showToast(`"${resume.name}" deleted`);
    } catch {
      showToast("Failed to delete resume", "error");
    } finally {
      setMutating(false);
    }
  }

  async function handleAnalyze(jobId: string) {
    if (!analyzingForResume) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/resumes/${analyzingForResume}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      setShowAnalyzeModal(false);
      setAnalyzingForResume(null);
      // Navigate to the resume detail page to see results
      router.push(`/resumes/${analyzingForResume}`);
    } catch {
      showToast("Analysis failed. Please try again.", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  const primaryResume = resumes.find((r) => r.isPrimary);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? "✓" : "✗"} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resume Tailoring</h1>
        <p className="text-gray-500 mt-1">
          Upload your resumes and analyze how well they match any job in your inbox.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload + Primary banner */}
        <div className="space-y-4">
          <ResumeUploader onUpload={handleUpload} uploading={uploading} />

          {primaryResume && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-5 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
                Primary Resume
              </p>
              <p className="font-semibold truncate">{primaryResume.name}</p>
              <p className="text-sm text-blue-200 mt-0.5">
                {primaryResume.wordCount.toLocaleString()} words · {primaryResume.format.toUpperCase()}
              </p>
              <button
                onClick={() => {
                  setAnalyzingForResume(primaryResume.id);
                  setShowAnalyzeModal(true);
                }}
                className="mt-4 w-full bg-white text-blue-700 text-sm font-semibold rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Analyze Against a Job
              </button>
            </div>
          )}
        </div>

        {/* Right: Resume list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <div className="text-5xl mb-3">📄</div>
              <p className="text-gray-600 font-medium">No resumes yet</p>
              <p className="text-sm text-gray-400 mt-1">Upload your first resume to get started</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Your Resumes ({resumes.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resumes.map((resume) => (
                  <div key={resume.id}>
                    <ResumeCard
                      resume={resume}
                      onTogglePrimary={handleTogglePrimary}
                      onDelete={handleDelete}
                      loading={mutating}
                    />
                    <button
                      onClick={() => {
                        setAnalyzingForResume(resume.id);
                        setShowAnalyzeModal(true);
                      }}
                      className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 py-1 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Analyze this resume against a job
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Job Picker Modal */}
      {showAnalyzeModal && (
        <JobPickerModal
          onSelect={handleAnalyze}
          onClose={() => {
            setShowAnalyzeModal(false);
            setAnalyzingForResume(null);
          }}
          analyzing={analyzing}
        />
      )}
    </div>
  );
}
