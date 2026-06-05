import { getCachedValue, setCachedValue } from "./cache/cache.js";
import { getCirculatingSupply, getTotalSupply } from "./query.js";

export const getCirculatingSupplyValue = async (cache: string | undefined): Promise<string | null> => {
  const skipCache = cache === "false";

  // Return the cached value if still valid
  const [cachedValue, isCacheValid] = await getCachedValue();
  if (cachedValue && isCacheValid && !skipCache) {
    return cachedValue;
  }

  if (skipCache) {
    console.log("Cache was skipped due to override");
  }

  // If cache is empty, fetch from GraphQL API
  const newValue: string | null = await getCirculatingSupply();

  // If newValue is not set, return the cached value
  if (!newValue) {
    console.log(`Unable to fetch live value, returning cached value: ${cachedValue}`);
    return cachedValue;
  }

  if (newValue) {
    await setCachedValue(newValue);
  }

  return newValue;
};

export const getTotalSupplyValue = async (cache: string | undefined): Promise<string | null> => {
  const skipCache = cache === "false";

  // Return the cached value if still valid
  const [cachedValue, isCacheValid] = await getCachedValue();
  if (cachedValue && isCacheValid && !skipCache) {
    return cachedValue;
  }

  if (skipCache) {
    console.log("Cache was skipped due to override");
  }

  // If cache is empty, fetch from GraphQL API
  const newValue: string | null = await getTotalSupply();

  // If newValue is not set, return the cached value
  if (!newValue) {
    console.log(`Unable to fetch live value, returning cached value: ${cachedValue}`);
    return cachedValue;
  }

  if (newValue) {
    await setCachedValue(newValue);
  }

  return newValue;
};
