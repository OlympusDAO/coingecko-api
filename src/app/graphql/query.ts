import { Client } from "@urql/core";
import fetch from "cross-fetch";

import { getVariable } from "../environment/environment";
import { OhmCirculatingSupplyDocument } from "../generated/graphql";

const GRAPHQL_ENDPOINT =
  "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/DTcDcUSBRJjz9NeoK5VbXCVzYbRTyuBwdPUqMi8x32pY";

const getGraphQLEndpoint = (): string => {
  return GRAPHQL_ENDPOINT.replace("[api-key]", getVariable("GRAPHQL_API_KEY"));
};

export const getCirculatingSupply = async (): Promise<string | null> => {
  const client = new Client({
    url: getGraphQLEndpoint(),
    fetch,
  });
  const queryResults = await client.query(OhmCirculatingSupplyDocument, {}).toPromise();
  if (!queryResults.data || queryResults.data.protocolMetrics.length === 0) {
    return null;
  }

  return queryResults.data.protocolMetrics[0].ohmCirculatingSupply || null;
};
