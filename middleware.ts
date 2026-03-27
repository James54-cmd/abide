import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/verify-token") ||
    pathname.startsWith("/auth/cancel-email-change") ||
    pathname.startsWith("/cancel-email-change") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/resend_verification") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/reset_password");

  if (isApiRoute) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // Check custom verification status in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status, email")
      .eq("id", user.id)
      .single();

    const verificationStatus = profile?.verification_status;
    const isVerified = verificationStatus === "verified";

    if (verificationStatus === "expired" && pathname !== "/resend_verification") {
      const resendUrl = new URL("/resend_verification", request.url);
      if (profile?.email) {
        resendUrl.searchParams.set("email", profile.email);
      }
      return NextResponse.redirect(resendUrl);
    }

    if (!isVerified && !isAuthRoute) {
      return NextResponse.redirect(new URL("/verify", request.url));
    }

    if (isVerified && isAuthRoute && pathname !== "/verify") {
       if (pathname === "/login") {
         return NextResponse.redirect(new URL("/", request.url));
       }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
