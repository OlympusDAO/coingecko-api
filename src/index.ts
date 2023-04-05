import * as gcp from "@pulumi/gcp";
import express from "express";

import { getCirculatingSupply } from "./app/query";

// Enable Cloud Functions API
new gcp.projects.Service("cloudfunctions", {
  service: "cloudfunctions.googleapis.com",
});

// Deploy Cloud HttpCallback Function
const cloudFunction = new gcp.cloudfunctions.HttpCallbackFunction("coingecko-api", {
  callback: async (req: express.Request, res: express.Response) => {
    const value = getCirculatingSupply();

    res.send(value);
  },
});

export const triggerUrl = cloudFunction.httpsTriggerUrl;
