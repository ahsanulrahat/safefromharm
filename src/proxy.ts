import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const adminMatch = pathname.match(/^\/(bn|en)\/admin(\/.*)?$/);

  if (adminMatch && adminMatch[2] !== "/login") {
    if (!request.auth) {
      const locale = adminMatch[1];
      const url = new URL(`/${locale}/admin/login`, request.url);
      url.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
      return Response.redirect(url);
    }
  }

  return intl(request);
});

export const config = {
  // Skip API routes, Next internals, resume redirects, and static files.
  matcher: ["/((?!api|_next|_vercel|r/|.*\\..*).*)"],
};
