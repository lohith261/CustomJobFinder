"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid verification link."); return; }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok) { setStatus("success"); setTimeout(() => router.push("/"), 2500); }
      else { setStatus("error"); setMessage(data.error || "Verification failed."); }
    }).catch(() => { setStatus("error"); setMessage("Network error. Please try again."); });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-md w-full text-center space-y-4">
        {status === "loading" && (
          <><div className="text-4xl animate-spin inline-block">⏳</div><p className="text-gray-600 font-medium">Verifying your email…</p></>
        )}
        {status === "success" && (
          <><div className="text-4xl">✅</div><h2 className="text-lg font-semibold text-gray-900">Email verified!</h2><p className="text-sm text-gray-500">Redirecting you to the app…</p></>
        )}
        {status === "error" && (
          <><div className="text-4xl">❌</div><h2 className="text-lg font-semibold text-gray-900">Verification failed</h2><p className="text-sm text-gray-500">{message}</p><Link href="/login" className="inline-block mt-2 text-brand-600 text-sm font-medium hover:underline">Back to login →</Link></>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
