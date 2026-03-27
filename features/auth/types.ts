export type ResetPasswordRequestState = {
  email: string;
  message: string | null;
  error: string | null;
  isSubmitting: boolean;
  setEmail: (value: string) => void;
  submit: () => Promise<void>;
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
