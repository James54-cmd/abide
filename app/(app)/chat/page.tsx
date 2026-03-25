"use client";

import { Suspense } from "react";
import ChatPage from "@/features/chat/pages/ChatPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  );
}
