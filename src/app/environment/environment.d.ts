declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GRAPHQL_API_KEY: string;
      FIRESTORE_COLLECTION: string;
      FIRESTORE_DOCUMENT: string;
    }
  }
}

export {};
