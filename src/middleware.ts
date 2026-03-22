import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If authenticated user hits /landing, redirect them to the app root
    if (req.nextUrl.pathname === "/landing" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;

        // Public paths — always allow
        const publicPaths = [
          "/landing",
          "/login",
          "/signup",
          "/verify-email",
          "/pricing",
          "/forgot-password",
          "/reset-password",
        ];
        if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
          return true;
        }

        // next-auth internals and static assets — always allow
        if (
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next/static") ||
          pathname.startsWith("/_next/image") ||
          pathname === "/favicon.ico"
        ) {
          return true;
        }

        // For the root path, redirect unauthenticated users to /landing
        // returning false causes next-auth to redirect to the signIn page,
        // but we override that via the pages config below.
        return !!token;
      },
    },
    pages: {
      signIn: "/landing",
    },
  }
);

export const config = {
  matcher: [
    // Run middleware on all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
