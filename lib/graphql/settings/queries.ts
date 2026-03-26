import { gql } from "@apollo/client";

export const MY_SETTINGS_PROFILE_QUERY = gql`
  query MySettingsProfile {
    myProfile {
      id
      email
      fullName
      avatarUrl
    }
  }
`;
