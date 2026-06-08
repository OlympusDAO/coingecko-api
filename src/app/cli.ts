import { fileURLToPath } from "node:url";

import { getCirculatingSupplyValue } from "./index.js";

const main = async () => {
  const value = await getCirculatingSupplyValue("true");
  console.log(`Value = ${value}`);
};

// If called from the command-line, trigger the getValue function in index.ts
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
