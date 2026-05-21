import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const FLEET_PREFIX = "/fleet";

function isPublicPath(pathname) {
  // Public marketing pages + auth pages. Add/remove as needed.
  return (
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/fleet" ||
    pathname === "/fleet/signup" ||
    pathname === "/fleet-onboarding"
  );
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req });
  const role = token?.role;

  // Keep /fleet (landing) public, but protect /fleet/* (except /fleet/signup)
  const isFleetProtectedRoute =
    pathname.startsWith(`${FLEET_PREFIX}/`) && pathname !== "/fleet/signup";

  // 1) Fleet area: must be authenticated AND role=fleet
  if (isFleetProtectedRoute) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }

    if (role !== "fleet") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 2) Non-fleet area: fleet users should not be here (except public/auth pages)
  if (role === "fleet" && !isPublicPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/fleet/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
