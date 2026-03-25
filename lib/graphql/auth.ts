import { gql } from "@apollo/client";
import { getApolloClient } from "@/lib/graphql/client";

type AuthPayload = {
  success: boolean;
  message?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
};

type SignUpResponse = {
  signUp: AuthPayload;
};

type LoginResponse = {
  login: AuthPayload;
};

const SIGN_UP_MUTATION = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      success
      message
      accessToken
      refreshToken
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      message
      accessToken
      refreshToken
    }
  }
`;

export async function signUpWithGraphql(input: {
  fullName: string;
  email: string;
  password: string;
  redirectTo?: string;
}) {
  const client = getApolloClient();
  const { data } = await client.mutate<SignUpResponse>({
    mutation: SIGN_UP_MUTATION,
    variables: { input },
  });

  if (!data?.signUp) {
    throw new Error("Signup failed.");
  }

  return data.signUp;
}

export async function loginWithGraphql(input: { email: string; password: string }) {
  const client = getApolloClient();
  const { data } = await client.mutate<LoginResponse>({
    mutation: LOGIN_MUTATION,
    variables: { input },
  });

  if (!data?.login) {
    throw new Error("Login failed.");
  }

  return data.login;
}

const RESEND_VERIFICATION_MUTATION = gql`
  mutation ResendVerification($email: String!) {
    resendVerification(email: $email)
  }
`;

export async function resendVerificationWithGraphql(email: string) {
  const client = getApolloClient();
  const { data } = await client.mutate<{ resendVerification: boolean }>({
    mutation: RESEND_VERIFICATION_MUTATION,
    variables: { email },
  });

  return data?.resendVerification ?? false;
}
