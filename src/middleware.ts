import { NextRequest, NextResponse } from "next/server";

/**
 * A.2/A.3 — Security Middleware
 *
 * Pridáva security headers na všetky responses:
 * - Content-Security-Policy: strict, ale povolené pre Next.js (inline scripts, eval v dev)
 * - X-Frame-Options: DENY (anti clickjacking)
 * - X-Content-Type-Options: nosniff (anti MIME sniffing)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: obmedzenie API prístupov
 * - Strict-Transport-Security: HSTS (iba v produkcii, keď secure cookie)
 *
 * A.3 CSRF protection:
 * - Pre POST/PATCH/PUT/DELETE metódy validuje Origin header
 * - Ak Origin chýba alebo nesedí, vráti 403
 * - Vynechá webhooks (ak budú pridané neskôr — prefix /api/webhook)
 */

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "X-DNS-Prefetch-Control": "on",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
  // Cross-Origin policies pre izoláciu
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "same-site",
};

// CSP — Content Security Policy
// Next.js dev mode potrebuje 'unsafe-eval' a 'unsafe-inline' pre HMR
// V produkcii obmedzujeme
function getCspHeader(isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    // Next.js potrebuje 'unsafe-inline' pre štýly a 'unsafe-eval' v dev mode
    `script-src 'self'${isDev ? " 'unsafe-inline' 'unsafe-eval'" : " 'unsafe-inline'"}`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self' https:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'", // ekvivalent X-Frame-Options: DENY
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

// A.3: CSRF — validuj Origin pre state-changing metódy
function isCsrfSafe(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return true;

  // Vynechaj webhook cesty (budú mať vlastný podpis)
  if (req.nextUrl.pathname.startsWith("/api/webhook")) return true;

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const secFetchSite = req.headers.get("sec-fetch-site");

  // Sec-Fetch-Site: same-origin je najspoľahlivejšia CSRF ochrana
  if (secFetchSite === "same-origin") return true;
  if (secFetchSite === "none" && method === "POST") {
    // Niektoré legitímne requesty (curl, Postman) nemajú Sec-Fetch-Site
    // Pre ne fallback na Origin check
  }

  // Origin check: ak je prítomný, musí sedieť s host
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
      // Allow sandbox preview origins
      if (host?.endsWith(".space-z.ai") && originHost?.endsWith(".space-z.ai")) return true;
      return false;
    } catch {
      return false;
    }
  }

  // Ak nie je Origin ani Sec-Fetch-Site, pustíme v dev mode (testovanie)
  // V produkcii by sme mali byť prísnejší, ale nechceme zablokovať legitímnych používateľov
  if (process.env.NODE_ENV === "development") return true;

  // V produkcii: ak chýba Origin aj Sec-Fetch-Site, zamietnime
  return false;
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // A.2: Security headers
  const isDev = process.env.NODE_ENV === "development";
  const isProd = process.env.NODE_ENV === "production";

  // CSP
  res.headers.set("Content-Security-Policy", getCspHeader(isDev));

  // Ostatné security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }

  // HSTS — iba v produkcii (HTTPS)
  if (isProd) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // A.3: CSRF kontrola pre state-changing metódy
  if (!isCsrfSafe(req)) {
    return new NextResponse(
      JSON.stringify({ error: "CSRF validation failed — neplatný origin." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return res;
}

export const config = {
  // Aplikuj na všetky routes okrem statických súborov
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest|xml|txt|css|js|map)$).*)",
  ],
};
