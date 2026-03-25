import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Check verification status via Admin client (bypasses RLS)
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("verification_status")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ status: "pending" });
  }

  return NextResponse.json({ status: profile.verification_status });
}
