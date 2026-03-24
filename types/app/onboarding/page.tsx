"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Heart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: BookOpen,
    title: "Hear from God's Word",
    description:
      "Receive Bible verses that speak directly to what you're going through — grounded in Scripture, filled with truth.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Encouragement",
    description:
      "Share how you're feeling, and receive thoughtful, Spirit-inspired encouragement paired with real Bible verses.",
  },
  {
    icon: Heart,
    title: "Save What Speaks to You",
    description:
      "Bookmark the verses that touch your heart. Build your personal collection of God's promises.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      router.push("/");
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-[430px] min-h-dvh flex flex-col bg-parchment dark:bg-dark-bg px-6 py-8">
      {/* Skip button */}
      <div className="flex justify-end">
        <button
          onClick={handleSkip}
          className="text-sm text-muted hover:text-ink dark:hover:text-parchment transition-colors active:scale-95"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center px-4"
          >
            <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mb-8">
              {(() => {
                const Icon = steps[step].icon;
                return <Icon className="w-12 h-12 text-gold" strokeWidth={1.2} />;
              })()}
            </div>
            <h2 className="text-2xl font-serif font-semibold text-ink dark:text-parchment mb-3">
              {steps[step].title}
            </h2>
            <p className="text-base text-muted leading-relaxed max-w-xs">
              {steps[step].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots & button */}
      <div className="space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === step ? "w-6 bg-gold" : "w-2 bg-gold/20"
              )}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 bg-gold text-white rounded-full py-4 text-base font-semibold shadow-warm transition-all active:scale-[0.98]"
        >
          {step === steps.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
