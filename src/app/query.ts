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

  let returnValue: string | null;
  try {
    const response = await client.query({
      operationName: "latest/metrics",
    });

    if (!response.data) {
      returnValue = null;
    } else {
      returnValue = response.data.ohmCirculatingSupply.toString();
    }
  } catch (error) {
    console.error(`Error fetching circulating supply: ${error}`);

    returnValue = null;
  }

  return returnValue;
};
