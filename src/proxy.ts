import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);
const prefixedInternalIntl = createMiddleware({ ...routing, localePrefix: "always" });

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A rewrite re-enters Proxy. Honor the internal locale marker so /bn can be
  // resolved without canonicalizing the internal rewrite back to `/`.
  if (request.headers.get("x-next-intl-locale") === "bn" && pathname.startsWith("/bn")) {
    return prefixedInternalIntl(request);
  }

  // Keep legacy /bn links working while canonical Bangla URLs stay unprefixed.
  if (pathname === "/bn" || pathname.startsWith("/bn/")) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(target, { status: 308 });
  }

  // next-intl's as-needed middleware cannot infer an explicitly matched
  // default locale when detection is disabled. Rewrite these URLs directly
  // to the existing [locale] route so they remain static and cookie-free.
  if (pathname !== "/en" && !pathname.startsWith("/en/")) {
    const target = request.nextUrl.clone();
    target.pathname = pathname === "/" ? "/bn" : `/bn${pathname}`;
    const headers = new Headers(request.headers);
    headers.set("x-next-intl-locale", "bn");
    return NextResponse.rewrite(target, { request: { headers } });
  }

  return intl(request);
}

export const config = {
  // Skip API routes, Next internals, resume redirects, and static files.
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|r/|.*\\..*).*)"],
};
