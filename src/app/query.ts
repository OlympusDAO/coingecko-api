import type { BoundsResponse, ClientConfig, DailyMetric } from "@olympusdao/treasury-subgraph-client";

type TreasurySubgraphClientModule = {
  createClient: (config?: ClientConfig) => {
    getBounds: () => Promise<BoundsResponse>;
    getDailyMetrics: (input: { start: string; end?: string }) => Promise<DailyMetric[]>;
  };
};

const TREASURY_SUBGRAPH_CLIENT_PACKAGE = "@olympusdao/treasury-subgraph-client";
// Keep TypeScript's CommonJS emit from downleveling dynamic import() to require().
const importTreasurySubgraphClient = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<TreasurySubgraphClientModule>;

const getSupplyValue = async (
  field: "ohmTotalSupply" | "ohmCirculatingSupply",
  label: string,
): Promise<string | null> => {
  const apiEndpointOverride = process.env.API_ENDPOINT;
  if (apiEndpointOverride) {
    console.log(`Overriding API endpoint with ${apiEndpointOverride}`);
  }

  const { createClient } = await importTreasurySubgraphClient(TREASURY_SUBGRAPH_CLIENT_PACKAGE);
  const client = createClient({
    ...(apiEndpointOverride ? { baseUrl: apiEndpointOverride } : {}),
  });

  let returnValue: string | null;
  try {
    const bounds = await client.getBounds();
    const [metric] = await client.getDailyMetrics({ start: bounds.latestDate, end: bounds.latestDate });

    // No data - return null
    if (!metric) {
      console.error(`No data returned from API`);
      returnValue = null;
    }
    // Has data
    else {
      // Check that the Ethereum timestamp is within the past 24 hours
      const now = new Date().getTime();
      const timestampThreshold = now - 24 * 60 * 60 * 1000;
      const isEthereumTimestampValid = metric.timestamps.Ethereum * 1000 > timestampThreshold;

      console.log(`Ethereum timestamp: ${metric.timestamps.Ethereum}`);

      // If the Ethereum timestamp is invalid, return null
      if (!isEthereumTimestampValid) {
        console.error(`Ethereum timestamp was out of range`);
        returnValue = null;
      }
      // Return the requested supply value
      else {
        console.log(`Ethereum timestamp is within range`);
        returnValue = metric[field].toString();
      }
    }
  } catch (error) {
    console.error(`Error fetching ${label}: ${error}`);

    returnValue = null;
  }

  return returnValue;
};

export const getTotalSupply = async (): Promise<string | null> => {
  return await getSupplyValue("ohmTotalSupply", "total supply");
};

export const getCirculatingSupply = async (): Promise<string | null> => {
  return await getSupplyValue("ohmCirculatingSupply", "circulating supply");
};
