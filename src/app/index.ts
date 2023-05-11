import { getCachedValue, setCachedValue } from "./cache/cache";
import { getCirculatingSupply } from "./query";

export const getValue = async (cache: string | undefined): Promise<string | null> => {
  const skipCache = cache === "false";
  if (skipCache) {
    console.log("Skipping cache");
  }

  // Return the cached value if still valid
  const cachedValue: string | null = await getCachedValue();
  if (cachedValue && !skipCache) {
    return cachedValue;
  }

  // If cache is empty, fetch from GraphQL API
  const newValue: string | null = await getCirculatingSupply();

  if (newValue) {
    await setCachedValue(newValue);
  }

  return newValue;
};
