import { getCachedValue, setCachedValue } from "./cache/cache";
import { getCirculatingSupply } from "./graphql/query";

export const getValue = async (): Promise<string | null> => {
  // Return the cached value if still valid
  const cachedValue: string | null = await getCachedValue();
  if (cachedValue) {
    return cachedValue;
  }

  // If cache is empty, fetch from GraphQL API
  const newValue: string | null = await getCirculatingSupply();

  if (newValue) {
    await setCachedValue(newValue);
  }

  return newValue;
};
