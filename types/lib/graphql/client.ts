import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

let apolloClient: ApolloClient | null = null;

export function getApolloClient() {
  if (apolloClient) return apolloClient;

  apolloClient = new ApolloClient({
    link: new HttpLink({
      uri: "/api/graphql",
    }),
    cache: new InMemoryCache(),
  });

  return apolloClient;
}
