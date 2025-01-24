import { getCirculatingSupplyValue } from ".";

const main = async () => {
  const value = await getCirculatingSupplyValue("true");
  console.log(`Value = ${value}`);
};

// If called from the command-line, trigger the getValue function in index.ts
if (require.main === module) {
  main();
}
