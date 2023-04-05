import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema:
    "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/DTcDcUSBRJjz9NeoK5VbXCVzYbRTyuBwdPUqMi8x32pY".replace(
      "[api-key]",
      process.env.GRAPHQL_API_KEY || "",
    ),
  documents: ["src/**/*.graphql"],
  generates: {
    "src/app/generated/graphql.ts": {
      preset: "client",
    },
  },
};

export default config;
