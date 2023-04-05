import { CodegenConfig } from "@graphql-codegen/cli";
import * as dotenv from "dotenv";

// Enables reading the .env file
dotenv.config();

const config: CodegenConfig = {
  schema:
    "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/DTcDcUSBRJjz9NeoK5VbXCVzYbRTyuBwdPUqMi8x32pY".replace(
      "[api-key]",
      process.env.GRAPHQL_API_KEY || "",
    ),
  documents: ["src/**/*.graphql"],
  ignoreNoDocuments: true,
  generates: {
    "src/app/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        preResolveTypes: true,
        scalars: {
          BigDecimal: "string",
          BigInt: "string",
          Bytes: "Uint8Array", // https://thegraph.com/docs/en/developing/assemblyscript-api/#bytes
        },
      },
    },
  },
  hooks: {
    afterOneFileWrite: ["yarn eslint --config ./.eslintrc.js --fix"],
  },
};

export default config;
