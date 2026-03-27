import { getApolloClient } from "@/lib/graphql/client";
import { getAccessToken } from "@/lib/supabase";
import { MY_SETTINGS_PROFILE_QUERY } from "@/lib/graphql/settings/queries";
import { UPDATE_MY_PASSWORD_MUTATION, UPDATE_MY_PROFILE_MUTATION } from "@/lib/graphql/settings/mutations";

type SettingsProfilePayload = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export async function fetchMySettingsProfile() {
  const token = await getAccessToken();
  if (!token) throw new Error("Unauthorized");

  const client = getApolloClient();
  const { data } = await client.query<{ myProfile: SettingsProfilePayload }>({
    query: MY_SETTINGS_PROFILE_QUERY,
    fetchPolicy: "no-cache",
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  if (!data?.myProfile) {
    throw new Error("Unable to load profile.");
  }
  return data.myProfile;
}

export async function updateMySettingsProfile(input: { fullName: string; avatarUrl: string | null }) {
  const token = await getAccessToken();
  if (!token) throw new Error("Unauthorized");

  const client = getApolloClient();
  const { data } = await client.mutate<{ updateMyProfile: SettingsProfilePayload }>({
    mutation: UPDATE_MY_PROFILE_MUTATION,
    variables: { input },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  if (!data?.updateMyProfile) {
    throw new Error("Unable to update profile.");
  }
  return data.updateMyProfile;
}

export async function updateMyPassword(newPassword: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("Unauthorized");

  const client = getApolloClient();
  await client.mutate({
    mutation: UPDATE_MY_PASSWORD_MUTATION,
    variables: { newPassword },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
}

