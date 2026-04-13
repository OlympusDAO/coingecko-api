import { createClient } from "@olympusdao/treasury-subgraph-client";

export const getTotalSupply = async (): Promise<string | null> => {
  const apiEndpointOverride = process.env.API_ENDPOINT;
  if (apiEndpointOverride) {
    console.log(`Overriding API endpoint with ${apiEndpointOverride}`);
  }

  const client = createClient({
    ...(apiEndpointOverride ? { baseUrl: apiEndpointOverride } : {}),
  });

  let returnValue: string | null;
  try {
    const response = await client.query({
      operationName: "latest/metrics",
    });

    // No data - return null
    if (!response.data) {
      console.error(`No data returned from API`);
      returnValue = null;
    }
    // Has data
    else {
      // Check that the Ethereum timestamp is within the past 24 hours
      const now = new Date().getTime();
      const timestampThreshold = now - 24 * 60 * 60 * 1000;
      const isEthereumTimestampValid = response.data.timestamps.Ethereum * 1000 > timestampThreshold;

      console.log(`Ethereum timestamp: ${response.data.timestamps.Ethereum}`);

      // If the Ethereum timestamp is invalid, return null
      if (!isEthereumTimestampValid) {
        console.error(`Ethereum timestamp was out of range`);
        returnValue = null;
      }
      // Return the total supply
      else {
        console.log(`Ethereum timestamp is within range`);
        returnValue = response.data.ohmTotalSupply.toString();
      }
    }
  } catch (error) {
    console.error(`Error fetching total supply: ${error}`);

    returnValue = null;
  }

  return returnValue;
};

export const getCirculatingSupply = async (): Promise<string | null> => {
  const apiEndpointOverride = process.env.API_ENDPOINT;
  if (apiEndpointOverride) {
    console.log(`Overriding API endpoint with ${apiEndpointOverride}`);
  }

  const client = createClient({
    ...(apiEndpointOverride ? { baseUrl: apiEndpointOverride } : {}),
  });

  let returnValue: string | null;
  try {
    const response = await client.query({
      operationName: "latest/metrics",
    });

    // No data - return null
    if (!response.data) {
      console.error(`No data returned from API`);
      returnValue = null;
    }
    // Has data
    else {
      // Check that the Ethereum timestamp is within the past 24 hours
      const now = new Date().getTime();
      const timestampThreshold = now - 24 * 60 * 60 * 1000;
      const isEthereumTimestampValid = response.data.timestamps.Ethereum * 1000 > timestampThreshold;

      console.log(`Ethereum timestamp: ${response.data.timestamps.Ethereum}`);

      // If the Ethereum timestamp is invalid, return null
      if (!isEthereumTimestampValid) {
        console.error(`Ethereum timestamp was out of range`);
        returnValue = null;
      }
      // Return the circulating supply
      else {
        console.log(`Ethereum timestamp is within range`);
        returnValue = response.data.ohmCirculatingSupply.toString();
      }
    }
  } catch (error) {
    console.error(`Error fetching circulating supply: ${error}`);

    returnValue = null;
  }

  return returnValue;
};
