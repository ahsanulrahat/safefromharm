import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);
const prefixedInternalIntl = createMiddleware({ ...routing, localePrefix: "always" });

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A rewrite re-enters Proxy. Honor the internal locale marker so /en can be
  // resolved without canonicalizing the internal rewrite back to `/`.
  if (
    request.headers.get("x-next-intl-locale") === "en" &&
    (pathname === "/en" || pathname.startsWith("/en/"))
  ) {
    return prefixedInternalIntl(request);
  }

  // English is the default locale, so /en/* redirects to the canonical
  // unprefixed URL.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(target, { status: 308 });
  }

  // Bangla keeps an explicit /bn prefix and is handled by next-intl.
  if (pathname === "/bn" || pathname.startsWith("/bn/")) {
    return intl(request);
  }

  // next-intl's as-needed middleware cannot infer an explicitly matched
  // default locale when detection is disabled. Rewrite unprefixed URLs
  // directly to the existing [locale] route so they remain static and
  // cookie-free.
  const target = request.nextUrl.clone();
  target.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  const headers = new Headers(request.headers);
  headers.set("x-next-intl-locale", "en");
  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  // Skip API routes, Next internals, resume redirects, and static files.
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|r/|.*\\..*).*)"],
};
