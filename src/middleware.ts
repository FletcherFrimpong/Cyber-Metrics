import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/login",
  "/invite",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/setup",
  "/api/auth/signup",
  "/api/auth/accept-invite",
];

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // In development, the jwt.ts module auto-generates and sets AUTH_SECRET.
    // If middleware runs before that, redirect to login (session will be
    // validated on the next request after the secret is initialized).
    return new TextEncoder().encode("__uninitialized__");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get("sf-session")?.value;
  if (!token) {
    // API routes get 401, pages get redirected
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    // Attach user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    response.headers.set("x-user-role", payload.role as string);

    // If authenticated user visits /login, redirect to dashboard
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch {
    // Invalid or expired token
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
