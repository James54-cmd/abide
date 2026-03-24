"use client";

import PageTransition from "@/components/PageTransition";

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="px-4 pt-6 pb-8 space-y-6">
        <div>
          <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">
            Settings
          </h2>
          <p className="text-sm text-muted mt-1">
            Account and app preferences will appear here.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/10 bg-white dark:bg-dark-card p-4 shadow-warm">
          <p className="text-sm text-ink dark:text-parchment leading-relaxed">
            Use the menu in the top bar to sign out when you are done.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
