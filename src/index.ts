import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import { getCirculatingSupplyValue, getTotalSupplyValue } from "./app";

const pulumiConfig = new pulumi.Config();
const gcpConfig = new pulumi.Config("gcp");
const PROJECT_NAME = "metrics";

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

const serviceFirebase = new gcp.projects.Service("firebase", {
  service: "firebase.googleapis.com",
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
    dependsOn: [serviceFirestore],
  },
);

// Create a document in Cloud Datastore to use for caching
const projectStackName = `${PROJECT_NAME}-${pulumi.getStack()}`;
const circulatingSupplyFirestoreDocumentName = "cache";
const circulatingSupplyFirestoreDocument = new gcp.firestore.Document(
  `${projectStackName}-circulating-supply`,
  {
    collection: projectStackName,
    documentId: circulatingSupplyFirestoreDocumentName,
    fields: "",
  },
  { dependsOn: [serviceFirestore, firestoreDatabase] },
);

// Deploy Cloud HttpCallback Function
const circulatingSupplyCloudFunction = new gcp.cloudfunctions.HttpCallbackFunction(
  `${projectStackName}-circulating-supply`,
  {
    callback: async (req: any, res: any) => {
      console.log("Received request");
      const cache: string | undefined = req.query.cache;
      const value = await getCirculatingSupplyValue(cache);

      if (!value) {
        res.status(500).send("Error fetching circulating supply");
        return;
      }

      res.send(value).end();
    },
    environmentVariables: {
      API_ENDPOINT: pulumiConfig.get("apiEndpoint"), // Optional
      FIRESTORE_COLLECTION: projectStackName,
      FIRESTORE_DOCUMENT: circulatingSupplyFirestoreDocumentName,
    },
    runtime: "nodejs20",
  },
  { dependsOn: [serviceCloudFunctions, serviceCloudBuild, circulatingSupplyFirestoreDocument] },
);

// Create a document in Firestore for the total supply
const totalSupplyFirestoreDocumentName = "total-supply";
const totalSupplyFirestoreDocument = new gcp.firestore.Document(
  `${projectStackName}-total-supply`,
  {
    collection: projectStackName,
    documentId: totalSupplyFirestoreDocumentName,
    fields: "",
  },
  { dependsOn: [serviceFirestore, firestoreDatabase] },
);

// Create a Cloud Function for the total supply
const totalSupplyCloudFunction = new gcp.cloudfunctions.HttpCallbackFunction(
  `${projectStackName}-total-supply`,
  {
    callback: async (req: any, res: any) => {
      console.log("Received request");
      const cache: string | undefined = req.query.cache;
      const value = await getTotalSupplyValue(cache);

      if (!value) {
        res.status(500).send("Error fetching total supply");
        return;
      }

      res.send(value).end();
    },
    environmentVariables: {
      API_ENDPOINT: pulumiConfig.get("apiEndpoint"), // Optional
      FIRESTORE_COLLECTION: projectStackName,
      FIRESTORE_DOCUMENT: totalSupplyFirestoreDocumentName,
    },
    runtime: "nodejs20",
  },
  { dependsOn: [serviceCloudFunctions, serviceCloudBuild, totalSupplyFirestoreDocument] },
);

/**
 * Firebase
 *
 * We utilise Firebase hosting to provide a static URL to the Cloud Function.
 */

// Deploy a Firebase Hosting site, so that we can obtain a static URL
const firebaseProject = new gcp.firebase.Project(
  projectStackName,
  {
    project: gcpConfig.require("project"),
  },
  {
    dependsOn: [serviceFirebase],
  },
);

const createFirebaseDeployment = (firebaseProject: gcp.firebase.Project, cloudFunction: gcp.cloudfunctions.HttpCallbackFunction, siteId: string, domain?: string): [gcp.firebase.HostingSite] => {
  // Define the base site
  const firebaseHostingSite = new gcp.firebase.HostingSite(
    siteId,
    {
      project: firebaseProject.project,
      siteId: siteId, // Will end up as siteId.web.app
    },
    {
      dependsOn: [firebaseProject],
    },
  );

  const firebaseSiteId = firebaseHostingSite.siteId;
  if (!firebaseSiteId) {
    throw new Error("Firebase Hosting site ID is undefined");
  }

  const firebaseSiteIdInput: pulumi.Input<string> = firebaseSiteId.apply(str => `${str}`);

  // If a domain is provided, create a custom domain
  if (domain) {
    const firebaseHostingCustomDomain = new gcp.firebase.HostingCustomDomain(
      siteId,
      {
        siteId: siteId,
        customDomain: domain,
      },
    );
  };

  // Create a rewrite rule to redirect all requests to the Cloud Function
  const firebaseHostingVersion = new gcp.firebase.HostingVersion(
    siteId,
    {
      siteId: firebaseSiteIdInput,
      config: {
        redirects: [
          {
            glob: "/",
            location: cloudFunction.httpsTriggerUrl,
            statusCode: 302,
          },
        ],
      },
    },
    {
      dependsOn: [firebaseHostingSite, cloudFunction],
    },
  );

  const firebaseHostingRelease = new gcp.firebase.HostingRelease(
    siteId,
    {
      siteId: firebaseSiteIdInput,
      versionName: firebaseHostingVersion.name,
      message: "Cloud Functions integration",
    },
    {
      dependsOn: [firebaseHostingVersion],
    },
  );

  return [firebaseHostingSite];
}

const getCustomDomain = (functionName: string, stack: string): string => {
  if (stack === "prod") {
    return `${functionName}.api.olympusdao.finance`;
  }

  if (stack === "dev") {
    return `${functionName}.staging.api.olympusdao.finance`;
  }

  throw new Error(`Unknown stack: ${stack}`);
}

// Create an endpoint for the circulating supply
// siteId will end up as olympus-metrics-<stack>-circulating-supply.web.app
const [circulatingSupplyFirebaseHostingSite] = createFirebaseDeployment(firebaseProject, circulatingSupplyCloudFunction, `olympus-${projectStackName}-circulating-supply`, getCustomDomain("circulating-supply", pulumi.getStack()));

// Create an endpoint for the total supply
// siteId will end up as olympus-metrics-<stack>-total-supply.web.app
const [totalSupplyFirebaseHostingSite] = createFirebaseDeployment(firebaseProject, totalSupplyCloudFunction, `olympus-${projectStackName}-total-supply`, getCustomDomain("total-supply", pulumi.getStack()));

export const circulatingSupplyCloudFunctionTriggerUrl = circulatingSupplyCloudFunction.httpsTriggerUrl;
export const circulatingSupplyFirebaseHostingUrl = circulatingSupplyFirebaseHostingSite.defaultUrl;

export const totalSupplyCloudFunctionTriggerUrl = totalSupplyCloudFunction.httpsTriggerUrl;
export const totalSupplyFirebaseHostingUrl = totalSupplyFirebaseHostingSite.defaultUrl;
