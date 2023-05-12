import { createClient } from "@olympusdao/treasury-subgraph-client";
import { fetch } from "cross-fetch";

export const getCirculatingSupply = async (): Promise<string | null> => {
  const apiEndpointOverride = process.env.API_ENDPOINT;
  if (apiEndpointOverride) {
    console.log(`Overriding API endpoint with ${apiEndpointOverride}`);
  }

  const client = createClient({
    ...(apiEndpointOverride ? { baseURL: apiEndpointOverride } : {}),
    customFetch: fetch,
  });

  const response = await client.query({
    operationName: "latest/metrics",
  });

  if (!response.data) {
    return null;
  }

  return response.data.ohmCirculatingSupply.toString();
};
