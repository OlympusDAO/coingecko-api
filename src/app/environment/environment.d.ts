declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GRAPHQL_API_KEY: string;
    }
  }
}

export {};
