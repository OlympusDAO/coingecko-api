import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import { getValue } from "./app";

const pulumiConfig = new pulumi.Config();
const PROJECT_NAME = "coingecko-api";

// Enable required APIs
new gcp.projects.Service("cloudfunctions", {
  service: "cloudfunctions.googleapis.com",
});

new gcp.projects.Service("firestore", {
  service: "firestore.googleapis.com",
});

// Create a document in Cloud Datastore to use for caching
const firestoreCollection = `${PROJECT_NAME}-${pulumi.getStack()}`;
const firestoreDocument = "cache";
new gcp.firestore.Document(firestoreCollection, {
  collection: firestoreCollection,
  documentId: firestoreDocument,
  fields: "",
});

// Deploy Cloud HttpCallback Function
const cloudFunction = new gcp.cloudfunctions.HttpCallbackFunction("coingecko-api", {
  callback: async (req: any, res: any) => {
    const value = await getValue();

    if (!value) {
      res.status(500).send("Error fetching circulating supply");
      return;
    }

    res.send(value).end();
  },
  environmentVariables: {
    GRAPHQL_API_KEY: pulumiConfig.requireSecret("GRAPHQL_API_KEY"),
    FIRESTORE_COLLECTION: firestoreCollection,
    FIRESTORE_DOCUMENT: firestoreDocument,
  },
});

export const triggerUrl = cloudFunction.httpsTriggerUrl;
