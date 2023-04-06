import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import { getValue } from "./app";

const pulumiConfig = new pulumi.Config();
const gcpConfig = new pulumi.Config("gcp");
const PROJECT_NAME = "coingecko-api";

// Enable required APIs
const serviceCloudFunctions = new gcp.projects.Service("cloudfunctions", {
  service: "cloudfunctions.googleapis.com",
});

const serviceCloudBuild = new gcp.projects.Service("cloudbuild", {
  service: "cloudbuild.googleapis.com",
});

const serviceFirestore = new gcp.projects.Service("firestore", {
  service: "firestore.googleapis.com",
});

// Create the default database for Cloud Firestore
const firestoreDatabase = new gcp.firestore.Database(
  "default",
  {
    name: "(default)",
    type: "FIRESTORE_NATIVE",
    locationId: gcpConfig.require("region"),
  },
  {
    protect: true,
  },
);

// Create a document in Cloud Datastore to use for caching
const firestoreCollectionName = `${PROJECT_NAME}-${pulumi.getStack()}`;
const firestoreDocumentName = "cache";
const firestoreDocument = new gcp.firestore.Document(
  firestoreCollectionName,
  {
    collection: firestoreCollectionName,
    documentId: firestoreDocumentName,
    fields: "",
  },
  { dependsOn: [serviceFirestore, firestoreDatabase] },
);

// Deploy Cloud HttpCallback Function
const cloudFunction = new gcp.cloudfunctions.HttpCallbackFunction(
  "coingecko-api",
  {
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
      FIRESTORE_COLLECTION: firestoreCollectionName,
      FIRESTORE_DOCUMENT: firestoreDocumentName,
    },
    runtime: "nodejs16",
  },
  { dependsOn: [serviceCloudFunctions, serviceCloudBuild, firestoreDocument] },
);

export const triggerUrl = cloudFunction.httpsTriggerUrl;
