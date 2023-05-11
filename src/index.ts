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
  },
);

// Create a document in Cloud Datastore to use for caching
const projectStackName = `${PROJECT_NAME}-${pulumi.getStack()}`;
const firestoreDocumentName = "cache";
const firestoreDocument = new gcp.firestore.Document(
  projectStackName,
  {
    collection: projectStackName,
    documentId: firestoreDocumentName,
    fields: "",
  },
  { dependsOn: [serviceFirestore, firestoreDatabase] },
);

// Deploy Cloud HttpCallback Function
const cloudFunction = new gcp.cloudfunctions.HttpCallbackFunction(
  projectStackName,
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
      API_ENDPOINT: pulumiConfig.get("apiEndpoint"), // Optional
      FIRESTORE_COLLECTION: projectStackName,
      FIRESTORE_DOCUMENT: firestoreDocumentName,
    },
    runtime: "nodejs16",
  },
  { dependsOn: [serviceCloudFunctions, serviceCloudBuild, firestoreDocument] },
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

const firebaseHostingSite = new gcp.firebase.HostingSite(
  "coingecko-api",
  {
    project: firebaseProject.project,
    siteId: `olympusdao-${projectStackName}`, // Will end up as olympusdao-coingecko-api-<stack>.web.app
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

// Create a rewrite rule to redirect all requests to the Cloud Function
const firebaseHostingVersion = new gcp.firebase.HostingVersion(
  projectStackName,
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
  projectStackName,
  {
    siteId: firebaseSiteIdInput,
    versionName: firebaseHostingVersion.name,
    message: "Cloud Functions integration",
  },
  {
    dependsOn: [firebaseHostingVersion],
  },
);

export const cloudFunctionTriggerUrl = cloudFunction.httpsTriggerUrl;
export const firebaseHostingUrl = firebaseHostingSite.defaultUrl;
