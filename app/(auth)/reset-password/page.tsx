import ResetPasswordRequestPage from "@/features/auth/pages/ResetPasswordRequestPage";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function pickEmailParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && value[0]) return value[0].trim();
  return "";
}

export default function Page({ searchParams }: PageProps) {
  const raw = pickEmailParam(searchParams.email);
  const initialEmail = raw ? raw.toLowerCase() : "";

  return <ResetPasswordRequestPage initialEmail={initialEmail} />;
}
