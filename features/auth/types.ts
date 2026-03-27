export type ResetPasswordRequestState = {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  isOtpSent: boolean;
  isOtpModalOpen: boolean;
  message: string | null;
  error: string | null;
  isSendingOtp: boolean;
  isResettingPassword: boolean;
  canResendOtp: boolean;
  otpResendCountdownLabel: string;
  setEmail: (value: string) => void;
  setOtp: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setIsOtpModalOpen: (value: boolean) => void;
  sendOtp: () => Promise<void>;
  resetPassword: () => Promise<void>;
};

export type ResetPasswordConfirmState = {
  newPassword: string;
  confirmPassword: string;
  message: string | null;
  error: string | null;
  isSubmitting: boolean;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  submit: () => Promise<void>;
};
