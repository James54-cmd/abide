/** Forgot-password OTP UX: attempt limit + Scripture-themed encouragement (see SKILL.md — password flows). */

export const PASSWORD_RESET_OTP_MAX_WRONG_ATTEMPTS = 3;

export type WrongOtpEncouragement = {
  body: string;
  citation: string;
};

/**
 * @param failedAttemptsSoFar — 1 after first wrong code, 2 after second (third failure redirects without copy).
 */
export function getWrongPasswordResetOtpEncouragement(failedAttemptsSoFar: number): WrongOtpEncouragement | null {
  switch (failedAttemptsSoFar) {
    case 1:
      return {
        body: "That code doesn’t match what we sent. Double-check the digits—you have up to three tries with this code.",
        citation: "Proverbs 24:16 — “Though the righteous may fall seven times, they rise again.”",
      };
    case 2:
      return {
        body: "Still not quite right. One more try with this code; after that, request a fresh one from the reset screen.",
        citation: "Galatians 6:9 — “Let us not become weary in doing good… if we do not give up.”",
      };
    default:
      return null;
  }
}
