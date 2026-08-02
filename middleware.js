import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminEmail } from "./lib/admin";

const PARTNER_PREFIX = "/partner";
const ADMIN_PREFIX = "/admin";

const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/safety",
  "/payments",
  "/contact",
  "/signin",
  "/signup",
  "/partner",
  "/partner/signup",
]);

const CUSTOMER_PROTECTED_PREFIXES = ["/book", "/trips", "/account", "/payment"];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.has(pathname);
}

function isCustomerProtectedPath(pathname) {
  return CUSTOMER_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAdminPath(pathname) {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

function redirectTo(req, pathname, callbackUrl) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (callbackUrl) {
    url.searchParams.set("callbackUrl", callbackUrl);
  }
  return NextResponse.redirect(url);
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const role = token?.role;

  const isPartnerProtectedRoute =
    pathname.startsWith(`${PARTNER_PREFIX}/`) &&
    pathname !== "/partner/signup";

  // Already signed in: keep auth pages from looping / landing on the wrong home
  if (token && (pathname === "/signin" || pathname === "/signup")) {
    return redirectTo(
      req,
      role === "fleet" ? "/partner/dashboard" : "/"
    );
  }

  // 0) Admin dashboard: only the designated admin email
  if (isAdminPath(pathname)) {
    if (!token) {
      return redirectTo(req, "/signin", pathname);
    }
    if (!isAdminEmail(token.email)) {
      return redirectTo(req, "/");
    }
    return NextResponse.next();
  }

  // 1) Partner console: must be authenticated AND role=fleet (partner account)
  if (isPartnerProtectedRoute) {
    if (!token) {
      return redirectTo(req, "/signin", pathname);
    }

    if (role !== "fleet") {
      return redirectTo(req, "/");
    }

    return NextResponse.next();
  }

  // 2) Customer protected routes (book, trips, account, payment)
  if (isCustomerProtectedPath(pathname)) {
    if (!token) {
      return redirectTo(req, "/signin", pathname);
    }

    if (role === "fleet") {
      return redirectTo(req, "/partner/dashboard");
    }

    return NextResponse.next();
  }

  // 3) Partner users should not browse non-public customer pages
  if (role === "fleet" && !isPublicPath(pathname)) {
    return redirectTo(req, "/partner/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
