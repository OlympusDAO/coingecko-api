import { getVariable } from "./environment/environment";

const GRAPHQL_ENDPOINT =
  "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/DTcDcUSBRJjz9NeoK5VbXCVzYbRTyuBwdPUqMi8x32pY";

const getGraphQLEndpoint = (): string => {
  return GRAPHQL_ENDPOINT.replace("[api-key]", getVariable("GRAPHQL_API_KEY"));
};

export const getCirculatingSupply = (): string => {
  // Do GraphQL query
  return "1";
};
