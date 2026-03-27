import { gql } from "@apollo/client";

export const UPDATE_MY_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($input: UpdateMyProfileInput!) {
    updateMyProfile(input: $input) {
      id
      email
      fullName
      avatarUrl
    }
  }
`;

export const UPDATE_MY_PASSWORD_MUTATION = gql`
  mutation UpdateMyPassword($newPassword: String!) {
    updateMyPassword(newPassword: $newPassword)
  }
`;
