import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import { getCirculatingSupply } from "./app/query";

const pulumiConfig = new pulumi.Config();

// Enable required APIs
new gcp.projects.Service("cloudfunctions", {
  service: "cloudfunctions.googleapis.com",
});

// Deploy Cloud HttpCallback Function
const cloudFunction = new gcp.cloudfunctions.HttpCallbackFunction("coingecko-api", {
  callback: async (req: any, res: any) => {
    const value = await getCirculatingSupply();

    if (!value) {
      res.status(500).send("Error fetching circulating supply");
      return;
    }

    res.send(value).end();
  },
  environmentVariables: {
    GRAPHQL_API_KEY: pulumiConfig.requireSecret("GRAPHQL_API_KEY"),
  },
});

export const triggerUrl = cloudFunction.httpsTriggerUrl;
