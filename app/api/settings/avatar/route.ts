import { NextRequest, NextResponse } from "next/server";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";

const MAX_AVATAR_SIZE_BYTES = 50 * 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set(["gif", "webp", "wbp"]);
const BLOCKED_MIME_TYPES = new Set(["image/gif", "image/webp"]);

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { user, supabase } = await requireUserFromAuthHeader(authHeader);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return badRequest("Please choose a file to upload.");
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return badRequest("That file is too large. Please choose a file under 50MB.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const mimeType = file.type.toLowerCase();
    if (BLOCKED_EXTENSIONS.has(extension) || BLOCKED_MIME_TYPES.has(mimeType)) {
      return badRequest("This file type is not supported. Please use a different format.");
    }

    const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return badRequest("We could not upload your file right now. Please try again.");
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return NextResponse.json({ avatarUrl: data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized.";
    const isUnauthorized = message === "Unauthorized." || message.includes("bearer");
    if (isUnauthorized) {
      return NextResponse.json(
        { error: "Your session expired. Please sign in again and retry." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong while uploading. Please try again." },
      { status: 500 }
    );
  }
}
