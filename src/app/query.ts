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

    // No data - return null
    if (!response.data) {
      returnValue = null;
    }
    // Has data
    else {
      // Check that the timestamps for Ethereum and Arbitrum within the past 8 hours
      const now = new Date().getTime();
      const eightHoursAgoMilliseconds = now - 8 * 60 * 60 * 1000;
      const isEthereumTimestampValid = response.data.timestamps.Ethereum * 1000 > eightHoursAgoMilliseconds;
      const isArbitrumTimestampValid = response.data.timestamps.Arbitrum * 1000 > eightHoursAgoMilliseconds;

      // If either timestamp is invalid, return null
      if (!isEthereumTimestampValid || !isArbitrumTimestampValid) {
        console.error(`Arbitrum or Ethereum timestamps were out of range`);
        console.log(`Arbitrum timestamp: ${response.data.timestamps.Arbitrum}`);
        console.log(`Ethereum timestamp: ${response.data.timestamps.Ethereum}`);
        returnValue = null;
      }
      else {
        // Return the circulating supply
        returnValue = response.data.ohmCirculatingSupply.toString();
      }
    }
  } catch (error) {
    console.error(`Error fetching circulating supply: ${error}`);

    returnValue = null;
  }

  return returnValue;
};
