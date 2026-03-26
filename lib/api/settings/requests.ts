import { getAccessToken } from "@/lib/supabase";

type UploadAvatarResponse = {
  avatarUrl: string;
};

type ApiErrorResponse = {
  error?: string;
};

export async function uploadAvatarFile(file: File): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Unauthorized");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/settings/avatar", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let message = "Upload failed. Please try again.";
    try {
      const errorPayload = (await response.json()) as ApiErrorResponse;
      if (errorPayload.error) {
        message = errorPayload.error;
      }
    } catch {
      // Keep default message when response is not JSON.
    }
    throw new Error(message);
  }

  const data = (await response.json()) as UploadAvatarResponse;
  return data.avatarUrl;
}
