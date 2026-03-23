import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Providers } from "@/components/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Job Tailor",
  description: "Smart job search and application management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={jakarta.variable}>
      <body>
        <Providers>
          {session ? (
            <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
              <Sidebar />
              <main className="flex-1 overflow-y-auto pt-14 md:pt-0 bg-gray-50 dark:bg-gray-950">{children}</main>
            </div>
          ) : (
            <main className="min-h-screen">{children}</main>
          )}
        </Providers>
      </body>
    </html>
  );
}
